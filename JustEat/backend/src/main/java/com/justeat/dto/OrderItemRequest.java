package com.justeat.dto;

public record OrderItemRequest(Long menuItemId, Integer quantity, Double price) {}
