package com.justeat.service.impl;

import com.justeat.model.MenuItem;
import com.justeat.repository.MenuItemRepository;
import com.justeat.repository.RestaurantRepository;
import com.justeat.service.MenuItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MenuItemServiceImpl implements MenuItemService {

    private static final int MOSTLY_ORDERED_THRESHOLD = 5;

    private final MenuItemRepository menuItemRepository;
    private final RestaurantRepository restaurantRepository;

    @Override
    public List<MenuItem> findByRestaurantId(Long restaurantId) {
        return menuItemRepository.findByRestaurantId(restaurantId);
    }

    @Override
    public List<MenuItem> findTopItemsByRestaurant(Long restaurantId) {
        return menuItemRepository.findTopItemsByRestaurant(restaurantId);
    }

    @Override
    public Optional<MenuItem> findById(Long id) {
        return menuItemRepository.findById(id);
    }

    @Override
    public Optional<MenuItem> addItem(Long restaurantId, MenuItem item) {
        return restaurantRepository.findById(restaurantId).map(r -> {
            item.setId(null);
            item.setRestaurant(r);
            item.setOrderCount(0);
            MenuItem saved = menuItemRepository.save(item);
            saved.setRestaurant(null);
            return saved;
        });
    }

    @Override
    public Optional<MenuItem> updateItem(Long itemId, MenuItem updated) {
        return menuItemRepository.findById(itemId).map(item -> {
            item.setName(updated.getName());
            item.setDescription(updated.getDescription());
            item.setPrice(updated.getPrice());
            item.setEmoji(updated.getEmoji());
            item.setIsVeg(updated.getIsVeg());
            item.setDietaryOption(updated.getDietaryOption());
            item.setIsSpecial(updated.getIsSpecial());
            MenuItem saved = menuItemRepository.save(item);
            saved.setRestaurant(null);
            return saved;
        });
    }

    @Override
    public void deleteItem(Long itemId) {
        menuItemRepository.deleteById(itemId);
    }

    @Override
    public void registerOrder(Long menuItemId, int quantity) {
        menuItemRepository.findById(menuItemId).ifPresent(menuItem -> {
            menuItem.setOrderCount(menuItem.getOrderCount() + quantity);
            menuItem.setIsMostlyOrdered(menuItem.getOrderCount() >= MOSTLY_ORDERED_THRESHOLD);
            menuItemRepository.save(menuItem);
        });
    }
}
