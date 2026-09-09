package com.justeat.service.impl;

import com.justeat.service.EmailService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromAddress;

    /**
     * Sends the password reset token to the user's email address.
     * Throws if sending fails so the caller can decide how to respond
     * (e.g. still return a generic 200 to avoid leaking whether the email exists).
     */
    @Override
    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject("Justeat — Your password reset code");
        message.setText(
            "Hi,\n\n" +
            "We received a request to reset your Justeat password.\n\n" +
            "Your password reset code is: " + resetToken + "\n\n" +
            "This code expires in 1 hour. If you didn't request this, you can safely ignore this email.\n\n" +
            "— The Justeat Team"
        );
        mailSender.send(message);
        log.info("Password reset email sent to {}", toEmail);
    }

    /**
     * Sends the email-verification OTP used during registration.
     */
    @Override
    public void sendRegistrationOtpEmail(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject("Justeat — Verify your email");
        message.setText(
            "Hi,\n\n" +
            "Thanks for signing up for Justeat! To finish creating your account, enter this verification code:\n\n" +
            "    " + otp + "\n\n" +
            "This code expires in 10 minutes. If you didn't try to create a Justeat account, you can ignore this email.\n\n" +
            "— The Justeat Team"
        );
        mailSender.send(message);
        log.info("Registration OTP email sent to {}", toEmail);
    }
}
