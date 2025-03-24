import React from "react";
import { ReviewListItem } from "./ReviewListItem";
import { Testimonial } from "@/types/testimonial";
import { motion } from "framer-motion";

interface ReviewsListProps {
  testimonials: Testimonial[];
  onReviewAction?: (id: string, action: 'approve' | 'reject' | 'feature' | 'archive') => void;
}

export const ReviewListView: React.FC<ReviewsListProps> = ({ testimonials }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {testimonials.map((testimonial, index) => (
        <motion.div
          key={testimonial.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: index * 0.03 }}
        >
          <ReviewListItem testimonial={testimonial as any} />
        </motion.div>
      ))}
    </div>
  );
};
