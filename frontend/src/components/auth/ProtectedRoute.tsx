import { Navigate, Outlet } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { authStore } from "@/stores/authStore";

const ProtectedRoute = observer(() => {
  if (authStore.loading) {
    return <div>Loading...</div>;
  }

  return authStore.isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
});

export default ProtectedRoute;
