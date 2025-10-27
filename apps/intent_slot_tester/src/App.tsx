import { Navigate, Route, Routes } from "react-router-dom";
import { AnnotatePage } from "./pages/AnnotatePage";
import { HistoryPage } from "./pages/HistoryPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AnnotatePage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
