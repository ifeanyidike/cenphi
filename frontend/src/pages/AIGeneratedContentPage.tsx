import AIGeneratedContent from "@/components/ai-generated-content/AIGeneratedContent";
import { DashboardWrapper } from "@/components/dashboard-main/DashboardWrapper";
import React from "react";

const AIGeneratedContentPage: React.FC = () => {
  return (
    <DashboardWrapper>
      <AIGeneratedContent />
    </DashboardWrapper>
  );
};

export default AIGeneratedContentPage;
