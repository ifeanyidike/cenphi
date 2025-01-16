import { createBrowserRouter } from "react-router-dom";
import TestimonialsDashboard from "@/pages/TestimonialsDashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <TestimonialsDashboard />,
  },
]);
