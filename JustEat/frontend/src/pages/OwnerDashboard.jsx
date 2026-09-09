import React, { useState, useEffect } from "react";
import { restaurantService, menuService, orderService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const STATUS_FLOW = ["PENDING", "PREPARING", "READY", "COMPLETED"];
const STATUS_LABELS = {
  PENDING: "Pending",
  PREPARING: "Preparing",
  READY: "Ready",
  COMPLETED: "Completed",
};

const RESTAURANT_EMOJIS = [
  "🍽️",
  "🍔",
  "🍕",
  "🍜",
  "🍛",
  "🍣",
  "🍱",
  "🌮",
  "🌯",
  "🍗",
  "🥗",
  "🍝",
  "🥘",
  "🍲",
  "🥩",
  "🧆",
  "🍤",
  "🥪",
  "🍟",
  "🌭",
  "🍦",
  "🍰",
  "🎂",
  "☕",
  "🍵",
  "🧃",
  "🍷",
  "🍻",
  "🥤",
  "🧋",
];

const MENU_EMOJIS = [
  "🍔",
  "🍕",
  "🍜",
  "🍛",
  "🍣",
  "🍱",
  "🌮",
  "🌯",
  "🍗",
  "🥗",
  "🍝",
  "🥘",
  "🍲",
  "🥩",
  "🧆",
  "🍤",
  "🥪",
  "🍟",
  "🌭",
  "🍦",
  "🍰",
  "🎂",
  "🥐",
  "🥨",
  "🧀",
  "🥚",
  "🍳",
  "🧇",
  "🥞",
  "🧈",
  "🥓",
  "🍖",
  "🌽",
  "🥕",
  "🥑",
  "🍅",
  "🥙",
  "🥫",
  "🍮",
  "🍯",
];

const DIETARY_OPTIONS = [
  "None",
  "Vegetarian",
  "Vegan",
  "Gluten-free",
  "Dairy-free",
  "Kosher",
  "Nut-free",
  "Halal",
  "Jain",
];

const BLANK_RESTAURANT = {
  name: "",
  cuisine: "",
  location: "",
  description: "",
  emoji: "🍽️",
  imageUrl: "",
};
const BLANK_ITEM = {
  name: "",
  price: "",
  emoji: "🍔",
  description: "",
  isVeg: true,
  dietaryOption: "None",
};

function normalizeDietaryOption(value) {
  if (!value || value === "None") return null;
  return value;
}

function getErrorMessage(err, fallback) {
  const data = err?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (typeof data?.message === "string" && data.message.trim())
    return data.message;
  if (typeof data?.error === "string" && data.error.trim()) return data.error;
  if (typeof err?.message === "string" && err.message.trim())
    return err.message;
  return fallback;
}

function getUserIdFromToken() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(normalized));
    const rawId = decoded?.userId;
    if (rawId == null) return null;
    const id = Number(rawId);
    return Number.isFinite(id) ? id : null;
  } catch {
    return null;
  }
}

