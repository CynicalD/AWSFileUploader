package com.rayandev.s3_uploader.user;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "user_files")
public class UserFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String originalFileName;
    private String s3Key;

    // this makes is many to one
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore // Crucial: This stops Spring Boot from crashing in an infinite loop when sending data to React
    private User user;

    public UserFile() {}

    public UserFile(String originalFileName, String s3Key, User user) {
        this.originalFileName = originalFileName;
        this.s3Key = s3Key;
        this.user = user;
    }

    //  Getters and Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getOriginalFileName() { return originalFileName; }
    public void setOriginalFileName(String originalFileName) { this.originalFileName = originalFileName; }
    public String getS3Key() { return s3Key; }
    public void setS3Key(String s3Key) { this.s3Key = s3Key; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}
