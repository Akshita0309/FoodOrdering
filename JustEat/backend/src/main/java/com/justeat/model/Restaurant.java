package com.justeat.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "restaurants")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Restaurant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String cuisine;
    private String location;
    private String description;
    private String emoji;

    @Column(length = 1000)
    private String imageUrl;

    @Column(nullable = false)
    private Long ownerId;

    private Double rating = 4.5;
    private Boolean isVeg = false;

    @OneToMany(mappedBy = "restaurant", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<MenuItem> menuItems;

    // Not persisted — populated on read so the frontend can search by dish name
    // (e.g. searching "pizza" should surface any restaurant that serves it).
    @Transient
    private List<String> menuItemNames;
}