export default function OwnerDashboard() {
  const { user } = useAuth();
  const ownerId = user?.id ?? getUserIdFromToken();
  const [tab, setTab] = useState("overview");
  const [restaurants, setRestaurants] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState(BLANK_ITEM);
  const [editingItem, setEditingItem] = useState(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState(BLANK_RESTAURANT);

  const restaurant = restaurants.find((r) => r.id === selectedId) || null;

  useEffect(() => {
    if (!ownerId) {
      toast.error(
        "Your session is missing owner details. Please sign in again.",
      );
      setLoading(false);
      return;
    }

    restaurantService
      .getAll({ ownerId })
      .then((res) => {
        const list = res.data || [];
        setRestaurants(list);
        if (list.length > 0) {
          setSelectedId(list[0].id);
          return Promise.all([
            restaurantService.getMenu(list[0].id),
            orderService.getRestaurantOrders(list[0].id),
          ]);
        }
      })
      .then((results) => {
        if (results) {
          setMenu(results[0].data);
          setOrders(results[1].data);
        }
      })
      .catch(() => toast.error("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, [ownerId]);

  const selectRestaurant = async (r) => {
    setSelectedId(r.id);
    setMenu([]);
    setOrders([]);
    setEditingItem(null);
    setShowAddForm(false);
    try {
      const [menuRes, ordersRes] = await Promise.all([
        restaurantService.getMenu(r.id),
        orderService.getRestaurantOrders(r.id),
      ]);
      setMenu(menuRes.data);
      setOrders(ordersRes.data);
    } catch {
      toast.error("Failed to load restaurant data");
    }
  };

  const createRestaurant = async () => {
    if (!ownerId) {
      toast.error("Unable to determine owner account. Please sign in again.");
      return;
    }
    if (
      !newRestaurant.name ||
      !newRestaurant.cuisine ||
      !newRestaurant.location
    ) {
      toast.error("Name, cuisine and location are required");
      return;
    }
    try {
      const res = await restaurantService.create({
        ...newRestaurant,
        ownerId,
      });
      const created = res.data;
      setRestaurants((prev) => [...prev, created]);
      setSelectedId(created.id);
      setMenu([]);
      setOrders([]);
      setNewRestaurant(BLANK_RESTAURANT);
      setShowCreateForm(false);
      toast.success("Restaurant created!");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to create restaurant"));
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await orderService.updateStatus(orderId, status);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
      );
      toast.success(`Order updated to ${STATUS_LABELS[status]}`);
    } catch {
      toast.error("Failed to update order");
    }
  };

  const toggleSpecial = async (item) => {
    try {
      const updated = { ...item, isSpecial: !item.isSpecial };
      await menuService.updateItem(restaurant.id, item.id, updated);
      setMenu((prev) => prev.map((m) => (m.id === item.id ? updated : m)));
      toast.success(
        updated.isSpecial ? "🔥 Marked as special!" : "Special removed",
      );
    } catch {
      toast.error("Failed to update item");
    }
  };

  const deleteMenuItem = async (itemId) => {
    if (!window.confirm("Delete this menu item?")) return;
    try {
      await menuService.deleteItem(restaurant.id, itemId);
      setMenu((prev) => prev.filter((m) => m.id !== itemId));
      toast.success("Item deleted");
    } catch {
      toast.error("Failed to delete item");
    }
  };

  const addMenuItem = async () => {
    if (!newItem.name || !newItem.price) {
      toast.error("Name and price required");
      return;
    }
    try {
      const res = await menuService.addItem(restaurant.id, {
        ...newItem,
        price: parseFloat(newItem.price),
        dietaryOption: normalizeDietaryOption(newItem.dietaryOption),
      });
      setMenu((prev) => [...prev, res.data]);
      setNewItem(BLANK_ITEM);
      setShowAddForm(false);
      toast.success("Menu item added!");
    } catch {
      toast.error("Failed to add item");
    }
  };

  const saveEditItem = async () => {
    if (!editingItem.name || !editingItem.price) {
      toast.error("Name and price required");
      return;
    }
    try {
      const updated = {
        ...editingItem,
        price: parseFloat(editingItem.price),
        dietaryOption: normalizeDietaryOption(editingItem.dietaryOption),
      };
      await menuService.updateItem(restaurant.id, editingItem.id, updated);
      setMenu((prev) =>
        prev.map((m) => (m.id === editingItem.id ? updated : m)),
      );
      setEditingItem(null);
      toast.success("Item updated!");
    } catch {
      toast.error("Failed to update item");
    }
  };

  if (loading)
    return (
      <div className="page-wrapper">
        <div className="container">
          <div className="spinner" />
        </div>
      </div>
    );

  const pendingCount = orders.filter((o) => o.status === "PENDING").length;
  const revenue = orders
    .filter((o) => o.status === "COMPLETED")
    .reduce((s, o) => s + (o.totalAmount || 0), 0);
  const popularItems = menu.filter((m) => m.isMostlyOrdered);

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 className="section-heading">
            {restaurant?.name || "Your Dashboard"}
          </h1>
          <p className="section-subheading">Restaurant owner dashboard</p>
        </div>

        {/* Restaurant selector strip */}
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: "1rem",
          }}
        >
          {restaurants.map((r) => (
            <button
              key={r.id}
              className={`btn ${r.id === selectedId ? "btn-primary" : "btn-secondary"} btn-sm`}
              onClick={() => selectRestaurant(r)}
            >
              {r.emoji} {r.name}
            </button>
          ))}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setShowCreateForm(true);
              setTab("restaurant");
            }}
          >
            + Add restaurant
          </button>
        </div>

        {/* No restaurant banner */}
        {restaurants.length === 0 && (
          <div
            className="card p-3"
            style={{
              marginBottom: "1rem",
              background: "#FFFAF0",
              border: "1px solid #FBD38D",
            }}
          >
            <p style={{ marginBottom: "0.5rem", fontWeight: 500 }}>
              👋 Welcome! You don't have a restaurant yet.
            </p>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setShowCreateForm(true);
                setTab("restaurant");
              }}
            >
              + Create your restaurant
            </button>
          </div>
        )}

        {/* Tab bar */}
        <div className="tab-bar">
          {["overview", "orders", "menu", "restaurant"].map((t) => (
            <button
              key={t}
              className={`tab-btn ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {tab === "overview" && (
          <div>
            <div className="grid-4 mb-3">
              <div className="stat-card">
                <div className="stat-number">{orders.length}</div>
                <div className="stat-label">Total orders</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{pendingCount}</div>
                <div className="stat-label">Pending</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">₹{revenue.toFixed(0)}</div>
                <div className="stat-label">Revenue</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{menu.length}</div>
                <div className="stat-label">Menu items</div>
              </div>
            </div>

            {popularItems.length > 0 && (
              <div className="card p-3 mb-2">
                <h3
                  style={{
                    fontWeight: 600,
                    marginBottom: "1rem",
                    fontSize: 16,
                  }}
                >
                  📈 Mostly ordered items
                </h3>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {popularItems.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        background: "#F0FFF4",
                        border: "1px solid #C6F6D5",
                        borderRadius: 10,
                        padding: "10px 14px",
                      }}
                    >
                      <div style={{ fontSize: 24, marginBottom: 4 }}>
                        {item.emoji || "🍽️"}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: 11, color: "#22543D" }}>
                        📈 Frequently ordered
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="card p-3">
              <h3
                style={{ fontWeight: 600, marginBottom: "1rem", fontSize: 16 }}
              >
                Recent orders
              </h3>
              {orders.length === 0 ? (
                <p style={{ color: "#718096", fontSize: 14 }}>No orders yet.</p>
              ) : (
                orders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 0",
                      borderBottom: "1px solid #E2E8F0",
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 500 }}>#{order.id}</span>
                      <span
                        style={{
                          color: "#718096",
                          fontSize: 13,
                          marginLeft: 8,
                        }}
                      >
                        {order.customerName}
                      </span>
                    </div>
                    <span
                      className={`badge badge-${order.status?.toLowerCase()}`}
                    >
                      {STATUS_LABELS[order.status]}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── Orders ── */}
        {tab === "orders" && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: "1rem" }}>
              Incoming orders
            </h2>
            {orders.length === 0 ? (
              <div className="empty-state">
                <div className="icon">📋</div>
                <p>No orders yet.</p>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="card p-3 mb-2">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600 }}>Order #{order.id}</span>
                      <span
                        style={{
                          color: "#718096",
                          fontSize: 13,
                          marginLeft: 8,
                        }}
                      >
                        {order.customerName}
                      </span>
                    </div>
                    <span style={{ fontWeight: 700, color: "#3B5BFF" }}>
                      ₹{order.totalAmount?.toFixed(2)}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: "#718096",
                      marginBottom: "0.75rem",
                    }}
                  >
                    {order.items
                      ?.map((i) => `${i.name} ×${i.quantity}`)
                      .join(", ")}
                  </p>
                  {order.deliveryAddress && (
                    <p
                      style={{
                        fontSize: 12,
                        color: "#A0AEC0",
                        marginBottom: "0.75rem",
                      }}
                    >
                      📍 {order.deliveryAddress}
                    </p>
                  )}
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <span
                      className={`badge badge-${order.status?.toLowerCase()}`}
                    >
                      {STATUS_LABELS[order.status]}
                    </span>
                    {STATUS_FLOW.indexOf(order.status) <
                      STATUS_FLOW.length - 1 &&
                      order.status !== "COMPLETED" && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() =>
                            updateOrderStatus(
                              order.id,
                              STATUS_FLOW[
                                STATUS_FLOW.indexOf(order.status) + 1
                              ],
                            )
                          }
                        >
                          Mark as{" "}
                          {
                            STATUS_LABELS[
                              STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1]
                            ]
                          }
                        </button>
                      )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Menu ── */}
        {tab === "menu" && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "1rem",
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>Menu items</h2>
              {restaurant && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setShowAddForm(!showAddForm);
                    setEditingItem(null);
                  }}
                >
                  + Add item
                </button>
              )}
            </div>

            {!restaurant && (
              <div className="empty-state">
                <p>Select or create a restaurant first.</p>
              </div>
            )}

            {/* Add new item form */}
            {showAddForm && restaurant && (
              <div className="card p-3 mb-2">
                <h3
                  style={{
                    fontWeight: 600,
                    marginBottom: "1rem",
                    fontSize: 15,
                  }}
                >
                  New menu item
                </h3>
                <div className="grid-2 mb-1">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Name *</label>
                    <input
                      className="form-control"
                      value={newItem.name}
                      onChange={(e) =>
                        setNewItem((p) => ({ ...p, name: e.target.value }))
                      }
                      placeholder="e.g. Butter Chicken"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Price (₹) *</label>
                    <input
                      className="form-control"
                      type="number"
                      step="0.01"
                      value={newItem.price}
                      onChange={(e) =>
                        setNewItem((p) => ({ ...p, price: e.target.value }))
                      }
                      placeholder="299"
                    />
                  </div>
                </div>
                <div className="grid-2 mb-2">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Emoji</label>
                    <select
                      className="form-control"
                      value={newItem.emoji}
                      onChange={(e) =>
                        setNewItem((p) => ({ ...p, emoji: e.target.value }))
                      }
                    >
                      {MENU_EMOJIS.map((e) => (
                        <option key={e} value={e}>
                          {e}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Description</label>
                    <input
                      className="form-control"
                      value={newItem.description}
                      onChange={(e) =>
                        setNewItem((p) => ({
                          ...p,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Brief description..."
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      className={`pill ${newItem.isVeg ? "active" : ""}`}
                      onClick={() => setNewItem((p) => ({ ...p, isVeg: true }))}
                    >
                      🥗 Veg
                    </button>
                    <button
                      type="button"
                      className={`pill ${!newItem.isVeg ? "active" : ""}`}
                      onClick={() =>
                        setNewItem((p) => ({ ...p, isVeg: false }))
                      }
                    >
                      🍖 Non-Veg
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Dietary option</label>
                  <select
                    className="form-control"
                    value={newItem.dietaryOption || "None"}
                    onChange={(e) =>
                      setNewItem((p) => ({
                        ...p,
                        dietaryOption: e.target.value,
                      }))
                    }
                  >
                    {DIETARY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={addMenuItem}
                  >
                    Save item
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Edit item form */}
            {editingItem && (
              <div
                className="card p-3 mb-2"
                style={{ border: "2px solid #3B5BFF" }}
              >
                <h3
                  style={{
                    fontWeight: 600,
                    marginBottom: "1rem",
                    fontSize: 15,
                  }}
                >
                  Edit: {editingItem.name}
                </h3>
                <div className="grid-2 mb-1">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Name *</label>
                    <input
                      className="form-control"
                      value={editingItem.name}
                      onChange={(e) =>
                        setEditingItem((p) => ({ ...p, name: e.target.value }))
                      }
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Price (₹) *</label>
                    <input
                      className="form-control"
                      type="number"
                      step="0.01"
                      value={editingItem.price}
                      onChange={(e) =>
                        setEditingItem((p) => ({ ...p, price: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="grid-2 mb-2">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Emoji</label>
                    <select
                      className="form-control"
                      value={editingItem.emoji}
                      onChange={(e) =>
                        setEditingItem((p) => ({ ...p, emoji: e.target.value }))
                      }
                    >
                      {MENU_EMOJIS.map((e) => (
                        <option key={e} value={e}>
                          {e}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Description</label>
                    <input
                      className="form-control"
                      value={editingItem.description}
                      onChange={(e) =>
                        setEditingItem((p) => ({
                          ...p,
                          description: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      className={`pill ${editingItem.isVeg ? "active" : ""}`}
                      onClick={() =>
                        setEditingItem((p) => ({ ...p, isVeg: true }))
                      }
                    >
                      🥗 Veg
                    </button>
                    <button
                      type="button"
                      className={`pill ${!editingItem.isVeg ? "active" : ""}`}
                      onClick={() =>
                        setEditingItem((p) => ({ ...p, isVeg: false }))
                      }
                    >
                      🍖 Non-Veg
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Dietary option</label>
                  <select
                    className="form-control"
                    value={editingItem.dietaryOption || "None"}
                    onChange={(e) =>
                      setEditingItem((p) => ({
                        ...p,
                        dietaryOption: e.target.value,
                      }))
                    }
                  >
                    {DIETARY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={saveEditItem}
                  >
                    Save changes
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setEditingItem(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="card">
              {menu.length === 0 ? (
                <div className="empty-state">
                  <p>No menu items yet. Add your first item above!</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Price</th>
                      <th>Type</th>
                      <th>Dietary</th>
                      <th>Special</th>
                      <th>Popular</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menu.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <span style={{ marginRight: 8 }}>{item.emoji}</span>
                          <span style={{ fontWeight: 500 }}>{item.name}</span>
                          {item.description && (
                            <span
                              style={{
                                display: "block",
                                fontSize: 12,
                                color: "#718096",
                              }}
                            >
                              {item.description}
                            </span>
                          )}
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          ₹{item.price?.toFixed(2)}
                        </td>
                        <td style={{ fontSize: 13 }}>
                          {item.isVeg === true && (
                            <span style={{ color: "#276749" }}>🥗 Veg</span>
                          )}
                          {item.isVeg === false && (
                            <span style={{ color: "#9B2335" }}>🍖 Non-Veg</span>
                          )}
                          {item.isVeg == null && (
                            <span style={{ color: "#718096" }}>—</span>
                          )}
                        </td>
                        <td style={{ fontSize: 13, color: "#4A5568" }}>
                          {item.dietaryOption || "—"}
                        </td>
                        <td>
                          <button
                            className={`badge ${item.isSpecial ? "badge-preparing" : ""}`}
                            style={{
                              cursor: "pointer",
                              border: "1px solid #E2E8F0",
                            }}
                            onClick={() => toggleSpecial(item)}
                          >
                            {item.isSpecial ? "✦ Special" : "Set special"}
                          </button>
                        </td>
                        <td>
                          {item.isMostlyOrdered && (
                            <span className="badge badge-completed">
                              📈 Popular
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setEditingItem({
                                  ...item,
                                  price: String(item.price),
                                  dietaryOption: item.dietaryOption || "None",
                                });
                                setShowAddForm(false);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => deleteMenuItem(item.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── Restaurant ── */}
        {tab === "restaurant" && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>
                {showCreateForm
                  ? "Create new restaurant"
                  : "Restaurant details"}
              </h2>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                {showCreateForm ? "Cancel" : "+ Add restaurant"}
              </button>
            </div>

            {/* Create restaurant form */}
            {showCreateForm && (
              <div
                className="card p-3 mb-3"
                style={{ maxWidth: 500, border: "2px solid #48BB78" }}
              >
                <h3
                  style={{
                    fontWeight: 600,
                    marginBottom: "1rem",
                    fontSize: 15,
                  }}
                >
                  New restaurant
                </h3>
                {["name", "cuisine", "location", "description"].map((field) => (
                  <div className="form-group" key={field}>
                    <label>
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                      {["name", "cuisine", "location"].includes(field)
                        ? " *"
                        : ""}
                    </label>
                    <input
                      className="form-control"
                      value={newRestaurant[field]}
                      onChange={(e) =>
                        setNewRestaurant((p) => ({
                          ...p,
                          [field]: e.target.value,
                        }))
                      }
                    />
                  </div>
                ))}
                <div className="form-group">
                  <label>Emoji</label>
                  <select
                    className="form-control"
                    value={newRestaurant.emoji}
                    onChange={(e) =>
                      setNewRestaurant((p) => ({ ...p, emoji: e.target.value }))
                    }
                  >
                    {RESTAURANT_EMOJIS.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Cover photo URL (optional)</label>
                  <input
                    className="form-control"
                    placeholder="https://example.com/my-restaurant.jpg"
                    value={newRestaurant.imageUrl}
                    onChange={(e) =>
                      setNewRestaurant((p) => ({
                        ...p,
                        imageUrl: e.target.value,
                      }))
                    }
                  />
                  <p style={{ fontSize: 11, color: "#718096", marginTop: 4 }}>
                    Paste a link to a photo. If left blank, the emoji above is
                    used instead.
                  </p>
                  {newRestaurant.imageUrl && (
                    <img
                      src={newRestaurant.imageUrl}
                      alt="Preview"
                      style={{
                        marginTop: 8,
                        width: "100%",
                        maxHeight: 140,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "1px solid #E2E8F0",
                      }}
                    />
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="btn btn-primary"
                    onClick={createRestaurant}
                  >
                    Create restaurant
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Edit existing restaurant */}
            {restaurant && !showCreateForm && (
              <div className="card p-3" style={{ maxWidth: 500 }}>
                <RestaurantForm
                  key={restaurant.id}
                  restaurant={restaurant}
                  onSave={async (data) => {
                    try {
                      await restaurantService.update(restaurant.id, data);
                      setRestaurants((prev) =>
                        prev.map((r) =>
                          r.id === restaurant.id ? { ...r, ...data } : r,
                        ),
                      );
                      toast.success("Restaurant updated!");
                    } catch (err) {
                      toast.error(getErrorMessage(err, "Failed to update"));
                    }
                  }}
                />
              </div>
            )}

            {!restaurant && !showCreateForm && (
              <div className="empty-state">
                <p>No restaurant selected. Create one or select from above.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function RestaurantForm({ restaurant, onSave }) {
  const EMOJIS = [
    "🍽️",
    "🍔",
    "🍕",
    "🍜",
    "🍛",
    "🍣",
    "🍱",
    "🌮",
    "🌯",
    "🍗",
    "🥗",
    "🍝",
    "🥘",
    "🍲",
    "🥩",
    "🧆",
    "🍤",
    "🥪",
    "🍟",
    "🌭",
    "🍦",
    "🍰",
    "🎂",
    "☕",
    "🍵",
    "🧃",
    "🍷",
    "🍻",
    "🥤",
    "🧋",
  ];

  const [form, setForm] = useState({
    name: restaurant.name || "",
    cuisine: restaurant.cuisine || "",
    location: restaurant.location || "",
    description: restaurant.description || "",
    emoji: restaurant.emoji || "🍽️",
    imageUrl: restaurant.imageUrl || "",
  });

  return (
    <div>
      <h3 style={{ fontWeight: 600, marginBottom: "1rem", fontSize: 15 }}>
        Edit: {restaurant.name}
      </h3>
      {["name", "cuisine", "location", "description"].map((field) => (
        <div className="form-group" key={field}>
          <label>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
          <input
            className="form-control"
            value={form[field]}
            onChange={(e) =>
              setForm((p) => ({ ...p, [field]: e.target.value }))
            }
          />
        </div>
      ))}
      <div className="form-group">
        <label>Emoji</label>
        <select
          className="form-control"
          value={form.emoji}
          onChange={(e) => setForm((p) => ({ ...p, emoji: e.target.value }))}
        >
          {EMOJIS.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Cover photo URL (optional)</label>
        <input
          className="form-control"
          placeholder="https://example.com/my-restaurant.jpg"
          value={form.imageUrl}
          onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
        />
        <p style={{ fontSize: 11, color: "#718096", marginTop: 4 }}>
          Paste a link to a photo. If left blank, the emoji above is used
          instead.
        </p>
        {form.imageUrl && (
          <img
            src={form.imageUrl}
            alt="Preview"
            style={{
              marginTop: 8,
              width: "100%",
              maxHeight: 140,
              objectFit: "cover",
              borderRadius: 8,
              border: "1px solid #E2E8F0",
            }}
          />
        )}
      </div>
      <button className="btn btn-primary" onClick={() => onSave(form)}>
        Save changes
      </button>
    </div>
  );
}
