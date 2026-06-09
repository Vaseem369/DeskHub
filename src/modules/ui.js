let toastRoot;
let activeModal;
let loaderEl;
let loaderDepth = 0;
let loaderScrollRestore = "";
let loaderShownAt = 0;
let loaderHideTimer = null;

const LOADER_MIN_VISIBLE_MS = 480;

const MAX_CONCURRENT_TOASTS = 5;
const toastPending = [];
let activeToastCount = 0;

function ensureToastRoot() {
  if (!toastRoot) {
    toastRoot =
      document.createElement("div");
    toastRoot.className =
      "toast-root";
    toastRoot.setAttribute(
      "aria-live",
      "polite"
    );
    document.body.append(toastRoot);
  }
}

function flushToastQueue() {
  while (
    activeToastCount <
      MAX_CONCURRENT_TOASTS &&
    toastPending.length > 0
  ) {
    const payload =
      toastPending.shift();

    activeToastCount += 1;
    mountToast(payload);
  }
}

function mountToast({
  message,
  type,
  duration,
}) {
  ensureToastRoot();

  const toastEl =
    document.createElement("div");
  toastEl.className =
    `toast toast-${type}`;
  toastEl.setAttribute(
    "role",
    "status"
  );
  toastEl.textContent = message;

  toastRoot.append(toastEl);

  requestAnimationFrame(() => {
    toastEl.classList.add(
      "toast-visible"
    );
  });

  let settled = false;

  const settle = () => {
    if (settled) {
      return;
    }

    settled = true;

    if (toastEl.isConnected) {
      toastEl.remove();
    }

    activeToastCount -= 1;
    flushToastQueue();
  };

  setTimeout(() => {
    toastEl.classList.remove(
      "toast-visible"
    );

    const onEnd = (event) => {
      if (
        event.propertyName !==
        "opacity"
      ) {
        return;
      }

      toastEl.removeEventListener(
        "transitionend",
        onEnd
      );
      settle();
    };

    toastEl.addEventListener(
      "transitionend",
      onEnd
    );

    setTimeout(settle, 350);
  }, duration);
}

export function toast(
  message,
  options = {}
) {
  const {
    type = "success",
    duration = 3000,
  } = options;

  toastPending.push({
    message,
    type,
    duration,
  });

  flushToastQueue();
}

export function modal({
  title,
  content,
  footer = "",
  onClose,
}) {
  closeModal();

  const overlay =
    document.createElement("div");
  overlay.className = "modal-overlay";

  overlay.innerHTML = `
    <section
      class="modal-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modalTitle"
    >
      <header class="modal-header">
        <h2 id="modalTitle">
          ${escapeHtml(title)}
        </h2>

        <button
          type="button"
          class="modal-close"
          data-modal-close
          aria-label="Close"
        >
          x
        </button>
      </header>

      <div class="modal-body">
        ${content}
      </div>

      ${
        footer
          ? `<footer class="modal-footer">${footer}</footer>`
          : ""
      }
    </section>
  `;

  const close = () => {
    overlay.remove();
    document.removeEventListener(
      "keydown",
      onKeyDown
    );
    activeModal = null;
    onClose?.();
  };

  const onKeyDown = (event) => {
    if (event.key === "Escape") {
      close();
    }
  };

  overlay.addEventListener(
    "click",
    (event) => {
      if (event.target === overlay) {
        close();
      }
    }
  );

  overlay
    .querySelector("[data-modal-close]")
    .addEventListener(
      "click",
      close
    );

  document.addEventListener(
    "keydown",
    onKeyDown
  );

  document.body.append(overlay);
  requestAnimationFrame(
    () => overlay.classList.add(
      "modal-visible"
    )
  );
  activeModal = {
    element: overlay,
    close,
  };

  return activeModal;
}

export function showLoader(
  message = "Loading..."
) {
  if (loaderHideTimer !== null) {
    clearTimeout(loaderHideTimer);
    loaderHideTimer = null;
  }

  if (!loaderEl) {
    loaderEl =
      document.createElement("div");
    loaderEl.className =
      "fullscreen-loader";
    loaderEl.setAttribute(
      "role",
      "status"
    );
    document.body.append(loaderEl);
  }

  loaderEl.innerHTML = `
    <div class="fullscreen-loader__inner">
      <span class="loader-spinner"></span>
      <p class="fullscreen-loader__message">
        ${escapeHtml(message)}
      </p>
    </div>
  `;

  if (loaderDepth === 0) {
    loaderShownAt = Date.now();
    loaderScrollRestore =
      document.body.style.overflow;
    document.body.style.overflow =
      "hidden";
  }

  loaderDepth += 1;
  loaderEl.hidden = false;
}

export function hideLoader() {
  if (!loaderEl || loaderDepth === 0) {
    return;
  }

  loaderDepth -= 1;

  if (loaderDepth > 0) {
    return;
  }

  const applyHide = () => {
    loaderHideTimer = null;

    if (loaderDepth !== 0) {
      return;
    }

    loaderEl.hidden = true;
    document.body.style.overflow =
      loaderScrollRestore;
  };

  const elapsed =
    Date.now() - loaderShownAt;

  const wait = Math.max(
    0,
    LOADER_MIN_VISIBLE_MS - elapsed
  );

  loaderHideTimer = setTimeout(
    applyHide,
    wait
  );
}

export function closeModal() {
  activeModal?.close();
}

export function confirmDialog({
  title = "Confirm",
  message = "Are you sure?",
  confirmText = "Confirm",
  cancelText = "Cancel",
} = {}) {
  return new Promise((resolve) => {
    const dialog = modal({
      title,
      content: `
        <p>${escapeHtml(message)}</p>
      `,
      footer: `
        <button
          type="button"
          class="secondary-button"
          data-confirm-cancel
        >
          ${escapeHtml(cancelText)}
        </button>

        <button
          type="button"
          class="danger-button"
          data-confirm-ok
        >
          ${escapeHtml(confirmText)}
        </button>
      `,
      onClose: () => resolve(false),
    });

    dialog.element
      .querySelector("[data-confirm-cancel]")
      .addEventListener(
        "click",
        () => {
          resolve(false);
          dialog.close();
        }
      );

    dialog.element
      .querySelector("[data-confirm-ok]")
      .addEventListener(
        "click",
        () => {
          resolve(true);
          dialog.close();
        }
      );
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
