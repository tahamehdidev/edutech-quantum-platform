import { apiClient } from "./apiClient.js";

async function signup({ email, password, name }) {
  const { data } = await apiClient.post("/auth/signup", { email, password, name });
  return data.user;
}

async function login({ email, password }) {
  const { data } = await apiClient.post("/auth/login", { email, password });
  return data; // { user, accessToken } -- the refresh token itself never leaves the httpOnly cookie
}

async function refresh() {
  const { data } = await apiClient.post("/auth/refresh");
  return data.accessToken;
}

async function logout() {
  await apiClient.post("/auth/logout");
}

async function logoutAll() {
  await apiClient.post("/auth/logout-all");
}

export const authService = { signup, login, refresh, logout, logoutAll };
