package com.justeat.service;

import com.justeat.model.User;

import java.util.List;
import java.util.Optional;

/**
 * Service interface for {@link User} entity operations.
 */
public interface UserService {

    User save(User user);

    Optional<User> findById(Long id);

    Optional<User> findByEmail(String email);

    Optional<User> findByResetToken(String resetToken);

    boolean existsByEmail(String email);

    List<User> findAll();

    void deleteById(Long id);

    /**
     * Fetches the current customer's saved preferences (favourite cuisines
     * and dietary restrictions).
     */
    Optional<User> getPreferences(String email);

    /**
     * Persists a customer's favourite cuisines / dietary restrictions.
     */
    Optional<User> savePreferences(String email, List<String> favouriteCuisines, List<String> dietaryRestrictions);
}
