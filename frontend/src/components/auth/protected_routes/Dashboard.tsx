import { Navigate, Outlet } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { authStore } from "@/stores/authStore";
import LoadingIndicator from "@/components/LoadingIndicator";
import useGetMember from "@/hooks/use-get-member";

const DashboardProtectedRoute = observer(() => {
  const { member, loading: memberLoading } = useGetMember(authStore.loading);
  // const [testimonials, setTestimonials] = useState<Testimonial[] | null>(
  //   workspaceRepo.testimonialManager.testimonials
  // );
  // const [testimonialLoading, setTestimonialLoading] = useState(true);
  // useEffect(() => {
  //   if (!member) return;
  //   if (testimonials) setTestimonialLoading(false);

  //   (async () => {
  //     setTestimonialLoading(true);
  //     const testimonials =
  //       await workspaceRepo.testimonialManager.getTestimonials();
  //     setTestimonials(testimonials);
  //     setTestimonialLoading(false);
  //   })();
  // }, [member]);

  // if (authStore.loading || memberLoading || testimonialLoading) {
  //   return <LoadingIndicator />;
  // }

  if (authStore.loading || memberLoading) {
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
