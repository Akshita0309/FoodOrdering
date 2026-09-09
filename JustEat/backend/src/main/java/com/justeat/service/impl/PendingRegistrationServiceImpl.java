package com.justeat.service.impl;

import com.justeat.model.PendingRegistration;
import com.justeat.repository.PendingRegistrationRepository;
import com.justeat.service.PendingRegistrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PendingRegistrationServiceImpl implements PendingRegistrationService {

    private final PendingRegistrationRepository pendingRegistrationRepository;

    @Override
    public PendingRegistration save(PendingRegistration pendingRegistration) {
        return pendingRegistrationRepository.save(pendingRegistration);
    }

    @Override
    public Optional<PendingRegistration> findByEmail(String email) {
        return pendingRegistrationRepository.findByEmail(email);
    }

    @Override
    public void delete(PendingRegistration pendingRegistration) {
        pendingRegistrationRepository.delete(pendingRegistration);
    }

    @Override
    public void deleteByEmail(String email) {
        pendingRegistrationRepository.deleteByEmail(email);
    }
}
