import { get } from "./client.js";

import {
  setItem,
  getItem,
  removeItem,
} from "../utils/storage.js";

export async function login(
  email,
  password
) {
  const { data } = await get(
    `/users?email=${email}`
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
  setItem("token", "fake-token");

  return user;
}

export function logout() {
  removeItem("user");
  removeItem("token");
}

export function getCurrentUser() {
  return getItem("user");
}