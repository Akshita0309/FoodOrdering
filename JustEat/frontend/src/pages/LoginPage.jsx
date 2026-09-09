import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";

// Password complexity: min 8 chars, 1 uppercase, 1 number
function validatePassword(pw) {
  if (!pw || pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(pw))
    return "Password must contain at least one uppercase letter.";
  if (!/[0-9]/.test(pw)) return "Password must contain at least one number.";
  return null;
}

function getErrorMessage(err, fallback = "Operation failed") {
  const data = err?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (typeof data?.message === "string" && data.message.trim())
    return data.message;
  if (typeof data?.error === "string" && data.error.trim()) return data.error;
  if (typeof err?.message === "string" && err.message.trim())
    return err.message;
  return fallback;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CUSTOMER");
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");

  // Registration OTP state
  const [regView, setRegView] = useState("form"); // "form" | "otp"
  const [otp, setOtp] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Forgot / reset password state
  const [view, setView] = useState("login"); // "login" | "forgot" | "reset"
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { login, initiateRegister, verifyRegistration, resendRegistrationOtp } =
    useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // ── Login / Register (step 1: send details, get OTP emailed) ──────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (isRegister && !name)) {
      toast.error("Please fill in all fields");
      return;
    }
    if (isRegister) {
      const pwErr = validatePassword(password);
      if (pwErr) {
        toast.error(pwErr);
        return;
      }
    }
    setLoading(true);
    try {
      if (isRegister) {
        const res = await initiateRegister(name, email, password, role);
        toast.success(res.message || "Verification code sent!");
        setPendingEmail(email);
        setRegView("otp");
        setResendCooldown(30);
      } else {
        const user = await login(email, password, role);
        toast.success(`Welcome back, ${user.name || email.split("@")[0]}!`);
        navigate(user.role === "OWNER" ? "/dashboard" : "/");
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // ── Register step 2: verify the emailed OTP ────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error("Enter the 6-digit code from your email");
      return;
    }
    setLoading(true);
    try {
      const user = await verifyRegistration(pendingEmail, otp);
      toast.success("Account verified! Welcome to JustEat.");
      navigate(user.role === "OWNER" ? "/dashboard" : "/");
    } catch (err) {
      toast.error(getErrorMessage(err, "Verification failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      const res = await resendRegistrationOtp(pendingEmail);
      toast.success(res.message || "New code sent!");
      setResendCooldown(30);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to resend code"));
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot Password ───────────────────────────────────────────────
  const handleForgot = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error("Please enter your email");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", {
        email: forgotEmail,
      });
      setForgotSubmitted(true);
      toast.success(res.data.message || "Check your email for a reset code");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to send reset email"));
    } finally {
      setLoading(false);
    }
  };

  // ── Reset Password ────────────────────────────────────────────────
  const handleReset = async (e) => {
    e.preventDefault();
    if (!resetToken) {
      toast.error("Please enter the reset token");
      return;
    }
    const pwErr = validatePassword(newPassword);
    if (pwErr) {
      toast.error(pwErr);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/reset-password", {
        token: resetToken,
        newPassword,
      });
      toast.success(res.data.message || "Password reset! Please log in.");
      setView("login");
      setResetToken("");
      setNewPassword("");
      setConfirmPassword("");
      setForgotSubmitted(false);
      setForgotEmail("");
    } catch (err) {
      toast.error(getErrorMessage(err, "Reset failed"));
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot password view ──────────────────────────────────────────
  if (view === "forgot") {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">Reset Password</div>
          <p className="login-tagline">
            Enter your email to receive a reset token
          </p>
          <form onSubmit={handleForgot}>
            <div className="form-group">
              <label>Email</label>
              <input
                className="form-control"
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <button
              className="btn btn-primary w-full mt-2"
              type="submit"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Token"}
            </button>
          </form>

          {forgotSubmitted && (
            <div
              style={{
                marginTop: "1rem",
                background: "#F0FFF4",
                border: "1px solid #9AE6B4",
                borderRadius: 8,
                padding: "12px 16px",
                fontSize: 13,
              }}
            >
              <p style={{ fontWeight: 600, marginBottom: 4 }}>
                Check your inbox
              </p>
              <p style={{ color: "#276749", marginBottom: 8 }}>
                If that email is registered, we've sent a reset code to it. It
                expires in 1 hour.
              </p>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setView("reset")}
              >
                I have my code
              </button>
            </div>
          )}

          <div className="divider mt-2">or</div>
          <button
            type="button"
            className="btn btn-secondary w-full"
            onClick={() => {
              setView("login");
              setForgotSubmitted(false);
            }}
          >
            ← Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  // ── Reset password view ───────────────────────────────────────────
  if (view === "reset") {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">New Password</div>
          <p className="login-tagline">
            Enter your token and choose a new password
          </p>
          <form onSubmit={handleReset}>
            <div className="form-group">
              <label>Reset Token</label>
              <input
                className="form-control"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value.toUpperCase())}
                placeholder="e.g. A1B2C3D4"
                style={{ letterSpacing: 2, fontWeight: 600 }}
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                className="form-control"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 chars, 1 uppercase, 1 number"
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                className="form-control"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
              />
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#718096",
                marginBottom: "0.75rem",
                lineHeight: 1.5,
              }}
            >
              Password rules: at least 8 characters, one uppercase letter, one
              number.
            </div>
            <button
              className="btn btn-primary w-full"
              type="submit"
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
          <div className="divider mt-2">or</div>
          <button
            type="button"
            className="btn btn-secondary w-full"
            onClick={() => setView("forgot")}
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // ── Register step 2: enter emailed OTP ─────────────────────────────
  if (isRegister && regView === "otp") {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">Verify your email</div>
          <p className="login-tagline">
            We've sent a 6-digit code to <strong>{pendingEmail}</strong>
          </p>
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label>Verification code</label>
              <input
                className="form-control"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="123456"
                inputMode="numeric"
                style={{
                  letterSpacing: 6,
                  fontWeight: 700,
                  fontSize: 20,
                  textAlign: "center",
                }}
                autoFocus
              />
            </div>
            <button
              className="btn btn-primary w-full mt-2"
              type="submit"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify & Create Account"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "0.75rem" }}>
            <button
              type="button"
              style={{
                background: "none",
                border: "none",
                color: resendCooldown > 0 ? "#A0AEC0" : "#3B5BFF",
                fontSize: 13,
                cursor: resendCooldown > 0 ? "default" : "pointer",
                padding: 0,
              }}
              onClick={handleResendOtp}
              disabled={resendCooldown > 0 || loading}
            >
              {resendCooldown > 0
                ? `Resend code in ${resendCooldown}s`
                : "Didn't get it? Resend code"}
            </button>
          </div>

          <div className="divider mt-2">or</div>
          <button
            type="button"
            className="btn btn-secondary w-full"
            onClick={() => {
              setRegView("form");
              setOtp("");
            }}
          >
            ← Back to registration form
          </button>
        </div>
      </div>
    );
  }

  // ── Login / Register view ─────────────────────────────────────────
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">🍔 JustEat</div>
        <p className="login-tagline">Your favourite food, delivered fast</p>

        <div className="role-selector">
          <button
            type="button"
            className={`role-option ${role === "CUSTOMER" ? "selected" : ""}`}
            onClick={() => setRole("CUSTOMER")}
          >
            Customer
          </button>
          <button
            type="button"
            className={`role-option ${role === "OWNER" ? "selected" : ""}`}
            onClick={() => setRole("OWNER")}
          >
            Restaurant Owner
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label>Full Name</label>
              <input
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
              />
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input
              className="form-control"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              className="form-control"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {isRegister && (
            <p
              style={{ fontSize: 11, color: "#718096", marginBottom: "0.5rem" }}
            >
              Password rules: min 8 chars, one uppercase letter, one number.
            </p>
          )}
          <button
            className="btn btn-primary w-full mt-2"
            type="submit"
            disabled={loading}
          >
            {loading
              ? isRegister
                ? "Creating Account..."
                : "Signing In..."
              : isRegister
                ? "Create Account"
                : "Sign In"}
          </button>
        </form>

        {!isRegister && (
          <div style={{ textAlign: "right", marginTop: "0.5rem" }}>
            <button
              type="button"
              style={{
                background: "none",
                border: "none",
                color: "#3B5BFF",
                fontSize: 13,
                cursor: "pointer",
                padding: 0,
              }}
              onClick={() => {
                setView("forgot");
                setForgotEmail(email);
              }}
            >
              Forgot password?
            </button>
          </div>
        )}

        <div className="divider mt-2">or</div>
        <button
          type="button"
          className="btn btn-secondary w-full"
          onClick={() => {
            setIsRegister(!isRegister);
            setRegView("form");
            setOtp("");
          }}
        >
          {isRegister
            ? "Already have an account? Sign In"
            : "Don't have an account? Register"}
        </button>
      </div>
    </div>
  );
}
