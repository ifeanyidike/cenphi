import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { motion } from "framer-motion";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Loader, Trash2 } from "lucide-react";

// Stores and helpers
import { testimonialSettingsStore as settingsStore } from "@/stores/testimonialSettingsStore";
import { itemVariants } from "@/utils/helpers";
import { CollectionMethod, TriggerSettingKeys } from "@/types/setup";

// Component imports
import Header from "./Header";
import AiOptimizationCard from "./AiOptimizationCard";
import MethodTabs from "./MethodTabs";
import AddFormatDialog from "./common/AddFormatDialog";
// Method specific components
import WebsiteSettings from "./website/WebsiteSettings";
import EmailSettings from "./email/EmailSettings";
import ChatSettings from "./chat/ChatSettings";
import SocialSettings from "./social/SocialSettings";
import CustomPageSettings from "./custom/CustomPageSettings";
import { TriggerType } from "@/types/setup/triggers";

const TestimonialCollectionSettings: React.FC = () => {
  // Dialogs state
  const [showFormatDialog, setShowFormatDialog] = useState(false);
  const { toast } = useToast();

  // Handlers for store interactions
  const handleMethodChange = (method: CollectionMethod) => {
    settingsStore.setActiveMethod(method);
  };

  const handleToggleMethod = (method: CollectionMethod, enabled: boolean) => {
    settingsStore.toggleMethodEnabled(method, enabled);
  };

  const handleFormatToggle =
    (method: CollectionMethod) => (formatType: any) => {
      settingsStore.toggleFormatEnabled(method, formatType);
    };

  const handleTriggerToggle =
    <K extends TriggerSettingKeys>(method: K) =>
    (triggerType: TriggerType): void => {
      settingsStore.toggleTriggerEnabled(method, triggerType);
    };

  // Type-safe remove trigger handler
  const handleRemoveTrigger =
    <K extends TriggerSettingKeys>(method: K) =>
    (id: string): void => {
      settingsStore.removeTrigger(method, id);
    };

  const handleAddFormat = (format: any) => {
    const success = settingsStore.addFormat(settingsStore.activeMethod, format);
    if (success) {
      toast({
        title: "Format Added",
        description: `${
          format.type.charAt(0).toUpperCase() + format.type.slice(1)
        } format has been added.`,
        variant: "default",
      });
    }
  };

  const handleSaveSettings = async () => {
    try {
      await settingsStore.saveSettings();
      toast({
        title: "Settings Saved",
        description:
          "Your testimonial collection settings have been saved successfully.",
        variant: "default",
      });
    } catch (error: any) {
      console.log("error", error.message);
      toast({
        title: "Save Failed",
        description: "An error occurred while saving settings.",
        variant: "destructive",
      });
    }
  };

  const handleResetSettings = () => {
    if (
      confirm(
        "Are you sure you want to reset all settings? This action cannot be undone."
      )
    ) {
      settingsStore.resetSettings();
      toast({
        title: "Settings Reset",
        description: "All settings have been reset to default values.",
        variant: "default",
      });
    }
  };

  const handleCopyElement = (element: string) => {
    settingsStore.setCopiedElement(element);
  };

  return (
    <>
      <Header
        title="Testimonial Collection"
        description="Configure how and where to collect testimonials from your customers."
        onSave={handleSaveSettings}
        isLoading={settingsStore.isLoading}
        isSaved={settingsStore.isSaved}
        areSettingsChanged={settingsStore.areSettingsChanged}
      />

      <AiOptimizationCard showToast={toast} />

      <MethodTabs
        activeMethod={settingsStore.activeMethod}
        onMethodChange={handleMethodChange}
        methodEnabled={{
          website: settingsStore.settings.website.enabled,
          email: settingsStore.settings.email.enabled,
          chat: settingsStore.settings.chat.enabled,
          social: settingsStore.settings.social.enabled,
          custom: settingsStore.settings.custom.enabled,
        }}
        onToggleMethod={handleToggleMethod}
      />

      <Card>
        <CardContent className="p-6">
          <Tabs
            value={settingsStore.activeMethod}
            onValueChange={(v) =>
              settingsStore.setActiveMethod(v as CollectionMethod)
            }
          >
            <TabsContent value="website" className="mt-0">
              <WebsiteSettings
                settings={settingsStore.settings.website}
                onFormatToggle={handleFormatToggle("website")}
                onTriggerToggle={handleTriggerToggle("website")}
                onRemoveTrigger={handleRemoveTrigger("website")}
                onSettingsChange={(field, value) =>
                  settingsStore.updateSettings("website", field, value)
                }
                onNestedSettingsChange={(parentField, field, value) =>
                  settingsStore.updateNestedSettings(
                    "website",
                    parentField,
                    field as never,
                    value
                  )
                }
                copiedElement={settingsStore.copiedElement}
                onCopyElement={handleCopyElement}
                showToast={toast}
              />
            </TabsContent>

            <TabsContent value="email" className="mt-0">
              <EmailSettings
                settings={settingsStore.settings.email}
                onFormatToggle={handleFormatToggle("email")}
                onTriggerToggle={handleTriggerToggle("email")}
                onRemoveTrigger={handleRemoveTrigger("email")}
                onSettingsChange={(field, value) =>
                  settingsStore.updateSettings("email", field, value)
                }
                onSelectTemplate={(templateId) =>
                  settingsStore.selectEmailTemplate(templateId)
                }
                showToast={toast}
              />
            </TabsContent>

            <TabsContent value="chat" className="mt-0">
              <ChatSettings
                settings={settingsStore.settings.chat}
                onFormatToggle={handleFormatToggle("chat")}
                onTriggerToggle={handleTriggerToggle("chat")}
                onRemoveTrigger={handleRemoveTrigger("chat")}
                onSettingsChange={(field, value) =>
                  settingsStore.updateSettings("chat", field, value)
                }
                onConnectPlatform={(platform, connected) =>
                  settingsStore.connectChatPlatform(platform, connected)
                }
                showToast={toast}
              />
            </TabsContent>

            <TabsContent value="social" className="mt-0">
              <SocialSettings
                settings={settingsStore.settings.social}
                onFormatToggle={handleFormatToggle("social")}
                onAddFormatClick={() => setShowFormatDialog(true)}
                onSettingsChange={(field, value) =>
                  settingsStore.updateSettings("social", field, value)
                }
                onNestedSettingsChange={(parentField, field, value) =>
                  settingsStore.updateNestedSettings(
                    "social",
                    parentField,
                    field,
                    value
                  )
                }
                onSyncPlatform={(p) => settingsStore.syncSocialPlatform(p)}
                onTogglePlatform={(p) => settingsStore.toggleSocialPlatform(p)}
                onConnectPlatform={(platform, connected, acc) =>
                  settingsStore.connectSocialPlatform(platform, connected, acc)
                }
                onDisconnectAccount={(p, id) =>
                  settingsStore.disconnectAccount(p, id)
                }
                onSetActiveAccount={(p, id) =>
                  settingsStore.setActiveAccount(p, id)
                }
                onAddCampaign={(c) => settingsStore.addCampaign(c)}
                onDeleteCampaign={(id) => settingsStore.deleteCampaign(id)}
                onUpdateCampaign={(c) => settingsStore.updateCampaign(c)}
                showToast={toast}
              />
            </TabsContent>

            <TabsContent value="custom" className="mt-0">
              <CustomPageSettings
                settings={settingsStore.settings.custom}
                onFormatToggle={handleFormatToggle("custom")}
                onAddFormatClick={() => setShowFormatDialog(true)}
                onSettingsChange={(field, value) =>
                  settingsStore.updateSettings("custom", field, value)
                }
                onNestedSettingsChange={(parentField, field, value) =>
                  settingsStore.updateNestedSettings(
                    "custom",
                    parentField,
                    field,
                    value
                  )
                }
                copiedElement={settingsStore.copiedElement}
                onCopyElement={handleCopyElement}
                showToast={toast}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <motion.div variants={itemVariants} className="pt-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleResetSettings}
          >
            <Trash2 className="h-4 w-4 text-gray-500" />
            <span>Reset All Settings</span>
          </Button>
          <Button
            className="flex items-center gap-2"
            onClick={handleSaveSettings}
            disabled={settingsStore.isLoading || settingsStore.isSaved}
          >
            {settingsStore.isLoading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : settingsStore.isSaved ? (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Save Settings</span>
              </>
            )}
          </Button>
        </div>
      </motion.div>

      {/* Dialogs */}
      <AddFormatDialog
        open={showFormatDialog}
        onOpenChange={setShowFormatDialog}
        activeMethod={settingsStore.activeMethod}
        existingFormats={
          settingsStore.settings[settingsStore.activeMethod].formats
        }
        onAddFormat={handleAddFormat}
      />
    </>
  );
};

export default observer(TestimonialCollectionSettings);
