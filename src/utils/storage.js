const PREFIX = "deskhub_";

export function setItem(key, value) {
  localStorage.setItem(
    PREFIX + key,
    JSON.stringify(value)
  );
}

export function getItem(key) {
  const value = localStorage.getItem(
    PREFIX + key
  );

  return value ? JSON.parse(value) : null;
}

export function removeItem(key) {
  localStorage.removeItem(PREFIX + key);
}