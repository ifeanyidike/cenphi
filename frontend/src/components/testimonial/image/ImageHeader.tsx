import React from "react";
import { Badge } from "../UI";
import { ImageSquare } from "../UI/icons";
import { Testimonial } from "@/types/testimonial";

interface ImageHeaderProps {
  testimonial: Testimonial;
}

const ImageHeader: React.FC<ImageHeaderProps> = ({ testimonial }) => {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center">
        <Badge
          variant="solid"
          color="info"
          shape="pill"
          icon={<ImageSquare size={14} />}
        >
          Image Testimonial
        </Badge>
        <span className="ml-3 text-sm text-slate-600 dark:text-slate-300">
          From {testimonial.source_data?.name?.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

export default ImageHeader;
