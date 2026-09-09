package com.justeat.dto;

import java.util.List;

public record PlaceOrderRequest(
    Long customerId, Long restaurantId, String deliveryAddress,
    Double totalAmount, List<OrderItemRequest> items
) {}
