import { Navigate, Outlet } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { authStore } from "@/stores/authStore";
import LoadingIndicator from "../LoadingIndicator";

const ProtectedRoute = observer(() => {
  if (authStore.loading) {
    // return <div>Loading...</div>;
    <LoadingIndicator />;
  }

  return authStore.isAuthenticated ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
});

export default ProtectedRoute;
