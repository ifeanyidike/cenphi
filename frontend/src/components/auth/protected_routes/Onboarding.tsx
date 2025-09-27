import { Navigate, Outlet } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { authStore } from "@/stores/authStore";
import LoadingIndicator from "@/components/LoadingIndicator";
import { workspaceHub } from "@/repo/workspace_hub";
import { useEffect, useState } from "react";

// OnboardingProtectedRoute.tsx
const OnboardingProtectedRoute = observer(() => {
  const [userExists, setUserExists] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if user is in active onboarding flow
  // const isActiveFlow = location.search.includes("flow=active");
  // console.log("is active", isActiveFlow, location.search);

  useEffect(() => {
    const fetchUser = async () => {
      if (!workspaceHub.workspace) {
        setLoading(true);
        const exists = await workspaceHub.checkUserExists();
        setUserExists(!!exists);
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // // If workspace exists AND user is not in active flow, redirect to dashboard
  // if (workspaceHub.workspace && !isActiveFlow) {
  //   return <Navigate to="/dashboard" replace />;
  // }

  if (authStore.loading || loading) return <LoadingIndicator />;
  if (userExists) return <Outlet />;

  return <Navigate to="/login" replace />;
});

export default OnboardingProtectedRoute;
