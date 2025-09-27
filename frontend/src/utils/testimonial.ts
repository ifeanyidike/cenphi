import { Testimonial } from "@/types/testimonial";

export const getInitials = (review: Testimonial) =>
  review.author_name
    ?.split(" ")
    .map((n) => n[0].toUpperCase())
    .join("");
