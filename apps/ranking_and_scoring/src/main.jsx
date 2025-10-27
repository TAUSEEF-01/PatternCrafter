import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

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

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
