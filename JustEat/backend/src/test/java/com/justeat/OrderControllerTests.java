package com.justeat;

import com.justeat.model.Order;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class OrderControllerTests extends AbstractIntegrationTest {

    @Test
    void placeOrderAsCustomerSucceeds() throws Exception {
        String itemRes = mvc.perform(post("/api/restaurants/" + restaurantId + "/menu")
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(Map.of(
                "name", "Burger", "price", 8.99, "emoji", "🍔"
            ))))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        Long itemId = mapper.readTree(itemRes).get("id").asLong();

        mvc.perform(post("/api/orders")
            .header("Authorization", "Bearer " + customerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(Map.of(
                "customerId", customerId,
                "restaurantId", restaurantId,
                "deliveryAddress", "123 Test St",
                "totalAmount", 8.99,
                "items", List.of(Map.of("menuItemId", itemId, "quantity", 1, "price", 8.99))
            ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void updateOrderStatusAsOwnerSucceeds() throws Exception {
        Order order = orderRepo.save(Order.builder()
            .customerId(customerId).customerName("Test Customer")
            .restaurantId(restaurantId).restaurantName("Test Kitchen")
            .totalAmount(10.0).deliveryAddress("123 St")
            .status(Order.OrderStatus.PENDING).build());

        mvc.perform(put("/api/orders/" + order.getId() + "/status")
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(Map.of("status", "PREPARING"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("PREPARING"));
    }

    @Test
    void updateOrderStatusAsCustomerReturns403() throws Exception {
        Order order = orderRepo.save(Order.builder()
            .customerId(customerId).customerName("Test Customer")
            .restaurantId(restaurantId).restaurantName("Test Kitchen")
            .totalAmount(10.0).status(Order.OrderStatus.PENDING).build());

        mvc.perform(put("/api/orders/" + order.getId() + "/status")
            .header("Authorization", "Bearer " + customerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(Map.of("status", "PREPARING"))))
            .andExpect(status().isForbidden());
    }

    @Test
    void getOrderByIdReturnsCorrectOrder() throws Exception {
        Order order = orderRepo.save(Order.builder()
            .customerId(customerId).customerName("Test Customer")
            .restaurantId(restaurantId).restaurantName("Test Kitchen")
            .totalAmount(15.99).deliveryAddress("456 Lane")
            .status(Order.OrderStatus.PENDING).build());

        mvc.perform(get("/api/orders/" + order.getId())
            .header("Authorization", "Bearer " + customerToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalAmount").value(15.99));
    }
}
