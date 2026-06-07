import {
  getCurrentUser,
  isAuthenticated,
} from "../api/auth.js";

import {
  countTickets,
  listRecentTickets,
  listTickets,
} from "../api/tickets.js";

import {
  hideLoader,
  showLoader,
} from "./ui.js";

const greetingEl =
  document.querySelector(
    "#dashboardGreeting"
  );

const totalEl =
  document.querySelector(
    "#totalTickets"
  );

const openEl =
  document.querySelector(
    "#openTickets"
  );

const inProgressEl =
  document.querySelector(
    "#inProgressTickets"
  );

const resolvedEl =
  document.querySelector(
    "#resolvedTickets"
  );

const recentEl =
  document.querySelector(
    "#recentTickets"
  );

const statusEl =
  document.querySelector(
    "#statusBreakdown"
  );

const errorEl =
  document.querySelector(
    "#dashboardError"
  );

export async function initDashboard() {
  if (!isAuthenticated()) {
    window.location.href =
      `${pagePrefix()}index.html`;

    return;
  }

  const user =
    getCurrentUser();

  greetingEl.textContent =
    user?.name
      ? `Welcome back, ${user.name}`
      : "Welcome back";

  try {
    showLoader("Loading dashboard...");

    const [
      total,
      open,
      inProgress,
      resolved,
      recentTickets,
      snapshot,
    ] = await Promise.all([
      countTickets(),
      countTickets("status=open"),
      countTickets("status=in-progress"),
      countTickets("status=resolved"),
      listRecentTickets(5),
      listTickets(),
    ]);

    renderDashboard({
      total,
      open,
      inProgress,
      resolved,
      recentTickets,
      snapshot:
        snapshot.tickets,
    });
  } catch (error) {
    console.error(error);
    errorEl.hidden = false;
    errorEl.textContent =
      "Could not load dashboard metrics. Check that json-server is running.";
  } finally {
    hideLoader();
  }
}

function renderDashboard(data) {
  const counts = {
    status:
      countBy(data.snapshot, "status"),
  };

  totalEl.textContent = data.total;
  openEl.textContent = data.open;
  inProgressEl.textContent =
    data.inProgress;
  resolvedEl.textContent =
    data.resolved;

  statusEl.innerHTML =
    metricRows(
      [
        "open",
        "in-progress",
        "resolved",
        "closed",
      ],
      counts.status
    );

  recentEl.innerHTML =
    recentTicketsMarkup(
      data.recentTickets
    );
}

function countBy(items, key) {
  return items.reduce(
    (acc, item) => {
      const value =
        item[key] || "unknown";

      acc[value] =
        (acc[value] || 0) + 1;

      return acc;
    },
    {}
  );
}

function metricRows(labels, counts) {
  return labels.map(
    (label) => `
      <div class="metric-row">
        <span>${formatLabel(label)}</span>
        <strong>${counts[label] || 0}</strong>
      </div>
    `
  ).join("");
}

function formatLabel(label) {
  return label
    .split("-")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1)
    )
    .join(" ");
}

function recentTicketsMarkup(tickets) {
  if (!tickets.length) {
    return `
      <p class="empty-state">
        No recent tickets
      </p>
    `;
  }

  return tickets.map(
    (ticket) => `
      <a
        class="recent-ticket"
        href="${pagePrefix()}ticket-detail.html?id=${encodeURIComponent(ticket.id)}"
      >
        <span>
          #${ticket.id} ${escapeHtml(ticket.title)}
        </span>
        <strong>
          ${escapeHtml(ticket.status || "open")}
        </strong>
      </a>
    `
  ).join("");
}

function pagePrefix() {
  return location.pathname.includes(
    "/public/"
  )
    ? "../"
    : "./";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
