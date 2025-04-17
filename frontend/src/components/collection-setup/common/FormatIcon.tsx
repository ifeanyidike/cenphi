import React from "react";
import { TestimonialFormat } from "@/types/setup";
import { Video, Mic, Type, Image as ImageIcon } from "lucide-react";

interface FormatIconProps {
  format: TestimonialFormat;
  className?: string;
}

const FormatIcon: React.FC<FormatIconProps> = ({ format, className }) => {
  const iconMapping = {
    video: Video,
    audio: Mic,
    text: Type,
    image: ImageIcon,
  };

  const IconComponent = iconMapping[format];
  return <IconComponent className={className || "h-5 w-5"} />;
};

export default FormatIcon;
