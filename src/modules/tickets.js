import {
  createTicket,
  listTickets,
  listUsers,
} from "../api/tickets.js";

import {
  isAuthenticated,
} from "../api/auth.js";

import {
  debounce,
} from "../utils/debounce.js";

import {
  formatDate,
} from "../utils/formatDate.js";

import {
  closeModal,
  modal,
  toast,
} from "./ui.js";

import {
  rowsToCsv,
  downloadTextFile,
} from "../utils/csv.js";

import {
  validateField,
  validateForm,
  validators,
} from "./form.js";

const PAGE_SIZE = 10;

const priorityOrder = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export const state = {
  search: "",
  status: "",
  priority: "",
  assignee: "",
  sort: "newest",
  page: 1,
  totalPages: 1,
  totalCount: 0,
};

const ticketsContainer =
  document.querySelector(
    "#ticketsContainer"
  );

const loadingEl =
  document.querySelector(
    "#loading"
  );

const errorEl =
  document.querySelector(
    "#error"
  );

const toolbarEl =
  document.querySelector(
    ".tickets-toolbar"
  );

const newTicketBtn =
  document.querySelector(
    "#newTicketBtn"
  );

const downloadCsvBtn =
  document.querySelector(
    "#downloadTicketsCsvBtn"
  );

let tickets = [];
let users = [];
let controls = {};

const debouncedRefresh =
  debounce(refresh, 300);

export async function initTicketsList() {
  if (!isAuthenticated()) {
    window.location.href =
      "./index.html";

    return;
  }

  readStateFromUrl();
  renderFilters();
  bindNewTicketButton();
  bindDownloadCsvButton();

  try {
    users = await listUsers();
    renderAssigneeOptions();
  } catch (error) {
    console.error(error);
  }

  await refresh();
}

export async function refresh() {
  setLoading(true);
  setError("");
  replaceUrl();

  try {
    const queryString =
      buildQueryString(
        state,
        {
          paginate: true,
        }
      );

    const result =
      await listTickets(queryString);

    tickets = sortTickets(
      result.tickets
    );

    state.totalCount =
      result.totalCount;

    state.totalPages =
      Math.max(
        1,
        Math.ceil(
          result.totalCount / PAGE_SIZE
        )
      );

    if (state.page > state.totalPages) {
      state.page = state.totalPages;
      await refresh();
      return;
    }

    renderTable(tickets);
    renderPagination();
  } catch (error) {
    console.error(error);

    ticketsContainer.innerHTML = "";

    setError(`
      <p>
        Failed to load tickets. Check that json-server is running.
      </p>

      <button
        type="button"
        id="retryTickets"
      >
        Retry
      </button>
    `);

    document
      .querySelector("#retryTickets")
      ?.addEventListener(
        "click",
        refresh
      );
  } finally {
    setLoading(false);
  }
}

export function renderTable(items) {
  if (!items.length) {
    ticketsContainer.innerHTML = `
      <p class="empty-state">
        No tickets found
      </p>

      ${paginationMarkup()}
    `;

    bindPagination();

    return;
  }

  ticketsContainer.innerHTML = `
    <div class="tickets-table-wrap">
      <table class="tickets-table">
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Title</th>
            <th scope="col">Customer</th>
            <th scope="col">Priority</th>
            <th scope="col">Status</th>
            <th scope="col">Assignee</th>
            <th scope="col">Created</th>
          </tr>
        </thead>

        <tbody>
          ${items.map(
            (ticket) => `
              <tr>
                <td>${escapeHtml(ticket.id)}</td>
                <td>
                  <a href="./ticket-detail.html?id=${encodeURIComponent(ticket.id)}">
                    ${escapeHtml(ticket.title)}
                  </a>
                </td>
                <td>${escapeHtml(ticket.customer)}</td>
                <td>${escapeHtml(ticket.priority)}</td>
                <td>${escapeHtml(ticket.status)}</td>
                <td>${escapeHtml(ticket.assignee)}</td>
                <td>
                  ${formatDate(ticket.createdAt)}
                </td>
              </tr>
            `
          ).join("")}
        </tbody>
      </table>
    </div>

    ${paginationMarkup()}
  `;

  bindPagination();
}

function bindNewTicketButton() {
  newTicketBtn?.addEventListener(
    "click",
    openCreateTicketModal
  );
}

function bindDownloadCsvButton() {
  downloadCsvBtn?.addEventListener(
    "click",
    downloadTicketsCsv
  );
}

