import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { restaurantService, reviewService } from "../services/api";
import { useCart } from "../context/CartContext";
import toast from "react-hot-toast";

export default function MenuPage() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vegFilter, setVegFilter] = useState("all"); // 'all' | 'veg' | 'nonveg'
  const { addItem } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([restaurantService.getById(id), restaurantService.getMenu(id)])
      .then(([rRes, mRes]) => {
        setRestaurant(rRes.data);
        setMenu(mRes.data);
      })
      .catch(() => toast.error("Failed to load menu"))
      .finally(() => setLoading(false));

    reviewService
      .getForRestaurant(id)
      .then((res) => setReviews(res.data || []))
      .catch(() => setReviews([]));
  }, [id]);

  const handleAdd = (item) => {
    addItem(item, restaurant);
    toast.success(`${item.name} added to cart`);
  };

  const applyVeg = (items) => {
    if (vegFilter === "veg") return items.filter((i) => i.isVeg === true);
    if (vegFilter === "nonveg") return items.filter((i) => i.isVeg === false);
    return items;
  };

  const visibleMenu = applyVeg(menu);

  if (loading)
    return (
      <div className="page-wrapper">
        <div className="container">
          <div className="spinner" />
        </div>
      </div>
    );
  if (!restaurant) return null;

  return (
    <div className="page-wrapper">
      <div className="container">
        <button
          className="btn btn-secondary mb-2"
          onClick={() => navigate("/")}
        >
          ← Back
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          {restaurant.imageUrl ? (
            <img
              src={restaurant.imageUrl}
              alt={restaurant.name}
              style={{
                width: 72,
                height: 72,
                borderRadius: 12,
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
          ) : (
            <span style={{ fontSize: 56 }}>{restaurant.emoji || "🍽️"}</span>
          )}
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700 }}>{restaurant.name}</h1>
            <p className="text-muted text-sm">
              {restaurant.cuisine} • ⭐ {restaurant.rating?.toFixed(1)} •{" "}
              {restaurant.location}
            </p>
            {restaurant.description && (
              <p style={{ fontSize: 14, color: "#4A5568", marginTop: 4 }}>
                {restaurant.description}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
          {["all", "veg", "nonveg"].map((v) => (
            <button
              key={v}
              className={`pill ${vegFilter === v ? "active" : ""}`}
              onClick={() => setVegFilter(v)}
            >
              {v === "all" ? "All" : v === "veg" ? "🥗 Veg" : "🍖 Non-Veg"}
            </button>
          ))}
        </div>

        {menu.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🍽️</div>
            <p>No menu items yet.</p>
          </div>
        ) : (
          <>
            {visibleMenu.some((i) => i.isSpecial) && (
              <>
                <h2 className="section-heading" style={{ fontSize: 16 }}>
                  🔥 Today's specials
                </h2>
                <div className="menu-grid mb-3">
                  {visibleMenu
                    .filter((i) => i.isSpecial)
                    .map((item) => (
                      <MenuCard key={item.id} item={item} onAdd={handleAdd} />
                    ))}
                </div>
              </>
            )}
            {visibleMenu.some((i) => i.isMostlyOrdered) && (
              <>
                <h2 className="section-heading" style={{ fontSize: 16 }}>
                  📈 Most popular
                </h2>
                <div className="menu-grid mb-3">
                  {visibleMenu
                    .filter((i) => i.isMostlyOrdered)
                    .map((item) => (
                      <MenuCard key={item.id} item={item} onAdd={handleAdd} />
                    ))}
                </div>
              </>
            )}
            <h2 className="section-heading" style={{ fontSize: 16 }}>
              Full menu
            </h2>
            <div className="menu-grid">
              {visibleMenu.length === 0 ? (
                <p style={{ color: "#718096", fontSize: 14 }}>
                  No items match this filter.
                </p>
              ) : (
                visibleMenu.map((item) => (
                  <MenuCard key={item.id} item={item} onAdd={handleAdd} />
                ))
              )}
            </div>
          </>
        )}

        <h2 className="section-heading" style={{ fontSize: 16, marginTop: "2rem" }}>
          ⭐ Customer reviews {reviews.length > 0 && `(${reviews.length})`}
        </h2>
        {reviews.length === 0 ? (
          <p style={{ color: "#718096", fontSize: 14 }}>
            No reviews yet. Be the first to order and share your feedback!
          </p>
        ) : (
          <div className="card p-3">
            {reviews.map((r, idx) => (
              <div
                key={r.id}
                style={{
                  paddingBottom: 12,
                  marginBottom: 12,
                  borderBottom:
                    idx < reviews.length - 1 ? "1px solid #E2E8F0" : "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <strong style={{ fontSize: 13 }}>
                    {r.customerName || "Customer"}
                  </strong>
                  <span style={{ color: "#FFB100", fontSize: 13 }}>
                    {"★".repeat(r.rating)}
                    {"☆".repeat(5 - r.rating)}
                  </span>
                </div>
                {r.comment && (
                  <p style={{ fontSize: 13, color: "#4A5568", marginTop: 4 }}>
                    {r.comment}
                  </p>
                )}
                <p style={{ fontSize: 11, color: "#A0AEC0", marginTop: 4 }}>
                  {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MenuCard({ item, onAdd }) {
  return (
    <div className="menu-item-card">
      <div style={{ fontSize: 36, marginBottom: 8 }}>{item.emoji || "🍽️"}</div>
      <div
        style={{ display: "flex", gap: 4, marginBottom: 4, flexWrap: "wrap" }}
      >
        {item.isVeg === true && (
          <span
            className="tag"
            style={{
              background: "#F0FFF4",
              color: "#276749",
              border: "1px solid #9AE6B4",
              fontSize: 11,
            }}
          >
            🥗 Veg
          </span>
        )}
        {item.isVeg === false && (
          <span
            className="tag"
            style={{
              background: "#FFF5F2",
              color: "#9B2335",
              border: "1px solid #FEB2B2",
              fontSize: 11,
            }}
          >
            🍖 Non-Veg
          </span>
        )}
        {item.isSpecial && <span className="tag tag-special">Special</span>}
        {item.isMostlyOrdered && (
          <span className="tag tag-popular">Popular</span>
        )}
      </div>
      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>
        {item.name}
      </div>
      <p style={{ fontSize: 12, color: "#718096", marginBottom: 10 }}>
        {item.description}
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 16, color: "#3B5BFF" }}>
          ₹{item.price?.toFixed(2)}
        </span>
        <button className="btn btn-primary btn-sm" onClick={() => onAdd(item)}>
          Add +
        </button>
      </div>
    </div>
  );
}
