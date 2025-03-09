import { ReviewListItem } from "@/components/custom/dashboard/ReviewListItem";
import { Review } from "@/types/types";

export const ReviewListView = ({ reviews }: { reviews: Review[] }) => (
  <div className="space-y-4">
    {reviews.map((review) => (
      <ReviewListItem key={review.id} review={review} />
    ))}
  </div>
);