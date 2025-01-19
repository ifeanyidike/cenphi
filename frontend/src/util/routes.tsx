import { createBrowserRouter } from "react-router-dom";
import TestimonialsDashboard from "@/pages/TestimonialsDashboard";
import { Login } from "@/pages/Login";
import { Signup } from "@/pages/SignUp";
import ResetPasswordPage from "@/pages/ResetPassword";

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
    path: "*",
    element: <Login />,
  },
  {
    path: "/reset-password",
    element: <ResetPasswordPage />,
  },
]);
