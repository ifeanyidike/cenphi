// router.tsx
import { createBrowserRouter } from "react-router-dom";

import TestimonialsDashboard from "@/pages/TestimonialsDashboard";
import { Login } from "@/pages/Login";
import { Signup } from "@/pages/SignUp";
import ResetPasswordPage from "@/pages/ResetPassword";
import NotFoundPage from "@/pages/NotFoundPage";

// Testimonial Collection Process
import TestimonialCollectionLayout from "@/layouts/TestimonialCollectionLayout";
import TestimonialTypeSelection from "@/pages/collection/TypeSelection";
import TestimonialCollection from "@/pages/TestimonialCollection";
import TestimonialUploads from "@/pages/collection/TestimonialUploads";
import VideoTestimonialRecorder from "@/pages/collection/VideoTestimonialRecorder";
import AudioTestimonialRecorder from "@/pages/collection/AudioTestimonialRecorder";
import TextTestimonialCollection from "@/pages/collection/TextTestimonialCollection";
import MobileTransferPage from "@/pages/collection/MobileTransferPage";
import ThankYouPage from "@/pages/collection/ThankYouPage";

import { useParams } from "react-router-dom";

// A dynamic component to choose the correct recorder based on the URL parameter.
const DynamicRecorder = () => {
  const { type } = useParams<{ type: "video" | "audio" | "text" }>();
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
    element: <TestimonialsDashboard />,
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
    path: "/flow",
    element: <TestimonialCollection />,
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
