package com.justeat.controller;

import com.justeat.model.MenuItem;
import com.justeat.model.Restaurant;
import com.justeat.service.MenuItemService;
import com.justeat.service.RestaurantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/restaurants")
@RequiredArgsConstructor
@Tag(name = "Restaurants", description = "Restaurant browse and management")
@SecurityRequirement(name = "bearerAuth")
public class RestaurantController {

    private final RestaurantService restaurantService;
    private final MenuItemService menuItemService;

    @GetMapping
    @Operation(summary = "Get all restaurants (filterable by ownerId, cuisine, name, veg)")
    public ResponseEntity<List<Restaurant>> getAll(
            @RequestParam(required = false) Long ownerId,
            @RequestParam(required = false) String cuisine,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Boolean veg) {
        return ResponseEntity.ok(restaurantService.getAll(ownerId, cuisine, name, veg));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get restaurant by ID")
    public ResponseEntity<Restaurant> getById(@PathVariable Long id) {
        return restaurantService.getById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/menu")
    @Operation(summary = "Get full menu for a restaurant")
    public ResponseEntity<List<MenuItem>> getMenu(@PathVariable Long id) {
        List<MenuItem> items = menuItemService.findByRestaurantId(id);
        items.forEach(i -> i.setRestaurant(null));
        return ResponseEntity.ok(items);
    }

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Create a new restaurant (owners only)")
    public ResponseEntity<?> create(@RequestBody Restaurant restaurant) {
        try {
            return ResponseEntity.ok(restaurantService.create(restaurant));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Update restaurant details")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Restaurant updated) {
        try {
            return restaurantService.update(id, updated)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    @PostMapping("/{restaurantId}/menu")
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Add a menu item")
    public ResponseEntity<MenuItem> addMenuItem(@PathVariable Long restaurantId, @RequestBody MenuItem item) {
        return menuItemService.addItem(restaurantId, item)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{restaurantId}/menu/{itemId}")
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Update a menu item")
    public ResponseEntity<MenuItem> updateMenuItem(@PathVariable Long restaurantId,
                                                   @PathVariable Long itemId,
                                                   @RequestBody MenuItem updated) {
        return menuItemService.updateItem(itemId, updated)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{restaurantId}/menu/{itemId}")
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Delete a menu item")
    public ResponseEntity<Void> deleteMenuItem(@PathVariable Long restaurantId, @PathVariable Long itemId) {
        menuItemService.deleteItem(itemId);
        return ResponseEntity.noContent().build();
    }
}
