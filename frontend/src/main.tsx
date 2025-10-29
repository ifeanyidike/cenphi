import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { configure } from "mobx";

import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import App from "./App";
import { Toaster } from "./components/ui/toaster";
import { HelmetProvider } from "react-helmet-async";
import { ProcessingMonitorProvider } from "./contexts/ProcessingMonitorContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <ProcessingMonitorProvider>
        <RouterProvider router={router}></RouterProvider>
        <App />
        <Toaster />
      </ProcessingMonitorProvider>
    </HelmetProvider>
  </StrictMode>
);

configure({
  enforceActions: "observed",
  computedRequiresReaction: true,
  reactionRequiresObservable: true,
  observableRequiresReaction: true,
  disableErrorBoundaries: import.meta.env.DEV, // Only disable in development
});
