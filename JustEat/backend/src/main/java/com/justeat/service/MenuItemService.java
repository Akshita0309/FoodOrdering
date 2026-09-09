package com.justeat.service;

import com.justeat.model.MenuItem;

import java.util.List;
import java.util.Optional;

/**
 * Service interface for {@link MenuItem} entity operations.
 */
public interface MenuItemService {

    List<MenuItem> findByRestaurantId(Long restaurantId);

    List<MenuItem> findTopItemsByRestaurant(Long restaurantId);

    Optional<MenuItem> findById(Long id);

    /**
     * Adds a new menu item to the given restaurant. Returns empty if the
     * restaurant doesn't exist.
     */
    Optional<MenuItem> addItem(Long restaurantId, MenuItem item);

    Optional<MenuItem> updateItem(Long itemId, MenuItem updated);

    void deleteItem(Long itemId);

    /**
     * Increments the order count for a menu item and flags it as "mostly
     * ordered" once the threshold is crossed. Used when an order is placed.
     */
    void registerOrder(Long menuItemId, int quantity);
}
