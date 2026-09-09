package com.justeat.service.impl;

import com.justeat.model.Order;
import com.justeat.model.Review;
import com.justeat.model.User;
import com.justeat.repository.OrderRepository;
import com.justeat.repository.ReviewRepository;
import com.justeat.repository.UserRepository;
import com.justeat.service.RestaurantService;
import com.justeat.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final RestaurantService restaurantService;

    @Override
    public Review submitReview(String customerEmail, Long orderId, Integer rating, String comment) {
        if (orderId == null) {
            throw new ReviewException(400, "orderId is required");
        }
        if (rating == null || rating < 1 || rating > 5) {
            throw new ReviewException(400, "Rating must be between 1 and 5");
        }

        User customer = userRepository.findByEmail(customerEmail).orElse(null);
        if (customer == null) {
            throw new ReviewException(401, "Unauthorized");
        }

        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) {
            throw new ReviewException(400, "Order not found");
        }
        if (!order.getCustomerId().equals(customer.getId())) {
            throw new ReviewException(403, "You can only review your own orders");
        }
        if (order.getStatus() != Order.OrderStatus.COMPLETED) {
            throw new ReviewException(400, "You can only review orders after they are completed");
        }
        if (reviewRepository.existsByOrderId(order.getId())) {
            throw new ReviewException(400, "You've already reviewed this order");
        }

        Review review = Review.builder()
            .orderId(order.getId())
            .restaurantId(order.getRestaurantId())
            .customerId(customer.getId())
            .customerName(customer.getName() != null ? customer.getName() : "Customer")
            .rating(rating)
            .comment(comment)
            .build();
        reviewRepository.save(review);

        recalculateRestaurantRating(order.getRestaurantId());

        return review;
    }

    @Override
    public Optional<Review> getReviewForOrder(Long orderId) {
        return reviewRepository.findByOrderId(orderId);
    }

    @Override
    public List<Review> getReviewsForRestaurant(Long restaurantId) {
        return reviewRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurantId);
    }

    private void recalculateRestaurantRating(Long restaurantId) {
        List<Review> reviews = reviewRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurantId);
        if (reviews.isEmpty()) return;
        double avg = reviews.stream().mapToInt(Review::getRating).average().orElse(0);
        double rounded = Math.round(avg * 10.0) / 10.0;
        restaurantService.recalculateRating(restaurantId, rounded);
    }
}
