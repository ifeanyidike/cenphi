import { FileText, PlayCircle, Image } from "lucide-react";

// Animation variants
export const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export const mediaIcons = {
  text: FileText,
  audio: PlayCircle,
  video: PlayCircle,
  image: Image,
};