function ticketAssigneeLabel(
  ticket
) {
  const a = ticket.assignee;

  if (
    a !== undefined &&
    a !== null &&
    a !== ""
  ) {
    return String(a);
  }

  const id = ticket.assignedTo;

  if (
    id === undefined ||
    id === null
  ) {
    return "";
  }

  const user = users.find(
    (u) => u.id === id
  );

  return user
    ? user.name
    : String(id);
}

function ticketsToCsvMatrix(
  items
) {
  const header = [
    "ID",
    "Title",
    "Customer",
    "Customer Email",
    "Status",
    "Priority",
    "Assignee",
    "Category",
    "Created",
    "Updated",
    "Description",
  ];

  const rows =
    items.map((t) => [
      t.id,
      t.title,
      t.customer ??
        t.customerName ??
        "",
      t.customerEmail ?? "",
      t.status ?? "",
      t.priority ?? "",
      ticketAssigneeLabel(t),
      t.category ?? "",
      t.createdAt ?? "",
      t.updatedAt ?? "",
      t.description ?? "",
    ]);

  return [header, ...rows];
}

async function downloadTicketsCsv() {
  if (state.totalCount === 0) {
    toast(
      "No tickets match the current filters",
      {
        type: "error",
      }
    );

    return;
  }

  const prevText =
    downloadCsvBtn?.textContent;

  if (downloadCsvBtn) {
    downloadCsvBtn.disabled = true;
    downloadCsvBtn.textContent =
      "Exporting…";
  }

  try {
    const queryString =
      buildQueryString(
        state,
        {
          paginate: false,
        }
      );

    const {
      tickets: allTickets,
    } = await listTickets(
      queryString
    );

    const sorted =
      sortTickets(allTickets);

    const matrix =
      ticketsToCsvMatrix(sorted);

    const csv =
      rowsToCsv(matrix);

    const stamp =
      new Date()
        .toISOString()
        .slice(0, 19)
        .replaceAll(":", "-");

    downloadTextFile(
      `deskhub-tickets-${stamp}.csv`,
      `\uFEFF${csv}`
    );

    toast(
      `Downloaded ${sorted.length} ticket(s)`
    );
  } catch (error) {
    console.error(error);

    toast(
      "Could not export tickets",
      {
        type: "error",
      }
    );
  } finally {
    if (downloadCsvBtn) {
      downloadCsvBtn.disabled = false;

      if (prevText) {
        downloadCsvBtn.textContent =
          prevText;
      }
    }
  }
}

function openCreateTicketModal() {
  const dialog = modal({
    title: "New Ticket",
    content: createTicketFormMarkup(),
  });

  const form =
    dialog.element.querySelector(
      "#createTicketForm"
    );

  const submitButton =
    form.querySelector(
      "[type='submit']"
    );

  const schema = {
    title: [
      validators.required(),
      validators.minLength(3),
      validators.maxLength(80),
    ],
    customer: [
      validators.required(),
      validators.minLength(2),
      validators.maxLength(60),
    ],
    customerEmail: [
      validators.required(),
      validators.email(),
    ],
    priority: [
      validators.oneOf([
        "low",
        "medium",
        "high",
        "urgent",
      ]),
    ],
    status: [
      validators.oneOf([
        "open",
        "in-progress",
        "resolved",
        "closed",
      ]),
    ],
    assignee: [
      validators.required(),
    ],
    description: [
      validators.required(),
      validators.minLength(10),
      validators.maxLength(500),
    ],
  };

  function values() {
    return Object.fromEntries(
      new FormData(form).entries()
    );
  }

  function showFieldError(name, error) {
    const errorEl =
      form.querySelector(
        `[data-error-for="${name}"]`
      );

    if (errorEl) {
      errorEl.textContent = error;
    }
  }

  function updateValidity() {
    const result =
      validateForm(values(), schema);

    submitButton.disabled =
      !result.isValid;

    return result;
  }

  form
    .querySelectorAll(
      "input, select, textarea"
    )
    .forEach((field) => {
      field.addEventListener(
        "blur",
        () => {
          showFieldError(
            field.name,
            validateField(
              field.value,
              schema[field.name]
            )
          );
        }
      );

      field.addEventListener(
        "input",
        updateValidity
      );

      field.addEventListener(
        "change",
        updateValidity
      );
    });

  updateValidity();

  form.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      const formValues = values();
      const result =
        validateForm(
          formValues,
          schema
        );

      for (const name of Object.keys(schema)) {
        showFieldError(
          name,
          result.errors[name] || ""
        );
      }

      if (!result.isValid) {
        submitButton.disabled = true;
        return;
      }

      submitButton.disabled = true;

      try {
        await createTicket({
          ...formValues,
          createdAt:
            new Date().toISOString(),
        });

        closeModal();
        await refresh();
        toast("Ticket created");
      } catch (error) {
        console.error(error);
        toast(
          "Could not create ticket",
          {
            type: "error",
          }
        );
        updateValidity();
      }
    }
  );
}

