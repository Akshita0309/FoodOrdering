package com.justeat.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    // Password reset
    private String resetToken;
    private java.time.LocalDateTime resetTokenExpiry;

    // Customer preferences
    @ElementCollection
    @CollectionTable(name = "user_cuisines", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "cuisine")
    private List<String> favouriteCuisines;

    @ElementCollection
    @CollectionTable(name = "user_dietary", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "restriction")
    private List<String> dietaryRestrictions;

    public enum Role {
        CUSTOMER, OWNER
    }
}
