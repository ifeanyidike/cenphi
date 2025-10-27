// router.tsx
import { createBrowserRouter, Navigate } from "react-router-dom";

import { Login } from "@/pages/Login";
import { Signup } from "@/pages/SignUp";
import ResetPasswordPage from "@/pages/ResetPassword";

import EmailPage from "@/pages/EmailPage";

// Testimonial Collection Process
import CollectionPage from "@/pages/CollectionPage";
import WhyCenphi from "@/pages/WhyCenphi";
import AuthFlow from "@/pages/authflow";

import Checkout from "@/pages/Checkout";
import { lazy } from "react";
import {
  DashboardErrorComponent,
  OnboardingErrorComponent,
  OnboardingLoadingComponent,
} from "@/components/ComponentRegistry";
import ErrorBoundary from "@/components/ErrorBoundary";
import DashboardErrorBoundary from "@/components/DashboardErrorBoundary";
import DashboardProtectedRoute from "@/components/auth/protected_routes/Dashboard";
import GenericProtectedRoute from "@/components/auth/protected_routes/Generic";
import OnboardingProtectedRoute from "@/components/auth/protected_routes/Onboarding";
import AuthPagesProtectedRoute from "@/components/auth/protected_routes/AuthPages";
import BrandGuidePage from "@/pages/BrandGuidePage";
import Studio from "@/pages/Studio";
import TestimonialDetailPage from "@/pages/TestimonialPage";
import TempCapturePage from "@/pages/TempCapturePage";
import AIGeneratedContentPage from "@/pages/AIGeneratedContentPage";
import SettingsPage from "@/pages/SettingsPage";
import Analytics from "@/pages/Analytics";
import TalkToYourDataPage from "@/pages/TalkToYourDataPage";
import VectorStoreTest from "@/pages/VectorStoreTest";
import PublicShareView from "@/pages/PublicShareView";
import DashboardLayout from "@/components/dashboard-main/DashboardLayout";
import TestimonialsDashboard from "@/pages/TestimonialsDashboard";

