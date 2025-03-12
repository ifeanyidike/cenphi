import { Navigate, Outlet } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { authStore } from "@/stores/authStore";
import LoadingIndicator from "@/components/LoadingIndicator";
import useGetMember from "@/hooks/use-get-member";
import { useEffect, useState } from "react";
import { workspaceRepo } from "@/repositories/workspaceRepository";
import { Testimonial } from "@/types/testimonial";

const DashboardProtectedRoute = observer(() => {
  const { member, loading: memberLoading } = useGetMember(authStore.loading);
  const [testimonials, setTestimonials] = useState<Testimonial[] | null>(
    workspaceRepo.testimonialManager.testimonials
  );
  const [testimonialLoading, setTestimonialLoading] = useState(false);
  useEffect(() => {
    if (!member || testimonials) return;

    (async () => {
      setTestimonialLoading(true);
      const testimonials =
        await workspaceRepo.testimonialManager.getTestimonials();
      console.log("testimonials", testimonials);
      setTestimonials(testimonials);
      setTestimonialLoading(false);
    })();
  }, [member]);

  if (authStore.loading || memberLoading || testimonialLoading) {
    return <LoadingIndicator />;
  }

  if (member?.workspace_plan && (!member?.workspace_name || !member.industry)) {
    return (
      <Navigate
        to="/onboarding?workflow=onboarding"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  if (!member?.workspace_plan) {
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

export default DashboardProtectedRoute;
