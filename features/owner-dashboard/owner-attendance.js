import "../../css/global.css";
import "./owner-dashboard.css";
import { logout, getUser } from "../../js/auth.js";
import { navigate } from "../../js/router.js";
import { apiFetch } from "../../js/utils/api.js";
import { _loadDrivers } from "./load-drivers.js";
import { _renderDriverSelector } from "./render-driver-selector.js";

export async function mountOwnerAttendance() {
  const app = document.getElementById("app");
  const user = getUser();
  const ownerId = user?.id;
  if (!app) throw new Error("Missing #app element");

  let selectedDriverId = "";

  app.innerHTML = `
    <section class="owner-page">
      <header class="owner-header">
        <button class="btn-secondary back-btn" id="back-btn">← Back</button>
        <div>
          <p class="subtitle">Driver Insight</p>
          <h2>Attendance Overview</h2>
        </div>
        <button class="btn-secondary logout-btn" id="logout-btn">Logout</button>
      </header>

      <div id="selector-container"></div>
      <div id="table-container"></div>
    </section>
  `;

  document
    .getElementById("back-btn")
    .addEventListener("click", () => navigate("#owner-dashboard"));
  document
    .getElementById("logout-btn")
    .addEventListener("click", () => logout());

  const selectorDiv = document.getElementById("selector-container");
  const tableDiv = document.getElementById("table-container");

  const renderTable = async () => {
    tableDiv.innerHTML = "";
    if (!selectedDriverId) {
      tableDiv.innerHTML = `<div class="apple-card empty-card"><p class="empty-state">Please select a driver to view attendance records.</p></div>`;
      return;
    }

    tableDiv.innerHTML = `
      <div class="apple-card owner-table-card" style="padding: 20px; opacity: 0.6;">
        <div style="height: 24px; width: 100%; background: currentColor; opacity: 0.05; border-radius: 4px; margin-bottom: 12px;"></div>
        <div style="height: 20px; width: 100%; background: currentColor; opacity: 0.03; border-radius: 4px; margin-bottom: 8px;"></div>
        <div style="height: 20px; width: 100%; background: currentColor; opacity: 0.03; border-radius: 4px;"></div>
      </div>
    `;

    let driverLogs = [];
    try {
      const logs = await apiFetch(
        `/api/attendance?driver_id=${selectedDriverId}`,
      );
      if (Array.isArray(logs)) driverLogs = logs;
    } catch {
      const raw = localStorage.getItem("fleet_attendance_logs");
      const logs = raw ? JSON.parse(raw) : [];
      driverLogs = logs.filter((l) => l.driver_id === selectedDriverId);
    }

    if (driverLogs.length === 0) {
      tableDiv.innerHTML = `<div class="apple-card empty-card"><p class="empty-state">No attendance records found for this driver.</p></div>`;
      return;
    }

    const drivers = await _loadDrivers(ownerId);
    const driverName =
      drivers.find((d) => d.id === selectedDriverId)?.full_name ?? "Unknown";
    const rows = driverLogs
      .sort((a, b) => b.timestamp - a.timestamp)
      .map((log) => {
        const d = new Date(log.timestamp);
        const date = d.toISOString().split("T")[0];
        const time = d.toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit",
        });
        const loc = `${Number(log.latitude).toFixed(4)}, ${Number(log.longitude).toFixed(4)}`;
        return `
          <tr>
            <td><span class="driver-badge">${driverName}</span></td>
            <td>${date}</td>
            <td class="log-time">${time}</td>
            <td class="log-coord">${loc}</td>
          </tr>
        `;
      })
      .join("");

    tableDiv.innerHTML = `
      <div class="apple-card owner-table-card">
        <div style="display: flex; justify-content: flex-end; margin-bottom: 16px;">
          <button type="button" id="download-attendance-btn" class="btn-secondary" title="Download Excel" style="padding: 6px 10px; display: inline-flex; align-items: center; justify-content: center;">
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
                <th>Driver</th>
                <th>Date</th>
                <th>Time</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;

    const downloadBtn = tableDiv.querySelector("#download-attendance-btn");
    if (downloadBtn) {
      downloadBtn.addEventListener("click", () => {
        let csvContent =
          "data:text/csv;charset=utf-8,Driver,Date,Time,Location\n";
        driverLogs.forEach((log) => {
          const d = new Date(log.timestamp);
          const date = d.toISOString().split("T")[0];
          const time = d.toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
          });
          const loc = `"${Number(log.latitude).toFixed(4)}, ${Number(log.longitude).toFixed(4)}"`;
          csvContent += `"${driverName}","${date}","${time}",${loc}\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute(
          "download",
          `attendance_${driverName.replace(/\s+/g, "_")}.csv`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }
  };

  selectorDiv.innerHTML = `
    <div class="apple-card" style="padding: 20px; opacity: 0.6;">
      <div style="height: 14px; width: 90px; background: currentColor; opacity: 0.1; border-radius: 4px; margin-bottom: 8px;"></div>
      <div style="height: 40px; width: 100%; background: currentColor; opacity: 0.05; border-radius: 8px;"></div>
    </div>
  `;

  await _renderDriverSelector(selectorDiv, selectedDriverId, ownerId, (id) => {
    selectedDriverId = id;
    renderTable();
  });
}