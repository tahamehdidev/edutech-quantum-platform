import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ErrorBoundary } from "./components/layouts/ErrorBoundary.jsx";
import { App } from "./App.jsx";
import { initSentry } from "./utils/sentry.js";
import "./styles/tokens.css";
import "./styles/global.css";

initSentry();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
