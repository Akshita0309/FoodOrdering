package com.justeat.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record ReviewRequest(
    @NotNull(message = "orderId is required")
    @Positive(message = "orderId must be a positive number")
    Long orderId,

    @NotNull(message = "rating is required")
    @Min(value = 1, message = "Rating must be between 1 and 5")
    @Max(value = 5, message = "Rating must be between 1 and 5")
    Integer rating,

    @Size(max = 500, message = "Comment cannot exceed 500 characters")
    String comment
) {}
