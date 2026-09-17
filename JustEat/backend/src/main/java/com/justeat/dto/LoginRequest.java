package com.justeat.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record LoginRequest(
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    String email,

    @NotBlank(message = "Password is required")
    String password,

    @Pattern(regexp = "^(CUSTOMER|OWNER)?$", message = "Role must be CUSTOMER or OWNER")
    String role
) {}
