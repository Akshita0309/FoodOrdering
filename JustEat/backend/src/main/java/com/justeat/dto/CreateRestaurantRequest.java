package com.justeat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateRestaurantRequest(
    @NotBlank(message = "Name is required")
    String name,

    String cuisine,
    String location,
    String description,
    String emoji,
    String imageUrl,

    @NotNull(message = "ownerId is required")
    Long ownerId,

    Double rating,
    Boolean isVeg,
    Boolean isAvailable
) {}
