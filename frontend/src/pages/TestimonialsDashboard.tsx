import DashboardView from "@/components/dashboard-landing/DashboardView";
import { DashboardWrapper } from "@/components/dashboard-main/DashboardWrapper";
import { observer } from "mobx-react-lite";

const TestimonialsDashboard = observer(() => {
  return (
    <DashboardWrapper>
      <DashboardView />
    </DashboardWrapper>
  );
});

export default TestimonialsDashboard;
