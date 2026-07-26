import "../../css/global.css";
import "./owner-dashboard.css";
import { logout, getUser } from "../../js/auth.js";
import { navigate } from "../../js/router.js";
import { apiFetch } from "../../js/utils/api.js";
import { _loadDrivers } from "./load-drivers.js";
import { _renderDriverSelector } from "./render-driver-selector.js";
import { mountOwnerAttendance } from "./owner-attendance.js";

export function mountOwnerDashboard() {
  const app = document.getElementById("app");
  if (!app) throw new Error("Missing #app element");

  app.innerHTML = `
    <section class="owner-page">
      <header class="owner-header">
        <div>
          <p class="subtitle">Overview</p>
          <h2>Owner Dashboard</h2>
        </div>
        <button class="btn-secondary logout-btn" id="logout-btn">Logout</button>
      </header>

      <div class="owner-tiles">
        <div class="tile-card apple-card" id="owner-attendance-tile">
          <div class="icon-wrapper">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 8v4l3 3"></path>
              <circle cx="12" cy="12" r="9"></circle>
            </svg>
          </div>
          <div class="tile-content">
            <h3>Driver Attendance</h3>
            <p>Track check-ins, timestamps, and live driver locations</p>
          </div>
        </div>

        <div class="tile-card apple-card" id="owner-fuel-tile">
          <div class="icon-wrapper">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="22" x2="15" y2="22"></line>
              <line x1="4" y1="9" x2="14" y2="9"></line>
              <path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"></path>
              <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42l-2.82-2.82"></path>
            </svg>
          </div>
          <div class="tile-content">
            <h3>Driver Fuel Logs</h3>
            <p>Review fuel expenses, odometer readings, and history</p>
          </div>
        </div>
        <div class="tile-card apple-card" id="owner-add-driver-tile">
          <div class="icon-wrapper">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
          </div>
          <div class="tile-content">
            <h3>Add Driver</h3>
            <p>Register new drivers under your fleet management account</p>
          </div>
        </div>
        <div class="tile-card apple-card" id="owner-see-drivers-tile">
          <div class="icon-wrapper">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div class="tile-content">
            <h3>See Drivers</h3>
            <p>View registered drivers, credentials, last locations, and total expenses</p>
          </div>
        </div>
      </div>
    </section>
  `;

  document
    .getElementById("logout-btn")
    .addEventListener("click", () => logout());
  document
    .getElementById("owner-attendance-tile")
    .addEventListener("click", () => navigate("#owner-attendance"));
  document
    .getElementById("owner-fuel-tile")
    .addEventListener("click", () => navigate("#owner-fuel"));
  document
    .getElementById("owner-add-driver-tile")
    .addEventListener("click", () => navigate("#owner-add-driver"));
  document
    .getElementById("owner-see-drivers-tile")
    .addEventListener("click", () => navigate("#owner-see-drivers"));
}