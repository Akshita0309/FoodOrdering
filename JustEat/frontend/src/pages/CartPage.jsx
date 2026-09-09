import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { orderService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function CartPage() {
  const { cart, cartRestaurant, addItem, removeItem, clearCart, total, count } =
    useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState("");

  const placeOrder = async () => {
    if (!address.trim()) {
      toast.error("Please enter a delivery address");
      return;
    }
    setLoading(true);
    try {
      const orderData = {
        restaurantId: cartRestaurant.id,
        customerId: user.id,
        deliveryAddress: address,
        items: cart.map((i) => ({
          menuItemId: i.id,
          quantity: i.qty,
          price: i.price,
        })),
        totalAmount: total,
      };
      const res = await orderService.place(orderData);
      clearCart();
      toast.success("Order placed successfully.");
      navigate(`/orders/${res.data.id}`);
    } catch (err) {
      toast.error("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (count === 0)
    return (
      <div className="page-wrapper">
        <div className="container" style={{ maxWidth: 600 }}>
          <div className="empty-state">
            <div className="icon">🛒</div>
            <p style={{ fontWeight: 500, marginBottom: 8 }}>
              Your cart is empty
            </p>
            <p className="text-muted text-sm mb-2">
              Add some items from a restaurant to get started.
            </p>
            <button className="btn btn-primary" onClick={() => navigate("/")}>
              Browse restaurants
            </button>
          </div>
        </div>
      </div>
    );

  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: 700 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <h1 className="section-heading" style={{ marginBottom: 0 }}>
            Your cart
          </h1>
          <button className="btn btn-secondary btn-sm" onClick={clearCart}>
            Clear all
          </button>
        </div>

        <div className="card p-3 mb-2">
          <p style={{ fontWeight: 600, marginBottom: "1rem" }}>
            🍽️ {cartRestaurant?.name}
          </p>
          {cart.map((item) => (
            <div key={item.id} className="cart-item-row">
              <div>
                <div style={{ fontWeight: 500 }}>
                  {item.emoji || ""} {item.name}
                </div>
                <div style={{ fontSize: 12, color: "#718096" }}>
                  ₹{item.price.toFixed(2)} each
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="qty-controls">
                  <button
                    className="qty-btn"
                    onClick={() => removeItem(item.id)}
                  >
                    −
                  </button>
                  <span
                    style={{
                      fontWeight: 600,
                      minWidth: 20,
                      textAlign: "center",
                    }}
                  >
                    {item.qty}
                  </span>
                  <button
                    className="qty-btn"
                    onClick={() => addItem(item, cartRestaurant)}
                  >
                    +
                  </button>
                </div>
                <span
                  style={{ fontWeight: 600, minWidth: 60, textAlign: "right" }}
                >
                  ₹{(item.price * item.qty).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: 700,
              fontSize: 16,
              paddingTop: "1rem",
              borderTop: "1px solid #E2E8F0",
              marginTop: "0.5rem",
            }}
          >
            <span>Total</span>
            <span style={{ color: "#3B5BFF" }}>₹{total.toFixed(2)}</span>
          </div>
        </div>

        <div className="card p-3">
          <h3 style={{ fontWeight: 600, marginBottom: "1rem", fontSize: 16 }}>
            Delivery details
          </h3>
          <div className="form-group">
            <label>Delivery address</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Enter your full delivery address..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <button
            className="btn btn-primary w-full"
            onClick={placeOrder}
            disabled={loading}
            style={{ fontSize: 16, padding: "12px" }}
          >
            {loading
              ? "Placing order..."
              : `Place order • ₹${total.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
