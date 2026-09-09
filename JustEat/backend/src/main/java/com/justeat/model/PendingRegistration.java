package com.justeat.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Holds a registration in-flight until the user verifies the email OTP.
 * Nothing here becomes a real {@link User} until verify-otp succeeds.
 */
@Entity
@Table(name = "pending_registrations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PendingRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    private String name;

    // Already bcrypt-encoded before being stored — plaintext passwords are
    // never persisted, even temporarily.
    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String role;

    @Column(nullable = false)
    private String otp;

    @Column(nullable = false)
    private LocalDateTime otpExpiry;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
