import { Testimonial } from "@/types/testimonial";

export const getInitials = (review: Testimonial) =>
  review.customer_profile?.name
    ?.split(" ")
    .map((n) => n[0].toUpperCase())
    .join("");
