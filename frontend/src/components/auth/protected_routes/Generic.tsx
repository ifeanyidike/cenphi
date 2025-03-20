import { Navigate, Outlet } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { authStore } from "@/stores/authStore";
import LoadingIndicator from "@/components/LoadingIndicator";

const GenericProtectedRoute = observer(() => {
  if (authStore.loading) {
    return <LoadingIndicator />;
  }

  return authStore.isAuthenticated ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: location.pathname }} replace />
  );
});

export default GenericProtectedRoute;
