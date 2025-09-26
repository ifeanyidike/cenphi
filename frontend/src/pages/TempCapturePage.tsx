import { DashboardWrapper } from "@/components/dashboard-main/DashboardWrapper";
import { CaptureScreen } from "@/components/onboarding/CaptureScreen";
import { workspaceHub } from "@/repo/workspace_hub";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";

const TempCapturePage = () => {
  const workspaceId = workspaceHub.workspace?.id;
  const navigate = useNavigate();
  return (
    <DashboardWrapper>
      <CaptureScreen
        onTestimonialCreated={() => {
          alert("Testimonial created");
        }}
        onError={(error) => {
          alert(error);
        }}
        workspaceId={workspaceId || ""}
        intent={"agency"}
        onSkip={() => navigate("/dashboard")}
      />
    </DashboardWrapper>
  );
};

export default observer(TempCapturePage);
