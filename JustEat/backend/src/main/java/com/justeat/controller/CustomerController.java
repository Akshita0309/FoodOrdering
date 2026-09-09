package com.justeat.controller;

import com.justeat.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
@Tag(name = "Customer Preferences", description = "Manage customer profile and preferences")
@SecurityRequirement(name = "bearerAuth")
public class CustomerController {

    private final UserService userService;

    @GetMapping("/preferences")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Get customer preferences")
    public ResponseEntity<?> getPreferences(Authentication auth) {
        return userService.getPreferences(auth.getName()).map(u -> ResponseEntity.ok(Map.of(
            "favouriteCuisines", u.getFavouriteCuisines() != null ? u.getFavouriteCuisines() : List.of(),
            "dietaryRestrictions", u.getDietaryRestrictions() != null ? u.getDietaryRestrictions() : List.of()
        ))).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/preferences")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Save customer preferences")
    public ResponseEntity<?> savePreferences(Authentication auth, @RequestBody PreferencesRequest req) {
        return userService.savePreferences(auth.getName(), req.favouriteCuisines(), req.dietaryRestrictions())
            .map(u -> ResponseEntity.ok(Map.of("message", "Preferences saved")))
            .orElse(ResponseEntity.notFound().build());
    }

    public record PreferencesRequest(List<String> favouriteCuisines, List<String> dietaryRestrictions) {}
}
