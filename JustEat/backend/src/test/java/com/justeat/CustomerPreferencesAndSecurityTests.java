package com.justeat;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CustomerPreferencesAndSecurityTests extends AbstractIntegrationTest {

    @Test
    void customerPreferencesSaveAndRetrieve() throws Exception {
        mvc.perform(put("/api/customers/preferences")
            .header("Authorization", "Bearer " + customerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(Map.of(
                "favouriteCuisines", List.of("Italian", "Japanese"),
                "dietaryRestrictions", List.of("Vegetarian")
            ))))
            .andExpect(status().isOk());

        mvc.perform(get("/api/customers/preferences")
            .header("Authorization", "Bearer " + customerToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.favouriteCuisines").isArray());
    }

    @Test
    void unauthenticatedRequestReturns401() throws Exception {
        mvc.perform(get("/api/restaurants"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void ownerCannotAccessCustomerPreferences() throws Exception {
        mvc.perform(get("/api/customers/preferences")
            .header("Authorization", "Bearer " + ownerToken))
            .andExpect(status().isForbidden());
    }
}
