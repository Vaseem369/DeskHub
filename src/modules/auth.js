import { login } from "../api/auth.js";

const form =
  document.querySelector("#loginForm");

const errorEl =
  document.querySelector("#error");

form.addEventListener(
  "submit",
  async (e) => {
    e.preventDefault();

    const email =
      form.email.value;

    const password =
      form.password.value;

    try {
      errorEl.textContent = "";

      await login(email, password);

      window.location.href =
        "./dashboard.html";

    } catch (error) {
      errorEl.textContent =
        "Invalid email or password";
    }
  }
);