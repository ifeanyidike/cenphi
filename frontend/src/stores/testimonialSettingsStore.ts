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
} from "@/types/setup";
import { defaultSettings } from "@/components/collection-setup/defaultSettings";

// Define missing interfaces
interface SocialCampaign {
  id: string;
  name: string;
  description: string;
  platform: SocialPlatformName;
  status: "active" | "paused" | "completed";
  collected: number;
  target: number;
  startDate: Date;
  endDate?: Date;
  keywords: string[];
  hashtags: string[];
  created_at: Date;
  updated_at: Date;
}

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
    // Only apply to methods that have formats
    if ('formats' in this.settings[method]) {
      const formats = (this.settings[method] as any).formats;
      const formatIndex = formats.findIndex(
        (format: any) => format.type === formatType
      );

      if (formatIndex !== -1) {
        formats[formatIndex].enabled = !formats[formatIndex].enabled;
        this.markAsChanged();
      }
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
    // Only apply to methods that have formats
    if ('formats' in this.settings[method]) {
      const formats = (this.settings[method] as any).formats;
      if (!formats.some((f: any) => f.type === format.type)) {
        formats.push(format);
        this.markAsChanged();
        return true;
      }
    }
    return false;
  }

  updateFormat(method: CollectionMethod, format: Partial<FormatOption>) {
    // Only apply to methods that have formats
    if ('formats' in this.settings[method]) {
      const formats = (this.settings[method] as any).formats;
      const formatIndex = formats.findIndex(
        (f: any) => f.type === format.type
      );

      if (formatIndex !== -1) {
        formats[formatIndex] = {
          ...formats[formatIndex],
          ...format,
        };
        this.markAsChanged();
        return true;
      }
    }
    return false;
  }

  setFormats(method: CollectionMethod, formats: FormatOption[]) {
    // Only apply to methods that have formats
    if ('formats' in this.settings[method]) {
      (this.settings[method] as any).formats = formats;
      this.markAsChanged();
    }
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
    // SocialSettings.platforms is a simple object with boolean values
    if (platformName in this.settings.social.platforms) {
      (this.settings.social.platforms as any)[platformName] = !(this.settings.social.platforms as any)[platformName];
      this.markAsChanged();
    }
  }

  syncSocialPlatform(platformName: SocialPlatformName) {
    // This method would need to be implemented based on actual social settings structure
    console.log(`Syncing ${platformName} platform`);
    this.markAsChanged();
  }

  connectSocialPlatform(
    platformName: SocialPlatformName,
    connected: boolean,
    account?: PlatformAccount
  ) {
    // This method would need to be implemented based on actual social settings structure
    console.log(`Connecting ${platformName} platform:`, connected, account);
    this.markAsChanged();
  }

  disconnectAccount(platformName: SocialPlatformName, accountId: string) {
    // This method would need to be implemented based on actual social settings structure
    console.log(`Disconnecting account ${accountId} from ${platformName}`);
    this.markAsChanged();
  }

  setActiveAccount(platformName: SocialPlatformName, accountId: string) {
    // This method would need to be implemented based on actual social settings structure
    console.log(`Setting active account ${accountId} for ${platformName}`);
    this.markAsChanged();
  }

  selectEmailTemplate(templateId: string) {
    // Email templates are simple strings, not objects with IDs
    console.log(`Selecting email template: ${templateId}`);
    this.markAsChanged();
  }

  connectChatPlatform(
    platform: string,
    connected: boolean
  ) {
    // Chat settings don't have connectedPlatforms property
    console.log(`Connecting chat platform ${platform}: ${connected}`);
    this.markAsChanged();
  }

  addCampaign(campaign: Omit<SocialCampaign, "id" | "collected">) {
    const newCampaign = {
      ...campaign,
      id: `campaign-${Date.now()}`,
      collected: 0,
    };

    // SocialSettings doesn't have campaigns property
    console.log('Adding campaign:', newCampaign);
    this.markAsChanged();
    return newCampaign;
  }
  
  updateCampaign(campaign: Partial<SocialCampaign>) {
    // SocialSettings doesn't have campaigns property
    console.log('Updating campaign:', campaign);
    this.markAsChanged();
  }

  deleteCampaign(campaignId: string) {
    // SocialSettings doesn't have campaigns property
    console.log('Deleting campaign:', campaignId);
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
