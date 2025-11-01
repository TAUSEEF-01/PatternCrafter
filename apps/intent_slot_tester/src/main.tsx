import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

// Apply theme from query parameter or saved preference
const params = new URLSearchParams(window.location.search);
const qpTheme = params.get("theme");
if (qpTheme === "light" || qpTheme === "dark") {
  document.documentElement.setAttribute("data-theme", qpTheme);
} else {
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
