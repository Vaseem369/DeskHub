import {
  addComment,
  deleteTicket,
  getTicket,
  listComments,
  listUsers,
  updateTicket,
} from "../api/tickets.js";

import {
  getCurrentUser,
  isAuthenticated,
} from "../api/auth.js";

import {
  formatDateTime,
  formatRelative,
} from "../utils/formatDate.js";

import {
  confirmDialog,
  hideLoader,
  showLoader,
  toast,
} from "./ui.js";

const titleEl =
  document.querySelector(
    "#ticketTitle"
  );

const infoEl =
  document.querySelector(
    "#ticketInfo"
  );

const commentsEl =
  document.querySelector(
    "#commentsList"
  );

const loadingEl =
  document.querySelector(
    "#detailLoading"
  );

const errorEl =
  document.querySelector(
    "#detailError"
  );

const deleteBtn =
  document.querySelector(
    "#deleteTicketBtn"
  );

const commentForm =
  document.querySelector(
    "#commentForm"
  );

const commentBody =
  document.querySelector(
    "#commentBody"
  );

let ticket;
let comments = [];
let users = [];
let ticketId;

export async function initTicketDetail() {
  if (!isAuthenticated()) {
    window.location.href =
      "./index.html";

    return;
  }

  const id =
    new URLSearchParams(
      location.search
    ).get("id");

  if (!id) {
    setError("Missing ticket id.");
    setLoading(false);
    return;
  }

  ticketId = id;
  bindDeleteButton(id);
  bindCommentForm();
  await loadTicket(id);
}

async function loadTicket(id) {
  setLoading(true);
  setError("");

  try {
    [
      ticket,
      comments,
      users,
    ] = await Promise.all([
      getTicket(id),
      listComments(id),
      listUsers(),
    ]);

    renderTicket();
    renderComments();
  } catch (error) {
    console.error(error);
    setError(
      "Failed to load ticket. Check that json-server is running."
    );
  } finally {
    setLoading(false);
  }
}

function renderTicket() {
  titleEl.textContent =
    ticket.title || `Ticket #${ticket.id}`;

  infoEl.innerHTML = `
    <dl class="detail-grid">
      ${detailItem("ID", ticket.id)}
      ${detailItem("Title", ticket.title)}
      ${detailItem("Customer", ticket.customer)}
      ${detailItem("Customer Email", ticket.customerEmail)}
      ${detailControl(
        "Status",
        "status",
        ticket.status,
        [
          ["open", "Open"],
          ["in-progress", "In-progress"],
          ["resolved", "Resolved"],
          ["closed", "Closed"],
        ]
      )}
      ${detailControl(
        "Priority",
        "priority",
        ticket.priority,
        [
          ["low", "Low"],
          ["medium", "Medium"],
          ["high", "High"],
          ["urgent", "Urgent"],
        ]
      )}
      ${detailControl(
        "Assignee",
        "assignee",
        ticket.assignee,
        users.map(
          (user) => [
            user.name,
            user.name,
          ]
        )
      )}
      ${detailItem(
        "Created",
        formatDateTime(ticket.createdAt)
      )}
      ${detailItem(
        "Updated",
        formatDateTime(ticket.updatedAt)
      )}
      ${detailItem(
        "Description",
        ticket.description,
        true
      )}
      ${extraFieldsMarkup()}
    </dl>
  `;

  infoEl
    .querySelectorAll("[data-ticket-field]")
    .forEach((select) => {
      select.addEventListener(
        "change",
        async () => {
          const field =
            select.dataset.ticketField;
          const previous =
            ticket[field];

          select.disabled = true;

          try {
            const updated =
              await updateTicket(
                ticket.id,
                {
                  [field]: select.value,
                  updatedAt:
                    new Date().toISOString(),
                }
              );

            ticket = {
              ...ticket,
              ...updated,
            };

            toast(
              `${fieldLabel(field)} updated`
            );
            renderTicket();
          } catch (error) {
            console.error(error);
            select.value = previous;
            toast(
              `Could not update ${fieldLabel(field).toLowerCase()}`,
              {
                type: "error",
              }
            );
            select.disabled = false;
          }
        }
      );
    });
}

