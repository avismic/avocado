import '../../css/global.css';
import { logout } from '../../js/auth.js';
import { navigate } from '../../js/router.js';
import { apiFetch } from '../../js/utils/api.js';

export async function mountSeeOwners() {
  const app = document.getElementById('app');
  if (!app) throw new Error('Missing #app element');

  app.innerHTML = `
    <section class="owner-page">
      <header class="owner-header">
        <button class="btn-secondary back-btn" id="back-btn">← Back</button>
        <div>
          <p class="subtitle">System Administration</p>
          <h2>Registered Owners</h2>
        </div>
        <button class="btn-secondary logout-btn" id="logout-btn">Logout</button>
      </header>

      <div class="apple-card" style="max-width: 800px; margin: 40px auto; padding: 24px;">
        <h3>Owner List</h3>
        <div id="owners-list" style="margin-top: 16px;">
          <p>Loading owners...</p>
        </div>
      </div>
    </section>
  `;

  document.getElementById('back-btn').addEventListener('click', () => navigate('#admin-dashboard'));
  document.getElementById('logout-btn').addEventListener('click', () => logout());

  const listDiv = document.getElementById('owners-list');

  try {
    const owners = await apiFetch('/api/admin/owners');
    if (!owners || owners.length === 0) {
      listDiv.innerHTML = '<p>No owners found.</p>';
      return;
    }

    listDiv.innerHTML = `
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <thead>
          <tr style="border-bottom: 1px solid #ddd;">
            <th style="padding: 12px;">Name</th>
            <th style="padding: 12px;">Username</th>
            <th style="padding: 12px;">Password</th>
          </tr>
        </thead>
        <tbody>
          ${owners.map(o => `
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 12px;">${o.full_name}</td>
              <td style="padding: 12px;">${o.username}</td>
              <td style="padding: 12px;">${o.password}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    listDiv.innerHTML = `<p style="color: red;">Error: ${err.message}</p>`;
  }
}