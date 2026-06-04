import { get }
from "./client.js";

import {
  set,
  get as getStoredValue,
  remove,
  clear,
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

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  set("user", safeUser);

  set(
    "token",
    "fake-jwt-token"
  );

  return safeUser;
}

export function logout() {
  remove("user");

  remove("token");
}

export function getCurrentUser() {
  return getStoredValue("user");
}

export function isAuthenticated() {
  return !!getStoredValue("token");
}

export function clearAuth() {
  clear();
}
