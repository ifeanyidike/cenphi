export interface EmailSettings {
  enabled: boolean;
  sender: {
    name: string;
    email: string;
  };
  signature: {
    text: string;
    includeCompanyLogo: boolean;
    includeSocialLinks: boolean;
    template: string;
  };
  templates: {
    request: string;
    thankYou: string;
    followup: string;
  };
  settings: {
    delay: number;
    autoSend: boolean;
    requireReply: boolean;
  };
}
