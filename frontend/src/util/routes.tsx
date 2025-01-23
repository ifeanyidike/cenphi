import { createBrowserRouter } from "react-router-dom";
import TestimonialsDashboard from "@/pages/TestimonialsDashboard";
import LandingPage from "@/pages/landingpage";
import { Login } from "@/pages/Login";
import { Signup } from "@/pages/SignUp";
import ResetPasswordPage from "@/pages/ResetPassword";
import WhyCenphi from "@/pages/WhyCenphi";
import Pricing from "@/pages/Pricing";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <TestimonialsDashboard />,
  },
  {
    path: "/home",
    element: <LandingPage />,
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
