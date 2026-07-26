import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import '../css/global.css';
import { apiFetch } from '../js/utils/api.js';
import { login, logout } from '../js/auth.js';
import { markAttendance } from '../features/attendance/attendance.js';
import { queueOfflineRequest, flushOfflineQueue } from '../js/utils/sync.js';

// Helper to set navigator.onLine
function setOnlineStatus(isOnline) {
  Object.defineProperty(navigator, 'onLine', { value: isOnline, configurable: true });
}

// Mock geolocation for tests
function mockGeo(success = true, coords = { latitude: 12.34567, longitude: 76.54321 }, timestamp = 1700000000000) {
  const getCurrentPosition = vi.fn((sCb, eCb) => {
    setTimeout(() => {
      if (success) {
        sCb({ coords, timestamp });
      } else {
        const err = new Error('Permission denied');
        err.code = 1;
        eCb(err);
      }
    }, 0);
  });
  Object.defineProperty(global.navigator, 'geolocation', {
    value: { getCurrentPosition },
    configurable: true
  });
  return getCurrentPosition;
}

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
  localStorage.clear();
  setOnlineStatus(true);
  vi.restoreAllMocks();
});

afterEach(() => {
  delete global.fetch;
});

describe('Phase 8 - API Client Layer & Remote Offline Sync', () => {
  test('apiFetch attaches Authorization Bearer token when user is logged in', async () => {
    // Login locally to set token in session
    await login('driver1', 'driverpw');

    let capturedHeaders = null;
    global.fetch = vi.fn().mockImplementation((url, config) => {
      capturedHeaders = config.headers;
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: 'ok' })
      });
    });

    const res = await apiFetch('/api/test');
    expect(res).toEqual({ data: 'ok' });
    expect(capturedHeaders).toBeDefined();
    expect(capturedHeaders['Authorization']).toMatch(/^Bearer .+/);
  });

  test('apiFetch throws error on non-ok HTTP status response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ message: 'Invalid payload' })
    });

    await expect(apiFetch('/api/bad-request')).rejects.toThrow('Invalid payload');
  });

  test('apiFetch catches network errors and marks isNetworkError', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    try {
      await apiFetch('/api/offline-test');
      expect.unreachable('Should have thrown error');
    } catch (err) {
      expect(err.isNetworkError).toBe(true);
    }
  });

  test('Attendance submission calls remote API when online', async () => {
    await login('driver1', 'driverpw');
    mockGeo(true);

    let apiCalled = false;
    global.fetch = vi.fn().mockImplementation((url, config) => {
      if (url.includes('/api/attendance') && config.method === 'POST') {
        apiCalled = true;
        const payload = JSON.parse(config.body);
        expect(payload.latitude).toBeCloseTo(12.34567);
        expect(payload.longitude).toBeCloseTo(76.54321);
      }
      return Promise.resolve({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ id: 'server-id' })
      });
    });

    await markAttendance();
    await new Promise(r => setTimeout(r, 0));

    expect(apiCalled).toBe(true);
  });

  test('Attendance submission falls back to queueOfflineRequest when network fetch fails', async () => {
    await login('driver1', 'driverpw');
    mockGeo(true);

    global.fetch = vi.fn().mockRejectedValue(new TypeError('Network disconnected'));

    await markAttendance();
    await new Promise(r => setTimeout(r, 0));

    const queueRaw = localStorage.getItem('fleet_offline_queue');
    const queue = queueRaw ? JSON.parse(queueRaw) : [];
    expect(queue.length).toBe(1);
    expect(queue[0].type).toBe('attendance');
    expect(queue[0].payload.latitude).toBeCloseTo(12.34567);
  });

  test('flushOfflineQueue posts queued attendance & fuel items to backend API', async () => {
    setOnlineStatus(false);
    const attendancePayload = { id: 'att-888', driver_id: 'd1', latitude: 1.1, longitude: 2.2, timestamp: 1000 };
    const fuelPayload = { id: 'fuel-999', driver_id: 'd1', odometer_reading: 500, amount_spent: 40, latitude: 1.1, longitude: 2.2, timestamp: 2000 };

    queueOfflineRequest('attendance', attendancePayload);
    queueOfflineRequest('fuel', fuelPayload);

    setOnlineStatus(true);
    const postedEndpoints = [];

    global.fetch = vi.fn().mockImplementation((url, config) => {
      postedEndpoints.push({ url, method: config.method, body: JSON.parse(config.body) });
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true })
      });
    });

    await flushOfflineQueue();

    expect(postedEndpoints.length).toBe(2);
    expect(postedEndpoints[0].url).toContain('/api/attendance');
    expect(postedEndpoints[0].body.id).toBe('att-888');
    expect(postedEndpoints[1].url).toContain('/api/fuel');
    expect(postedEndpoints[1].body.id).toBe('fuel-999');

    // Offline queue should now be empty
    expect(localStorage.getItem('fleet_offline_queue')).toBeNull();

    // Synced records should be reflected in local storage
    const attLogs = JSON.parse(localStorage.getItem('fleet_attendance_logs') || '[]');
    expect(attLogs.some(l => l.id === 'att-888')).toBe(true);
  });
});
