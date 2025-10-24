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
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);
  const [workspaceLoaded, setWorkspaceLoaded] = useState(false);

  useEffect(() => {
    const fetchWorkspace = async () => {
      setLoadingWorkspace(true);
      if (!workspaceHub.workspace) {
        const loaded = await workspaceHub.getWorkspaceData();
        setWorkspaceLoaded(!!loaded);
      }
      setLoadingWorkspace(false);
    };
    fetchWorkspace();
  }, []);

  if (loadingWorkspace) return <LoadingIndicator />;

  if (!workspaceHub.workspace?.id && !workspaceLoaded) {
    return <Navigate to="/onboarding" replace />;
  }

  if (!authStore.loading && !authStore.isAuthenticated) {
    const from = location.pathname + location.search;
    return <Navigate to="/login" state={{ from }} replace />;
  }

  if (authStore.loading) {
    return <LoadingIndicator />;
  }

  return (
    <JobSystemProvider>
      <Outlet />
      <GlobalProcessingMonitor />
    </JobSystemProvider>
  );
});

export default DashboardProtectedRoute;
