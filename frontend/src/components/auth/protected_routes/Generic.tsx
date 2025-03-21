import { Navigate, Outlet, useLocation } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { authStore } from "@/stores/authStore";
import LoadingIndicator from "@/components/LoadingIndicator";

const GenericProtectedRoute = observer(() => {
  const location = useLocation();

  if (authStore.loading) {
    return <LoadingIndicator />;
  }

  const from = { pathname: location.pathname, search: location.search };
  return authStore.isAuthenticated ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from }} replace />
  );
});

export default GenericProtectedRoute;
