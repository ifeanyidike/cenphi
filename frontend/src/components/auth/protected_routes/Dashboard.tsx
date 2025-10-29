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
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [workspaceLoaded, setWorkspaceLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchWorkspace = async () => {
      if (!isMounted) return;

      // Don't fetch if auth is still loading
      if (authStore.loading) {
        return;
      }

      // Don't fetch if not authenticated
      if (!authStore.isAuthenticated) {
        return;
      }

      setLoadingWorkspace(true);
      // Only fetch if we don't already have workspace data
      if (!workspaceHub.workspace?.id) {
        const loaded = await workspaceHub.getWorkspaceData();
        if (isMounted) {
          setWorkspaceLoaded(!!loaded);
          setLoadingWorkspace(false);
        }
      } else {
        // Workspace already loaded
        if (isMounted) {
          setWorkspaceLoaded(true);
          setLoadingWorkspace(false);
        }
      }
    };

    fetchWorkspace();

    return () => {
      isMounted = false;
    };
  }, [authStore.loading, authStore.isAuthenticated]);

  // Show loading while auth is initializing
  if (authStore.loading) {
    return <LoadingIndicator />;
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

  // Show loading while checking workspace
  if (loadingWorkspace) {
    return <LoadingIndicator />;
  }

  // Redirect to onboarding if no workspace
  if (!workspaceHub.workspace?.id && !workspaceLoaded) {
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
