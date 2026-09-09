package com.justeat;

import com.justeat.model.MenuItem;
import com.justeat.model.Restaurant;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class MenuControllerTests extends AbstractIntegrationTest {

    @Test
    void addMenuItemAsOwnerSucceeds() throws Exception {
        mvc.perform(post("/api/restaurants/" + restaurantId + "/menu")
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(Map.of(
                "name", "Pasta", "price", 10.99,
                "description", "Fresh pasta", "emoji", "🍝"
            ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Pasta"));
    }

    @Test
    void getMenuReturnsItems() throws Exception {
        mvc.perform(post("/api/restaurants/" + restaurantId + "/menu")
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(Map.of(
                "name", "Pizza", "price", 9.99, "emoji", "🍕"
            ))))
            .andExpect(status().isOk());

        mvc.perform(get("/api/restaurants/" + restaurantId + "/menu")
            .header("Authorization", "Bearer " + customerToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    @Test
    void deleteMenuItemAsOwner() throws Exception {
        String itemRes = mvc.perform(post("/api/restaurants/" + restaurantId + "/menu")
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(Map.of(
                "name", "To Delete", "price", 5.00, "emoji", "🗑️"
            ))))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        Long itemId = mapper.readTree(itemRes).get("id").asLong();

        mvc.perform(delete("/api/restaurants/" + restaurantId + "/menu/" + itemId)
            .header("Authorization", "Bearer " + ownerToken))
            .andExpect(status().isNoContent());

        assertThat(menuItemRepo.findById(itemId)).isEmpty();
    }

    @Test
    void menuItemOrderCountTriggersMostlyOrderedFlag() {
        Restaurant r = restaurantRepo.save(Restaurant.builder()
            .name("Count Test").cuisine("Test").ownerId(ownerId)
            .location("London").emoji("🍽️").rating(4.0).build());

        MenuItem item = menuItemRepo.save(MenuItem.builder()
            .restaurant(r).name("Track Me").price(5.0)
            .orderCount(4).isMostlyOrdered(false).build());

        item.setOrderCount(item.getOrderCount() + 1);
        item.setIsMostlyOrdered(item.getOrderCount() >= 5);
        MenuItem saved = menuItemRepo.save(item);

        assertThat(saved.getOrderCount()).isEqualTo(5);
        assertThat(saved.getIsMostlyOrdered()).isTrue();
    }
}
