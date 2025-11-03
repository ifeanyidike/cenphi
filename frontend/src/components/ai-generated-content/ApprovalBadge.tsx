// components/ai-generated-content/ApprovalBadge.tsx
import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle, FileEdit } from "lucide-react";

interface ApprovalBadgeProps {
  status: "draft" | "pending" | "approved" | "rejected";
  size?: "sm" | "md";
  className?: string;
}

const ApprovalBadge: React.FC<ApprovalBadgeProps> = ({
  status,
  size = "sm",
  className = "",
}) => {
  const config = {
    draft: {
      icon: FileEdit,
      label: "Draft",
      bgColor: "bg-gray-100",
      textColor: "text-gray-700",
      iconColor: "text-gray-500",
    },
    pending: {
      icon: Clock,
      label: "Pending",
      bgColor: "bg-amber-50",
      textColor: "text-amber-700",
      iconColor: "text-amber-500",
    },
    approved: {
      icon: CheckCircle2,
      label: "Approved",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-700",
      iconColor: "text-emerald-500",
    },
    rejected: {
      icon: XCircle,
      label: "Rejected",
      bgColor: "bg-rose-50",
      textColor: "text-rose-700",
      iconColor: "text-rose-500",
    },
  };

  const { icon: Icon, label, bgColor, textColor, iconColor } = config[status];
  const iconSize = size === "sm" ? 12 : 14;
  const fontSize = size === "sm" ? "text-[10px]" : "text-xs";
  const padding = size === "sm" ? "px-1.5 py-0.5" : "px-2 py-1";

  return (
    <Badge
      variant="secondary"
      className={`${bgColor} ${textColor} ${padding} ${fontSize} font-medium inline-flex items-center gap-1 border-0 ${className}`}
    >
      <Icon size={iconSize} className={iconColor} />
      <span>{label}</span>
    </Badge>
  );
};

export default ApprovalBadge;
