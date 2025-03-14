import { Navigate, Outlet } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { authStore } from "@/stores/authStore";
import LoadingIndicator from "../LoadingIndicator";
import { useEffect, useState } from "react";
import { auth } from "@/config/firebase";
import { MemberDataParams } from "@/types/member";
import { workspaceRepo } from "@/repositories/WorkspaceRepo";

const ProtectedRoute = observer(() => {
  const dashboardRoute = location.pathname.includes("dashboard");
  const [dashboardLoading, setDashboardLoading] = useState(!!dashboardRoute);
  const [member, setMember] = useState<MemberDataParams | null>(null);

  useEffect(() => {
    if (location.pathname.includes("dashboard")) {
      (async () => {
        setDashboardLoading(true);
        const uid = auth.currentUser?.uid;
        if (uid) {
          const member = await workspaceRepo.membersManager.getUser(uid);
          setMember(member);
        }
        setDashboardLoading(false);
      })();
    }
  }, []);

  if (authStore.loading || dashboardLoading) {
    return <LoadingIndicator />;
  }

  if (
    dashboardRoute &&
    member?.workspace_plan &&
    (!member?.workspace_name || !member.industry)
  ) {
    return (
      <Navigate
        to="/onboarding?workflow=onboarding"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  if (dashboardRoute && !member?.workspace_plan) {
    return (
      <Navigate
        to="/pricing?workflow=onboarding"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  return authStore.isAuthenticated ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: location.pathname }} replace />
  );
});

export default ProtectedRoute;
