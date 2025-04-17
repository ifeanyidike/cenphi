import { BusinessEventType, DelayUnit, FormatOption } from "./general";
import { EnhancedTriggerOption } from "./triggers";

export interface EmailTemplate {
  id: string;
  name: string;
  thumbnail: string;
  active: boolean;
  subject: string;
  content: string;
  description: string;
  design?: {
    headerColor?: string;
    footerColor?: string;
    backgroundColor?: string;
    textColor?: string;
    buttonColor?: string;
    buttonTextColor?: string;
    fontFamily?: string;
    heroImageUrl?: string;
    primaryColor?: string;
  };
  metadata?: {
    created: string;
    modified: string;
    author: string;
    tags: string[];
  };
  variables?: string[]; // Available variables in template
  previewText?: string; // Email preview text
}

export type EmailSettings = {
  enabled: boolean;
  formats: FormatOption[];
  triggers: EnhancedTriggerOption<BusinessEventType>[];
  templates: EmailTemplate[];
  senderName: string;
  senderEmail: string;
  replyToEmail: string;
  senderType: "personal" | "company";
  companyLogo?: string;
  signatureTemplate: "minimal" | "standard" | "branded" | "social";
  signatureText?: string;

  unsubscribeLink?: string;
  emailValidation?: boolean;
  schedule?: {
    followUpEnabled: boolean;
    followUpDelay: number;
    followUpDelayUnit: DelayUnit;
    maxFollowUps: number;
    bestTimeToSend?: boolean;
    timezone?: string;
    avoidWeekends?: boolean;
    scheduling?: "immediate" | "batched" | "optimal";
  };
  advanced?: {
    esp?: "native" | "mailchimp" | "sendgrid" | "ses" | "mailgun";
    espApiKey?: string;
    listId?: string;
    espSettings?: Record<string, any>;
    trackOpens?: boolean;
    trackClicks?: boolean;
    unsubscribeLink?: boolean;
    customMergeFields?: string[];
    emailValidation?: boolean;
    dkimSigning?: boolean;
    templateTesting?: boolean;
    spamScoreCheck?: boolean;
  };
};
