import { isAuthenticated, getUser } from "./auth.js";

const routes = new Map();

export function registerRoute(routeHash, handler) {
  routes.set(routeHash, handler);
}

function resolveTarget(hash = "") {
  const cleanHash = (hash || "").replace(/^#/, "");
  if (cleanHash === "login") return { hash: "#login" };
  if (!isAuthenticated()) {
    return { hash: "#login" };
  }
  const user = getUser();
  if (!user) return { hash: "#login" };
  const roleDash = {
    admin: "#admin-dashboard",
    driver: "#driver-dashboard",
    owner: "#owner-dashboard",
  };
  const adminOnly = ["admin-dashboard", "admin-add-owner", "admin-see-owners"];
  const driverOnly = [
    "driver-dashboard",
    "driver-attendance-history",
    "driver-fuel",
  ];
  const ownerOnly = [
    "owner-dashboard",
    "owner-attendance",
    "owner-fuel",
    "owner-add-driver",
    "owner-see-drivers",
  ];
  if (adminOnly.includes(cleanHash) && user.role !== "admin") {
    return { hash: "#admin-dashboard" };
  }
  if (driverOnly.includes(cleanHash) && user.role !== "driver") {
    return { hash: "#driver-dashboard" };
  }

  if (ownerOnly.includes(cleanHash) && user.role !== "owner") {
    return { hash: "#owner-dashboard" };
  }
  if (
    (adminOnly.includes(cleanHash) && user.role === "admin") ||
    (driverOnly.includes(cleanHash) && user.role === "driver") ||
    (ownerOnly.includes(cleanHash) && user.role === "owner")
  ) {
    return { hash: `#${cleanHash}` };
  }
  return { hash: roleDash[user.role] || "#login" };
}

let isNavigating = false;
export function navigate(targetHash) {
  const currentHash =
    (typeof window !== "undefined" &&
      window.location &&
      window.location.hash) ||
    "";
  const resolved = resolveTarget(targetHash || currentHash);
  if (
    typeof window !== "undefined" &&
    window.location &&
    resolved.hash !== window.location.hash
  ) {
    window.location.replace(resolved.hash);
  } else {
    handleHashChange();
  }
}

function handleHashChange() {
  if (isNavigating) return;
  isNavigating = true;
  try {
    const currentHash =
      (typeof window !== "undefined" &&
        window.location &&
        window.location.hash) ||
      "";
    const resolved = resolveTarget(currentHash);
    const clean = resolved.hash.replace(/^#/, "");
    const handler = routes.get(clean);
    if (handler) {
      handler();
    }
  } finally {
    isNavigating = false;
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("hashchange", handleHashChange);
}
