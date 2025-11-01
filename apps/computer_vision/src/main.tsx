import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";

const params = new URLSearchParams(window.location.search);
const themeParam = params.get("theme");
if (themeParam === "light" || themeParam === "dark") {
  document.documentElement.setAttribute("data-theme", themeParam);
} else {
  const savedTheme = localStorage.getItem("pc_theme");
  if (savedTheme === "light" || savedTheme === "dark") {
    document.documentElement.setAttribute("data-theme", savedTheme);
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.VITE_BASE_PATH || "/"}>
      <App />
    </BrowserRouter>
  </StrictMode>
);
