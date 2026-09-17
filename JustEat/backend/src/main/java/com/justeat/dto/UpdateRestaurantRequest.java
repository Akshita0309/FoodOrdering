package com.justeat.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateRestaurantRequest(
    @NotBlank(message = "Name is required")
    String name,
    String cuisine,
    String location,
    String description,
    String emoji,
    String imageUrl,
    Boolean isVeg,
    Boolean isAvailable
) {}
