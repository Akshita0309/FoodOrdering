package com.justeat.controller;

import com.justeat.model.PendingRegistration;
import com.justeat.model.User;
import com.justeat.service.EmailService;
import com.justeat.service.PendingRegistrationService;
import com.justeat.service.UserService;
import com.justeat.security.JwtUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "Login and registration endpoints")
public class AuthController {

    private final AuthenticationManager authManager;
    private final UserService userService;
    private final PendingRegistrationService pendingRegistrationService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final UserDetailsService userDetailsService;
    private final EmailService emailService;
    private final SecureRandom random = new SecureRandom();

    private static final int OTP_VALID_MINUTES = 10;

    /**
     * Step 1 of registration: validate the details, stash them as a pending
     * registration (password already hashed — never stored in plaintext),
     * and email a 6-digit OTP. No User row is created yet.
     */
    @PostMapping("/register/initiate")
    @Operation(summary = "Start registration — sends an email OTP to verify before the account is created")
    public ResponseEntity<?> initiateRegister(@RequestBody RegisterRequest req) {
        if (req.email() == null || req.email().isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
        if (req.name() == null || req.name().isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Name is required"));
        String pwError = validatePassword(req.password());
        if (pwError != null)
            return ResponseEntity.badRequest().body(Map.of("message", pwError));
        if (userService.existsByEmail(req.email()))
            return ResponseEntity.badRequest().body(Map.of("message", "Email already registered"));

        String role;
        try {
            role = (req.role() != null ? User.Role.valueOf(req.role()) : User.Role.CUSTOMER).name();
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid role"));
        }

        String otp = generateOtp();
        PendingRegistration pending = pendingRegistrationService.findByEmail(req.email()).orElse(new PendingRegistration());
        pending.setEmail(req.email());
        pending.setName(req.name());
        pending.setPasswordHash(passwordEncoder.encode(req.password()));
        pending.setRole(role);
        pending.setOtp(otp);
        pending.setOtpExpiry(LocalDateTime.now().plusMinutes(OTP_VALID_MINUTES));
        pendingRegistrationService.save(pending);

        try {
            emailService.sendRegistrationOtpEmail(req.email(), otp);
        } catch (Exception ex) {
            log.error("Failed to send registration OTP to {}", req.email(), ex);
            return ResponseEntity.status(502).body(Map.of(
                "message", "We couldn't send the verification email right now. Please try again shortly."));
        }

        return ResponseEntity.ok(Map.of(
            "message", "We've sent a 6-digit verification code to " + req.email() + ". It expires in "
                + OTP_VALID_MINUTES + " minutes."));
    }

    /**
     * Step 2 of registration: confirm the OTP and actually create the account.
     */
    @PostMapping("/register/verify")
    @Operation(summary = "Verify the email OTP and complete registration")
    public ResponseEntity<?> verifyRegister(@RequestBody VerifyOtpRequest req) {
        if (req.email() == null || req.otp() == null)
            return ResponseEntity.badRequest().body(Map.of("message", "Email and OTP are required"));

        PendingRegistration pending = pendingRegistrationService.findByEmail(req.email()).orElse(null);
        if (pending == null)
            return ResponseEntity.badRequest().body(Map.of("message", "No pending registration for this email. Please register again."));

        if (pending.getOtpExpiry().isBefore(LocalDateTime.now())) {
            pendingRegistrationService.delete(pending);
            return ResponseEntity.badRequest().body(Map.of("message", "This code has expired. Please register again to get a new one."));
        }
        if (!pending.getOtp().equals(req.otp().trim())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Incorrect verification code."));
        }
        if (userService.existsByEmail(pending.getEmail())) {
            pendingRegistrationService.delete(pending);
            return ResponseEntity.badRequest().body(Map.of("message", "Email already registered. Please sign in instead."));
        }

        User user = User.builder()
            .email(pending.getEmail())
            .name(pending.getName())
            .password(pending.getPasswordHash())
            .role(User.Role.valueOf(pending.getRole()))
            .build();
        userService.save(user);
        pendingRegistrationService.delete(pending);

        return buildAuthResponse(user);
    }

    /**
     * Resend a fresh OTP for a registration that's still pending.
     */
    @PostMapping("/register/resend-otp")
    @Operation(summary = "Resend the registration OTP")
    public ResponseEntity<?> resendOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));

        PendingRegistration pending = pendingRegistrationService.findByEmail(email).orElse(null);
        if (pending == null)
            return ResponseEntity.badRequest().body(Map.of("message", "No pending registration for this email. Please register again."));

