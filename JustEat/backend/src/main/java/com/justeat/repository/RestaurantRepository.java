package com.justeat.repository;

import com.justeat.model.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {
    List<Restaurant> findByOwnerId(Long ownerId);
    List<Restaurant> findByCuisineIgnoreCase(String cuisine);
    List<Restaurant> findByNameContainingIgnoreCase(String name);
}
