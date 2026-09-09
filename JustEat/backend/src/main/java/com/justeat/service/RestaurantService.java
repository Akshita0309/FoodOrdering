package com.justeat.service;

import com.justeat.model.Restaurant;

import java.util.List;
import java.util.Optional;

/**
 * Service interface for {@link Restaurant} entity operations.
 */
public interface RestaurantService {

    /**
     * Returns restaurants filtered by the given (all optional) criteria,
     * annotated with dish names for search and stripped of the full menu
     * item collection to avoid circular JSON.
     */
    List<Restaurant> getAll(Long ownerId, String cuisine, String name, Boolean veg);

    Optional<Restaurant> getById(Long id);

    Restaurant create(Restaurant restaurant);

    Optional<Restaurant> update(Long id, Restaurant updated);

    List<Restaurant> findByOwnerId(Long ownerId);

    /**
     * Recalculates and persists a restaurant's average rating from its reviews.
     */
    void recalculateRating(Long restaurantId, double roundedAverage);
}
