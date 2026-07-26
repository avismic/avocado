const globalCss = new URL("../../css/global.css", import.meta.url).href;
const loginCss = new URL("./login.css", import.meta.url).href;

for (const href of [globalCss, loginCss]) {
  if (!document.querySelector(`link[href="${href}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }
}

import { login } from "../../js/auth.js";
import { navigate } from "../../js/router.js";

export function mountLogin() {
  const app = document.getElementById("app");
  if (!app) throw new Error("Missing #app element");

  app.innerHTML = `
    <div class="login-wrapper">
      <div class="login-card apple-card">
        <div class="login-header">
          <p class="subtitle">Fleet Operations</p>
          <h2>Sign In</h2>
        </div>
        <form id="login-form" novalidate>
          <div class="form-group">
            <label for="username">Username</label>
            <input type="text" id="username" name="username" autocomplete="username" placeholder="Enter your username" required />
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" autocomplete="current-password" placeholder="Enter your password" required />
          </div>
          <button type="submit" class="login-btn">Sign In</button>
          <div class="error-message" id="login-error" hidden></div>
        </form>
      </div>
    </div>
  `;

  const form = document.getElementById("login-form");
  const errDiv = document.getElementById("login-error");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errDiv.hidden = true;
    const username = form.username.value.trim();
    const password = form.password.value.trim();

    try {
      const session = await login(username, password);
      const role = session?.user?.role;

      if (role === "admin") {
        navigate("#admin-dashboard");
      } else if (role === "owner") {
        navigate("#owner-dashboard");
      } else {
        navigate("#driver-dashboard");
      }
    } catch (err) {
      errDiv.textContent = err.message;
      errDiv.hidden = false;
    }
  });
}
