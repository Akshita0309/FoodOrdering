package com.justeat.controller;

import com.justeat.dto.PlaceOrderRequest;
import com.justeat.model.Order;
import com.justeat.model.User;
import com.justeat.service.OrderService;
import com.justeat.service.RestaurantService;
import com.justeat.service.UserService;
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
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Orders", description = "Order placement and tracking")
@SecurityRequirement(name = "bearerAuth")
public class OrderController {

    private final OrderService orderService;
    private final RestaurantService restaurantService;
    private final UserService userService;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Place a new order")
    public ResponseEntity<?> placeOrder(@RequestBody PlaceOrderRequest req) {
        try {
            return ResponseEntity.ok(orderService.placeOrder(req));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Get current customer's order history")
    public ResponseEntity<List<Order>> getMyOrders(Authentication auth) {
        User customer = userService.findByEmail(auth.getName()).orElse(null);
        List<Order> orders = customer != null
            ? orderService.getOrdersForCustomer(customer.getId())
            : List.of();
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get order by ID (customer who placed it, or the owning restaurant's owner)")
    public ResponseEntity<?> getById(Authentication auth, @PathVariable Long id) {
        Order order = orderService.getById(id).orElse(null);
        if (order == null) return ResponseEntity.notFound().build();

        User user = userService.findByEmail(auth.getName()).orElse(null);
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));

        boolean isOwnCustomerOrder = user.getRole() == User.Role.CUSTOMER && order.getCustomerId().equals(user.getId());
        boolean isOwningRestaurantOwner = user.getRole() == User.Role.OWNER
            && restaurantService.getById(order.getRestaurantId())
                .map(r -> r.getOwnerId().equals(user.getId()))
                .orElse(false);

        if (!isOwnCustomerOrder && !isOwningRestaurantOwner) {
            return ResponseEntity.status(403).body(Map.of("message", "You don't have access to this order"));
        }

        return ResponseEntity.ok(order);
    }

    @GetMapping("/restaurant/{restaurantId}")
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Get all orders for a restaurant")
    public ResponseEntity<List<Order>> getRestaurantOrders(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(orderService.getOrdersForRestaurant(restaurantId));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Update order status (owner only)")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Order.OrderStatus status = Order.OrderStatus.valueOf(body.get("status"));
        return orderService.updateStatus(id, status)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}
