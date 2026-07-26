import '../../css/global.css';
import { logout } from '../../js/auth.js';
import { navigate } from '../../js/router.js';

export function mountAdminDashboard() {
  const app = document.getElementById('app');
  if (!app) throw new Error('Missing #app element');

  app.innerHTML = `
    <section class="owner-page">
      <header class="owner-header">
        <div>
          <p class="subtitle">System Administration</p>
          <h2>Admin Dashboard</h2>
        </div>
        <button class="btn-secondary logout-btn" id="logout-btn">Logout</button>
      </header>

      <div class="owner-tiles">
        <div class="tile-card apple-card" id="admin-add-owner-tile">
          <div class="icon-wrapper">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
          </div>
          <div class="tile-content">
            <h3>Add Owner</h3>
            <p>Register new fleet owners in the system</p>
          </div>
        </div>

        <div class="tile-card apple-card" id="admin-see-owners-tile">
          <div class="icon-wrapper">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div class="tile-content">
            <h3>See Owners</h3>
            <p>View list of registered owners and their credentials</p>
          </div>
        </div>
      </div>
    </section>
  `;

  document.getElementById('logout-btn').addEventListener('click', () => logout());
  document.getElementById('admin-add-owner-tile').addEventListener('click', () => navigate('#admin-add-owner'));
  document.getElementById('admin-see-owners-tile').addEventListener('click', () => navigate('#admin-see-owners'));
}