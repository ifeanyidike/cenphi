// router.tsx
import { createBrowserRouter } from "react-router-dom";

import { Login } from "@/pages/Login";
import { Signup } from "@/pages/SignUp";
import ResetPasswordPage from "@/pages/ResetPassword";
import Pending from "@/pages/Pending";
import Approved from "@/pages/Approved";
import Rejected from "@/pages/Rejected";

import EmailPage from "@/pages/EmailPage";
import AllReviewsPage from "@/pages/AllReviewsPage";

// Testimonial Collection Process
import TestimonialCollectionLayout from "@/layouts/TestimonialCollectionLayout";
import TestimonialTypeSelection from "@/pages/collection/TypeSelection";
import TestimonialUploads from "@/pages/collection/TestimonialUploads";
import VideoTestimonialRecorder from "@/pages/collection/VideoTestimonialRecorder";
import TextTestimonialCollection from "@/pages/collection/TextTestimonialCollection";
import MobileTransferPage from "@/pages/collection/MobileTransferPage";
import ThankYouPage from "@/pages/collection/ThankYouPage";
import WhyCenphi from "@/pages/WhyCenphi";
import AuthFlow from "@/pages/authflow";
import OAuthSuccess from "@/pages/OAuthSuccess";


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
import { ViewPendingReview } from "@/pages/ViewPendingDetail";
import Sentiment from "@/pages/Sentiment";
// import TestimonialCollectionSettingsPage from "@/pages/TestimonialCollectionSettingsPage";
import BrandGuidePage from "@/pages/BrandGuidePage";
import TestimonialPage from "@/pages/TestimonialPage";
import AIServiceTester from "@/pages/AIServiceTester";
import Tester from "@/pages/PageTester";
import SettingsPageWrapper from "@/pages/SettingsPageWrapper";
import GoogleDrivePageWrapper from "@/pages/GoogleDrivePageWrapper";
import LinkedInShareTest from "@/pages/LinkedInShareTest";
import LinkedInReadyPageWrapper from "@/pages/LinkedInReadyPageWrapper";
import TestConnectionStatus from "@/pages/TestConnectionStatus";

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
    type?: "video" | "image" | "text";
  };
  if (type === "video") {
    return <VideoTestimonialRecorder />;
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
  { element: <BrandGuidePage />, path: "/brand-guide" },
  { element: <AIServiceTester />, path: "/ai-tests" },
  { element: <Tester />, path: "/tester" },
  { element: <TestConnectionStatus />, path: "/test-connection" },
  {
    element: <DashboardProtectedRoute />,
    children: [
      // {
      //   path: "/dashboard",
      //   element: (
      //     <ErrorBoundary
      //       ErrorComponent={DashboardErrorComponent}
      //       LoadingComponent={LoadingIndicator}
      //       componentName="Dashboard"
      //     >
      //       <TestimonialsDashboard />
      //     </ErrorBoundary>
      //   ),
      // },
      {
        path: "/testimonial/detail/:id",
        element: (
          <ErrorBoundary
            ErrorComponent={DashboardErrorComponent}
            LoadingComponent={LoadingIndicator}
            componentName="TestimonialPage"
          >
            <TestimonialPage />
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
    path: "/about",
    element: <WhyCenphi />,
  },
  // {
  //   element: <DashboardProtectedRoute />,
  //   children: [
  //     {
  //       path: "/dashboard",
  //       element: (
  //         <ErrorBoundary
  //           ErrorComponent={DashboardErrorComponent}
  //           LoadingComponent={LoadingIndicator}
  //           componentName="Dashboard"
  //         >
  //           <TestimonialsDashboard />
  //         </ErrorBoundary>
  //       ),
  //     },
  //     {
  //       path: "/settings",
  //       element: (
  //         <ErrorBoundary
  //           ErrorComponent={DashboardErrorComponent}
  //           LoadingComponent={LoadingIndicator}
  //           componentName="Settings"
  //         >
  //           <SettingsPageWrapper />
  //         </ErrorBoundary>
  //       ),
  //     },
  //     {
  //       path: "/google-drive",
  //       element: (
  //         <ErrorBoundary
  //           ErrorComponent={DashboardErrorComponent}
  //           LoadingComponent={LoadingIndicator}
  //           componentName="GoogleDrive"
  //         >
  //           <GoogleDrivePageWrapper />
  //         </ErrorBoundary>
  //       ),
  //     },
  //   ],
  // },

   {
   path: "/dashboard",
    element:    <TestimonialsDashboard />
  },

 {
   path: "/settings",
    element:   <SettingsPageWrapper />,
  },

 {
    path: "/google-drive",
    element:  <GoogleDrivePageWrapper />,
  },

  {
    path: "/pending_detail",
    element: <ViewPendingReview />,
  },

  {
    path: "/pending",
    element: <Pending />,
  },

  {
    path: "/sentiment",
element:   <Sentiment/>
  },
  {
    path: "/rejected",
    element: <Rejected />,
  },

  {
    path: "/approved",
    element: <Approved />,
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
    path: "/review",
    element: <ReviewPage />,
  },

  {
    path: "/reviews",
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
    path: "/oauth/success",
    element: <OAuthSuccess />,
  },
  {
    path: "/linkedin-test",
    element: <LinkedInShareTest />,
  },
  {
    path: "/linkedin-ready",
    element: <LinkedInReadyPageWrapper />,
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
        // Dynamic route: the ":type" segment must be "video" or "text".
        path: ":type",
        loader: ({ params }: { params: { type?: string } }) => {
          const allowedTypes = ["video", "text"];
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
