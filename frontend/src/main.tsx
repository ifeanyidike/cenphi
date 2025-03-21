import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { configure } from "mobx";

import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import App from "./App";
import { Toaster } from "./components/ui/toaster";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router}></RouterProvider>
    <App />
    <Toaster />
  </StrictMode>
);

configure({
  enforceActions: "observed",
  computedRequiresReaction: true,
  reactionRequiresObservable: true,
  observableRequiresReaction: true,
  disableErrorBoundaries: true,
});
