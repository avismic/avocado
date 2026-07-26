import { navigate } from "../../js/router.js";
import { _loadDrivers } from "./load-drivers.js";

export async function _renderDriverSelector(container, selectedId, ownerId, onSelect) {
  const drivers = await _loadDrivers(ownerId);

  if (drivers.length === 0) {
    container.innerHTML = `
      <div class="apple-card empty-card" style="text-align: center; padding: 40px; margin-top: 20px;">
        <h3>Please add drivers</h3>
        <p class="empty-state">You haven't added any drivers yet. Please add drivers to view their records.</p>
        <button class="btn-primary" id="go-add-driver-btn" style="margin-top: 16px; padding: 8px 16px;">Add Driver</button>
      </div>
    `;
    document
      .getElementById("go-add-driver-btn")
      ?.addEventListener("click", () => navigate("#owner-add-driver"));
    return drivers;
  }
  const wrapper = document.createElement("div");
  wrapper.className = "driver-selector-card apple-card";

  const label = document.createElement("label");
  label.htmlFor = "driver-select";
  label.textContent = "Select Driver";
  wrapper.appendChild(label);

  const select = document.createElement("select");
  select.id = "driver-select";
  select.className = "owner-select";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "-- Choose a driver --";
  select.appendChild(placeholder);

  drivers.forEach((driver) => {
    const opt = document.createElement("option");
    opt.value = driver.id;
    opt.textContent = driver.full_name;
    if (driver.id === selectedId) opt.selected = true;
    select.appendChild(opt);
  });

  select.addEventListener("change", () => onSelect(select.value));
  container.innerHTML = "";
  wrapper.appendChild(select);
  container.appendChild(wrapper);
  return drivers;
}