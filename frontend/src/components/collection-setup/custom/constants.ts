import { motion } from "framer-motion";

// Animation variants
export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// Standard field options for the form
export const standardFieldOptions = [
  {
    id: "name",
    label: "Full Name",
    type: "text" as const,
    required: true,
  },
  {
    id: "email",
    label: "Email Address",
    type: "email" as const,
    required: true,
  },
  {
    id: "company",
    label: "Company",
    type: "text" as const,
    required: false,
  },
  {
    id: "position",
    label: "Job Title",
    type: "text" as const,
    required: false,
  },
  {
    id: "phone",
    label: "Phone Number",
    type: "tel" as const,
    required: false,
  },
  {
    id: "website",
    label: "Website",
    type: "url" as const,
    required: false,
  },
  {
    id: "location",
    label: "Location",
    type: "text" as const,
    required: false,
  },
  {
    id: "rating",
    label: "Rating",
    type: "select" as const,
    required: false,
    options: ["1", "2", "3", "4", "5"],
  },
  {
    id: "testimonial",
    label: "Testimonial",
    type: "textarea" as const,
    required: true,
  },
];
