import {
  clearAuth,
  getCurrentUser,
  isAuthenticated,
} from "../api/auth.js";

import {
  applyTheme,
  getStoredTheme,
  setStoredTheme,
} from "./theme.js";

function loginHref() {
  return window.location.pathname.includes(
    "/public/"
  )
    ? "../index.html"
    : "./index.html";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function accountSectionHtml() {
  if (!isAuthenticated()) {
    const isLogin =
      window.location.pathname.endsWith(
        "index.html"
      ) ||
      window.location.pathname === "/" ||
      window.location.pathname === "";

    return `
      <p class="settings-muted">
        You are not signed in.
      </p>
      ${
        isLogin
          ? ""
          : `<p class="settings-muted">
        <a href="./index.html">Go to sign in</a>
      </p>`
      }
    `;
  }

  const user = getCurrentUser();

  if (!user) {
    return `
      <p class="settings-muted">
        Account details are unavailable.
      </p>
    `;
  }

  return `
    <dl class="settings-account-dl">
      <div>
        <dt>Name</dt>
        <dd>${escapeHtml(user.name)}</dd>
      </div>
      <div>
        <dt>Email</dt>
        <dd>${escapeHtml(user.email)}</dd>
      </div>
      <div>
        <dt>Role</dt>
        <dd>${escapeHtml(user.role)}</dd>
      </div>
    </dl>

    <div class="settings-account-actions">
      <button
        type="button"
        class="danger-button settings-logout-btn"
        data-settings-logout
      >
        Log out
      </button>
    </div>
  `;
}

function syncThemeRadios(root) {
  const theme = getStoredTheme();

  root
    .querySelectorAll(
      'input[name="deskhubTheme"]'
    )
    .forEach((input) => {
      input.checked =
        input.value === theme;
    });
}

function refreshAccountSection(root) {
  const host =
    root.querySelector(
      "[data-settings-account]"
    );

  if (host) {
    host.innerHTML =
      accountSectionHtml();
  }
}

export function initSettings() {
  applyTheme(getStoredTheme());

  if (
    document.getElementById(
      "deskhubSettingsBtn"
    )
  ) {
    return;
  }

  const wrap =
    document.createElement("div");

  wrap.className = "app-settings-bar";

  wrap.innerHTML = `
    <button
      type="button"
      id="deskhubSettingsBtn"
      class="settings-bar-btn"
      aria-expanded="false"
      aria-controls="deskhubSettingsBackdrop"
      aria-label="Settings"
      title="Settings"
    >
      <svg
        class="settings-icon"
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
      </svg>
    </button>
  `;

  const backdrop =
    document.createElement("div");

  backdrop.id =
    "deskhubSettingsBackdrop";

  backdrop.className =
    "settings-backdrop";

  backdrop.hidden = true;

  backdrop.setAttribute(
    "aria-hidden",
    "true"
  );

  backdrop.innerHTML = `
    <div
      class="settings-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deskhubSettingsTitle"
    >
      <header class="settings-sheet-header">
        <h2 id="deskhubSettingsTitle">
          Settings
        </h2>

        <button
          type="button"
          class="settings-close-btn"
          data-close-settings
          aria-label="Close settings"
        >
          ×
        </button>
      </header>

      <div class="settings-sheet-body">
        <section
          class="settings-section"
          aria-labelledby="settingsAccountHeading"
        >
          <h3 id="settingsAccountHeading">
            Account
          </h3>

          <div data-settings-account></div>
        </section>

        <section
          class="settings-section"
          aria-labelledby="settingsThemeHeading"
        >
          <h3 id="settingsThemeHeading">
            Appearance
          </h3>

          <p class="settings-hint">
            Light or dark mode for the whole app.
          </p>

          <fieldset class="settings-theme-fieldset">
            <legend class="visually-hidden">
              Color theme
            </legend>

            <label class="settings-theme-option">
              <input
                type="radio"
                name="deskhubTheme"
                value="light"
              />
              <span>Light mode</span>
            </label>

            <label class="settings-theme-option">
              <input
                type="radio"
                name="deskhubTheme"
                value="dark"
              />
              <span>Dark mode</span>
            </label>
          </fieldset>
        </section>
      </div>
    </div>
  `;

  document.body.append(wrap);
  document.body.append(backdrop);

  document.body.classList.add(
    "has-app-settings-bar"
  );

  const triggerBtn =
    document.getElementById(
      "deskhubSettingsBtn"
    );

  function onEscape(event) {
    if (event.key === "Escape") {
      setOpen(false);
    }
  }

  function setOpen(open) {
    backdrop.hidden = !open;

    backdrop.setAttribute(
      "aria-hidden",
      String(!open)
    );

    triggerBtn.setAttribute(
      "aria-expanded",
      String(open)
    );

    if (open) {
      refreshAccountSection(
        backdrop
      );
      syncThemeRadios(
        backdrop
      );
      document.addEventListener(
        "keydown",
        onEscape
      );
    } else {
      document.removeEventListener(
        "keydown",
        onEscape
      );
    }
  }

  triggerBtn.addEventListener(
    "click",
    () => {
      setOpen(backdrop.hidden);
    }
  );

  backdrop.addEventListener(
    "click",
    (event) => {
      if (event.target === backdrop) {
        setOpen(false);
      }
    }
  );

  backdrop
    .querySelector(
      "[data-close-settings]"
    )
    .addEventListener(
      "click",
      () => setOpen(false)
    );

  backdrop.addEventListener(
    "click",
    (event) => {
      const logoutBtn =
        event.target.closest(
          "[data-settings-logout]"
        );

      if (logoutBtn) {
        clearAuth();
        window.location.href =
          loginHref();
      }
    }
  );

  backdrop
    .querySelectorAll(
      'input[name="deskhubTheme"]'
    )
    .forEach((input) => {
      input.addEventListener(
        "change",
        () => {
          if (input.checked) {
            setStoredTheme(
              input.value
            );
          }
        }
      );
    });
}
