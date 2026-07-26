import { describe, test, expect, vi, beforeEach } from 'vitest';
import '../css/global.css';
import '../js/router.js';
import { logout, login } from '../js/auth.js';
import { mountDriverDashboard } from '../features/driver-dashboard/driver-dashboard.js';
import { markAttendance, getAttendanceLogs } from '../features/attendance/attendance.js';
import { mountAttendanceHistory } from '../features/attendance/attendance-view.js';
import * as modalModule from '../features/shared/modal.js';

// Mock geolocation
function mockGeo(success = true, coords = { latitude: 11.11111, longitude: 22.22222 }, timestamp = Date.now()) {
  const getCurrentPosition = vi.fn((sCb, eCb) => {
    setTimeout(() => {
      if (success) {
        sCb({ coords, timestamp });
      } else {
        const err = new Error('Permission denied');
        err.code = 1; // PERMISSION_DENIED
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
  delete global.navigator.geolocation;
});

describe('Driver Dashboard & Attendance Flow', () => {
  test('dashboard renders two tiles and logout works', async () => {
    // Login as driver first
    await login('driver1', 'driverpw');
    mountDriverDashboard();
    const attendanceTile = document.getElementById('attendance-tile');
    const fuelTile = document.getElementById('fuel-tile');
    const logoutBtn = document.getElementById('logout-btn');
    expect(attendanceTile).not.toBeNull();
    expect(fuelTile).not.toBeNull();
    expect(logoutBtn).not.toBeNull();
    // Simulate logout click
    logoutBtn.click();
    expect(localStorage.getItem('fleet_session')).toBeNull();
  });

  test('tapping Attendance tile triggers geolocation and stores a log', async () => {
    await login('driver1', 'driverpw');
    const geoMock = mockGeo(true);
    const modalSpy = vi.spyOn(modalModule, 'showModal').mockImplementation(() => {});

    await markAttendance();

    expect(geoMock).toHaveBeenCalled();
    const logs = getAttendanceLogs();
    expect(logs.length).toBe(1);
    const log = logs[0];
    expect(log.driver_id).toBe('11111111-1111-1111-1111-111111111111');
    expect(log.latitude).toBeCloseTo(11.11111);
    expect(log.longitude).toBeCloseTo(22.22222);
    expect(modalSpy).toHaveBeenCalled();
    modalSpy.mockRestore();
  });

  test('modal after attendance shows OK and View Attendance buttons', async () => {
    await login('driver1', 'driverpw');
    mockGeo(true);
    
    await markAttendance();

    const primaryBtn = document.querySelector('.modal-primary-btn');
    const secondaryBtn = document.querySelector('.modal-secondary-btn');
    expect(primaryBtn).not.toBeNull();
    expect(secondaryBtn).not.toBeNull();
    expect(primaryBtn.textContent).toBe('OK');
    expect(secondaryBtn.textContent).toBe('View Attendance');

    // Click secondary button should navigate to history view
    secondaryBtn.click();
    mountAttendanceHistory();
    const table = document.querySelector('.attendance-table');
    expect(table).not.toBeNull();
    // Verify at least one row exists (header + data row)
    const rows = table.querySelectorAll('tbody tr');
    expect(rows.length).toBeGreaterThanOrEqual(1);
    // Verify formatted date/time appear
    const firstRowCells = rows[0].querySelectorAll('td');
    expect(firstRowCells[0].textContent).toMatch(/\d{4}-\d{2}-\d{2}/);
    expect(firstRowCells[1].textContent).toMatch(/\d{1,2}:\d{2}/);
    expect(firstRowCells[2].textContent).toMatch(/\d+\.\d{5}, \d+\.\d{5}/);
  });
});
