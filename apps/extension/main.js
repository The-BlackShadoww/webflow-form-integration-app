const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || "http://localhost:3000";

document.getElementById("open")?.addEventListener("click", () => {
  // Webflow Designer Extensions run inside an iframe — open the dashboard in a new tab.
  window.open(`${DASHBOARD_URL}/sites`, "_blank", "noopener");
});
