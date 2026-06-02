import { get }
from "./client.js";

import {
  setItem,
  getItem,
  removeItem,
}
from "../utils/storage.js";

export async function login(
  email,
  password
) {
  const { data } = await get(
    `/users?email=${encodeURIComponent(email)}`
  );

  const user = data[0];

  if (
    !user ||
    user.password !== password
  ) {
    throw new Error(
      "Invalid credentials"
    );
  }

  setItem("user", user);

  setItem(
    "token",
    "fake-jwt-token"
  );

  return user;
}

export function logout() {
  removeItem("user");

  removeItem("token");
}

export function getCurrentUser() {
  return getItem("user");
}

export function isAuthenticated() {
  return !!getItem("token");
}