const BASE_URL =
  "http://localhost:3001";

async function request(
  endpoint,
  options = {}
) {
  try {
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
      throw new Error(
        "Request failed"
      );
    }

    const data =
      await response.json();

    return {
      data,
      headers: response.headers,
    };

  } catch (error) {
    console.error(error);

    throw error;
  }
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