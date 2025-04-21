import { Navigate, Outlet, useLocation } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { authStore } from "@/stores/authStore";
import LoadingIndicator from "@/components/LoadingIndicator";
import useGetMember from "@/hooks/use-get-member";

const OnboardingProtectedRoute = observer(() => {
  const location = useLocation();
  const { member, loading } = useGetMember(authStore.loading);

  if (authStore.loading || loading) {
    return <LoadingIndicator />;
  }

  if (!member?.workspace_plan) {
    return (
      <Navigate
        to="/pricing?workflow=onboarding"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  const from = location.pathname + location.search;
  return authStore.isAuthenticated ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from }} replace />
  );
});

export default OnboardingProtectedRoute;
