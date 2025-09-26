import { DashboardWrapper } from "@/components/dashboard-main/DashboardWrapper";
import TestimonialDetail from "@/components/TestimonialDetail";
import { observer } from "mobx-react-lite";

const TestimonialPage = observer(() => {
  return (
    <DashboardWrapper>
      <TestimonialDetail />
    </DashboardWrapper>
  );
});

export default TestimonialPage;
