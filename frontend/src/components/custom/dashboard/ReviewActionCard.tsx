// AIActionsCard.tsx
import { Bot, Brain, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../ui/card";
import { ActionButton } from "./ActionButton";
import { ActionItem } from "@/types/types";

export const AIActionsCard = () => {
  const actions: ActionItem[] = [
    {
      label: "Generate Response",
      icon: Bot,
      color: "text-green-600",
      description: "AI-crafted reply",
    },
    {
      label: "Analyze Sentiment",
      icon: Brain,
      color: "text-blue-600",
      description: "Emotion detection",
    },
    {
      label: "Summarize Reviews",
      icon: FileText,
      color: "text-purple-600",
      description: "Key points extraction",
    },
  ];

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="p-6">
        <CardTitle className="text-lg font-semibold">
          AI Powered Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-2">
          {actions.map((action) => (
            <ActionButton key={action.label} action={action} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};