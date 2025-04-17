import { ChatSettings } from "./chat";
import { CustomSettings } from "./custom";
import { EmailSettings } from "./email";
import { SocialSettings } from "./social";
import { EnhancedTriggerOption } from "./triggers";
import { WebsiteSettings } from "./website";

export * from "./chat";
export * from "./email";
export * from "./general";
export * from "./triggers";
export * from "./website";
export * from "./social";
export * from "./custom";
export * from "./brand-guide";

export interface CollectionSettings {
  website: WebsiteSettings;
  chat: ChatSettings;
  email: EmailSettings;
  social: SocialSettings;
  custom: CustomSettings;
}

export type CollectionMethod = keyof CollectionSettings;
export type TriggerSettingKeys = {
  [K in CollectionMethod]: CollectionSettings[K] extends {
    triggers: EnhancedTriggerOption<unknown>[];
  }
    ? K
    : never;
}[CollectionMethod];

export type BusinessEventOf<K extends TriggerSettingKeys> =
  CollectionSettings[K] extends {
    triggers: Array<EnhancedTriggerOption<infer E>>;
  }
    ? E
    : never;

export type TriggerSettingType<K extends TriggerSettingKeys> = {
  triggers: EnhancedTriggerOption<BusinessEventOf<K>>[];
};

export type SettingsWithTriggers<K extends TriggerSettingKeys> =
  CollectionSettings[K] & {
    triggers: EnhancedTriggerOption<BusinessEventOf<K>>[];
  };

export type TriggerElementType<K extends TriggerSettingKeys> =
  CollectionSettings[K]["triggers"][number];
