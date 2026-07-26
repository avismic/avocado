import '../../css/global.css';
import './driver-dashboard.css';
import { logout } from '../../js/auth.js';

export function mountDriverDashboard() {
  const app = document.getElementById('app');
  if (!app) throw new Error('Missing #app element');

  app.innerHTML = `
    <section class="driver-dashboard">
      <header class="driver-header">
        <div>
          <p class="subtitle">Overview</p>
          <h1>Driver Dashboard</h1>
        </div>
        <button class="btn-secondary logout-btn" id="logout-btn">Logout</button>
      </header>

      <div class="tiles-container">
        <div class="tile-card apple-card" id="attendance-tile">
          <div class="icon-wrapper">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 8v4l3 3"></path>
              <circle cx="12" cy="12" r="9"></circle>
            </svg>
          </div>
          <div class="tile-content">
            <h3>Mark Attendance</h3>
            <p>Record your shift start and current location</p>
          </div>
        </div>

        <div class="tile-card apple-card" id="fuel-tile">
          <div class="icon-wrapper">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="22" x2="15" y2="22"></line>
              <line x1="4" y1="9" x2="14" y2="9"></line>
              <path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"></path>
              <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42l-2.82-2.82"></path>
            </svg>
          </div>
          <div class="tile-content">
            <h3>Fuel Log</h3>
            <p>Log fuel refills and track expenses</p>
          </div>
        </div>
      </div>
    </section>
  `;

  document.getElementById('logout-btn').addEventListener('click', () => logout());
  document.getElementById('attendance-tile').addEventListener('click', () => {
    import('../../features/attendance/attendance.js').then(m => m.markAttendance());
  });
  document.getElementById('fuel-tile').addEventListener('click', () => {
    window.location.hash = '#driver-fuel';
  });
}