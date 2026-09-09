import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path ? "nav-link active" : "nav-link";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <a className="navbar-brand" href="/">
          🍔 Just<span>Eat</span>
        </a>
        <div className="nav-links">
          {user.role === "CUSTOMER" && (
            <>
              <button className={isActive("/")} onClick={() => navigate("/")}>
                Browse
              </button>
              <button
                className={isActive("/orders")}
                onClick={() => navigate("/orders")}
              >
                My Orders
              </button>
              <button
                className={isActive("/preferences")}
                onClick={() => navigate("/preferences")}
              >
                Preferences
              </button>
              <button
                className="cart-icon-btn"
                onClick={() => navigate("/cart")}
              >
                🛒 {count > 0 && <span className="cart-count">{count}</span>}
              </button>
            </>
          )}
          {user.role === "OWNER" && (
            <button
              className={isActive("/dashboard")}
              onClick={() => navigate("/dashboard")}
            >
              Dashboard
            </button>
          )}
          <span style={{ fontSize: 13, color: "#718096", padding: "0 6px" }}>
            {user.name || user.email}
          </span>
          <button className="nav-link" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}
