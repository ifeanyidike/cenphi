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
import { TawkToWidget } from "./components/TawkToWidget";
import { PostHogProvider } from "posthog-js/react";

const options = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  person_profiles: "always", // Create profiles for all visitors
  capture_pageview: true, // Auto-capture page views
  capture_pageleave: true, // Track when users leave pages
  session_recording: {
    recordCrossOriginIframes: true,
  },
  loaded: (posthog: any) => {
    if (import.meta.env.DEV) {
      console.log("PostHog loaded successfully");
      // Make PostHog available in console for debugging
      (window as any).posthog = posthog;
      console.log("You can now use posthog.capture() in the console");
    }
  },
} as const;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PostHogProvider
      apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
      options={options}
    >
      <HelmetProvider>
        <ProcessingMonitorProvider>
          <RouterProvider router={router}></RouterProvider>
          <App />
          <TawkToWidget />
          <Toaster />
        </ProcessingMonitorProvider>
      </HelmetProvider>
    </PostHogProvider>
  </StrictMode>
);

configure({
  enforceActions: "observed",
  computedRequiresReaction: true,
  reactionRequiresObservable: true,
  observableRequiresReaction: true,
  disableErrorBoundaries: import.meta.env.DEV, // Only disable in development
});
