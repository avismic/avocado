export function loadCss(moduleUrl, relativePath) {
  const href = new URL(relativePath, moduleUrl).href;

  if (document.querySelector(`link[href="${href}"]`)) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}