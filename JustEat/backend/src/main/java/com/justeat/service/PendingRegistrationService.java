package com.justeat.service;

import com.justeat.model.PendingRegistration;

import java.util.Optional;

/**
 * Service interface for {@link PendingRegistration} entity operations.
 */
public interface PendingRegistrationService {

    PendingRegistration save(PendingRegistration pendingRegistration);

    Optional<PendingRegistration> findByEmail(String email);

    void delete(PendingRegistration pendingRegistration);

    void deleteByEmail(String email);
}
