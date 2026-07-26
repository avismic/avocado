// js/app_v2.js – Bootstrap the app, register routes and start router
import { registerRoute, navigate } from "./router.js";
import { isAuthenticated } from "./auth.js";
import { mountLogin } from "../features/login/login.js";

// Simple placeholder dashboard renderers (real dashboards would live in their own feature folders)
function mountDriverDashboard() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="glass-card" style="margin:2rem;padding:2rem;">
      <h2>Driver Dashboard</h2>
      <p>Welcome, ${isAuthenticated() ? "" : ""}</p>
      <button id="logout-btn">Logout</button>
    </div>
  `;
  document.getElementById("logout-btn").addEventListener("click", () => {
    import("./auth.js").then((m) => m.logout());
  });
}

function mountOwnerDashboard() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="glass-card" style="margin:2rem;padding:2rem;">
      <h2>Owner Dashboard</h2>
      <p>Welcome, ${isAuthenticated() ? "" : ""}</p>
      <button id="logout-btn">Logout</button>
    </div>
  `;
  document.getElementById("logout-btn").addEventListener("click", () => {
    import("./auth.js").then((m) => m.logout());
  });
}

// Register routes
registerRoute("login", mountLogin);
registerRoute("driver-dashboard", mountDriverDashboard);
registerRoute("owner-dashboard", mountOwnerDashboard);

// Initial navigation based on auth status
if (!isAuthenticated()) {
  navigate("#login");
} else {
  // Let router resolve the correct dashboard for the authenticated user
  navigate("#");
}
