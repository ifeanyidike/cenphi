import BrandGuide from "@/components/brand-guide";
import { DashboardWrapper } from "@/components/dashboard-main/DashboardWrapper";
import { observer } from "mobx-react-lite";

const BrandGuidePage = () => {
  return (
    <DashboardWrapper>
      <BrandGuide />
    </DashboardWrapper>
  );
};

export default observer(BrandGuidePage);