function extraFieldsMarkup() {
  const knownFields = [
    "id",
    "title",
    "customer",
    "customerEmail",
    "status",
    "priority",
    "assignee",
    "createdAt",
    "updatedAt",
    "description",
  ];

  return Object.entries(ticket)
    .filter(([key]) =>
      !knownFields.includes(key)
    )
    .map(([key, value]) =>
      detailItem(
        fieldLabel(key),
        typeof value === "object"
          ? JSON.stringify(value)
          : value
      )
    )
    .join("");
}

function renderComments() {
  comments = [...comments].sort(
    (a, b) =>
      new Date(a.createdAt) -
      new Date(b.createdAt)
  );

  if (!comments.length) {
    commentsEl.innerHTML = `
      <p class="empty-state">
        No comments yet
      </p>
    `;

    return;
  }

  commentsEl.innerHTML = comments.map(
    (comment) => `
      <article class="comment-item">
        <header>
          <strong>
            ${escapeHtml(comment.author || "Support")}
          </strong>
          <span>
            ${escapeHtml(formatRelative(comment.createdAt))}
          </span>
        </header>
        <p>
          ${escapeHtml(comment.body || comment.text)}
        </p>
      </article>
    `
  ).join("");
}

function bindCommentForm() {
  commentForm?.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      const body =
        commentBody.value.trim();

      if (!body) {
        toast(
          "Comment cannot be empty",
          {
            type: "error",
          }
        );
        return;
      }

      const user =
        getCurrentUser();

      const submitButton =
        commentForm.querySelector(
          "button"
        );

      submitButton.disabled = true;
      showLoader("Saving comment...");

      try {
        await addComment({
          ticketId,
          body,
          author:
            user?.name || "Support",
        });

        comments =
          await listComments(ticketId);
        renderComments();
        commentBody.value = "";
        toast("Comment added");
      } catch (error) {
        console.error(error);
        toast(
          "Could not add comment",
          {
            type: "error",
          }
        );
      } finally {
        submitButton.disabled = false;
        hideLoader();
      }
    }
  );
}

function bindDeleteButton(id) {
  deleteBtn?.addEventListener(
    "click",
    async () => {
      const confirmed =
        await confirmDialog({
          title: "Delete ticket",
          message:
            "This ticket will be permanently deleted.",
          confirmText: "Delete",
        });

      if (!confirmed) {
        return;
      }

      try {
        showLoader("Deleting ticket...");
        await deleteTicket(id);
        toast("Ticket deleted");
        window.location.href =
          "./tickets.html";
      } catch (error) {
        console.error(error);
        toast(
          "Could not delete ticket",
          {
            type: "error",
          }
        );
      }
      finally {
        hideLoader();
      }
    }
  );
}

function detailItem(
  label,
  value,
  isWide = false
) {
  return `
    <div class="detail-item ${isWide ? "detail-item-wide" : ""}">
      <dt>${escapeHtml(label)}</dt>
      <dd>${escapeHtml(value)}</dd>
    </div>
  `;
}

function detailControl(
  label,
  field,
  value,
  options
) {
  const controlOptions =
    options.some(
      ([optionValue]) =>
        optionValue === value
    ) || !value
      ? options
      : [
        [value, value],
        ...options,
      ];

  return `
    <div class="detail-item">
      <dt>${escapeHtml(label)}</dt>
      <dd>
        <select
          data-ticket-field="${field}"
          aria-label="${escapeHtml(label)}"
        >
          ${controlOptions.map(
            ([optionValue, optionLabel]) => `
              <option
                value="${escapeHtml(optionValue)}"
                ${optionValue === value ? "selected" : ""}
              >
                ${escapeHtml(optionLabel)}
              </option>
            `
          ).join("")}
        </select>
      </dd>
    </div>
  `;
}

function fieldLabel(field) {
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) =>
      char.toUpperCase()
    );
}

function setLoading(isLoading) {
  if (loadingEl) {
    loadingEl.hidden = !isLoading;
  }
}

function setError(message) {
  if (!errorEl) {
    return;
  }

  errorEl.textContent = message;
  errorEl.hidden = !message;
}

function escapeHtml(value) {
  return String(value ?? "-")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
