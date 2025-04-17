import { FormatOption } from "./general";
import { EnhancedTriggerOption } from "./triggers";

export type ChatBusinessEventType = "support_resolved" | "chat_completed";

export interface TestimonialMessageTemplate {
  id: string;
  name: string;
  message: string;
  default: boolean;
  variables?: string[]; // Available variables in the template
  contextType?: "support" | "purchase" | "feedback" | "general"; // What context this template is best for
  tone?: "friendly" | "professional" | "casual" | "enthusiastic"; // Tone of the message
}

export interface ChatSettings {
  enabled: boolean;
  formats: FormatOption[];
  triggers: EnhancedTriggerOption<ChatBusinessEventType>[];
  messageTemplate: TestimonialMessageTemplate;
  connectedPlatforms: {
    intercom: boolean;
    zendesk: boolean;
    crisp: boolean;
    drift: boolean;
    tawk?: boolean;
    livechat?: boolean;
    freshchat?: boolean;
    custom?: boolean;
  };
  promptMessage: string;
  timeout: string;
  allowAgentTrigger: boolean;
  followUp?: {
    enabled: boolean;
    delay: number; // minutes
    message: string;
    maxAttempts: number;
  };
  display?: {
    disableDuringActiveSupport: boolean;
    showAsBotMessage: boolean;
    embedRatingInChat: boolean;
    closeAfterSubmission: boolean;
  };
  timing?: {
    minChatDuration: number; // minutes
    cooldownPeriod: number; // days
    maxRequestsPerChat: number;
  };
  customIntegration?: {
    apiEndpoint?: string;
    apiKey?: string;
    webhookUrl?: string;
    headers?: Record<string, string>;
  };
}
