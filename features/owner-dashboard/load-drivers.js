import { apiFetch } from "../../js/utils/api.js";

export async function _loadDrivers(ownerId) {
  try {
    const query = ownerId ? `?owner_id=${ownerId}` : "";
    const drivers = await apiFetch(`/api/drivers${query}`);
    if (Array.isArray(drivers)) return drivers;
  } catch {}

  const raw = localStorage.getItem("fleet_users");
  if (raw) {
    try {
      const users = JSON.parse(raw);
      return users.filter(
        (u) => u.role === "driver" && (!ownerId || u.owner_id === ownerId),
      );
    } catch {}
  }

  return [];
}