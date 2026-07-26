// js/auth.js – Authentication service with remote API support & offline fallback
import { apiFetch } from './utils/api.js';

// Mock user database – fallback for offline mode & unit testing
const mockUsers = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    username: 'driver1',
    password: 'driverpw',
    full_name: 'Driver One',
    role: 'driver'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    username: 'owner1',
    password: 'ownerpw',
    full_name: 'Owner One',
    role: 'owner'
  }
];

const SESSION_KEY = 'fleet_session';

/** Helper – retrieve session object from localStorage */
function _loadSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Helper – persist session */
function _saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/** Helper – clear session */
function _clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

/** Public API */
export async function login(username, password) {
  if (!username || !password) {
    throw new Error('Username and password are required');
  }

  try {
    const session = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    if (session && session.user && session.token) {
      _saveSession(session);
      return session;
    }
  } catch (err) {
    // If offline or network error, fallback to local mock user database
    if (err.isNetworkError || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      const userRecord = mockUsers.find(
        (u) => u.username === username && u.password === password
      );

      if (!userRecord) {
        throw new Error('Invalid username or password');
      }

      const token = btoa(`${userRecord.id}:${Date.now()}`);
      const session = {
        user: {
          id: userRecord.id,
          username: userRecord.username,
          full_name: userRecord.full_name,
          role: userRecord.role
        },
        token
      };

      _saveSession(session);
      return session;
    }

    throw err;
  }

  throw new Error('Invalid response from login API');
}

export function logout() {
  _clearSession();
  // lazy‑import router to avoid circular dependency at module load time
  import('./router.js').then((router) => router.navigate('#login'));
}

export function getUser() {
  const session = _loadSession();
  return session?.user ?? null;
}

export function isAuthenticated() {
  return !!_loadSession();
}

export function getToken() {
  const session = _loadSession();
  return session?.token ?? null;
}
