import {
  get,
  post,
  patch,
  del,
} from "./client.js";

export async function listTickets(
  queryString = ""
) {
  const endpoint = queryString
    ? `/tickets?${queryString}`
    : "/tickets";

  const {
    data,
    headers,
  } = await get(
    endpoint
  );

  return {
    tickets: data,
    totalCount: Number(
      headers.get("X-Total-Count") ??
      data.length
    ),
  };
}

export async function getTicket(id) {
  const { data } = await get(
    `/tickets/${id}`
  );

  return data;
}

export async function createTicket(ticket) {
  const { data } = await post(
    "/tickets",
    ticket
  );

  return data;
}

export async function updateTicket(
  id,
  updates
) {
  const { data } = await patch(
    `/tickets/${id}`,
    updates
  );

  return data;
}

export async function deleteTicket(id) {
  const { data } = await del(
    `/tickets/${id}`
  );

  return data;
}

export async function listComments(ticketId) {
  const query = ticketId
    ? `?ticketId=${encodeURIComponent(ticketId)}&_sort=createdAt&_order=asc`
    : "";

  const { data } = await get(
    `/comments${query}`
  );

  return data;
}

export async function addComment(comment) {
  const { data } = await post(
    "/comments",
    {
      ...comment,
      createdAt:
        comment.createdAt ||
        new Date().toISOString(),
    }
  );

  return data;
}

export async function updateComment(
  id,
  updates
) {
  const { data } = await patch(
    `/comments/${id}`,
    updates
  );

  return data;
}

export async function deleteComment(id) {
  const { data } = await del(
    `/comments/${id}`
  );

  return data;
}

export async function listUsers() {
  const { data } = await get(
    "/users"
  );

  return data;
}

export async function countTickets(
  queryString = ""
) {
  const params =
    new URLSearchParams(queryString);

  params.set("_page", "1");
  params.set("_limit", "1");

  const { headers } = await get(
    `/tickets?${params.toString()}`
  );

  return Number(
    headers.get("X-Total-Count") || 0
  );
}

export async function listRecentTickets(
  limit = 5
) {
  const params =
    new URLSearchParams({
      _sort: "createdAt",
      _order: "desc",
      _limit: String(limit),
    });

  const { data } = await get(
    `/tickets?${params.toString()}`
  );

  return data;
}
