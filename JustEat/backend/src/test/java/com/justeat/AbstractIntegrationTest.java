package com.justeat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.justeat.repository.MenuItemRepository;
import com.justeat.repository.OrderRepository;
import com.justeat.repository.PendingRegistrationRepository;
import com.justeat.repository.RestaurantRepository;
import com.justeat.repository.UserRepository;
import com.justeat.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:justeat_test;MODE=MySQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
    "jwt.secret=justeat-super-secret-key-change-this-in-production-min-256-bits-long",
    "jwt.expiration=86400000",
    "logging.level.com.justeat=WARN",
    "logging.level.org.springframework.security=WARN"
})
abstract class AbstractIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired UserRepository userRepo;
    @Autowired RestaurantRepository restaurantRepo;
    @Autowired MenuItemRepository menuItemRepo;
    @Autowired OrderRepository orderRepo;
    @Autowired PendingRegistrationRepository pendingRegistrationRepo;

    // The real EmailService would try to reach an actual SMTP server, which
    // isn't available in this test environment. Mocking it makes the
    // registration OTP flow a no-op send while everything else (the pending
    // registration row + its OTP) still gets persisted normally, so tests
    // can read the OTP straight out of the repository.
    @MockBean EmailService emailService;

    static String customerToken;
    static String ownerToken;
    static String customerEmail;
    static String ownerEmail;
    static Long restaurantId;
    static Long customerId;
    static Long ownerId;
    static boolean setupDone = false;

    static final String TEST_PASSWORD = "Password123";

    /**
     * Drives the real two-step OTP registration flow used by the app:
     * initiate -> read the OTP from pending registration -> verify.
     */
    protected JsonNode registerAndVerify(String email, String password, String name, String role) throws Exception {
        mvc.perform(post("/api/auth/register/initiate")
            .contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(Map.of(
                "email", email,
                "password", password,
                "name", name,
                "role", role
            ))))
            .andExpect(status().isOk());

        String otp = pendingRegistrationRepo.findByEmail(email)
            .orElseThrow(() -> new IllegalStateException("No pending registration found for " + email))
            .getOtp();

        String verifyRes = mvc.perform(post("/api/auth/register/verify")
            .contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(Map.of(
                "email", email,
                "otp", otp
            ))))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        return mapper.readTree(verifyRes);
    }

    @BeforeEach
    void setup() throws Exception {
        if (setupDone) return;
        setupDone = true;

        String runId = String.valueOf(System.currentTimeMillis());
        customerEmail = "test.customer." + runId + "@test.com";
        ownerEmail = "test.owner." + runId + "@test.com";

        JsonNode custData = registerAndVerify(customerEmail, TEST_PASSWORD, "Test Customer", "CUSTOMER");
        customerToken = custData.get("token").asText();
        customerId = custData.get("user").get("id").asLong();

        JsonNode ownerData = registerAndVerify(ownerEmail, TEST_PASSWORD, "Test Owner", "OWNER");
        ownerToken = ownerData.get("token").asText();
        ownerId = ownerData.get("user").get("id").asLong();

        String restRes = mvc.perform(post("/api/restaurants")
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(Map.of(
                "name", "Test Kitchen", "cuisine", "Italian",
                "location", "London", "emoji", "🍝", "ownerId", ownerId
            ))))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        restaurantId = mapper.readTree(restRes).get("id").asLong();
    }
}
