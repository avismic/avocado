import '../../css/global.css';
import { getDriverLocation } from '../../js/utils/geo.js';
import { getUser } from '../../js/auth.js';
import { showModal } from '../../features/shared/modal.js';
import { navigate } from '../../js/router.js';
import { queueOfflineRequest } from '../../js/utils/sync.js';
import { apiFetch } from '../../js/utils/api.js';

const FUEL_LOGS_KEY = 'fleet_fuel_logs';

function _loadLogs() {
  const raw = localStorage.getItem(FUEL_LOGS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function _saveLogs(logs) {
  localStorage.setItem(FUEL_LOGS_KEY, JSON.stringify(logs));
}

function _formatDate(ts) {
  const d = new Date(ts);
  const date = d.toISOString().split('T')[0];
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return { date, time };
}

export function mountFuelPage() {
  const app = document.getElementById('app');
  if (!app) throw new Error('Missing #app element');

  app.innerHTML = `
    <section class="fuel-page">
      <header class="fuel-header">
        <button class="back-btn" id="back-btn">← Back</button>
        <h2>Fuel Log</h2>
      </header>

      <div class="fuel-form-card glass-card">
        <form id="fuel-form" novalidate>
          <label for="odometer">Odometer Reading (km)</label>
          <input type="number" step="0.01" id="odometer" name="odometer" required />

          <label for="amount">Amount Spent ($)</label>
          <input type="number" step="0.01" id="amount" name="amount" required />

          <button type="submit" class="fuel-submit">Log Fuel Refill</button>
        </form>
      </div>

      <div class="fuel-history">
        <h3>Refill History</h3>
        <table class="fuel-history-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Odometer (km)</th>
              <th>Amount ($)</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody id="history-body"></tbody>
        </table>
      </div>
    </section>
  `;

  document.getElementById('back-btn').addEventListener('click', () => navigate('#driver-dashboard'));

  const form = document.getElementById('fuel-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const odometer = parseFloat(form.odometer.value);
    const amount = parseFloat(form.amount.value);

    if (isNaN(odometer) || odometer <= 0) {
      showModal({ title: 'Invalid Input', message: 'Odometer must be a positive number.', primaryBtnText: 'OK' });
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      showModal({ title: 'Invalid Input', message: 'Amount spent must be a positive number.', primaryBtnText: 'OK' });
      return;
    }

    try {
      const { latitude, longitude, timestamp } = await getDriverLocation();
      const user = getUser();
      if (!user) throw new Error('User not authenticated');

      const record = {
        id: crypto.randomUUID(),
        driver_id: user.id,
        odometer_reading: odometer,
        amount_spent: amount,
        cost: amount,
        liters: null,
        latitude,
        longitude,
        timestamp
      };

      let isOffline = false;

      try {
        await apiFetch('/api/fuel', {
          method: 'POST',
          body: JSON.stringify(record)
        });
      } catch (err) {
        console.error("API error:", err);
        if (err.isNetworkError) {
          isOffline = true;
        } else {
          throw err;
        }
      }

      if (isOffline) {
        queueOfflineRequest('fuel', record);
      }

      const logs = _loadLogs();
      logs.push(record);
      _saveLogs(logs);

      form.reset();
      _renderHistory();

      showModal({
        title: 'Fuel Logged',
        message: !isOffline ? 'Fuel refill recorded successfully!' : 'Saved offline. Will sync when back online.',
        primaryBtnText: 'OK',
        primaryBtnCallback: () => {},
        secondaryBtnText: 'View History',
        secondaryBtnCallback: () => {
          document.getElementById('history-body')?.scrollIntoView({ behavior: 'smooth' });
        }
      });
    } catch (err) {
      showModal({ title: 'Error', message: err.message, primaryBtnText: 'OK' });
    }
  });

  _renderHistory();
}

function _renderHistory() {
  const tbody = document.getElementById('history-body');
  if (!tbody) return;

  const logs = _loadLogs().filter(l => l.driver_id === getUser()?.id);

  if (logs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4">No fuel logs yet.</td></tr>';
    return;
  }

  const rows = logs
    .sort((a, b) => b.timestamp - a.timestamp)
    .map(log => {
      const { date, time } = _formatDate(log.timestamp);
      const coord = `${log.latitude.toFixed(5)}, ${log.longitude.toFixed(5)}`;
      const odo = log.odometer_reading ?? log.odometer;
      const amt = log.amount_spent ?? log.cost;
      return `
        <tr>
          <td>${date} ${time}</td>
          <td>${odo}</td>
          <td>${amt}</td>
          <td>${coord}</td>
        </tr>
      `;
    })
    .join('');

  tbody.innerHTML = rows;
}