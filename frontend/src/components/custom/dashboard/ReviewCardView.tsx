import { ReviewCard } from "./ReviewCard";
import { Review } from "@/types/types";

export const ReviewCardView = ({ reviews }: { reviews: Review[] }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {reviews.map((review) => (
      <ReviewCard key={review.id} review={review} />
    ))}
  </div>
);