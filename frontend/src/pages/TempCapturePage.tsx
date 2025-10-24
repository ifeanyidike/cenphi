import { CaptureScreen } from "@/components/onboarding/CaptureScreen";
import { workspaceHub } from "@/repo/workspace_hub";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";

const TempCapturePage = () => {
  const workspaceId = workspaceHub.workspace?.id;
  const navigate = useNavigate();
  return (
      <CaptureScreen
        onTestimonialCreated={() => {
          alert("Testimonial created");
        }}
        workspaceId={workspaceId || ""}
        intent={"agency"}
        onSkip={() => navigate("/dashboard")}
      />
  );
};

export default observer(TempCapturePage);
