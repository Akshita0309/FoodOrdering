package com.justeat;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthControllerTests extends AbstractIntegrationTest {

    @Test
    void registerCustomerReturnsToken() throws Exception {
        String email = "new.user." + System.nanoTime() + "@test.com";
        JsonNode data = registerAndVerify(email, TEST_PASSWORD, "New User", "CUSTOMER");
        assertThat(data.get("token").asText()).isNotBlank();
        assertThat(data.get("user").get("role").asText()).isEqualTo("CUSTOMER");
    }

    @Test
    void loginValidCredentialsReturnsToken() throws Exception {
        mvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(Map.of(
                "email", customerEmail,
                "password", TEST_PASSWORD
            ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").exists());
    }

    @Test
    void loginInvalidCredentialsReturns401() throws Exception {
        mvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(Map.of(
                "email", "nobody@test.com",
                "password", "wrong"
            ))))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void duplicateEmailRegistrationReturns400() throws Exception {
        mvc.perform(post("/api/auth/register/initiate")
            .contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(Map.of(
                "email", customerEmail,
                "password", "AnotherPass123",
                "name", "Duplicate",
                "role", "CUSTOMER"
            ))))
            .andExpect(status().isBadRequest());
    }
}
