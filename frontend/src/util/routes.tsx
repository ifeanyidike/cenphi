import { createBrowserRouter } from "react-router-dom";
import TestimonialsDashboard from "../pages/TestimonialsDashboard";
import TestimonialsDashboard2 from "@/pages/TestimonialsDashboard2";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <TestimonialsDashboard />,
  },
  {
    path: "/dash",
    element: <TestimonialsDashboard2 />,
  },
]);
