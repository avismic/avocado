//path: features/owner-dashboard/see-drivers.js
import { loadCss } from "../../js/utils/loadCss.js";

loadCss(import.meta.url, "../../css/global.css");
loadCss(import.meta.url, "./see-drivers.css");
import { logout, getUser } from "../../js/auth.js";
import { navigate } from "../../js/router.js";
import { apiFetch } from "../../js/utils/api.js";

export async function mountSeeDrivers() {
  const app = document.getElementById("app");
  if (!app) throw new Error("Missing #app element");

  app.innerHTML = `
    <section class="owner-page">
      <header class="owner-header">
        <button class="btn-secondary back-btn" id="back-btn">← Back</button>
        <div>
          <h2>Drivers</h2>
        </div>
        <button class="btn-secondary logout-btn" id="logout-btn">Logout</button>
      </header>

      <div id="drivers-list-container">
        <div class="apple-card owner-table-card" style="padding: 20px; opacity: 0.6;">
          <div style="height: 24px; width: 100%; background: currentColor; opacity: 0.05; border-radius: 4px; margin-bottom: 12px;"></div>
          <div style="height: 20px; width: 100%; background: currentColor; opacity: 0.03; border-radius: 4px; margin-bottom: 8px;"></div>
          <div style="height: 20px; width: 100%; background: currentColor; opacity: 0.03; border-radius: 4px;"></div>
        </div>
      </div>
    </section>
  `;

  document
    .getElementById("back-btn")
    .addEventListener("click", () => navigate("#owner-dashboard"));
  document
    .getElementById("logout-btn")
    .addEventListener("click", () => logout());

  const container = document.getElementById("drivers-list-container");
  const owner = getUser();

  try {
    const drivers = await apiFetch(
      `/api/drivers/details?owner_id=${owner?.id}`,
    );

    if (!Array.isArray(drivers) || drivers.length === 0) {
      container.innerHTML = `<div class="apple-card empty-card"><p class="empty-state">No drivers registered under your account yet.</p></div>`;
      return;
    }

    const rows = drivers
      .map((driver) => {
        const rawTime = driver.last_attendance_time
          ? Number(driver.last_attendance_time)
          : null;
        const lastTime =
          rawTime && !isNaN(rawTime)
            ? new Date(rawTime).toLocaleString(undefined, {
                dateStyle: "short",
                timeStyle: "short",
              })
            : "N/A";

        const lat = driver.last_latitude
          ? Number(driver.last_latitude).toFixed(4)
          : "0.0000";
        const lng = driver.last_longitude
          ? Number(driver.last_longitude).toFixed(4)
          : "0.0000";

        const lastLoc = driver.last_address || `${lat}, ${lng}`;

        const fuelSpent = `₹${Number(driver.total_fuel_spent || 0).toFixed(2)}`;

        return `
        <tr data-driver-id="${driver.id}">
          <td>
            <div class="driver-info">
              <strong>${driver.full_name}</strong>
              <span class="driver-username">@${driver.username}</span>
            </div>
          </td>
          <td>
            <div class="password-cell">
              <span class="password-text" data-password="${driver.password}">••••••••</span>
              <button type="button" class="btn-toggle-pwd">Show</button>
            </div>
          </td>
          <td><span class="log-coord">${lastLoc}</span></td>
          <td><span class="log-amount">${fuelSpent}</span></td>
          <td><span class="log-time">${lastTime}</span></td>
          <td>
            <button type="button" class="btn-secondary btn-delete-driver" data-id="${driver.id}" title="Delete Driver" style="color: #ff3b30; border-color: #ff3b30; padding: 6px 10px; display: inline-flex; align-items: center; justify-content: center;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </td>
        </tr>
      `;
      })
      .join("");

    container.innerHTML = `
      <div class="apple-card owner-table-card">
        <div style="display: flex; justify-content: flex-end; margin-bottom: 16px;">
          <button type="button" id="download-drivers-btn" class="btn-secondary" title="Download Excel" style="padding: 6px 10px; display: inline-flex; align-items: center; justify-content: center;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
        </div>
        <div class="table-wrapper">
          <table class="owner-table">
            <thead>
              <tr>
                <th>Driver Name</th>
                <th>Password</th>
                <th>Last Location</th>
                <th>Total Fuel Spent</th>
                <th>Last Attendance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;

    const downloadBtn = container.querySelector("#download-drivers-btn");
    if (downloadBtn) {
      downloadBtn.addEventListener("click", () => {
        let csvContent =
          "data:text/csv;charset=utf-8,Driver Name,Username,Password,Last Location,Total Fuel Spent,Last Attendance\n";
        drivers.forEach((driver) => {
          const rawTime = driver.last_attendance_time
            ? Number(driver.last_attendance_time)
            : null;
          const lastTime =
            rawTime && !isNaN(rawTime)
              ? new Date(rawTime).toLocaleString(undefined, {
                  dateStyle: "short",
                  timeStyle: "short",
                })
              : "N/A";
          const lat = driver.last_latitude
            ? Number(driver.last_latitude).toFixed(4)
            : "0.0000";
          const lng = driver.last_longitude
            ? Number(driver.last_longitude).toFixed(4)
            : "0.0000";

          const lastLoc = `"${driver.last_address || `${lat}, ${lng}`}"`;
          const fuelSpent = `"₹${Number(driver.total_fuel_spent || 0).toFixed(2)}"`;
          csvContent += `"${driver.full_name}","@${driver.username}","${driver.password}",${lastLoc},${fuelSpent},"${lastTime}"\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `drivers_directory.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }

    container.querySelectorAll(".btn-toggle-pwd").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const cell = e.target.closest(".password-cell");
        const textSpan = cell.querySelector(".password-text");
        const rawPwd = textSpan.getAttribute("data-password");

        if (textSpan.textContent === "••••••••") {
          textSpan.textContent = rawPwd;
          e.target.textContent = "Hide";
        } else {
          textSpan.textContent = "••••••••";
          e.target.textContent = "Show";
        }
      });
    });

    container.querySelectorAll(".btn-delete-driver").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const driverId = e.target.getAttribute("data-id");
        if (!confirm("Are you sure you want to delete this driver?")) return;

        try {
          await apiFetch(`/api/drivers/${driverId}`, {
            method: "DELETE",
          });
          const row = e.target.closest("tr");
          row.remove();

          if (container.querySelectorAll("tbody tr").length === 0) {
            container.innerHTML = `<div class="apple-card empty-card"><p class="empty-state">No drivers registered under your account yet.</p></div>`;
          }
        } catch (err) {
          alert(`Failed to delete driver: ${err.message}`);
        }
      });
    });
  } catch (err) {
    container.innerHTML = `<div class="apple-card empty-card"><p class="empty-state">Failed to load drivers: ${err.message}</p></div>`;
  }
}