        String otp = generateOtp();
        pending.setOtp(otp);
        pending.setOtpExpiry(LocalDateTime.now().plusMinutes(OTP_VALID_MINUTES));
        pendingRegistrationService.save(pending);

        try {
            emailService.sendRegistrationOtpEmail(email, otp);
        } catch (Exception ex) {
            log.error("Failed to resend registration OTP to {}", email, ex);
            return ResponseEntity.status(502).body(Map.of(
                "message", "We couldn't send the verification email right now. Please try again shortly."));
        }

        return ResponseEntity.ok(Map.of("message", "A new code has been sent to " + email + "."));
    }

    private String generateOtp() {
        return String.format("%06d", random.nextInt(1_000_000));
    }

    private String validatePassword(String pw) {
        if (pw == null || pw.length() < 8) return "Password must be at least 8 characters";
        if (!pw.matches(".*[A-Z].*")) return "Password must contain at least one uppercase letter";
        if (!pw.matches(".*[0-9].*")) return "Password must contain at least one number";
        return null;
    }

    @PostMapping("/login")
    @Operation(summary = "Login and receive JWT token")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        try {
            authManager.authenticate(new UsernamePasswordAuthenticationToken(req.email(), req.password()));
        } catch (org.springframework.security.core.AuthenticationException ex) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid email or password"));
        }
        User user = userService.findByEmail(req.email()).orElseThrow();
        String requestedRole = req.role() != null ? req.role().trim().toUpperCase() : null;
        if (requestedRole != null && !requestedRole.isEmpty() && !user.getRole().name().equals(requestedRole)) {
            return ResponseEntity.status(401).body(Map.of("message",
                "Incorrect role selected. This account is registered as a " + user.getRole().name().toLowerCase() + "."));
        }
        return buildAuthResponse(user);
    }

    private ResponseEntity<?> buildAuthResponse(User user) {
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtils.generateToken(userDetails, user.getId(), user.getRole().name());
        return ResponseEntity.ok(Map.of(
            "token", token,
            "user", Map.of(
                "id", user.getId(),
                "email", user.getEmail(),
                "name", user.getName() != null ? user.getName() : "",
                "role", user.getRole().name()
            )
        ));
    }

    public record LoginRequest(String email, String password, String role) {}
    public record RegisterRequest(String email, String password, String name, String role) {}
    public record VerifyOtpRequest(String email, String otp) {}
    public record ResetPasswordRequest(String token, String newPassword) {}

    @PostMapping("/forgot-password")
    @Operation(summary = "Request a password reset token (emailed to the user)")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));

        var userOpt = userService.findByEmail(email);
        // Always return the same generic message, whether or not the account exists,
        // so this endpoint can't be used to enumerate registered emails.
        Map<String, String> genericResponse = Map.of(
            "message", "If that email is registered, a reset code has been sent to it.");

        if (userOpt.isEmpty())
            return ResponseEntity.ok(genericResponse);

        User user = userOpt.get();
        String token = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        user.setResetToken(token);
        user.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
        userService.save(user);

        try {
            emailService.sendPasswordResetEmail(user.getEmail(), token);
        } catch (Exception ex) {
            log.error("Failed to send password reset email to {}", user.getEmail(), ex);
            return ResponseEntity.status(502).body(Map.of(
                "message", "We couldn't send the reset email right now. Please try again shortly."));
        }

        return ResponseEntity.ok(genericResponse);
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password using token")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest req) {
        if (req.newPassword() == null || req.newPassword().length() < 8)
            return ResponseEntity.badRequest().body(Map.of("message", "Password must be at least 8 characters"));
        if (!req.newPassword().matches(".*[A-Z].*"))
            return ResponseEntity.badRequest().body(Map.of("message", "Password must contain at least one uppercase letter"));
        if (!req.newPassword().matches(".*[0-9].*"))
            return ResponseEntity.badRequest().body(Map.of("message", "Password must contain at least one number"));

        User user = userService.findByResetToken(req.token())
            .filter(u -> u.getResetTokenExpiry() != null && u.getResetTokenExpiry().isAfter(LocalDateTime.now()))
            .orElse(null);
        if (user == null)
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid or expired reset token"));

        user.setPassword(passwordEncoder.encode(req.newPassword()));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userService.save(user);
        return ResponseEntity.ok(Map.of("message", "Password reset successfully. You can now log in."));
    }
}
