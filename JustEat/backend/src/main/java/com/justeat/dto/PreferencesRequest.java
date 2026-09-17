package com.justeat.dto;

import java.util.List;

public record PreferencesRequest(
    List<String> favouriteCuisines,
    List<String> dietaryRestrictions
) {}
