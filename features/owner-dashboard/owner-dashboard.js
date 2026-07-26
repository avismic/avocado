import '../../css/global.css';
import './owner-dashboard.css';
import { logout } from '../../js/auth.js';
import { navigate } from '../../js/router.js';
import { apiFetch } from '../../js/utils/api.js';

/* Helper: load driver users via API with local storage/mock fallback */
async function _loadDrivers() {
  try {
    const drivers = await apiFetch('/api/drivers');
    if (Array.isArray(drivers)) return drivers;
  } catch {
    // API unavailable - fall back to local storage or mock
  }

  const raw = localStorage.getItem('fleet_users');
  if (raw) {
    try {
      const users = JSON.parse(raw);
      return users.filter(u => u.role === 'driver');
    } catch {
      // fallback
    }
  }

  // Default mock drivers fallback
  return [
    {
      id: '11111111-1111-1111-1111-111111111111',
      username: 'driver1',
      full_name: 'Driver One',
      role: 'driver'
    }
  ];
}

/* Helper: create driver selector UI */
async function _renderDriverSelector(container, selectedId, onSelect) {
  const drivers = await _loadDrivers();

  const wrapper = document.createElement('div');
  wrapper.className = 'driver-selector';

  const label = document.createElement('label');
  label.htmlFor = 'driver-select';
  label.textContent = 'Select Driver';
  wrapper.appendChild(label);

  const select = document.createElement('select');
  select.id = 'driver-select';

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = '-- choose a driver --';
  select.appendChild(placeholder);

  drivers.forEach(driver => {
    const opt = document.createElement('option');
    opt.value = driver.id;
    opt.textContent = driver.full_name;
    if (driver.id === selectedId) opt.selected = true;
    select.appendChild(opt);
  });

  select.addEventListener('change', () => onSelect(select.value));
  container.innerHTML = '';
  wrapper.appendChild(select);
  container.appendChild(wrapper);
  return drivers;
}

/* ---------- Owner Main Dashboard ---------- */
export function mountOwnerDashboard() {
  const app = document.getElementById('app');
  if (!app) throw new Error('Missing #app element');

  app.innerHTML = `
    <section class="owner-page">
      <header class="owner-header">
        <h1>Owner Dashboard</h1>
        <button class="logout-btn" id="logout-btn">Logout</button>
      </header>

      <div class="owner-tiles">
        <div class="owner-tile" id="owner-attendance-tile">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 11V7"></path>
            <path d="M15 11V7"></path>
            <path d="M5 21h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z"></path>
          </svg>
          <h3>Driver Attendance</h3>
        </div>
        <div class="owner-tile" id="owner-fuel-tile">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="1 4 23 4 23 20 1 20 1 4"></polygon>
            <line x1="1" y1="8" x2="23" y2="8"></line>
            <line x1="1" y1="16" x2="23" y2="16"></line>
          </svg>
          <h3>Driver Fuel Logs</h3>
        </div>
      </div>
    </section>
  `;

  document.getElementById('logout-btn').addEventListener('click', () => logout());
  document.getElementById('owner-attendance-tile')
    .addEventListener('click', () => navigate('#owner-attendance'));
  document.getElementById('owner-fuel-tile')
    .addEventListener('click', () => navigate('#owner-fuel'));
}

