const BASE_URL = "http://localhost:3001";

async function request(
  endpoint,
  options = {}
) {
  const response = await fetch(
    `${BASE_URL}${endpoint}`,
    {
      headers: {
        "Content-Type":
          "application/json",
      },
      ...options,
    }
  );

  if (!response.ok) {
    throw new Error("API Error");
  }

  const data = await response.json();

  return {
    data,
    headers: response.headers,
  };
}

export function get(endpoint) {
  return request(endpoint);
}