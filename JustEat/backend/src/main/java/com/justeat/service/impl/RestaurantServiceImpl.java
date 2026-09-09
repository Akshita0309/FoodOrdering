package com.justeat.service.impl;

import com.justeat.model.MenuItem;
import com.justeat.model.Restaurant;
import com.justeat.repository.MenuItemRepository;
import com.justeat.repository.RestaurantRepository;
import com.justeat.service.RestaurantService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RestaurantServiceImpl implements RestaurantService {

    private static final int MAX_IMAGE_URL_LENGTH = 1000;

    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;

    @Override
    public List<Restaurant> getAll(Long ownerId, String cuisine, String name, Boolean veg) {
        List<Restaurant> results;
        if (ownerId != null) results = restaurantRepository.findByOwnerId(ownerId);
        else if (cuisine != null) results = restaurantRepository.findByCuisineIgnoreCase(cuisine);
        else if (name != null) results = restaurantRepository.findByNameContainingIgnoreCase(name);
        else results = restaurantRepository.findAll();

        if (veg != null) {
            results = results.stream()
                .filter(r -> veg ? Boolean.TRUE.equals(r.getIsVeg()) : !Boolean.TRUE.equals(r.getIsVeg()))
                .toList();
        }

        // Annotate with dish names (for dish-based search on the frontend) and
        // strip the full menu item list to avoid circular JSON.
        results.forEach(r -> {
            List<MenuItem> items = menuItemRepository.findByRestaurantId(r.getId());
            r.setMenuItemNames(items.stream().map(MenuItem::getName).toList());
            r.setMenuItems(null);
        });
        return results;
    }

    @Override
    public Optional<Restaurant> getById(Long id) {
        return restaurantRepository.findById(id).map(r -> {
            r.setMenuItems(null);
            return r;
        });
    }

    @Override
    public Restaurant create(Restaurant restaurant) {
        restaurant.setId(null);
        if (restaurant.getImageUrl() != null) {
            String imageUrl = restaurant.getImageUrl().trim();
            if (imageUrl.length() > MAX_IMAGE_URL_LENGTH) {
                throw new IllegalArgumentException("Image URL is too long. Please use a shorter URL.");
            }
            restaurant.setImageUrl(imageUrl.isEmpty() ? null : imageUrl);
        }
        restaurant.setMenuItems(null);
        return restaurantRepository.save(restaurant);
    }

    @Override
    public Optional<Restaurant> update(Long id, Restaurant updated) {
        return restaurantRepository.findById(id).map(r -> {
            r.setName(updated.getName());
            r.setCuisine(updated.getCuisine());
            r.setLocation(updated.getLocation());
            r.setDescription(updated.getDescription());
            r.setEmoji(updated.getEmoji());
            if (updated.getImageUrl() != null) {
                String imageUrl = updated.getImageUrl().trim();
                if (imageUrl.length() > MAX_IMAGE_URL_LENGTH) {
                    throw new IllegalArgumentException("Image URL is too long. Please use a shorter URL.");
                }
                r.setImageUrl(imageUrl.isEmpty() ? null : imageUrl);
            } else {
                r.setImageUrl(null);
            }
            r.setMenuItems(null);
            return restaurantRepository.save(r);
        });
    }

    @Override
    public List<Restaurant> findByOwnerId(Long ownerId) {
        return restaurantRepository.findByOwnerId(ownerId);
    }

    @Override
    public void recalculateRating(Long restaurantId, double roundedAverage) {
        restaurantRepository.findById(restaurantId).ifPresent(r -> {
            r.setRating(roundedAverage);
            r.setMenuItems(null);
            restaurantRepository.save(r);
        });
    }
}
