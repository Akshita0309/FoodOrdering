import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    setLoading(false);
  }, []);

  const login = async (email, password, role) => {
    const res = await api.post("/auth/login", {
      email,
      password,
      role,
    });

    const { token, user: u } = res.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(u));

    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    setUser(u);

    return u;
  };

  // Step 1: send registration details, triggers an OTP email. No account
  // exists yet — nothing to log in with until verifyRegistration succeeds.
  const initiateRegister = async (name, email, password, role) => {
    const res = await api.post("/auth/register/initiate", {
      name,
      email,
      password,
      role,
    });
    return res.data;
  };

  // Step 2: confirm the OTP. On success the account is created and the
  // server returns a token, so this logs the user in immediately.
  const verifyRegistration = async (email, otp) => {
    const res = await api.post("/auth/register/verify", { email, otp });
    const { token, user: u } = res.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(u));

    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    setUser(u);

    return u;
  };

  const resendRegistrationOtp = async (email) => {
    const res = await api.post("/auth/register/resend-otp", { email });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        initiateRegister,
        verifyRegistration,
        resendRegistrationOtp,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
