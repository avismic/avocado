import "../../css/global.css";
import "./fuel.css";
import { getDriverLocation } from "../../js/utils/geo.js";
import { getUser } from "../../js/auth.js";
import { showModal } from "../../features/shared/modal.js";
import { navigate } from "../../js/router.js";
import { queueOfflineRequest } from "../../js/utils/sync.js";
import { apiFetch } from "../../js/utils/api.js";
import { mountFuelPage } from "./fuel-page.js";

const FUEL_LOGS_KEY = "fleet_fuel_logs";

export function _loadLogs() {
  const raw = localStorage.getItem(FUEL_LOGS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function _saveLogs(logs) {
  localStorage.setItem(FUEL_LOGS_KEY, JSON.stringify(logs));
}

export function _formatDate(timestamp) {
  const d = new Date(Number(timestamp));
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const date = `${year}-${month}-${day}`;
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return { date, time };
}

export function _renderHistory() {
  const tbody = document.getElementById("history-body");
  if (!tbody) return;

  const logs = _loadLogs().filter((l) => l.driver_id === getUser()?.id);
  

  if (logs.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="4" class="empty-state">No fuel logs recorded yet.</td></tr>';
    return;
  }

  const rows = logs
    .sort((a, b) => b.timestamp - a.timestamp)
    .map((log) => {
      const { date, time } = _formatDate(log.timestamp);
      const coord = `${log.latitude.toFixed(4)}, ${log.longitude.toFixed(4)}`;
      const odo = log.odometer_reading ?? log.odometer;
      const amt = log.amount_spent ?? log.cost;
      const locationText = log.address || `${Number(log.latitude).toFixed(4)}, ${Number(log.longitude).toFixed(4)}`;
      return `
        <tr>
          <td><span class="log-date">${date}</span> <span class="log-time">${time}</span></td>
          <td>${odo} km</td>
          <td class="log-amount">$${amt.toFixed(2)}</td>
          <td class="log-coord">${locationText}</td>
        </tr>
      `;
    })
    .join("");

  tbody.innerHTML = rows;
}
