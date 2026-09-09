import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { restaurantService, preferencesService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const CUISINES = [
  "All",
  "Indian",
  "Italian",
  "Japanese",
  "American",
  "Chinese",
  "Thai",
  "Mexican",
];
const VEG_OPTIONS = ["All", "🥗 Veg", "🍖 Non-Veg"];

export default function BrowsePage() {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [preferences, setPreferences] = useState({
    favouriteCuisines: [],
    dietaryRestrictions: [],
  });
  const [recommended, setRecommended] = useState([]);
  const [otherRestaurants, setOtherRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cuisine, setCuisine] = useState("All");
  const [vegFilter, setVegFilter] = useState("All");
  const navigate = useNavigate();

  useEffect(() => {
    restaurantService
      .getAll()
      .then((res) => {
        setRestaurants(res.data);
        setFiltered(res.data);
      })
      .catch(() => toast.error("Failed to load restaurants"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user?.role !== "CUSTOMER") return;

    preferencesService
      .get()
      .then((res) =>
        setPreferences({
          favouriteCuisines: res.data?.favouriteCuisines || [],
          dietaryRestrictions: res.data?.dietaryRestrictions || [],
        }),
      )
      .catch(() => {
        // Keep browse page usable even if preference fetch fails.
      });
  }, [user]);

  useEffect(() => {
    let result = restaurants;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.cuisine.toLowerCase().includes(q) ||
          // Match on dish name too, so searching "pizza" surfaces every
          // restaurant that serves it, even if the restaurant name doesn't match.
          (r.menuItemNames || []).some((dish) =>
            dish.toLowerCase().includes(q),
          ),
      );
    }
    if (cuisine !== "All") result = result.filter((r) => r.cuisine === cuisine);
    if (vegFilter === "🥗 Veg") result = result.filter((r) => r.isVeg === true);
    if (vegFilter === "🍖 Non-Veg")
      result = result.filter((r) => r.isVeg !== true);
    setFiltered(result);
  }, [search, cuisine, vegFilter, restaurants]);

  useEffect(() => {
    const favouriteCuisines = (preferences.favouriteCuisines || []).map((c) =>
      c.toLowerCase(),
    );
    const dietaryRestrictions = (preferences.dietaryRestrictions || []).map(
      (d) => d.toLowerCase(),
    );
    const requiresVegOnly = dietaryRestrictions.some(
      (d) => d === "vegetarian" || d === "vegan",
    );

    const hasCuisinePreference = favouriteCuisines.length > 0;
    const hasActionablePreference = hasCuisinePreference || requiresVegOnly;

    if (!hasActionablePreference) {
      setRecommended([]);
      setOtherRestaurants(filtered);
      return;
    }

    const recommendedList = filtered.filter((r) => {
      const cuisineMatch =
        !hasCuisinePreference ||
        favouriteCuisines.includes((r.cuisine || "").toLowerCase());
      const dietaryMatch = !requiresVegOnly || r.isVeg === true;
      return cuisineMatch && dietaryMatch;
    });

    const recommendedIds = new Set(recommendedList.map((r) => r.id));
    const others = filtered.filter((r) => !recommendedIds.has(r.id));

    setRecommended(recommendedList);
    setOtherRestaurants(others);
  }, [filtered, preferences]);

  const renderRestaurantCards = (list) => (
    <div className="restaurant-grid">
      {list.map((r) => (
        <div
          key={r.id}
          className="rest-card"
          onClick={() => navigate(`/restaurant/${r.id}`)}
        >
          <div className="rest-card-image">
            {r.imageUrl ? (
              <img src={r.imageUrl} alt={r.name} />
            ) : (
              r.emoji || "🍽️"
            )}
          </div>
          <div className="rest-card-body">
            <div className="rest-card-name">{r.name}</div>
            <div className="rest-card-meta">
              <span>{r.cuisine}</span>
              <span>⭐ {r.rating?.toFixed(1) || "4.5"}</span>
              <span>📍 {r.location || "Nearby"}</span>
            </div>
            <div className="rest-tags">
              {r.isVeg && <span className="tag tag-special">🥗 Pure Veg</span>}
              {r.hasSpecial && (
                <span className="tag tag-special">🔥 Today's special</span>
              )}
              {r.hasMostlyOrdered && (
                <span className="tag tag-popular">📈 Popular</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="page-wrapper">
      <div className="container">
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 className="section-heading">Find your favourite food</h1>
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              className="form-control"
              style={{ paddingLeft: 40, maxWidth: 500 }}
              placeholder="Search restaurants, cuisines, or dishes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-pills">
            {CUISINES.map((c) => (
              <button
                key={c}
                className={`pill ${cuisine === c ? "active" : ""}`}
                onClick={() => setCuisine(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="filter-pills" style={{ marginTop: 6 }}>
            {VEG_OPTIONS.map((v) => (
              <button
                key={v}
                className={`pill ${vegFilter === v ? "active" : ""}`}
                onClick={() => setVegFilter(v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="spinner" />
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🍽️</div>
            <p>No restaurants found. Try a different search.</p>
          </div>
        ) : (
          <>
            {recommended.length > 0 && (
              <div style={{ marginBottom: "1.5rem" }}>
                <h2 className="section-heading" style={{ fontSize: "1.2rem" }}>
                  Recommended for you
                </h2>
                <p
                  className="text-muted text-sm"
                  style={{ marginBottom: "0.8rem" }}
                >
                  Based on your saved preferences
                </p>
                {renderRestaurantCards(recommended)}
              </div>
            )}

            {otherRestaurants.length > 0 && (
              <div>
                {recommended.length > 0 && (
                  <h2
                    className="section-heading"
                    style={{ fontSize: "1.2rem" }}
                  >
                    More restaurants
                  </h2>
                )}
                {renderRestaurantCards(otherRestaurants)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
