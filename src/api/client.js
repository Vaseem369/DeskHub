const PRODUCTION_API_URL =
  "https://deskhub-xktc.onrender.com";

const BASE_URL =
  window.location.hostname ===
    "localhost" ||
  window.location.hostname ===
    "127.0.0.1"
    ? "http://localhost:3001"
    : PRODUCTION_API_URL;

export async function request(
  endpoint,
  options = {}
) {
  const response = await fetch(
    `${BASE_URL}${endpoint}`,
    {
      ...options,

      headers: {
        "Content-Type":
          "application/json",

        ...options.headers,
      },
    }
  );

  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  const data = contentType.includes(
    "application/json"
  )
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      response.statusText ||
      "Request failed";

    throw new Error(
      `${response.status} ${message}`
    );
  }

  return {
    data,
    headers: response.headers,
    status: response.status,
  };
}

export function get(endpoint) {
  return request(endpoint);
}

export function post(
  endpoint,
  body
) {
  return request(endpoint, {
    method: "POST",

    body: JSON.stringify(body),
  });
}

export function patch(
  endpoint,
  body
) {
  return request(endpoint, {
    method: "PATCH",

    body: JSON.stringify(body),
  });
}

export function del(endpoint) {
  return request(endpoint, {
    method: "DELETE",
  });
}
