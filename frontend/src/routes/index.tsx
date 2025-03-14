// router.tsx
import { createBrowserRouter } from "react-router-dom";

import { Login } from "@/pages/Login";
import { Signup } from "@/pages/SignUp";
import ResetPasswordPage from "@/pages/ResetPassword";

import EmailPage from "@/pages/EmailPage";
import AllReviewsPage from "@/pages/AllReviewsPage";

// Testimonial Collection Process
import TestimonialCollectionLayout from "@/layouts/TestimonialCollectionLayout";
import TestimonialTypeSelection from "@/pages/collection/TypeSelection";
import TestimonialUploads from "@/pages/collection/TestimonialUploads";
import VideoTestimonialRecorder from "@/pages/collection/VideoTestimonialRecorder";
import AudioTestimonialRecorder from "@/pages/collection/AudioTestimonialRecorder";
import TextTestimonialCollection from "@/pages/collection/TextTestimonialCollection";
import MobileTransferPage from "@/pages/collection/MobileTransferPage";
import ThankYouPage from "@/pages/collection/ThankYouPage";
import WhyCenphi from "@/pages/WhyCenphi";
import AuthFlow from "@/pages/authflow";

import { useParams } from "react-router-dom";

import ReviewPage from "@/components/custom/dashboard/ReviewPage";
import Checkout from "@/pages/Checkout";
import { lazy } from "react";
import {
  DashboardErrorComponent,
  OnboardingErrorComponent,
  OnboardingLoadingComponent,
} from "@/components/ComponentRegistry";
import LoadingIndicator from "@/components/LoadingIndicator";
import ErrorBoundary from "@/components/ErrorBoundary";
import OnboardingError from "@/components/onboarding/OnboardingError";
import DashboardProtectedRoute from "@/components/auth/protected_routes/Dashboard";
import GenericProtectedRoute from "@/components/auth/protected_routes/Generic";
import OnboardingProtectedRoute from "@/components/auth/protected_routes/Onboarding";

// lazy load
const LandingPage = lazy(() => import("@/pages/Landing"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const OnboardingPage = lazy(() => import("@/pages/OnboardingPage"));
const TestimonialsDashboard = lazy(
  () => import("@/pages/TestimonialsDashboard")
);
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

const DynamicRecorder = () => {
  // const { type } = useParams<{ type: "video" | "audio" | "text" }>();
  const { type } = useParams() as {
    type?: "video" | "audio" | "image" | "text";
  };
  if (type === "video") {
    return <VideoTestimonialRecorder />;
  } else if (type === "audio") {
    return <AudioTestimonialRecorder />;
  } else {
    // Although the loader should prevent an invalid type from reaching here,
    // we return NotFoundPage as a fallback.
    return <NotFoundPage />;
  }
};

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
    ],
  },
  {
    element: <OnboardingProtectedRoute />,
    children: [
      {
        path: "/onboarding",
        element: (
          <ErrorBoundary
            ErrorComponent={OnboardingError}
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
    path: "/reviewpage",
    element: <ReviewPage />,
  },

  {
    path: "/all-reviewpage",
    element: <AllReviewsPage />,
  },
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

  {
    // Parent route for the testimonial collection process.
    path: "/collection",
    element: <TestimonialCollectionLayout />,
    children: [
      {
        // Starter: choose testimonial type (video, audio, text).
        index: true,
        element: <TestimonialTypeSelection />,
      },
      {
        // Dynamic route: the ":type" segment must be "video", "audio", or "text".
        path: ":type",
        loader: ({ params }) => {
          const allowedTypes = ["video", "audio", "text"];
          if (!params.type || !allowedTypes.includes(params.type)) {
            throw new Response("Not Found", { status: 404 });
          }
          return null;
        },
        errorElement: <NotFoundPage />,
        children: [
          {
            // For recording: conditionally render the proper recorder based on the type.
            path: "record",
            element: <DynamicRecorder />,
          },
          {
            path: "upload",
            element: <TestimonialUploads />,
          },
          {
            index: true,
            element: <TextTestimonialCollection />,
          },
        ],
      },
      {
        // Transfer Flow: if the user needs to switch to mobile.
        path: "transfer",
        children: [
          {
            index: true,
            element: <MobileTransferPage />,
          },
        ],
      },
      {
        path: "thank-you",
        element: <ThankYouPage />,
      },
    ],
  },
  {
    // Fallback for any unknown route.
    path: "*",
    element: <NotFoundPage />,
  },
]);
