package com.rayandev.s3_uploader.user;

import com.rayandev.s3_uploader.s3.S3Buckets;
import com.rayandev.s3_uploader.s3.S3Service;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("api/v1/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserRepository userRepository;
    private final S3Service s3Service;
    private final S3Buckets s3Buckets;

    public UserController(UserRepository userRepository, S3Service s3Service, S3Buckets s3Buckets) {
        this.userRepository = userRepository;
        this.s3Service = s3Service;
        this.s3Buckets = s3Buckets;
    }

    @PostMapping("/auth")
    public User authenticate(@RequestParam("username") String username,
                             @RequestParam("password") String password) {
        User user = userRepository.findByUsername(username).orElse(null);

        if (user != null) {
            if (user.getPassword().equals(password)) {
                return user;
            } else {
                throw new RuntimeException("Invalid password");
            }
        }

        User newUser = new User(username, password);
        return userRepository.save(newUser);
    }

    @PostMapping(value = "{userId}/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public User uploadFile(@PathVariable Integer userId,
                           @RequestParam("file") MultipartFile file) throws IOException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 1. Generate a clean UUID for the S3 Key
        String s3Key = UUID.randomUUID().toString();

        // 2. Put it in a "user-files" folder in your bucket
        s3Service.putObject(s3Buckets.getBucket(), "user-files/" + s3Key, file.getBytes());

        // 3. Create the database record and attach it to the user
        UserFile userFile = new UserFile(file.getOriginalFilename(), s3Key, user);
        user.getFiles().add(userFile);

        // 4. Returning the saved user automatically sends the updated list of files to React
        return userRepository.save(user);
    }

    // --- NEW: Get any file directly by its S3 Key ---
    @GetMapping(value = "files/{s3Key}", produces = MediaType.IMAGE_JPEG_VALUE)
    public byte[] getFile(@PathVariable("s3Key") String s3Key) {
        return s3Service.getObject(s3Buckets.getBucket(), "user-files/" + s3Key);
    }
}