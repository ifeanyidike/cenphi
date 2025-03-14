import React from "react";
import { ReviewListItem } from "./ReviewListItem";
import { Review } from "@/types/types";
import { motion } from "framer-motion";

interface ReviewsListProps {
  reviews: Review[];
}

export const ReviewListView: React.FC<ReviewsListProps> = ({ reviews }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {reviews.map((review, index) => (
        <motion.div
          key={review.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: index * 0.03 }}
        >
          <ReviewListItem review={review as any} />
        </motion.div>
      ))}
    </div>
  );
};
