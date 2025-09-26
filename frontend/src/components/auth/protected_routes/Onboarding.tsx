import { Navigate, Outlet, useLocation } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { authStore } from "@/stores/authStore";
import LoadingIndicator from "@/components/LoadingIndicator";
import { workspaceHub } from "@/repo/workspace_hub";
import { useEffect, useState } from "react";
// import useGetMember from "@/hooks/use-get-member";

// const OnboardingProtectedRoute = observer(() => {
//   const location = useLocation();
//   const { member, loading } = useGetMember(authStore.loading);

//   if (authStore.loading || loading) {
//     return <LoadingIndicator />;
//   }

//   if (!member?.workspace_plan) {
//     return (
//       <Navigate
//         to="/pricing?workflow=onboarding"
//         state={{ from: location.pathname }}
//         replace
//       />
//     );
//   }

//   const from = location.pathname + location.search;
//   return authStore.isAuthenticated ? (
//     <Outlet />
//   ) : (
//     <Navigate to="/login" state={{ from }} replace />
//   );
// });

// export default OnboardingProtectedRoute;

// OnboardingProtectedRoute.tsx
const OnboardingProtectedRoute = observer(() => {
  const [userExists, setUserExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const location = useLocation();

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
