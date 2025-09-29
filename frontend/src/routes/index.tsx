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
import LoadingIndicator from "@/components/LoadingIndicator";
import ErrorBoundary from "@/components/ErrorBoundary";
import DashboardProtectedRoute from "@/components/auth/protected_routes/Dashboard";
import GenericProtectedRoute from "@/components/auth/protected_routes/Generic";
import OnboardingProtectedRoute from "@/components/auth/protected_routes/Onboarding";
import AuthPagesProtectedRoute from "@/components/auth/protected_routes/AuthPages";
import BrandGuidePage from "@/pages/BrandGuidePage";
// import AIServiceTester from "@/pages/AIServiceTester";
// import Tester from "@/pages/PageTester";
import AIStudioPage from "@/pages/aistudio";
import TestimonialDetailPage from "@/pages/TestimonialPage";
import TempCapturePage from "@/pages/TempCapturePage";
import AIGeneratedContentPage from "@/pages/AIGeneratedContentPage";
import SettingsPage from "@/pages/SettingsPage";
import SocialAnalytics from "@/pages/SocialAnalytics";

// lazy load
const LandingPage = lazy(() => import("@/pages/Landing"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const OnboardingPage = lazy(() => import("@/pages/OnboardingPage"));
const TestimonialsDashboard = lazy(
  () => import("@/pages/TestimonialsDashboard")
);
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
        path: "/dashboard",
        element: (
          <ErrorBoundary
            ErrorComponent={DashboardErrorComponent}
            LoadingComponent={LoadingIndicator}
            componentName="Dashboard"
          >
            <TestimonialsDashboard />
          </ErrorBoundary>
        ),
      },
      {
        path: "/studio",
        element: (
          <ErrorBoundary
            ErrorComponent={DashboardErrorComponent}
            LoadingComponent={LoadingIndicator}
            componentName="Studio"
          >
            <AIStudioPage />
          </ErrorBoundary>
        ),
      },
      {
        path: "/detail/:testimonialId",
        element: (
          <ErrorBoundary
            ErrorComponent={DashboardErrorComponent}
            LoadingComponent={LoadingIndicator}
            componentName="DetailPage"
          >
            <TestimonialDetailPage />
          </ErrorBoundary>
        ),
      },
      {
        path: "/brand-guide",
        element: (
          <ErrorBoundary
            ErrorComponent={DashboardErrorComponent}
            LoadingComponent={LoadingIndicator}
            componentName="BrandGuide"
          >
            <BrandGuidePage />
          </ErrorBoundary>
        ),
      },
      {
        path: "/capture-page",
        element: (
          <ErrorBoundary
            ErrorComponent={DashboardErrorComponent}
            LoadingComponent={LoadingIndicator}
            componentName="CapturePage"
          >
            <TempCapturePage />
          </ErrorBoundary>
        ),
      },
      {
        path: "/studio/stories",
        element: <Navigate to="/ai-content" replace />,
      },
      {
        path: "/studio/stories/:jobId",
        element: <Navigate to="/ai-content" replace />,
      },
      {
        path: "/ai-content",
        element: (
          <ErrorBoundary
            ErrorComponent={DashboardErrorComponent}
            LoadingComponent={LoadingIndicator}
            componentName="AIGeneratedContent"
          >
            <AIGeneratedContentPage />
          </ErrorBoundary>
        ),
      },
      {
        path: "/settings",
        element: (
          <ErrorBoundary
            ErrorComponent={DashboardErrorComponent}
            LoadingComponent={LoadingIndicator}
            componentName="Settings"
          >
            <SettingsPage />
          </ErrorBoundary>
        ),
      },
      {
        path: "/social/analytics",
        element: (
          <ErrorBoundary
            ErrorComponent={DashboardErrorComponent}
            LoadingComponent={LoadingIndicator}
            componentName="SocialAnalytics"
          >
            <SocialAnalytics />
          </ErrorBoundary>
        ),
      },
    ],
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

  {
    // Fallback for any unknown route.
    path: "*",
    element: <NotFoundPage />,
  },
]);
