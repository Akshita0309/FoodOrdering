package com.justeat.controller;

import com.justeat.model.Review;
import com.justeat.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@Tag(name = "Reviews", description = "Customer ratings and reviews for completed orders")
@SecurityRequirement(name = "bearerAuth")
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Submit a rating/review for a completed order")
    public ResponseEntity<?> submitReview(Authentication auth, @RequestBody ReviewRequest req) {
        try {
            Review review = reviewService.submitReview(auth.getName(), req.orderId(), req.rating(), req.comment());
            return ResponseEntity.ok(review);
        } catch (ReviewService.ReviewException ex) {
            return ResponseEntity.status(ex.getStatus()).body(Map.of("message", ex.getMessage()));
        }
    }

    @GetMapping("/order/{orderId}")
    @Operation(summary = "Get the review (if any) submitted for a specific order")
    public ResponseEntity<?> getReviewForOrder(@PathVariable Long orderId) {
        return reviewService.getReviewForOrder(orderId)
            .<ResponseEntity<?>>map(ResponseEntity::ok)
            .orElse(ResponseEntity.ok(Map.of()));
    }

    @GetMapping("/restaurant/{restaurantId}")
    @Operation(summary = "Get all reviews for a restaurant")
    public ResponseEntity<List<Review>> getReviewsForRestaurant(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(reviewService.getReviewsForRestaurant(restaurantId));
    }

    public record ReviewRequest(Long orderId, Integer rating, String comment) {}
}
