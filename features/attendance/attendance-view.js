// features/attendance/attendance-view.js
import '../../css/global.css';
import './attendance.css';
import { getAttendanceLogs } from './attendance.js';
import { getUser } from '../../js/auth.js';
import { navigate } from '../../js/router.js';

function _formatDate(timestamp) {
  const d = new Date(timestamp);
  // YYYY‑MM‑DD
  const date = d.toISOString().split('T')[0];
  // HH:MM AM/PM
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return { date, time };
}

export function mountAttendanceHistory() {
  const app = document.getElementById('app');
  if (!app) throw new Error('Missing #app element');

  const user = getUser();
  const logs = getAttendanceLogs().filter(l => l.driver_id === user?.id);

  const rows = logs.map(log => {
    const { date, time } = _formatDate(log.timestamp);
    const coord = `${log.latitude.toFixed(5)}, ${log.longitude.toFixed(5)}`;
    return `
      <tr>
        <td>${date}</td>
        <td>${time}</td>
        <td>${coord}</td>
      </tr>`;
  }).join('');

  app.innerHTML = `
    <section class="attendance-view">
      <header class="attendance-header">
        <button class="back-btn" id="back-btn">← Back</button>
        <h2>Attendance History</h2>
      </header>
      <table class="attendance-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Location</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="3">No records found.</td></tr>'}
        </tbody>
      </table>
    </section>
  `;

  document.getElementById('back-btn').addEventListener('click', () => navigate('#driver-dashboard'));
}
