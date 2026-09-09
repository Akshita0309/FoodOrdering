package com.justeat.service.impl;

import com.justeat.dto.PlaceOrderRequest;
import com.justeat.model.MenuItem;
import com.justeat.model.Order;
import com.justeat.model.OrderItem;
import com.justeat.model.Restaurant;
import com.justeat.model.User;
import com.justeat.repository.MenuItemRepository;
import com.justeat.repository.OrderRepository;
import com.justeat.repository.RestaurantRepository;
import com.justeat.repository.UserRepository;
import com.justeat.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;
    private final UserRepository userRepository;

    @Override
    public Order placeOrder(PlaceOrderRequest req) {
        Restaurant restaurant = restaurantRepository.findById(req.restaurantId())
            .orElseThrow(() -> new IllegalArgumentException("Restaurant not found"));

        User customer = userRepository.findById(req.customerId()).orElse(null);

        Order order = Order.builder()
            .customerId(req.customerId())
            .customerName(customer != null ? customer.getName() : "Customer")
            .restaurantId(req.restaurantId())
            .restaurantName(restaurant.getName())
            .totalAmount(req.totalAmount())
            .deliveryAddress(req.deliveryAddress())
            .status(Order.OrderStatus.PENDING)
            .build();

        Order saved = orderRepository.save(order);

        List<OrderItem> items = new ArrayList<>(req.items().stream().map(i -> {
            MenuItem menuItem = menuItemRepository.findById(i.menuItemId()).orElse(null);
            if (menuItem != null) {
                menuItem.setOrderCount(menuItem.getOrderCount() + i.quantity());
                menuItem.setIsMostlyOrdered(menuItem.getOrderCount() >= 5);
                menuItemRepository.save(menuItem);
            }
            return OrderItem.builder()
                .order(saved)
                .menuItemId(i.menuItemId())
                .name(menuItem != null ? menuItem.getName() : "Item")
                .quantity(i.quantity())
                .price(i.price())
                .build();
        }).toList());

        saved.setItems(items);
        orderRepository.save(saved);
        stripBackReferences(saved);
        return saved;
    }

    @Override
    public List<Order> getOrdersForCustomer(Long customerId) {
        List<Order> orders = orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
        orders.forEach(this::stripBackReferences);
        return orders;
    }

    @Override
    public Optional<Order> getById(Long id) {
        return orderRepository.findById(id).map(o -> {
            stripBackReferences(o);
            return o;
        });
    }

    @Override
    public List<Order> getOrdersForRestaurant(Long restaurantId) {
        List<Order> orders = orderRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurantId);
        orders.forEach(this::stripBackReferences);
        return orders;
    }

    @Override
    public Optional<Order> updateStatus(Long id, Order.OrderStatus status) {
        return orderRepository.findById(id).map(o -> {
            o.setStatus(status);
            Order saved = orderRepository.save(o);
            stripBackReferences(saved);
            return saved;
        });
    }

    private void stripBackReferences(Order order) {
        if (order.getItems() != null) order.getItems().forEach(i -> i.setOrder(null));
    }
}
