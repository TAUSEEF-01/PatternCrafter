import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { LabelingProvider } from "./context/LabelingContext.jsx";
import { LabelingWorkspace } from "./pages/LabelingWorkspace.jsx";
import { SummaryPage } from "./pages/SummaryPage.jsx";

function App() {
  return (
    <BrowserRouter basename={import.meta.env.VITE_BASE_PATH || "/"}>
      <LabelingProvider>
        <div className="app-root">
          <Routes>
            <Route path="/" element={<LabelingWorkspace />} />
            <Route path="/summary" element={<SummaryPage />} />
            <Route path="*" element={<LabelingWorkspace />} />
          </Routes>
        </div>
      </LabelingProvider>
    </BrowserRouter>
  );
}

export default App;
