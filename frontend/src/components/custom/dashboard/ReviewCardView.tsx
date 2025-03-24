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
  // // If no testimonials, show empty state
  // if (testimonials.length === 0) {
  //   return (
  //     <div className="text-center py-8 text-gray-500">
  //       <EmptyDashboard/>
  //     </div>
  //   );
  // }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
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