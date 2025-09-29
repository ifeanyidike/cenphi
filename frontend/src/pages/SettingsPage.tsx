import React from "react";
import SettingsPanel from "@/components/settings/SettingsPanel";
import { DashboardWrapper } from "@/components/dashboard-main/DashboardWrapper";

const SettingsPage: React.FC = () => {
  return (
    <DashboardWrapper>
      <SettingsPanel />
    </DashboardWrapper>
  );
};

export default SettingsPage;
