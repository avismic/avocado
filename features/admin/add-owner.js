import '../../css/global.css';
import { logout } from '../../js/auth.js';
import { navigate } from '../../js/router.js';
import { apiFetch } from '../../js/utils/api.js';

export function mountAddOwner() {
  const app = document.getElementById('app');
  if (!app) throw new Error('Missing #app element');

  app.innerHTML = `
    <section class="owner-page">
      <header class="owner-header">
        <button class="btn-secondary back-btn" id="back-btn">← Back</button>
        <div>
          <p class="subtitle">System Administration</p>
          <h2>Add Owner</h2>
        </div>
        <button class="btn-secondary logout-btn" id="logout-btn">Logout</button>
      </header>

      <div class="apple-card" style="max-width: 500px; margin: 40px auto; padding: 24px;">
        <h3>Register New Owner</h3>
        <form id="add-owner-form" style="display: flex; flex-direction: column; gap: 16px; margin-top: 16px;">
          <div>
            <label>Full Name</label>
            <input type="text" id="owner-name" class="owner-select" required placeholder="e.g. John Doe" />
          </div>
          <div>
            <label>Username</label>
            <input type="text" id="owner-username" class="owner-select" required placeholder="e.g. johndoe" />
          </div>
          <div>
            <label>Password</label>
            <input type="password" id="owner-password" class="owner-select" required placeholder="••••••••" />
          </div>
          <button type="submit" class="btn-primary">Add Owner</button>
        </form>
        <div id="form-message" style="margin-top: 12px;"></div>
      </div>
    </section>
  `;

  document.getElementById('back-btn').addEventListener('click', () => navigate('#admin-dashboard'));
  document.getElementById('logout-btn').addEventListener('click', () => logout());

  const form = document.getElementById('add-owner-form');
  const msgDiv = document.getElementById('form-message');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const full_name = document.getElementById('owner-name').value.trim();
    const username = document.getElementById('owner-username').value.trim();
    const password = document.getElementById('owner-password').value.trim();

    try {
      await apiFetch('/api/admin/add-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name, username, password })
      });

      msgDiv.innerHTML = `<p style="color: green;">Owner created successfully!</p>`;
      form.reset();
    } catch (err) {
      msgDiv.innerHTML = `<p style="color: red;">Error: ${err.message}</p>`;
    }
  });
}