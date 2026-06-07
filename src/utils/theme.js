import {
  get,
  set,
} from "./storage.js";

const STORAGE_KEY = "theme";

export function getStoredTheme() {
  const value = get(STORAGE_KEY);

  return value === "dark"
    ? "dark"
    : "light";
}

export function applyTheme(theme) {
  const next =
    theme === "dark"
      ? "dark"
      : "light";

  document.documentElement.dataset.theme =
    next;
}

export function setStoredTheme(theme) {
  const next =
    theme === "dark"
      ? "dark"
      : "light";

  set(STORAGE_KEY, next);
  applyTheme(next);
}
