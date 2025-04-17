import React from "react";
import { CollectionMethod } from "@/types/setup";
import { Globe, Mail, MessageSquare, Share2, Layout } from "lucide-react";

interface MethodIconProps {
  method: CollectionMethod;
  className?: string;
}

const MethodIcon: React.FC<MethodIconProps> = ({ method, className }) => {
  const iconMapping = {
    website: Globe,
    email: Mail,
    chat: MessageSquare,
    social: Share2,
    custom: Layout,
  };

  const IconComponent = iconMapping[method];
  return <IconComponent className={className || "h-5 w-5"} />;
};

export default MethodIcon;