function createTicketFormMarkup() {
  return `
    <form
      id="createTicketForm"
      class="ticket-form"
      novalidate
    >
      ${fieldMarkup(
        "title",
        "Title",
        `<input name="title" id="title" type="text" />`
      )}

      ${fieldMarkup(
        "customer",
        "Customer",
        `<input name="customer" id="customer" type="text" />`
      )}

      ${fieldMarkup(
        "customerEmail",
        "Customer Email",
        `<input name="customerEmail" id="customerEmail" type="email" />`
      )}

      ${fieldMarkup(
        "priority",
        "Priority",
        `<select name="priority" id="priority">
          <option value="">Choose priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>`
      )}

      ${fieldMarkup(
        "status",
        "Status",
        `<select name="status" id="status">
          <option value="open">Open</option>
          <option value="in-progress">In-progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>`
      )}

      ${fieldMarkup(
        "assignee",
        "Assignee",
        `<select name="assignee" id="assignee">
          <option value="">Choose assignee</option>
          ${users.map(
            (user) => `
              <option value="${escapeHtml(user.name)}">
                ${escapeHtml(user.name)}
              </option>
            `
          ).join("")}
        </select>`
      )}

      ${fieldMarkup(
        "description",
        "Description",
        `<textarea name="description" id="description" rows="5"></textarea>`
      )}

      <button type="submit">
        Create Ticket
      </button>
    </form>
  `;
}

function fieldMarkup(
  name,
  label,
  control
) {
  return `
    <label class="form-field" for="${name}">
      <span>${label}</span>
      ${control}
      <small data-error-for="${name}"></small>
    </label>
  `;
}

export function buildQueryString(
  values,
  options = {}
) {
  const {
    paginate = true,
  } = options;

  const params =
    new URLSearchParams();

  if (values.search) {
    params.set(
      "q",
      values.search
    );
  }

  if (values.status) {
    params.set(
      "status",
      values.status
    );
  }

  if (values.priority) {
    params.set(
      "priority",
      values.priority
    );
  }

  if (values.assignee) {
    params.set(
      "assignee",
      values.assignee
    );
  }

  if (values.sort === "newest") {
    params.set("_sort", "createdAt");
    params.set("_order", "desc");
  }

  if (values.sort === "priority") {
    params.set("_sort", "priority");
    params.set("_order", "desc");
  }

  if (values.sort === "status") {
    params.set("_sort", "status");
    params.set("_order", "asc");
  }

  if (paginate) {
    params.set(
      "_page",
      values.page
    );
    params.set(
      "_limit",
      PAGE_SIZE
    );
  } else {
    params.set("_page", "1");
    params.set(
      "_limit",
      String(
        Math.max(
          Number(values.totalCount) ||
            0,
          1
        )
      )
    );
  }

  return params.toString();
}

function renderFilters() {
  if (!toolbarEl) {
    return;
  }

  toolbarEl.innerHTML = `
    <label class="filter-control">
      <span>Search</span>
      <input
        id="ticketSearch"
        type="search"
        value="${escapeHtml(state.search)}"
        placeholder="Search tickets"
      />
    </label>

    <label class="filter-control">
      <span>Status</span>
      <select id="statusFilter">
        ${optionsMarkup(
          [
            ["", "All"],
            ["open", "Open"],
            ["in-progress", "In-progress"],
            ["resolved", "Resolved"],
            ["closed", "Closed"],
          ],
          state.status
        )}
      </select>
    </label>

    <label class="filter-control">
      <span>Priority</span>
      <select id="priorityFilter">
        ${optionsMarkup(
          [
            ["", "All"],
            ["low", "Low"],
            ["medium", "Medium"],
            ["high", "High"],
            ["urgent", "Urgent"],
          ],
          state.priority
        )}
      </select>
    </label>

    <label class="filter-control">
      <span>Assignee</span>
      <select id="assigneeFilter">
        <option value="">All</option>
      </select>
    </label>

    <label class="filter-control">
      <span>Sort</span>
      <select id="sortFilter">
        ${optionsMarkup(
          [
            ["newest", "Newest"],
            ["priority", "Priority"],
            ["status", "Status"],
          ],
          state.sort
        )}
      </select>
    </label>
  `;

  controls = {
    search:
      document.querySelector(
        "#ticketSearch"
      ),
    status:
      document.querySelector(
        "#statusFilter"
      ),
    priority:
      document.querySelector(
        "#priorityFilter"
      ),
    assignee:
      document.querySelector(
        "#assigneeFilter"
      ),
    sort:
      document.querySelector(
        "#sortFilter"
      ),
  };

  controls.search.addEventListener(
    "input",
    () => {
      state.search =
        controls.search.value.trim();
      state.page = 1;
      debouncedRefresh();
    }
  );

  for (const key of [
    "status",
    "priority",
    "assignee",
    "sort",
  ]) {
    controls[key].addEventListener(
      "change",
      () => {
        state[key] =
          controls[key].value;
        state.page = 1;
        refresh();
      }
    );
  }
}

