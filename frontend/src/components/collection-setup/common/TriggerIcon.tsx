import React from "react";
import { TriggerType } from "@/types/setup";
import {
  ShoppingCart,
  MessageSquare,
  Coffee,
  Edit3,
  Eye,
  Clock,
  Scroll,
  LogOut,
  TextCursor,
} from "lucide-react";

interface TriggerIconProps {
  trigger: TriggerType;
  className?: string;
}

const TriggerIcon: React.FC<TriggerIconProps> = ({ trigger, className }) => {
  const iconMapping: Record<TriggerType, React.ElementType> = {
    purchase: ShoppingCart,
    feedback: MessageSquare,
    support: Coffee,
    custom: Edit3,
    pageview: Eye,
    timeonsite: Clock,
    scrolldepth: Scroll,
    exitintent: LogOut,
    clickelement: TextCursor,
  };

  const IconComponent = iconMapping[trigger];
  return <IconComponent className={className || "h-5 w-5"} />;
};

export default TriggerIcon;
