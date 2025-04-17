// src/stores/testimonialSettingsStore.ts
import { makeAutoObservable, runInAction } from "mobx";
import {
  CollectionSettings,
  CollectionMethod,
  FormatOption,
  TestimonialFormat,
  SocialPlatformName,
  EnhancedTriggerOption,
  TriggerSettingKeys,
  BusinessEventOf,
  SettingsWithTriggers,
  TriggerElementType,
  PlatformAccount,
  SocialCampaign,
} from "@/types/setup";
import { defaultSettings } from "@/components/collection-setup/defaultSettings";

export class TestimonialSettingsStore {
  settings: CollectionSettings = defaultSettings;
  activeMethod: CollectionMethod = "website";
  isSaved: boolean = true;
  areSettingsChanged: boolean = false;
  isLoading: boolean = false;
  copiedElement: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setActiveMethod(method: CollectionMethod) {
    this.activeMethod = method;
  }

  toggleMethodEnabled(method: CollectionMethod, enabled: boolean) {
    this.settings[method].enabled = enabled;
    this.markAsChanged();
  }

  toggleFormatEnabled(method: CollectionMethod, formatType: TestimonialFormat) {
    const formats = this.settings[method].formats;
    const formatIndex = formats.findIndex(
      (format) => format.type === formatType
    );

    if (formatIndex !== -1) {
      formats[formatIndex].enabled = !formats[formatIndex].enabled;
      this.markAsChanged();
    }
  }

  private getSettingsWithTriggers<K extends TriggerSettingKeys>(
    method: K
  ): CollectionSettings[K] {
    return this.settings[method];
  }

  // private getSettingsWithTriggers<K extends TriggerSettingKeys>(method: K): SettingsWithTriggers<K> {
  //   // This single cast is necessary but isolated to one location
  //   return this.settings[method] as SettingsWithTriggers<K>;
  // }

  toggleTriggerEnabled<K extends TriggerSettingKeys>(
    method: K,
    triggerType: string
  ) {
    const settings = this.getSettingsWithTriggers(method);
    const triggerIndex = settings.triggers.findIndex(
      (trigger) => trigger.type === triggerType
    );

    if (triggerIndex !== -1) {
      settings.triggers[triggerIndex].enabled =
        !settings.triggers[triggerIndex].enabled;
      this.markAsChanged();
    }
  }

  addFormat(method: CollectionMethod, format: FormatOption) {
    if (!this.settings[method].formats.some((f) => f.type === format.type)) {
      this.settings[method].formats.push(format);
      this.markAsChanged();
      return true;
    }
    return false;
  }

  updateFormat(method: CollectionMethod, format: Partial<FormatOption>) {
    const formatIndex = this.settings[method].formats.findIndex(
      (f) => f.type === format.type
    );

    if (formatIndex !== -1) {
      this.settings[method].formats[formatIndex] = {
        ...this.settings[method].formats[formatIndex],
        ...format,
      };
      this.markAsChanged();
      return true;
    }
    return false;
  }

  setFormats(method: CollectionMethod, formats: FormatOption[]) {
    this.settings[method].formats = formats;
    this.markAsChanged();
  }

  // addTrigger(method: CollectionMethod, trigger: EnhancedTriggerOption) {
  //   if (
  //     !(this.settings[method] as CollectionSettings["website"]).triggers.some(
  //       (t) => t.businessEvent === trigger.businessEvent
  //     )
  //   ) {
  //     console.log("adding triggers...");
  //     (this.settings[method] as CollectionSettings["website"]).triggers.push(
  //       trigger
  //     );
  //     this.markAsChanged();
  //     return true;
  //   }

  //   return false;
  // }

  addTrigger<K extends TriggerSettingKeys>(
    method: K,
    trigger: EnhancedTriggerOption<BusinessEventOf<K>>
  ) {
    const settings = this.getSettingsWithTriggers(
      method
    ) as SettingsWithTriggers<K>;
    settings.triggers.push(trigger);
    this.markAsChanged();
  }

  addTriggers<K extends TriggerSettingKeys>(
    method: K,
    trigger: EnhancedTriggerOption<BusinessEventOf<K>>[]
  ) {
    const settings = this.getSettingsWithTriggers(
      method
    ) as SettingsWithTriggers<K>;
    settings.triggers.push(...trigger);
    this.markAsChanged();
  }

  editTrigger<K extends TriggerSettingKeys>(
    method: K,
    id: string,
    values: Partial<TriggerElementType<K>>
  ) {
    const settings = this.getSettingsWithTriggers(method);
    const idx = settings.triggers.findIndex((t) => t.id === id);

    if (idx > -1) {
      // Use the array's indexed accessor type to ensure proper typing
      const currentTrigger = settings.triggers[idx];
      const updatedTrigger = {
        ...currentTrigger,
        ...values,
      } as TriggerElementType<K>;

      settings.triggers[idx] = updatedTrigger;
      return true;
    }

    return false;
  }

  removeTrigger<K extends TriggerSettingKeys>(method: K, id: string) {
    const settings = this.getSettingsWithTriggers(method);
    settings.triggers = settings.triggers.filter(
      (t) => t.id !== id
    ) as CollectionSettings[K]["triggers"];
    this.markAsChanged();
  }

  updateSettings<T extends keyof CollectionSettings>(
    method: T,
    field: keyof CollectionSettings[T],
    value: any
  ) {
    this.settings[method] = {
      ...this.settings[method],
      [field]: value,
    };
    this.markAsChanged();
  }

