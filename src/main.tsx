import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth"; // IMPORT THIS
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AuthProvider> {/* TURN ON THE POWER */}
      <App />
    </AuthProvider>
  </BrowserRouter>
);