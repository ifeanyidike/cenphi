import { DelayUnit } from "./general";

export type UserSegmentType =
  | "all_users"
  | "new_users"
  | "returning_users"
  | "customers";

export type TriggerType =
  | "purchase"
  | "support"
  | "feedback"
  | "custom"
  | "pageview"
  | "timeonsite"
  | "scrolldepth"
  | "exitintent"
  | "clickelement";

export interface EnhancedTriggerOption<E> {
  id: string;
  name: string;
  description?: string;
  type: TriggerType;
  enabled: boolean;
  businessEvent: E;
  userSegment: UserSegmentType[];
  delay: string;
  delayUnit: DelayUnit;
  selector?: string;
  frequency:
    | "once"
    | "every_time"
    | "daily_limit"
    | "weekly_limit"
    | "monthly_limit";
  frequencyLimit?: number;
  priority: "low" | "medium" | "high";
  // Add JSON schema for data the trigger expects
  dataSchema?: Record<string, unknown>;
  // Conditions for displaying the trigger (all must be true)
  conditions?: Array<{
    field: string; // Data point to evaluate
    operator:
      | "=="
      | "!="
      | ">"
      | "<"
      | ">="
      | "<="
      | "contains"
      | "starts_with"
      | "ends_with";
    value: string | number | boolean | null;
  }>;
  // Example data mapping for the trigger
  expectedData?: {
    example: Record<string, unknown>;
    required: string[];
    optional: string[];
  };
  // Analytics tags
  tags?: string[];
}
