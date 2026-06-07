import {
  initSettings,
} from "./utils/settings.js";

initSettings();

import "./modules/auth.js";

const page =
  document.body.dataset.page;

if (page === "dashboard") {
  const { initDashboard } =
    await import("./modules/dashboard.js");

  initDashboard();
}

if (page === "tickets-list") {
  const { initTicketsList } =
    await import("./modules/tickets.js");

  initTicketsList();
}

if (page === "ticket-detail") {
  const { initTicketDetail } =
    await import("./modules/ticketDetail.js");

  initTicketDetail();
}
