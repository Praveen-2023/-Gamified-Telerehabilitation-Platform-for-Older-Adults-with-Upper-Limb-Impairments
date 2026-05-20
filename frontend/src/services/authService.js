import api from "./api";

export const authService = {
  register: async (userData) =>
    (await api.post("/auth/register", userData)).data,
  login: async (credentials) =>
    (await api.post("/auth/login", credentials)).data,
  forgotPassword: async (email) =>
    (await api.post("/auth/forgot-password", { email })).data,
  verifyOTP: async (data) => (await api.post("/auth/verify-otp", data)).data,
};
