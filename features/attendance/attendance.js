import { getDriverLocation } from "../../js/utils/geo.js";
import { getUser } from "../../js/auth.js";
import { showModal } from "../../features/shared/modal.js";
import { queueOfflineRequest } from "../../js/utils/sync.js";
import { apiFetch } from "../../js/utils/api.js";

const ATTENDANCE_KEY = "fleet_attendance_logs";

function _loadLogs() {
  const raw = localStorage.getItem(ATTENDANCE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function _saveLogs(logs) {
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(logs));
}

export async function markAttendance() {
  try {
    const { latitude, longitude, timestamp } = await getDriverLocation();
    const user = getUser();
    if (!user) throw new Error("User not authenticated");

    const record = {
      id: crypto.randomUUID(),
      driver_id: user.id,
      latitude,
      longitude,
      timestamp,
      address: null,
    };

    let isOffline = false;

    try {
      const response = await apiFetch("/api/attendance", {
        method: "POST",
        body: JSON.stringify(record),
      });
      if (response && response.address) {
        record.address = response.address;
      }
    } catch (err) {
      console.error("API error:", err);
      isOffline = true;
    }

    if (isOffline) {
      queueOfflineRequest("attendance", record);
    }

    const logs = _loadLogs();
    logs.unshift(record);
    _saveLogs(logs);

    showModal({
      title: "Attendance",
      message: !isOffline
        ? "Attendance marked successfully!"
        : "Saved offline. Will sync when back online.",
      primaryBtnText: "OK",
      primaryBtnCallback: () => {},
      secondaryBtnText: "View Attendance",
      secondaryBtnCallback: () => {
        window.location.hash = "#driver-attendance-history";
      },
    });
  } catch (err) {
    showModal({
      title: "Error",
      message: err.message,
      primaryBtnText: "OK",
    });
  }
}

export function getAttendanceLogs() {
  return _loadLogs().sort((a, b) => b.timestamp - a.timestamp);
}
