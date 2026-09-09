package com.justeat.service;

/**
 * Service interface for outgoing transactional emails.
 */
public interface EmailService {

    /**
     * Sends the password reset token to the user's email address.
     */
    void sendPasswordResetEmail(String toEmail, String resetToken);

    /**
     * Sends the email-verification OTP used during registration.
     */
    void sendRegistrationOtpEmail(String toEmail, String otp);
}
