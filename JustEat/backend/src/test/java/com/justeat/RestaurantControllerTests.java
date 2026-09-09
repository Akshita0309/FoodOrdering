package com.justeat;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class RestaurantControllerTests extends AbstractIntegrationTest {

    @Test
    void getRestaurantsAuthenticatedReturnsList() throws Exception {
        mvc.perform(get("/api/restaurants")
            .header("Authorization", "Bearer " + customerToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    @Test
    void createRestaurantAsCustomerReturns403() throws Exception {
        mvc.perform(post("/api/restaurants")
            .header("Authorization", "Bearer " + customerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(Map.of(
                "name", "Hack Cafe", "ownerId", customerId
            ))))
            .andExpect(status().isForbidden());
    }

    @Test
    void createRestaurantAsOwnerSucceeds() throws Exception {
        mvc.perform(post("/api/restaurants")
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(Map.of(
                "name", "New Bistro", "cuisine", "French",
                "location", "Paris", "emoji", "🥐", "ownerId", ownerId
            ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("New Bistro"));
    }

    @Test
    void getRestaurantById() throws Exception {
        mvc.perform(get("/api/restaurants/" + restaurantId)
            .header("Authorization", "Bearer " + customerToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Test Kitchen"));
    }

    @Test
    void updateRestaurantDetailsAsOwner() throws Exception {
        mvc.perform(put("/api/restaurants/" + restaurantId)
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(Map.of(
                "name", "Updated Kitchen", "cuisine", "French",
                "location", "Paris", "emoji", "🥐", "description", "Updated desc"
            ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Updated Kitchen"));
    }
}
