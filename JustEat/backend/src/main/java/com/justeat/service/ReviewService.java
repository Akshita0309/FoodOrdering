package com.justeat.service;

import com.justeat.model.Review;

import java.util.List;
import java.util.Optional;

/**
 * Service interface for {@link Review} entity operations.
 */
public interface ReviewService {

    /**
     * Submits a review for a completed order belonging to the given customer.
     * Throws {@link IllegalStateException} / {@link IllegalArgumentException}
     * subclasses of {@link ReviewException} describing why the review was
     * rejected, so the controller can translate that into the right HTTP status.
     */
    Review submitReview(String customerEmail, Long orderId, Integer rating, String comment);

    Optional<Review> getReviewForOrder(Long orderId);

    List<Review> getReviewsForRestaurant(Long restaurantId);

    /**
     * Thrown when a review submission is rejected for a business reason.
     * {@code status} indicates the HTTP status the controller should return.
     */
    class ReviewException extends RuntimeException {
        private final int status;

        public ReviewException(int status, String message) {
            super(message);
            this.status = status;
        }

        public int getStatus() {
            return status;
        }
    }
}
