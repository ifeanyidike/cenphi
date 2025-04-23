import { JSONObject } from "../helper";

export type TestimonialFormat = "video" | "audio" | "text" | "image";

export interface FormatOption {
  type: TestimonialFormat;
  enabled: boolean;
  maxSize?: number; // Maximum file size in bytes
  maxDuration?: number; // Maximum duration in seconds for video/audio
  allowUploads?: boolean; // Allow file uploads in addition to recording
  requiredFields?: string[]; // Required metadata fields for this format
  order?: number;
  settings?: {
    richFormatting?: boolean;
    placeholder?: string;
    sentimentAnalysis?: boolean;
    minLength?: number;
    maxSize?: number;
    captionRequired?: boolean;
    allowMultiple?: boolean;
    format?: string;
    echoCancellation?: boolean;
    noiseReduction?: boolean;
    quality?: string;
    maxDuration?: number;
    countdown?: boolean;
    showGuidelines?: boolean;
    requireModeration?: boolean;
    allowUploads?: boolean;
    minimumRating?: number;
    prompt?: string;
  };
}

export interface ToastMessage {
  title: string;
  description: string;
  variant?: "default" | "destructive";
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Testimonial submission
export interface TestimonialSubmission {
  id: string;
  type: TestimonialFormat;
  content: string | File;
  rating?: number;
  customerName: string;
  customerEmail?: string;
  customerTitle?: string;
  customerCompany?: string;
  customerLocation?: string;
  submitDate: Date;
  approved?: boolean;
  featured?: boolean;
  triggerSource?: string;
  metadata?: Record<string, any>;
  date: string;
  mediaContent: Blob;
}

export interface TestimonialFormField {
  id: string;
  label: string;
  type:
    | "text"
    | "email"
    | "textarea"
    | "select"
    | "checkbox"
    | "radio"
    | "number"
    | "tel"
    | "url"
    | "date";
  required: boolean;
  placeholder?: string;
  helpText?: string;
  defaultValue?: string | number | boolean;
  options?: Array<{
    value: string;
    label: string;
  }>;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    patternError?: string;
  };
  disabled?: boolean;
  hidden?: boolean;
  width?: "full" | "half" | "third";
  order?: number;
  conditional?: {
    dependsOn: string;
    showWhen: string | number | boolean;
  };
}

export type DelayUnit = "seconds" | "minutes" | "hours" | "days" | "weeks";

export type BusinessEventType =
  | "purchase_completed"
  | "service_completed" // After a service is delivered
  | "support_interaction"; // After customer support interaction

// export interface EnhancedTriggerOption {
//   id: string;
//   name: string;
//   description?: string;
//   enabled: boolean;
//   businessEvent: BusinessEventType;
//   userSegment: UserSegmentType[];
//   delay: string;
//   delayUnit: DelayUnit;
//   frequency:
//     | "once"
//     | "every_time"
//     | "daily_limit"
//     | "weekly_limit"
//     | "monthly_limit";
//   frequencyLimit?: number;
//   priority: "low" | "medium" | "high";
//   // Add JSON schema for data the trigger expects
//   dataSchema?: Record<string, unknown>;
//   // Conditions for displaying the trigger (all must be true)
//   conditions?: Array<{
//     field: string; // Data point to evaluate
//     operator:
//       | "=="
//       | "!="
//       | ">"
//       | "<"
//       | ">="
//       | "<="
//       | "contains"
//       | "starts_with"
//       | "ends_with";
//     value: string | number | boolean | null;
//   }>;
//   // Example data mapping for the trigger
//   expectedData?: {
//     example: Record<string, unknown>;
//     required: string[];
//     optional: string[];
//   };
//   // Analytics tags
//   tags?: string[];
// }
export interface MessageTemplate {
  id: string;
  workspace_id: string;
  name: string;
  template_type: "email" | "chat" | "social" | "website" | "custom";
  context_type?: "support" | "purchase" | "feedback" | "general";
  tone?: "friendly" | "professional" | "casual" | "enthusiastic";

  subject?: string;
  content: string;
  variables?: string[];

  design_settings?: JSONObject;
  is_default: boolean;

  created_at: Date;
  updated_at: Date;
}
