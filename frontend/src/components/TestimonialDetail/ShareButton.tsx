// components/TestimonialDetail/ShareButton.tsx
import React, { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import SocialSharingModal from "./SocialSharingModal";

interface ShareButtonProps {
  testimonialId?: string;
  testimonialIds?: string[];
  content?: string;
  artifactType?: string;
  videoUrl?: string;
  imageUrls?: string[];
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({
  testimonialId,
  testimonialIds,
  content = "",
  artifactType = "text",
  videoUrl,
  imageUrls = [],
  variant = "outline",
  size = "sm",
  className = "",
}) => {
  const [showSharingModal, setShowSharingModal] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowSharingModal(true)}
        className={`${className}`}
      >
        <Share2 className="h-4 w-4 mr-2" />
        Share
      </Button>

      <SocialSharingModal
        isOpen={showSharingModal}
        onClose={() => setShowSharingModal(false)}
        testimonialId={testimonialId}
        testimonialIds={testimonialIds}
        artifactContent={content}
        artifactType={artifactType}
        videoUrl={videoUrl}
        imageUrls={imageUrls}
      />
    </>
  );
};

export default ShareButton;