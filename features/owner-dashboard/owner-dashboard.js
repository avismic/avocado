import '../../css/global.css';
import './owner-dashboard.css';
import { logout } from '../../js/auth.js';
import { navigate } from '../../js/router.js';
import { apiFetch } from '../../js/utils/api.js';

async function _loadDrivers() {
  try {
    const drivers = await apiFetch('/api/drivers');
    if (Array.isArray(drivers)) return drivers;
  } catch {
  }

  const raw = localStorage.getItem('fleet_users');
  if (raw) {
    try {
      const users = JSON.parse(raw);
      return users.filter(u => u.role === 'driver');
    } catch {
    }
  }

  return [
    {
      id: '11111111-1111-1111-1111-111111111111',
      username: 'driver1',
      full_name: 'Driver One',
      role: 'driver'
    }
  ];
}

async function _renderDriverSelector(container, selectedId, onSelect) {
  const drivers = await _loadDrivers();

  const wrapper = document.createElement('div');
  wrapper.className = 'driver-selector-card apple-card';

  const label = document.createElement('label');
  label.htmlFor = 'driver-select';
  label.textContent = 'Select Driver';
  wrapper.appendChild(label);

  const select = document.createElement('select');
  select.id = 'driver-select';
  select.className = 'owner-select';

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = '-- Choose a driver --';
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

export function mountOwnerDashboard() {
  const app = document.getElementById('app');
  if (!app) throw new Error('Missing #app element');

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
      </div>
    </section>
  `;

  document.getElementById('logout-btn').addEventListener('click', () => logout());
  document.getElementById('owner-attendance-tile').addEventListener('click', () => navigate('#owner-attendance'));
  document.getElementById('owner-fuel-tile').addEventListener('click', () => navigate('#owner-fuel'));
  document.getElementById('logout-btn').addEventListener('click', () => logout());
  document.getElementById('owner-attendance-tile').addEventListener('click', () => navigate('#owner-attendance'));
  document.getElementById('owner-fuel-tile').addEventListener('click', () => navigate('#owner-fuel'));
  document.getElementById('owner-add-driver-tile').addEventListener('click', () => navigate('#owner-add-driver'));

}

export async function mountOwnerAttendance() {
  const app = document.getElementById('app');
  if (!app) throw new Error('Missing #app element');

  let selectedDriverId = '';

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

  document.getElementById('back-btn').addEventListener('click', () => navigate('#owner-dashboard'));
  document.getElementById('logout-btn').addEventListener('click', () => logout());

  const selectorDiv = document.getElementById('selector-container');
  const tableDiv = document.getElementById('table-container');

  const renderTable = async () => {
    tableDiv.innerHTML = '';
    if (!selectedDriverId) {
      tableDiv.innerHTML = `<div class="apple-card empty-card"><p class="empty-state">Please select a driver to view attendance records.</p></div>`;
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
      tableDiv.innerHTML = `<div class="apple-card empty-card"><p class="empty-state">No attendance records found for this driver.</p></div>`;
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
      .join('');

    tableDiv.innerHTML = `
      <div class="apple-card owner-table-card">
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
  };

  await _renderDriverSelector(selectorDiv, selectedDriverId, id => {
    selectedDriverId = id;
    renderTable();
  });
}

export async function mountOwnerFuel() {
  const app = document.getElementById('app');
  if (!app) throw new Error('Missing #app element');

  let selectedDriverId = '';

  app.innerHTML = `
    <section class="owner-page">
      <header class="owner-header">
        <button class="btn-secondary back-btn" id="back-btn">← Back</button>
        <div>
          <p class="subtitle">Driver Insight</p>
          <h2>Fuel Expense Overview</h2>
        </div>
        <button class="btn-secondary logout-btn" id="logout-btn">Logout</button>
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
      tableDiv.innerHTML = `<div class="apple-card empty-card"><p class="empty-state">Please select a driver to view fuel records.</p></div>`;
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
      tableDiv.innerHTML = `<div class="apple-card empty-card"><p class="empty-state">No fuel records found for this driver.</p></div>`;
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
        const lat = log.latitude ? Number(log.latitude).toFixed(4) : '0.0000';
        const lng = log.longitude ? Number(log.longitude).toFixed(4) : '0.0000';
        const loc = `${lat}, ${lng}`;
        const odo = log.odometer_reading ?? log.odometer;
        const amt = log.amount_spent ?? log.cost;
        return `
          <tr>
            <td><span class="driver-badge">${driverName}</span></td>
            <td><span class="log-date">${date}</span> <span class="log-time">${time}</span></td>
            <td>${odo} km</td>
            <td class="log-amount">$${Number(amt).toFixed(2)}</td>
            <td class="log-coord">${loc}</td>
          </tr>
        `;
      })
      .join('');

    tableDiv.innerHTML = `
      <div class="apple-card owner-table-card">
        <div class="table-wrapper">
          <table class="owner-table">
            <thead>
              <tr>
                <th>Driver</th>
                <th>Date & Time</th>
                <th>Odometer</th>
                <th>Amount</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;
  };

  await _renderDriverSelector(selectorDiv, selectedDriverId, id => {
    selectedDriverId = id;
    renderTable();
  });
}