import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; // Add this
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter> {/* Wrap App in this */}
    <App />
  </BrowserRouter>
);