/* ---------- Owner Attendance ---------- */
export async function mountOwnerAttendance() {
  const app = document.getElementById('app');
  if (!app) throw new Error('Missing #app element');

  let selectedDriverId = '';

  app.innerHTML = `
    <section class="owner-page">
      <header class="owner-header">
        <button class="back-btn" id="back-btn">← Back</button>
        <h1>Attendance – Driver Insight</h1>
        <button class="logout-btn" id="logout-btn">Logout</button>
      </header>
      <div id="selector-container"></div>
      <div id="table-container"></div>
    </section>
  `;

  document.getElementById('back-btn').addEventListener('click', () => navigate('#owner-dashboard'));
  document.getElementById('logout-btn').addEventListener('click', () => logout());

  const selectorDiv = document.getElementById('selector-container');
  const tableDiv = document.getElementById('table-container');

  const renderTable = async () => {
    tableDiv.innerHTML = '';
    if (!selectedDriverId) {
      tableDiv.innerHTML = `<p class="empty-state">Please select a driver to view attendance.</p>`;
      return;
    }

    let driverLogs = [];
    try {
      const logs = await apiFetch(`/api/attendance?driver_id=${selectedDriverId}`);
      if (Array.isArray(logs)) driverLogs = logs;
    } catch {
      const raw = localStorage.getItem('fleet_attendance_logs');
      const logs = raw ? JSON.parse(raw) : [];
      driverLogs = logs.filter(l => l.driver_id === selectedDriverId);
    }

    if (driverLogs.length === 0) {
      tableDiv.innerHTML = `<p class="empty-state">No attendance records found for this driver.</p>`;
      return;
    }

    const drivers = await _loadDrivers();
    const driverName = drivers.find(d => d.id === selectedDriverId)?.full_name ?? 'Unknown';
    const rows = driverLogs
      .sort((a, b) => b.timestamp - a.timestamp)
      .map(log => {
        const d = new Date(log.timestamp);
        const date = d.toISOString().split('T')[0];
        const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
        const loc = `${Number(log.latitude).toFixed(5)}, ${Number(log.longitude).toFixed(5)}`;
        return `
          <tr>
            <td>${driverName}</td>
            <td>${date}</td>
            <td>${time}</td>
            <td>${loc}</td>
          </tr>
        `;
      })
      .join('');

    tableDiv.innerHTML = `
      <table class="owner-table">
        <thead>
          <tr><th>Driver</th><th>Date</th><th>Time</th><th>Location</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  };

  await _renderDriverSelector(selectorDiv, selectedDriverId, id => {
    selectedDriverId = id;
    renderTable();
  });
}

/* ---------- Owner Fuel ---------- */
export async function mountOwnerFuel() {
  const app = document.getElementById('app');
  if (!app) throw new Error('Missing #app element');

  let selectedDriverId = '';

  app.innerHTML = `
    <section class="owner-page">
      <header class="owner-header">
        <button class="back-btn" id="back-btn">← Back</button>
        <h1>Fuel – Driver Insight</h1>
        <button class="logout-btn" id="logout-btn">Logout</button>
      </header>
      <div id="selector-container"></div>
      <div id="table-container"></div>
    </section>
  `;

  document.getElementById('back-btn').addEventListener('click', () => navigate('#owner-dashboard'));
  document.getElementById('logout-btn').addEventListener('click', () => logout());

  const selectorDiv = document.getElementById('selector-container');
  const tableDiv = document.getElementById('table-container');

  const renderTable = async () => {
    tableDiv.innerHTML = '';
    if (!selectedDriverId) {
      tableDiv.innerHTML = `<p class="empty-state">Please select a driver to view fuel logs.</p>`;
      return;
    }

    let driverLogs = [];
    try {
      const logs = await apiFetch(`/api/fuel?driver_id=${selectedDriverId}`);
      if (Array.isArray(logs)) driverLogs = logs;
    } catch {
      const raw = localStorage.getItem('fleet_fuel_logs');
      const logs = raw ? JSON.parse(raw) : [];
      driverLogs = logs.filter(l => l.driver_id === selectedDriverId);
    }

    if (driverLogs.length === 0) {
      tableDiv.innerHTML = `<p class="empty-state">No fuel records found for this driver.</p>`;
      return;
    }

    const drivers = await _loadDrivers();
    const driverName = drivers.find(d => d.id === selectedDriverId)?.full_name ?? 'Unknown';
    const rows = driverLogs
      .sort((a, b) => b.timestamp - a.timestamp)
      .map(log => {
        const d = new Date(log.timestamp);
        const date = d.toISOString().split('T')[0];
        const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
        const lat = log.latitude ? Number(log.latitude).toFixed(5) : '0.00000';
        const lng = log.longitude ? Number(log.longitude).toFixed(5) : '0.00000';
        const loc = `${lat}, ${lng}`;
        const odo = log.odometer_reading ?? log.odometer;
        const amt = log.amount_spent ?? log.cost;
        return `
          <tr>
            <td>${driverName}</td>
            <td>${date} ${time}</td>
            <td>${odo}</td>
            <td>${amt}</td>
            <td>${loc}</td>
          </tr>
        `;
      })
      .join('');

    tableDiv.innerHTML = `
      <table class="owner-table">
        <thead>
          <tr><th>Driver</th><th>Date & Time</th><th>Odometer</th><th>Amount</th><th>Location</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  };

  await _renderDriverSelector(selectorDiv, selectedDriverId, id => {
    selectedDriverId = id;
    renderTable();
  });
}
