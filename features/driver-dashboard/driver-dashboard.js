// features/driver-dashboard/driver-dashboard.js
import '../../css/global.css';
import './driver-dashboard.css';
import { logout } from '../../js/auth.js';

export function mountDriverDashboard() {
  const app = document.getElementById('app');
  if (!app) throw new Error('Missing #app element');

  app.innerHTML = `
    <section class="driver-dashboard">
      <header class="driver-header">
        <h1>Driver Dashboard</h1>
        <button class="logout-btn" id="logout-btn">Logout</button>
      </header>
      <div class="tiles-container">
        <div class="tile-card" id="attendance-tile">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12" y2="16"></line></svg>
          <h3>Mark Attendance</h3>
        </div>
        <div class="tile-card" id="fuel-tile">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 4 23 4 23 20 1 20 1 4"></polygon><line x1="1" y1="8" x2="23" y2="8"></line></svg>
          <h3>Fuel Log</h3>
        </div>
      </div>
    </section>
  `;

  // Attach handlers
  document.getElementById('logout-btn').addEventListener('click', () => logout());
  document.getElementById('attendance-tile').addEventListener('click', () => {
    import('../../features/attendance/attendance.js').then(m => m.markAttendance());
  });
  document.getElementById('fuel-tile').addEventListener('click', () => {
    window.location.hash = '#driver-fuel';
  });
}
