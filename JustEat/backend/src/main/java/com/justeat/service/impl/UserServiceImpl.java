package com.justeat.service.impl;

import com.justeat.model.User;
import com.justeat.repository.UserRepository;
import com.justeat.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public User save(User user) {
        return userRepository.save(user);
    }

    @Override
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public Optional<User> findByResetToken(String resetToken) {
        return userRepository.findByResetToken(resetToken);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    public List<User> findAll() {
        return userRepository.findAll();
    }

    @Override
    public void deleteById(Long id) {
        userRepository.deleteById(id);
    }

    @Override
    public Optional<User> getPreferences(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public Optional<User> savePreferences(String email, List<String> favouriteCuisines, List<String> dietaryRestrictions) {
        return userRepository.findByEmail(email).map(u -> {
            u.setFavouriteCuisines(favouriteCuisines);
            u.setDietaryRestrictions(dietaryRestrictions);
            return userRepository.save(u);
        });
    }
}
