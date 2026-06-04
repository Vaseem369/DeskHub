import {
  login,
  isAuthenticated,
} from "../api/auth.js";

const isLoginPage =
  window.location.pathname.includes(
    "index.html"
  ) ||
  window.location.pathname === "/";

if (
  isAuthenticated() &&
  isLoginPage
) {
  window.location.href =
    "./dashboard.html";
}

const form =
  document.querySelector(
    "#loginForm"
  );

const errorEl =
  document.querySelector(
    "#error"
  ) ||
  document.querySelector(
    "[data-error]"
  );

if (form) {
  form.addEventListener(
    "submit",
    async (e) => {

      e.preventDefault();

      const formData =
        new FormData(form);

      const email =
        formData.get("email");

      const password =
        formData.get("password");

      try {
        if (errorEl) {
          errorEl.textContent = "";
        }

        await login(
          email,
          password
        );

        window.location.href =
          "./dashboard.html";

      } catch (error) {
        if (errorEl) {
          errorEl.textContent =
            "Invalid email or password";
        }
      }
    }
  );
}