  // updateNestedSettings<
  //   T extends keyof CollectionSettings,
  //   U extends keyof CollectionSettings[T],
  // >(
  //   method: T,
  //   parentField: U,
  //   field: keyof CollectionSettings[T][U],
  //   value: any
  // ) {
  //   this.settings[method] = {
  //     ...this.settings[method],
  //     [parentField]: {
  //       ...this.settings[method][parentField],
  //       [field]: value,
  //     },
  //   };
  //   this.markAsChanged();
  // }

  updateNestedSettings<
    T extends keyof CollectionSettings,
    U extends keyof CollectionSettings[T],
    F extends keyof NonNullable<CollectionSettings[T][U]>,
  >(
    method: T,
    parentField: U,
    field: F,
    value: NonNullable<CollectionSettings[T][U]>[F]
  ): void {
    this.settings[method] = {
      ...this.settings[method],
      [parentField]: {
        ...this.settings[method][parentField],
        [field]: value,
      },
    };
    this.markAsChanged();
  }

  toggleSocialPlatform(platformName: SocialPlatformName) {
    const platforms = this.settings.social.platforms;
    const platformIndex = platforms.findIndex((p) => p.name === platformName);
    console.log(
      "platform idx",
      platformIndex,
      platforms[platformIndex].enabled
    );
    if (platformIndex !== -1) {
      platforms[platformIndex].enabled = !platforms[platformIndex].enabled;
      this.markAsChanged();
    }
  }

  syncSocialPlatform(platformName: SocialPlatformName) {
    const platforms = this.settings.social.platforms;
    const platformIndex = platforms.findIndex((p) => p.name === platformName);
    if (platformIndex !== -1) {
      platforms[platformIndex].lastSyncDate = new Date();
      this.markAsChanged();
    }
  }

  connectSocialPlatform(
    platformName: SocialPlatformName,
    connected: boolean,
    account?: PlatformAccount
  ) {
    const platforms = this.settings.social.platforms;
    const platformIndex = platforms.findIndex((p) => p.name === platformName);

    if (platformIndex !== -1) {
      platforms[platformIndex].connected = connected;
      if (connected && account) {
        platforms[platformIndex] = {
          ...platforms[platformIndex],
          accounts: [...platforms[platformIndex].accounts, account],
          activeAccountId:
            platforms[platformIndex].accounts.length === 0
              ? account.id
              : platforms[platformIndex].activeAccountId,
        };
      }
      this.markAsChanged();
    }
  }

  disconnectAccount(platformName: SocialPlatformName, accountId: string) {
    const platforms = this.settings.social.platforms;
    const platformIndex = platforms.findIndex((p) => p.name === platformName);
    if (platformIndex < 0) return;

    const platform = platforms[platformIndex];
    const accounts = platform.accounts.filter((a) => a.id !== accountId);

    const activeAccountId =
      platform.activeAccountId === accountId
        ? accounts.length > 0
          ? accounts[0].id
          : undefined
        : platform.activeAccountId;

    this.settings.social.platforms[platformIndex] = {
      ...platform,
      accounts,
      activeAccountId,
      connected: accounts.length > 0,
    };
  }

  setActiveAccount(platformName: SocialPlatformName, accountId: string) {
    const platforms = this.settings.social.platforms;
    const platformIndex = platforms.findIndex((p) => p.name === platformName);

    if (platformIndex !== -1) {
      platforms[platformIndex].activeAccountId = accountId;
      this.markAsChanged();
    }
  }

  selectEmailTemplate(templateId: string) {
    this.settings.email.templates = this.settings.email.templates.map(
      (template) => ({
        ...template,
        active: template.id === templateId,
      })
    );
    this.markAsChanged();
  }

  connectChatPlatform(
    platform: keyof CollectionSettings["chat"]["connectedPlatforms"],
    connected: boolean
  ) {
    this.settings.chat.connectedPlatforms[platform] = connected;
    this.markAsChanged();
  }

  addCampaign(campaign: Omit<SocialCampaign, "id" | "collected">) {
    const newCampaign = {
      ...campaign,
      id: `campaign-${Date.now()}`,
      collected: 0,
    };

    this.settings.social.campaigns.push(newCampaign);
    this.markAsChanged();
    return newCampaign;
  }
  updateCampaign(campaign: Partial<SocialCampaign>) {
    const campaignIndex = this.settings.social.campaigns.findIndex(
      (c) => c.id === campaign.id
    );
    if (campaignIndex !== -1) {
      this.settings.social.campaigns[campaignIndex] = {
        ...this.settings.social.campaigns[campaignIndex],
        ...campaign,
      };
      this.markAsChanged();
    }
  }

  deleteCampaign(campaignId: string) {
    this.settings.social.campaigns = this.settings.social.campaigns.filter(
      (c) => c.id !== campaignId
    );
    this.markAsChanged();
  }

  resetSettings() {
    this.settings = defaultSettings;
    this.isSaved = true;
    this.areSettingsChanged = false;
  }

  markAsChanged() {
    this.isSaved = false;
    this.areSettingsChanged = true;
  }

  markAsSaved() {
    this.isSaved = true;
    this.areSettingsChanged = false;
  }

  saveSettings(): Promise<void> {
    this.isLoading = true;
    // Simulate API call
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        runInAction(() => {
          this.markAsSaved();
          this.isLoading = false;
        });
        resolve();
      }, 1000);
    });
  }

  setCopiedElement(element: string | null) {
    this.copiedElement = element;

    if (element) {
      // Auto-clear after 2 seconds
      setTimeout(() => {
        runInAction(() => {
          this.copiedElement = null;
        });
      }, 2000);
    }
  }
}

// Create and export a singleton instance
export const testimonialSettingsStore = new TestimonialSettingsStore();
