import AIStudio from "@/components/ai-studio/Studio";
import { DashboardWrapper } from "@/components/dashboard-main/DashboardWrapper";
import { observer } from "mobx-react-lite";

const AIStudioPage = observer(() => {
  return (
    <DashboardWrapper>
      <AIStudio />
    </DashboardWrapper>
  );
});

export default AIStudioPage;
