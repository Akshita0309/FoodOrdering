import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

const getToken = () => (localStorage.getItem("token") || "").trim();

const withAuth = (config = {}) => {
  const token = getToken();
  if (!token) return config;

  return {
    ...config,
    headers: {
      ...(config.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  };
};

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    if (typeof config.headers?.set === "function") {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err),
);

export const authService = {
  login: (data) => api.post("/auth/login", data),
  register: (data) => api.post("/auth/register", data),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (data) => api.post("/auth/reset-password", data),
};

export const restaurantService = {
  getAll: (params) => api.get("/restaurants", withAuth({ params })),
  getById: (id) => api.get(`/restaurants/${id}`, withAuth()),
  getMenu: (id) => api.get(`/restaurants/${id}/menu`, withAuth()),
  create: (data) => api.post("/restaurants", data, withAuth()),
  update: (id, data) => api.put(`/restaurants/${id}`, data, withAuth()),
};

export const menuService = {
  addItem: (restaurantId, data) =>
    api.post(`/restaurants/${restaurantId}/menu`, data, withAuth()),
  updateItem: (restaurantId, itemId, data) =>
    api.put(`/restaurants/${restaurantId}/menu/${itemId}`, data, withAuth()),
  deleteItem: (restaurantId, itemId) =>
    api.delete(`/restaurants/${restaurantId}/menu/${itemId}`, withAuth()),
};

export const orderService = {
  place: (data) => api.post("/orders", data, withAuth()),
  getMyOrders: () => api.get("/orders/my", withAuth()),
  getById: (id) => api.get(`/orders/${id}`, withAuth()),
  getRestaurantOrders: (restaurantId) =>
    api.get(`/orders/restaurant/${restaurantId}`, withAuth()),
  updateStatus: (id, status) =>
    api.put(`/orders/${id}/status`, { status }, withAuth()),
};

export const preferencesService = {
  get: () => api.get("/customers/preferences", withAuth()),
  save: (data) => api.put("/customers/preferences", data, withAuth()),
};

export const reviewService = {
  submit: (data) => api.post("/reviews", data, withAuth()),
  getForOrder: (orderId) => api.get(`/reviews/order/${orderId}`, withAuth()),
  getForRestaurant: (restaurantId) =>
    api.get(`/reviews/restaurant/${restaurantId}`, withAuth()),
};

export default api;
