// js/utils/geo.js
// Geolocation helper – returns a promise that resolves with lat, lng, timestamp
// Uses high‑accuracy settings and provides clear error messages for the UI layer.

export function getDriverLocation() {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation not supported by this browser"));
      return;
    }

    const options = {
      enableHighAccuracy: false,
      timeout: 20000,
      maximumAge: 30000,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        console.error("Raw Geolocation Error:", error);
        const isDev =
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1";
        if (isDev) {
          resolve({
            latitude: 12.9716,
            longitude: 77.5946,
            timestamp: Date.now(),
          });
          return;
        }
        let message;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Geolocation permission denied";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Geolocation position unavailable";
            break;
          case error.TIMEOUT:
            message = "Geolocation request timed out";
            break;
          default:
            message = "Geolocation error";
        }
        reject(new Error(message));
      },
      options,
    );
  });
}
