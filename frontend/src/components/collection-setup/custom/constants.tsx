import {
  Briefcase,
  Building,
  FormInput,
  Globe,
  Layers,
  LayoutGrid,
  List,
  Mail,
  MapPin,
  MessageSquare,
  PanelRight,
  User,
} from "lucide-react";

// Templates for common field types
export const fieldTemplateOptions = [
  {
    id: "customer_feedback",
    name: "Customer Feedback",
    description: "Common fields for collecting customer feedback",
    fields: [
      { name: "rating", label: "Rating (1-5)", type: "number", required: true },
      {
        name: "feedback_type",
        label: "Feedback Type",
        type: "select",
        required: true,
      },
      {
        name: "improvement_suggestions",
        label: "Suggestions for Improvement",
        type: "textarea",
        required: false,
      },
    ],
  },
  {
    id: "product_review",
    name: "Product Review",
    description: "Fields specific to product reviews",
    fields: [
      {
        name: "product_name",
        label: "Product Name",
        type: "text",
        required: true,
      },
      {
        name: "purchase_date",
        label: "Date of Purchase",
        type: "date",
        required: false,
      },
      {
        name: "usage_period",
        label: "How Long Used",
        type: "text",
        required: false,
      },
      {
        name: "pros",
        label: "What did you like?",
        type: "textarea",
        required: true,
      },
      {
        name: "cons",
        label: "What could be improved?",
        type: "textarea",
        required: false,
      },
    ],
  },
  {
    id: "service_review",
    name: "Service Review",
    description: "Fields for service-based businesses",
    fields: [
      {
        name: "service_type",
        label: "Service Type",
        type: "text",
        required: true,
      },
      {
        name: "service_date",
        label: "Service Date",
        type: "date",
        required: false,
      },
      {
        name: "service_quality",
        label: "Quality of Service",
        type: "number",
        required: true,
      },
      {
        name: "staff_rating",
        label: "Staff Friendliness",
        type: "number",
        required: false,
      },
      {
        name: "recommendation_likelihood",
        label: "How likely to recommend?",
        type: "select",
        required: true,
      },
    ],
  },
];

// Standard form field options
export const standardFieldOptions = [
  { id: "name", label: "Full Name", icon: User, type: "text", required: true },
  {
    id: "email",
    label: "Email Address",
    icon: Mail,
    type: "email",
    required: true,
  },
  {
    id: "company",
    label: "Company",
    icon: Building,
    type: "text",
    required: false,
  },
  {
    id: "jobTitle",
    label: "Job Title",
    icon: Briefcase,
    type: "text",
    required: false,
  },
  {
    id: "location",
    label: "Location",
    icon: MapPin,
    type: "text",
    required: false,
  },
  {
    id: "website",
    label: "Website",
    icon: Globe,
    type: "url",
    required: false,
  },
];

// Field type options
export const fieldTypeOptions = [
  { value: "text", label: "Text (Short)" },
  { value: "textarea", label: "Text (Long)" },
  { value: "email", label: "Email" },
  { value: "number", label: "Number" },
  { value: "tel", label: "Phone" },
  { value: "url", label: "URL/Website" },
  { value: "date", label: "Date" },
  { value: "select", label: "Dropdown" },
];

// Animation variants
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      when: "beforeChildren",
      ease: [0.22, 0.03, 0.26, 1],
    },
  },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
};

export const listItemVariants = {
  hidden: { opacity: 0, x: -10, scale: 0.98 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    x: -10,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
  drag: {
    scale: 1.02,
    boxShadow: "0 8px 16px rgba(0,0,0,0.12)",
    cursor: "grabbing",
    zIndex: 10,
  },
};

// Floating animation for attention-grabbing elements
export const floatAnimation = {
  initial: { y: 0 },
  animate: {
    y: [0, -6, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Glow pulse animation
export const glowPulse = {
  initial: {
    boxShadow: "0 0 0 rgba(99, 102, 241, 0)",
  },
  animate: {
    boxShadow: [
      "0 0 0 rgba(99, 102, 241, 0)",
      "0 0 16px rgba(99, 102, 241, 0.5)",
      "0 0 0 rgba(99, 102, 241, 0)",
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Get icon for field type
export const getFieldIcon = (
  fieldType: string
): React.FC<{ className?: string }> => {
  switch (fieldType) {
    case "text":
      return FormInput;
    case "email":
      return Mail;
    case "tel":
      return ({ className }) => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      );
    case "url":
      return Globe;
    case "textarea":
      return MessageSquare;
    case "date":
      return ({ className }) => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
          <line x1="16" x2="16" y1="2" y2="6" />
          <line x1="8" x2="8" y1="2" y2="6" />
          <line x1="3" x2="21" y1="10" y2="10" />
        </svg>
      );
    case "number":
      return ({ className }) => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 7v12h12V7l-6-4Z" />
          <path d="m5 7 6 6" />
          <path d="m11 13 6-6" />
        </svg>
      );
    case "select":
      return Layers;
    default:
      return FormInput;
  }
};

export const FieldTypeIcon = ({
  type,
  className = "h-4 w-4",
}: {
  type: string;
  className?: string;
}) => {
  const IconComponent = getFieldIcon(type);
  return <IconComponent className={className} />;
};

export const getFormLayoutIcon = (
  layout: "grid" | "horizontal" | "vertical" | undefined
) => {
  switch (layout) {
    case "horizontal":
      return <PanelRight className="h-4 w-4" />;
    case "grid":
      return <LayoutGrid className="h-4 w-4" />;
    default:
      return <List className="h-4 w-4" />;
  }
};
