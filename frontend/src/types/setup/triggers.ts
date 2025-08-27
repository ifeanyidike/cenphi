export interface EnhancedTriggerOption<T = unknown> {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type?: string;
  businessEvent?: T;
  delay?: string;
  delayUnit?: "seconds" | "minutes" | "hours" | "days";
  data?: T;
  conditions?: {
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
    value: string | number;
  }[];
}
