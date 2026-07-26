import { loadCss } from "../../js/utils/loadCss.js";

loadCss(import.meta.url, "../../css/global.css");
loadCss(import.meta.url, "./fuel.css");
import { getDriverLocation } from "../../js/utils/geo.js";
import { getUser } from "../../js/auth.js";
import { showModal } from "../../features/shared/modal.js";
import { navigate } from "../../js/router.js";
import { queueOfflineRequest } from "../../js/utils/sync.js";
import { apiFetch } from "../../js/utils/api.js";
import { _renderHistory, _loadLogs, _saveLogs, _formatDate } from "./fuel.js";

export function mountFuelPage() {
  const app = document.getElementById("app");
  if (!app) throw new Error("Missing #app element");

  app.innerHTML = `
    <section class="fuel-page">
      <header class="fuel-header">
        <button class="btn-secondary back-btn" id="back-btn">← Back</button>
        <div>
          <p class="subtitle">Management</p>
          <h2>Fuel Log</h2>
        </div>
      </header>

      <div class="fuel-form-card apple-card">
        <form id="fuel-form" novalidate>
          <div class="form-group">
            <label for="odometer">Odometer Reading (km)</label>
            <input type="number" step="0.01" id="odometer" name="odometer" placeholder="e.g. 14600" required />
          </div>

          <div class="form-group">
            <label for="amount">Amount Spent ($)</label>
            <input type="number" step="0.01" id="amount" name="amount" placeholder="e.g. 1000" required />
          </div>

          <button type="submit" class="btn-primary fuel-submit">Log Fuel Refill</button>
        </form>
      </div>

      <div class="fuel-history apple-card">
        <h3>Refill History</h3>
        <div class="table-wrapper">
          <table class="fuel-history-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Odometer</th>
                <th>Amount</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody id="history-body"></tbody>
          </table>
        </div>
      </div>
    </section>
  `;

  document
    .getElementById("back-btn")
    .addEventListener("click", () => navigate("#driver-dashboard"));

  const form = document.getElementById("fuel-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const odometer = parseFloat(form.odometer.value);
    const amount = parseFloat(form.amount.value);

    if (isNaN(odometer) || odometer <= 0) {
      showModal({
        title: "Invalid Input",
        message: "Odometer must be a positive number.",
        primaryBtnText: "OK",
      });
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      showModal({
        title: "Invalid Input",
        message: "Amount spent must be a positive number.",
        primaryBtnText: "OK",
      });
      return;
    }

    try {
      const { latitude, longitude, timestamp } = await getDriverLocation();
      const user = getUser();
      if (!user) throw new Error("User not authenticated");

      const record = {
        id: crypto.randomUUID(),
        driver_id: user.id,
        odometer_reading: odometer,
        amount_spent: amount,
        cost: amount,
        liters: null,
        latitude,
        longitude,
        timestamp,
      };

      // Inside features/fuel/fuel-page.js

      let isOffline = false;

      try {
        const response = await apiFetch("/api/fuel", {
          method: "POST",
          body: JSON.stringify(record),
        });

        // Capture the address returned from the server and update the record
        if (response && response.address) {
          record.address = response.address;
        }
      } catch (err) {
        console.error("API error:", err);
        if (err.isNetworkError) {
          isOffline = true;
        } else {
          throw err;
        }
      }

      if (isOffline) {
        queueOfflineRequest("fuel", record);
      }

      const logs = _loadLogs();
      logs.push(record);
      _saveLogs(logs);

      form.reset();
      _renderHistory();

      showModal({
        title: "Fuel Logged",
        message: !isOffline
          ? "Fuel refill recorded successfully!"
          : "Saved offline. Will sync when back online.",
        primaryBtnText: "OK",
        primaryBtnCallback: () => {},
        secondaryBtnText: "View History",
        secondaryBtnCallback: () => {
          document
            .getElementById("history-body")
            ?.scrollIntoView({ behavior: "smooth" });
        },
      });
    } catch (err) {
      showModal({ title: "Error", message: err.message, primaryBtnText: "OK" });
    }
  });

  _renderHistory();
}
