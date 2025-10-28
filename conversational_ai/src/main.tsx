import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";

// Apply theme from query parameter if present
const params = new URLSearchParams(window.location.search);
const qpTheme = params.get("theme");
if (qpTheme === "light" || qpTheme === "dark") {
  document.documentElement.setAttribute("data-theme", qpTheme);
} else {
  // optional: fall back to saved theme
  const saved = localStorage.getItem("pc_theme");
  if (saved === "light" || saved === "dark") {
    document.documentElement.setAttribute("data-theme", saved);
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.VITE_BASE_PATH || "/"}>
      <App />
    </BrowserRouter>
  </StrictMode>
);
