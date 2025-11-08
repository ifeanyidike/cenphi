import { Navigate, Outlet } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { authStore } from "@/stores/authStore";
import LoadingIndicator from "@/components/LoadingIndicator";

// OnboardingProtectedRoute.tsx
const OnboardingProtectedRoute = observer(() => {
  if (authStore.loading) {
    return (
      <LoadingIndicator
        title="Authenticating"
        message="Verifying your credentials"
        variant="minimal"
        showProgress={false}
      />
    );
  }

  // Not authenticated → redirect to login
  if (!authStore.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated but email not verified → redirect to verification page
  if (authStore.user && !authStore.user.emailVerified) {
    return <Navigate to="/verify-email-pending" replace />;
  }

  // Email verified → allow access to onboarding
  // The Onboarding component itself will handle checking if workspace exists
  // and redirect to dashboard if needed
  return <Outlet />;
});

export default OnboardingProtectedRoute;
