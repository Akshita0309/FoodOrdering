package com.justeat.service.impl;

import com.justeat.model.OrderItem;
import com.justeat.repository.OrderRepository;
import com.justeat.service.OrderItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderItemServiceImpl implements OrderItemService {

    private final OrderRepository orderRepository;

    @Override
    public List<OrderItem> findByOrderId(Long orderId) {
        return orderRepository.findById(orderId)
            .map(order -> {
                List<OrderItem> items = order.getItems();
                if (items == null) return List.<OrderItem>of();
                items.forEach(i -> i.setOrder(null));
                return items;
            })
            .orElse(List.of());
    }
}
