import {
  addComment,
  deleteComment,
  deleteTicket,
  getTicket,
  listComments,
  listUsers,
  updateComment,
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

const errorEl =
  document.querySelector(
    "#detailError"
  );

const deleteBtn =
  document.querySelector(
    "#deleteTicketBtn"
  );

const editBtn =
  document.querySelector(
    "#editTicketBtn"
  );

const cancelEditBtn =
  document.querySelector(
    "#cancelEditBtn"
  );

const saveTicketBtn =
  document.querySelector(
    "#saveTicketBtn"
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
let editMode = false;
let commentDeleteBound = false;

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
    hideLoader();
    return;
  }

  ticketId = id;
  bindDeleteButton(id);
  bindCommentForm();
  bindEditControls();
  bindCommentDeleteActions();
  await loadTicket(id);
}

async function fetchTicketData(id) {
  [
    ticket,
    comments,
    users,
  ] = await Promise.all([
    getTicket(id),
    listComments(id),
    listUsers(),
  ]);
}

async function loadTicket(id) {
  showLoader("Loading ticket...");
  setError("");

  try {
    await fetchTicketData(id);
    editMode = false;
    setEditToolbar();
    renderTicket();
    renderComments();
  } catch (error) {
    console.error(error);
    setError(
      "Failed to load ticket. Check that json-server is running."
    );
  } finally {
    hideLoader();
  }
}

function setEditToolbar() {
  if (editBtn) {
    editBtn.hidden = editMode;
  }

  if (cancelEditBtn) {
    cancelEditBtn.hidden = !editMode;
  }

  if (saveTicketBtn) {
    saveTicketBtn.hidden = !editMode;
  }

  if (deleteBtn) {
    deleteBtn.disabled = editMode;
  }

  if (commentForm) {
    commentForm.hidden = editMode;
  }
}

function bindEditControls() {
  editBtn?.addEventListener(
    "click",
    () => {
      editMode = true;
      setEditToolbar();
      renderTicket();
      renderComments();
    }
  );

  cancelEditBtn?.addEventListener(
    "click",
    () => {
      editMode = false;
      setEditToolbar();
      renderTicket();
      renderComments();
    }
  );

  saveTicketBtn?.addEventListener(
    "click",
    saveTicketEdits
  );
}

function bindCommentDeleteActions() {
  if (commentDeleteBound || !commentsEl) {
    return;
  }

  commentDeleteBound = true;

  commentsEl.addEventListener(
    "click",
    async (event) => {
      const btn =
        event.target.closest(
          "[data-delete-comment]"
        );

      if (!btn) {
        return;
      }

      event.preventDefault();

      const commentId =
        btn.dataset.deleteComment;

      if (!commentId) {
        return;
      }

      const confirmed =
        await confirmDialog({
          title: "Delete comment",
          message:
            "This comment will be permanently removed.",
          confirmText: "Delete",
        });

      if (!confirmed) {
        return;
      }

      try {
        showLoader(
          "Deleting comment..."
        );
        await deleteComment(
          commentId
        );
        comments =
          await listComments(
            ticketId
          );
        renderComments();
        toast("Comment deleted");
      } catch (error) {
        console.error(error);
        toast(
          "Could not delete comment",
          {
            type: "error",
          }
        );
      } finally {
        hideLoader();
      }
    }
  );
}

async function saveTicketEdits() {
  if (!saveTicketBtn) {
    return;
  }

  saveTicketBtn.disabled = true;
  showLoader("Saving changes...");

  try {
    const statusEl =
      infoEl.querySelector(
        '[data-edit-field="status"]'
      );

    const priorityEl =
      infoEl.querySelector(
        '[data-edit-field="priority"]'
      );

    const assigneeEl =
      infoEl.querySelector(
        '[data-edit-field="assignee"]'
      );

    const updates = {};

    if (statusEl) {
      const v = statusEl.value;

      if (v !== (ticket.status || "")) {
        updates.status = v;
      }
    }

    if (priorityEl) {
      const v = priorityEl.value;

      if (v !== (ticket.priority || "")) {
        updates.priority = v;
      }
    }

    if (assigneeEl) {
      const v = assigneeEl.value;

      if (v !== (ticket.assignee || "")) {
        updates.assignee = v;
      }
    }

    if (
      Object.keys(updates).length > 0
    ) {
      updates.updatedAt =
        new Date().toISOString();

      const updated =
        await updateTicket(
          ticket.id,
          updates
        );

      ticket = {
        ...ticket,
        ...updated,
      };
    }

    const textareas =
      commentsEl.querySelectorAll(
        "[data-comment-edit]"
      );

    for (const ta of textareas) {
      const id = ta.dataset.commentEdit;
      const next =
        ta.value.trim();
      const orig = comments.find(
        (c) => String(c.id) === String(id)
      );

      if (!orig) {
        continue;
      }

      const prev =
        commentText(orig).trim();

      if (next === prev) {
        continue;
      }

      if (!next) {
        throw new Error(
          "Comment text cannot be empty"
        );
      }

      await updateComment(id, {
        body: next,
        content: next,
      });
    }

    await fetchTicketData(ticketId);
    editMode = false;
    setEditToolbar();
    renderTicket();
    renderComments();
    toast("Changes saved");
  } catch (error) {
    console.error(error);
    toast(
      error?.message ||
        "Could not save changes",
      {
        type: "error",
      }
    );
  } finally {
    saveTicketBtn.disabled = false;
    hideLoader();
  }
}

