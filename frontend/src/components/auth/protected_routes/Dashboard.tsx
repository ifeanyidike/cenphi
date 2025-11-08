import JobSystemProvider from "@/components/job-system/JobSystemProvider";
import LoadingIndicator from "@/components/LoadingIndicator";
import { GlobalProcessingMonitor } from "@/components/common/GlobalProcessingMonitor";
import { workspaceHub } from "@/repo/workspace_hub";
import { authStore } from "@/stores/authStore";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const DashboardProtectedRoute = observer(() => {
  const location = useLocation();
  // Start with false if workspace already exists, true otherwise
  const [isCheckingWorkspace, setIsCheckingWorkspace] = useState(
    !workspaceHub.workspace?.id
  );

  useEffect(() => {
    let isMounted = true;

    const checkWorkspace = async () => {
      console.log("[DashboardProtectedRoute] Checking workspace...", {
        authLoading: authStore.loading,
        isAuthenticated: authStore.isAuthenticated,
        workspaceId: workspaceHub.workspace?.id,
        location: location.pathname,
      });

      // Don't check if auth is still loading
      if (authStore.loading) {
        console.log("[DashboardProtectedRoute] Auth still loading, skipping");
        return;
      }

      // Don't check if not authenticated
      if (!authStore.isAuthenticated) {
        console.log("[DashboardProtectedRoute] Not authenticated");
        if (isMounted) setIsCheckingWorkspace(false);
        return;
      }

      // Workspace already loaded in hub - no need to fetch
      if (workspaceHub.workspace?.id) {
        console.log(
          "[DashboardProtectedRoute] ✅ Workspace already loaded:",
          workspaceHub.workspace.id
        );
        if (isMounted) setIsCheckingWorkspace(false);
        return;
      }

      // Fetch workspace data (this call is cached in workspaceHub)
      console.log("[DashboardProtectedRoute] 🔄 Fetching workspace data...");
      try {
        await workspaceHub.getWorkspaceData();
        console.log(
          "[DashboardProtectedRoute] ✅ Workspace fetched:",
          workspaceHub.workspace?.id
        );
      } finally {
        if (isMounted) setIsCheckingWorkspace(false);
      }
    };

    checkWorkspace();

    return () => {
      isMounted = false;
    };
  }, [authStore.loading, authStore.isAuthenticated]);

  // Show loading while auth is initializing
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

  // Redirect to login if not authenticated
  if (!authStore.isAuthenticated) {
    const from = location.pathname + location.search;
    return <Navigate to="/login" state={{ from }} replace />;
  }

  // Authenticated but email not verified → redirect to verification page
  if (authStore.user && !authStore.user.emailVerified) {
    return <Navigate to="/verify-email-pending" replace />;
  }

  // Show loading while checking workspace (only on initial check)
  if (isCheckingWorkspace) {
    return (
      <LoadingIndicator
        title="Loading workspace"
        message="Setting up your dashboard"
      />
    );
  }

  // Redirect to onboarding ONLY if no workspace exists after checking
  // The workspace observable from MobX is the single source of truth
  if (!workspaceHub.workspace?.id) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <JobSystemProvider>
      <Outlet />
      <GlobalProcessingMonitor />
    </JobSystemProvider>
  );
});

export default DashboardProtectedRoute;
