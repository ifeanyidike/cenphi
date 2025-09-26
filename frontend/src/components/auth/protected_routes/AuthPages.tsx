import LoadingIndicator from "@/components/LoadingIndicator";
import { authStore } from "@/stores/authStore";
import { observer } from "mobx-react-lite";
import { Navigate, Outlet } from "react-router-dom";

const AuthPagesProtectedRoute = observer(() => {
  // Show loading while auth state is being determined
  if (authStore.loading) {
    return <LoadingIndicator />;
  }

  // If user is authenticated, redirect to dashboard
  if (authStore.isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // If user is not authenticated, allow access to auth pages
  return <Outlet />;
});

export default AuthPagesProtectedRoute;