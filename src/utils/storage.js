const PREFIX = "deskhub_";

export function set(key, value) {
  localStorage.setItem(
    PREFIX + key,
    JSON.stringify(value)
  );
}

export function get(key) {
  const value = localStorage.getItem(
    PREFIX + key
  );

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function remove(key) {
  localStorage.removeItem(
    PREFIX + key
  );
}

export function clear() {
  Object.keys(localStorage).forEach(
    (key) => {
      if (
        key.startsWith(PREFIX)
      ) {
        localStorage.removeItem(key);
      }
    }
  );
}

export const setItem = set;
export const getItem = get;
export const removeItem = remove;
export const clearStorage = clear;
