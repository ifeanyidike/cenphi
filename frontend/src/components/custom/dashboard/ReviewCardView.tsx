import React from "react";
import { ReviewCard } from "./ReviewCard";
import { Testimonial } from "@/types/testimonial";


interface ReviewCardViewProps {
  testimonials: Testimonial[];
  onReviewAction?: (id: string, action: 'approve' | 'reject' | 'feature' | 'archive') => void;
}

export const ReviewCardView: React.FC<ReviewCardViewProps> = ({ 
  testimonials=[],
  onReviewAction
}) => {
 
  return (
    <div className="flex gap-2 justify-center items-center">
      {testimonials.map((testimonial) => (
        <ReviewCard 
          key={testimonial.id} 
          testimonial={testimonial} 
          onAction={onReviewAction}
        />
      ))}
    </div>
  );
};