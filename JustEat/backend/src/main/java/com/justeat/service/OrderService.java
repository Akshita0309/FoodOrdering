package com.justeat.service;

import com.justeat.dto.PlaceOrderRequest;
import com.justeat.model.Order;

import java.util.List;
import java.util.Optional;

/**
 * Service interface for {@link Order} (and its {@code OrderItem} children) operations.
 */
public interface OrderService {

    Order placeOrder(PlaceOrderRequest request);

    List<Order> getOrdersForCustomer(Long customerId);

    Optional<Order> getById(Long id);

    List<Order> getOrdersForRestaurant(Long restaurantId);

    Optional<Order> updateStatus(Long id, Order.OrderStatus status);
}