function commentText(comment) {
  return (
    comment?.body ??
    comment?.text ??
    comment?.content ??
    ""
  );
}

function commentAuthor(comment) {
  if (comment.author) {
    return comment.author;
  }

  if (comment.authorId) {
    const u = users.find(
      (x) => x.id === comment.authorId
    );

    return u?.name || "Support";
  }

  return "Support";
}

function renderTicket() {
  titleEl.textContent =
    ticket.title || `Ticket #${ticket.id}`;

  const statusBlock = editMode
    ? detailEditSelect(
        "Status",
        "status",
        ticket.status,
        [
          ["open", "Open"],
          ["in-progress", "In-progress"],
          ["resolved", "Resolved"],
          ["closed", "Closed"],
        ]
      )
    : detailItem(
        "Status",
        ticket.status || "-"
      );

  const priorityBlock = editMode
    ? detailEditSelect(
        "Priority",
        "priority",
        ticket.priority,
        [
          ["low", "Low"],
          ["medium", "Medium"],
          ["high", "High"],
          ["urgent", "Urgent"],
        ]
      )
    : detailItem(
        "Priority",
        ticket.priority || "-"
      );

  const assigneeValue =
    ticket.assignee || "";

  const assigneeBlock = editMode
    ? detailEditSelect(
        "Assignee",
        "assignee",
        assigneeValue,
        users.map((user) => [
          user.name,
          user.name,
        ])
      )
    : detailItem(
        "Assignee",
        assigneeValue || "-"
      );

  infoEl.innerHTML = `
    <dl class="detail-grid">
      ${detailItem("ID", ticket.id)}
      ${detailItem("Title", ticket.title)}
      ${detailItem("Customer", ticket.customer)}
      ${detailItem("Customer Email", ticket.customerEmail)}
      ${statusBlock}
      ${priorityBlock}
      ${assigneeBlock}
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

  if (editMode) {
    commentsEl.innerHTML = comments
      .map(
        (comment) => `
      <article
        class="comment-item comment-item-edit"
      >
        <header class="comment-item-header">
          <div>
            <strong>
              ${escapeHtml(
                commentAuthor(comment)
              )}
            </strong>
            <span>
              ${escapeHtml(
                formatRelative(comment.createdAt)
              )}
            </span>
          </div>
          <button
            type="button"
            class="comment-delete-btn danger-button"
            data-delete-comment="${escapeHtml(comment.id)}"
            aria-label="Delete comment"
          >
            Delete
          </button>
        </header>
        <textarea
          data-comment-edit="${escapeHtml(comment.id)}"
          rows="4"
          aria-label="Edit comment"
        >${escapeHtml(
          commentText(comment)
        )}</textarea>
      </article>
    `
      )
      .join("");

    return;
  }

  commentsEl.innerHTML = comments
    .map(
      (comment) => `
      <article class="comment-item">
        <header class="comment-item-header">
          <div>
            <strong>
              ${escapeHtml(
                commentAuthor(comment)
              )}
            </strong>
            <span>
              ${escapeHtml(
                formatRelative(comment.createdAt)
              )}
            </span>
          </div>
          <button
            type="button"
            class="comment-delete-btn danger-button"
            data-delete-comment="${escapeHtml(comment.id)}"
            aria-label="Delete comment"
          >
            Delete
          </button>
        </header>
        <p>
          ${escapeHtml(commentText(comment))}
        </p>
      </article>
    `
    )
    .join("");
}

function bindCommentForm() {
  commentForm?.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      if (editMode) {
        return;
      }

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
      if (editMode) {
        return;
      }

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
      } finally {
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

function detailEditSelect(
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
          data-edit-field="${field}"
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
