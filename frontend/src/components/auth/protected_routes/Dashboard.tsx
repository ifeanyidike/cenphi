import { Navigate, Outlet, useLocation } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { authStore } from "@/stores/authStore";
import LoadingIndicator from "@/components/LoadingIndicator";
import useGetMember from "@/hooks/use-get-member";

const DashboardProtectedRoute = observer(() => {
  const location = useLocation();

  // Check if we're coming from the onboarding page to prevent redirect loops
  const isFromOnboarding = location.state?.from?.includes("onboarding");

  const { member, loading: memberLoading } = useGetMember(authStore.loading);

  if (authStore.loading || memberLoading) {
    return <LoadingIndicator />;
  }

  if (!authStore.isAuthenticated) {
    const from = location.pathname + location.search;
    return <Navigate to="/login" state={{ from }} replace />;
  }

  if (
    member?.workspace_plan &&
    (!member?.workspace_name || !member.industry) &&
    !isFromOnboarding
  ) {
    console.log("Redirecting to onboarding - incomplete profile", member);
    return (
      <Navigate
        to="/onboarding?workflow=onboarding"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  if (!member?.workspace_plan && !isFromOnboarding) {
    // Log the redirection for debugging
    console.log("Redirecting to pricing - no plan", member);
    return (
      <Navigate
        to="/pricing?workflow=onboarding"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // If we made it here, allow access to dashboard routes
  return <Outlet />;
});

export default DashboardProtectedRoute;
