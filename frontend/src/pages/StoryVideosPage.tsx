import StoryVideos from "@/components/ai-studio/stories/StoryVideos";
import { DashboardWrapper } from "@/components/dashboard-main/DashboardWrapper";
import { observer } from "mobx-react-lite";

const StoryVideosPage = observer(() => {
  return (
    <DashboardWrapper>
      <StoryVideos />
    </DashboardWrapper>
  );
});

export default StoryVideosPage;
