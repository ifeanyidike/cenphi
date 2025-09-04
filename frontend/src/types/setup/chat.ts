export interface ChatSettings {
  enabled: boolean;
  platforms: {
    intercom: boolean;
    zendesk: boolean;
    drift: boolean;
    crisp: boolean;
    tawkto: boolean;
  };
  triggers: {
    sentiment: boolean;
    purchase: boolean;
    chat_end: boolean;
    support_resolved: boolean;
    duration: boolean;
  };
  formats: {
    type: "video" | "audio" | "text" | "image";
    enabled: boolean;
  }[];
  templates: {
    request: string;
    thankYou: string;
    followup: string;
  };
  settings: {
    delay: number;
    autoTrigger: boolean;
    requireRating: boolean;
    minRating: number;
  };
}
