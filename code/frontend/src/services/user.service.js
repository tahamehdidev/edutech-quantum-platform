import { apiClient } from "./apiClient.js";

async function getMe() {
  const { data } = await apiClient.get("/users/me");
  return data.user;
}

async function updateMe({ name }) {
  const { data } = await apiClient.patch("/users/me", { name });
  return data.user;
}

export const userService = { getMe, updateMe };
