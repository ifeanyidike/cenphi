export interface EnhancedTriggerOption<T = any> {
  id: string;
  name: string;
  event: T;
  enabled?: boolean;
  [key: string]: any;
}

export interface TriggerSettings {
  triggers: EnhancedTriggerOption[];
  [key: string]: any;
}