function renderAssigneeOptions() {
  if (!controls.assignee) {
    return;
  }

  controls.assignee.innerHTML = `
    <option value="">All</option>
    ${users.map(
      (user) => `
        <option
          value="${escapeHtml(user.name)}"
          ${user.name === state.assignee ? "selected" : ""}
        >
          ${escapeHtml(user.name)}
        </option>
      `
    ).join("")}
  `;
}

function renderPagination() {
  const paginationEl =
    document.querySelector(
      "#ticketsPagination"
    );

  if (!paginationEl) {
    return;
  }

  paginationEl.outerHTML =
    paginationMarkup();

  bindPagination();
}

function paginationMarkup() {
  const pageNumbers =
    Array.from(
      {
        length: state.totalPages,
      },
      (_, index) => index + 1
    );

  return `
    <nav
      id="ticketsPagination"
      class="tickets-pagination"
      aria-label="Ticket pages"
    >
      <button
        type="button"
        data-page-prev
        ${state.page === 1 ? "disabled" : ""}
      >
        Prev
      </button>

      <div class="page-numbers">
        ${pageNumbers.map(
          (page) => `
            <button
              type="button"
              data-page-number="${page}"
              ${page === state.page ? "aria-current=\"page\"" : ""}
            >
              ${page}
            </button>
          `
        ).join("")}
      </div>

      <button
        type="button"
        data-page-next
        ${state.page >= state.totalPages ? "disabled" : ""}
      >
        Next
      </button>

      <span class="page-summary">
        Page ${state.page} of ${state.totalPages}
      </span>
    </nav>
  `;
}

function bindPagination() {
  document
    .querySelector("[data-page-prev]")
    ?.addEventListener(
      "click",
      () => {
        if (state.page > 1) {
          state.page -= 1;
          refresh();
        }
      }
    );

  document
    .querySelector("[data-page-next]")
    ?.addEventListener(
      "click",
      () => {
        if (
          state.page <
          state.totalPages
        ) {
          state.page += 1;
          refresh();
        }
      }
    );

  document
    .querySelectorAll(
      "[data-page-number]"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          state.page = Number(
            button.dataset.pageNumber
          );
          refresh();
        }
      );
    });
}

function sortTickets(items) {
  if (state.sort !== "priority") {
    return items;
  }

  return [...items].sort(
    (a, b) =>
      (priorityOrder[a.priority] ?? 99) -
      (priorityOrder[b.priority] ?? 99)
  );
}

function readStateFromUrl() {
  const params =
    new URLSearchParams(
      window.location.search
    );

  state.search =
    params.get("search") || "";
  state.status =
    params.get("status") || "";
  state.priority =
    params.get("priority") || "";
  state.assignee =
    params.get("assignee") || "";
  state.sort =
    params.get("sort") || "newest";
  state.page =
    Number(params.get("page")) || 1;
}

function replaceUrl() {
  const params =
    new URLSearchParams();

  for (const key of [
    "search",
    "status",
    "priority",
    "assignee",
  ]) {
    if (state[key]) {
      params.set(key, state[key]);
    }
  }

  if (state.sort !== "newest") {
    params.set("sort", state.sort);
  }

  if (state.page !== 1) {
    params.set("page", state.page);
  }

  const query = params.toString();

  history.replaceState(
    null,
    "",
    query
      ? `${location.pathname}?${query}`
      : location.pathname
  );
}

function optionsMarkup(options, currentValue) {
  return options.map(
    ([value, label]) => `
      <option
        value="${value}"
        ${value === currentValue ? "selected" : ""}
      >
        ${label}
      </option>
    `
  ).join("");
}

function setLoading(isLoading) {
  if (!loadingEl) {
    return;
  }

  loadingEl.hidden = !isLoading;
}

function setError(html) {
  if (!errorEl) {
    return;
  }

  errorEl.innerHTML = html;
  errorEl.hidden = !html;
}

function escapeHtml(value) {
  return String(value ?? "-")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