// lazy load (only for non-dashboard routes)
const LandingPage = lazy(() => import("@/pages/Landing"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const OnboardingPage = lazy(() => import("@/pages/OnboardingPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    element: <DashboardProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            path: "/dashboard",
            element: (
              <DashboardErrorBoundary
                ErrorComponent={DashboardErrorComponent}
                componentName="Dashboard"
              >
                <TestimonialsDashboard />
              </DashboardErrorBoundary>
            ),
          },
          {
            path: "/studio",
            element: (
              <DashboardErrorBoundary
                ErrorComponent={DashboardErrorComponent}
                componentName="Studio"
              >
                <Studio />
              </DashboardErrorBoundary>
            ),
          },
          {
            path: "/studio/optimize",
            element: (
              <DashboardErrorBoundary
                ErrorComponent={DashboardErrorComponent}
                componentName="Studio"
              >
                <Studio />
              </DashboardErrorBoundary>
            ),
          },
          {
            path: "/studio/clipping",
            element: (
              <DashboardErrorBoundary
                ErrorComponent={DashboardErrorComponent}
                componentName="Studio"
              >
                <Studio />
              </DashboardErrorBoundary>
            ),
          },
          {
            path: "/studio/story",
            element: (
              <DashboardErrorBoundary
                ErrorComponent={DashboardErrorComponent}
                componentName="Studio"
              >
                <Studio />
              </DashboardErrorBoundary>
            ),
          },
          {
            path: "/studio/content",
            element: (
              <DashboardErrorBoundary
                ErrorComponent={DashboardErrorComponent}
                componentName="Studio"
              >
                <Studio />
              </DashboardErrorBoundary>
            ),
          },
          {
            path: "/studio/custom",
            element: (
              <DashboardErrorBoundary
                ErrorComponent={DashboardErrorComponent}
                componentName="Studio"
              >
                <Studio />
              </DashboardErrorBoundary>
            ),
          },
          {
            path: "/detail/:testimonialId",
            element: (
              <DashboardErrorBoundary
                ErrorComponent={DashboardErrorComponent}
                componentName="DetailPage"
              >
                <TestimonialDetailPage />
              </DashboardErrorBoundary>
            ),
          },
          {
            path: "/brand-guide",
            element: (
              <DashboardErrorBoundary
                ErrorComponent={DashboardErrorComponent}
                componentName="BrandGuide"
              >
                <BrandGuidePage />
              </DashboardErrorBoundary>
            ),
          },
          {
            path: "/capture-page",
            element: (
              <DashboardErrorBoundary
                ErrorComponent={DashboardErrorComponent}
                componentName="CapturePage"
              >
                <TempCapturePage />
              </DashboardErrorBoundary>
            ),
          },
          {
            path: "/studio/stories",
            element: <Navigate to="/content-hub" replace />,
          },
          {
            path: "/studio/stories/:jobId",
            element: <Navigate to="/content-hub" replace />,
          },
          {
            path: "/content-hub",
            element: (
              <DashboardErrorBoundary
                ErrorComponent={DashboardErrorComponent}
                componentName="AIGeneratedContent"
              >
                <AIGeneratedContentPage />
              </DashboardErrorBoundary>
            ),
          },
          {
            path: "/settings",
            element: (
              <DashboardErrorBoundary
                ErrorComponent={DashboardErrorComponent}
                componentName="Settings"
              >
                <SettingsPage />
              </DashboardErrorBoundary>
            ),
          },
          {
            path: "/analytics",
            element: (
              <DashboardErrorBoundary
                ErrorComponent={DashboardErrorComponent}
                componentName="Analytics"
              >
                <Analytics />
              </DashboardErrorBoundary>
            ),
          },
          {
            path: "/social/analytics",
            element: <Navigate to="/analytics" replace />,
          },
          {
            path: "/talk-to-your-data",
            element: (
              <DashboardErrorBoundary
                ErrorComponent={DashboardErrorComponent}
                componentName="TalkToYourData"
              >
                <TalkToYourDataPage />
              </DashboardErrorBoundary>
            ),
          },
          {
            path: "/vector-store-test",
            element: (
              <DashboardErrorBoundary
                ErrorComponent={DashboardErrorComponent}
                componentName="VectorStoreTest"
              >
                <VectorStoreTest />
              </DashboardErrorBoundary>
            ),
          },
        ], // End of DashboardLayout children
      },
    ], // End of DashboardProtectedRoute children
  },
  {
    element: <OnboardingProtectedRoute />,
    children: [
      {
        path: "/onboarding",
        element: (
          <ErrorBoundary
            ErrorComponent={DashboardErrorComponent}
            LoadingComponent={OnboardingLoadingComponent}
            componentName="Onboarding"
          >
            <OnboardingPage />
          </ErrorBoundary>
        ),
      },
    ],
  },

  {
    element: <GenericProtectedRoute />,
    children: [
      {
        path: "/authflow",
        element: <AuthFlow />,
      },
      {
        path: "/checkout",
        element: (
          <ErrorBoundary
            ErrorComponent={OnboardingErrorComponent}
            LoadingComponent={OnboardingLoadingComponent}
            componentName="Checkout"
          >
            <Checkout />
          </ErrorBoundary>
        ),
      },
    ],
  },

  {
    path: "/why-Cenphi",
    element: <WhyCenphi />,
  },
  {
    path: "/pricing",
    element: <Pricing />,
  },
  {
    path: "/emailpage",
    element: <EmailPage />,
  },
  {
    element: <AuthPagesProtectedRoute />,
    children: [
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/signup",
        element: <Signup />,
      },
      {
        path: "/reset-password",
        element: <ResetPasswordPage />,
      },
    ],
  },

  // Testimonial collection from email links
  {
    path: "/collect",
    element: <CollectionPage />,
  },

  // Public share view (no auth required)
  {
    path: "/share/:shareId/view",
    element: <PublicShareView />,
  },

  {
    // Fallback for any unknown route.
    path: "*",
    element: <NotFoundPage />,
  },
]);
