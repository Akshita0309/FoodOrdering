import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { orderService, reviewService } from "../services/api";
import toast from "react-hot-toast";

const STATUSES = ["PENDING", "PREPARING", "READY", "COMPLETED"];
const STATUS_LABELS = {
  PENDING: "Pending",
  PREPARING: "Preparing",
  READY: "Ready for pickup",
  COMPLETED: "Completed",
};
export function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    orderService
      .getMyOrders()
      .then((res) => setOrders(res.data))
      .catch(() => toast.error("Failed to load orders"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter(
    (o) =>
      !search ||
      o.restaurantName?.toLowerCase().includes(search.toLowerCase()) ||
      o.items?.some((i) =>
        i.name?.toLowerCase().includes(search.toLowerCase()),
      ),
  );

  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: 800 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.25rem",
          }}
        >
          <h1 className="section-heading" style={{ marginBottom: 0 }}>
            Order history
          </h1>
          <input
            className="form-control"
            style={{ width: 220 }}
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="spinner" />
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📋</div>
            <p>No orders yet. Go browse some restaurants!</p>
            <button
              className="btn btn-primary mt-2"
              onClick={() => navigate("/")}
            >
              Browse restaurants
            </button>
          </div>
        ) : (
          <div className="card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Restaurant</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 500 }}>#{order.id}</td>
                    <td>{order.restaurantName}</td>
                    <td style={{ color: "#718096", fontSize: 13 }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      ₹{order.totalAmount?.toFixed(2)}
                    </td>
                    <td>
                      <span
                        className={`badge badge-${order.status?.toLowerCase()}`}
                      >
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        {order.status !== "COMPLETED" ? "Track" : "View"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function OrderTrackingPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    orderService
      .getById(id)
      .then((res) => setOrder(res.data))
      .catch(() => toast.error("Order not found"))
      .finally(() => setLoading(false));

    const interval = setInterval(() => {
      orderService
        .getById(id)
        .then((res) => setOrder(res.data))
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    reviewService
      .getForOrder(id)
      .then((res) => setReview(res.data && res.data.id ? res.data : null))
      .catch(() => setReview(null))
      .finally(() => setReviewLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="page-wrapper">
        <div className="container">
          <div className="spinner" />
        </div>
      </div>
    );
  if (!order) return null;

  const statusIdx = STATUSES.indexOf(order.status);

  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: 700 }}>
        <button
          className="btn btn-secondary btn-sm mb-2"
          onClick={() => navigate("/orders")}
        >
          ← Back to orders
        </button>

        <div className="card p-3 mb-2">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "0.5rem",
            }}
          >
            <h2 style={{ fontWeight: 700 }}>Order #{order.id}</h2>
            <span className={`badge badge-${order.status?.toLowerCase()}`}>
              {STATUS_LABELS[order.status]}
            </span>
          </div>
          <p className="text-muted text-sm">
            {order.restaurantName} • Placed{" "}
            {new Date(order.createdAt).toLocaleString()}
          </p>

          <div className="tracking-steps mt-2">
            {STATUSES.map((s, i) => (
              <div
                key={s}
                className={`tracking-step ${i < statusIdx ? "done" : ""} ${i === statusIdx ? "current" : ""}`}
              >
                <div className="step-circle">{i < statusIdx ? "✓" : i + 1}</div>
                <div className="step-label">{STATUS_LABELS[s]}</div>
              </div>
            ))}
          </div>

          {order.status !== "COMPLETED" && (
            <div
              style={{
                background: "#FFF5F2",
                border: "1px solid #FED7C7",
                borderRadius: 8,
                padding: "10px 14px",
                marginTop: "1rem",
                fontSize: 13,
              }}
            >
              {order.status === "PENDING"
                ? "Your order has been received and is waiting for confirmation."
                : order.status === "PREPARING"
                  ? "The restaurant is now preparing your food."
                  : "Your order is ready! The driver is on the way."}
            </div>
          )}
        </div>

        {order.status === "COMPLETED" && !reviewLoading && (
          <ReviewSection
            orderId={order.id}
            existingReview={review}
            onSubmitted={(r) => setReview(r)}
          />
        )}

        <div className="card p-3">
          <h3 style={{ fontWeight: 600, marginBottom: "1rem", fontSize: 16 }}>
            Order summary
          </h3>
          {order.items?.map((item, i) => (
            <div key={i} className="cart-item-row">
              <span>
                {item.name} × {item.quantity}
              </span>
              <span style={{ fontWeight: 500 }}>
                ₹{(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: 700,
              paddingTop: "1rem",
              borderTop: "1px solid #E2E8F0",
            }}
          >
            <span>Total</span>
            <span style={{ color: "#3B5BFF" }}>
              ₹{order.totalAmount?.toFixed(2)}
            </span>
          </div>
          {order.deliveryAddress && (
            <p style={{ fontSize: 12, color: "#718096", marginTop: "0.75rem" }}>
              📍 {order.deliveryAddress}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StarRating({ value, onChange, readOnly }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          onClick={() => !readOnly && onChange && onChange(n)}
          style={{
            fontSize: 26,
            cursor: readOnly ? "default" : "pointer",
            color: n <= value ? "#FFB100" : "#E2E8F0",
            lineHeight: 1,
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function ReviewSection({ orderId, existingReview, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (existingReview) {
    return (
      <div className="card p-3 mb-2">
        <h3 style={{ fontWeight: 600, marginBottom: "0.5rem", fontSize: 16 }}>
          Your review
        </h3>
        <StarRating value={existingReview.rating} readOnly />
        {existingReview.comment && (
          <p style={{ fontSize: 13, color: "#4A5568", marginTop: 8 }}>
            {existingReview.comment}
          </p>
        )}
        <p style={{ fontSize: 12, color: "#718096", marginTop: 6 }}>
          Thanks for sharing your feedback! 🙏
        </p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      toast.error("Please select a star rating");
      return;
    }
    setSubmitting(true);
    try {
      const res = await reviewService.submit({ orderId, rating, comment });
      toast.success("Thanks for your review!");
      onSubmitted(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card p-3 mb-2">
      <h3 style={{ fontWeight: 600, marginBottom: "0.5rem", fontSize: 16 }}>
        Rate your order
      </h3>
      <p style={{ fontSize: 13, color: "#718096", marginBottom: 10 }}>
        How was your experience with this order?
      </p>
      <form onSubmit={handleSubmit}>
        <StarRating value={rating} onChange={setRating} />
        <div className="form-group mt-2">
          <textarea
            className="form-control"
            rows={3}
            placeholder="Tell us more (optional)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        <button
          className="btn btn-primary btn-sm"
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit review"}
        </button>
      </form>
    </div>
  );
}
