package com.justeat.service;

import com.justeat.model.OrderItem;

import java.util.List;

/**
 * Service interface for {@link OrderItem} entity operations.
 *
 * <p>{@code OrderItem} is a child entity of {@code Order} (persisted via
 * cascade), so this service reads through the parent order rather than a
 * dedicated repository.
 */
public interface OrderItemService {

    /**
     * Returns the line items belonging to the given order, with the
     * back-reference to the parent order stripped to avoid circular JSON.
     */
    List<OrderItem> findByOrderId(Long orderId);
}
