import React from "react";
import { motion } from "framer-motion";
import { Badge, Button } from "../UI";
import { Download, Share, Check, Plus } from "../UI/icons";
import { Testimonial } from "@/types/testimonial";
import { workspaceHub } from "@/repo/workspace_hub";

interface ImageFooterProps {
  itemVariants: any;
  testimonial: Testimonial;
  isDarkMode: boolean;
}

const ImageFooter: React.FC<ImageFooterProps> = ({
  itemVariants,
  testimonial,
  isDarkMode,
}) => {
  const imageEditorManager = workspaceHub.imageEditorManager;
  return (
    <motion.div
      variants={itemVariants}
      className={`mt-4 p-4 rounded-lg flex flex-wrap gap-y-3 justify-between items-center ${
        isDarkMode ? "bg-slate-800" : "bg-slate-50"
      }`}
    >
      <div className="flex flex-wrap gap-2">
        <Badge
          variant="soft"
          color="info"
          size="xs"
          shape="pill"
          icon={<Plus size={12} />}
        >
          Created: {new Date(testimonial.created_at).toLocaleDateString()}
        </Badge>

        <Badge
          variant="soft"
          color="success"
          size="xs"
          shape="pill"
          icon={<Check size={12} />}
        >
          {testimonial.source_data?.verified ? "Verified" : "Unverified"}
        </Badge>

        {testimonial.source_data?.featured && (
          <Badge
            variant="soft"
            color="accent"
            size="xs"
            shape="pill"
            icon={
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            }
          >
            Featured
          </Badge>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          size="sm"
          icon={<Share size={14} />}
          className={
            isDarkMode
              ? "border-slate-700 text-slate-300 hover:bg-slate-800"
              : ""
          }
        >
          Share
        </Button>

        <Button
          variant="outline"
          size="sm"
          icon={<Download size={14} />}
          onClick={async () => {
            const blob = await imageEditorManager.saveImage();
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `testimonial-${testimonial.id}.jpg`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }
          }}
          className={
            isDarkMode
              ? "border-slate-700 text-slate-300 hover:bg-slate-800"
              : ""
          }
        >
          Download
        </Button>

        <Button
          variant="primary"
          size="sm"
          icon={<Check size={14} />}
          onClick={() => imageEditorManager.applyAdjustments()}
          className="min-w-[120px]"
        >
          Save Changes
        </Button>
      </div>
    </motion.div>
  );
};

export default ImageFooter;
