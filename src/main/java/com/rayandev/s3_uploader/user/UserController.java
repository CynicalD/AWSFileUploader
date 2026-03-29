package com.rayandev.s3_uploader.user;

import com.rayandev.s3_uploader.s3.S3Buckets;
import com.rayandev.s3_uploader.s3.S3Service;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("api/v1/users")
@CrossOrigin(origins = "*") // Crucial for your React frontend to connect
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
        // Find user by username
        User user = userRepository.findByUsername(username)
                .orElse(null);

        // If a user exists, check the password
        if (user != null) {
            if (user.getPassword().equals(password)) {
                return user; // Login successful
            } else {
                throw new RuntimeException("Invalid password"); // Login failed
            }
        }

        // If user doesn't exist, create a new one
        User newUser = new User();
        newUser.setUsername(username);
        newUser.setPassword(password);
        return userRepository.save(newUser);
    }

    @PostMapping(value = "{userId}/profile-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public void uploadProfileImage(@PathVariable Integer userId,
                                   @RequestParam("file") MultipartFile file) throws IOException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String key = "profile-images/" + UUID.randomUUID();
        s3Service.putObject(s3Buckets.getBucket(), key, file.getBytes());

        user.setProfileImageKey(key);
        userRepository.save(user);
    }

    @GetMapping(value = "{userId}/profile-image", produces = MediaType.IMAGE_JPEG_VALUE)
    public byte[] getProfileImage(@PathVariable("userId") Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return s3Service.getObject(s3Buckets.getBucket(), user.getProfileImageKey());
    }
}