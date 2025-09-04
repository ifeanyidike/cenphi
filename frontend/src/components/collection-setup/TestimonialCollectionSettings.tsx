import React from "react";
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
import { CollectionMethod } from "@/types/setup";
import { TestimonialFormat } from "@/types/setup/general";

// Component imports
import MethodTabs from "./MethodTabs";
// Method specific components
import GoogleDriveSettings from "./google-drive/GoogleDriveSettings";
import LinkedInSettings from "./linkedin/LinkedInSettings";

const TestimonialCollectionSettings: React.FC = () => {
  const { toast } = useToast();

  // Handlers for store interactions
  const handleMethodChange = (method: CollectionMethod) => {
    settingsStore.setActiveMethod(method);
  };

  const handleToggleMethod = (method: CollectionMethod, enabled: boolean) => {
    settingsStore.toggleMethodEnabled(method, enabled);
  };

  const handleFormatToggle =
    (method: CollectionMethod) => (formatType: TestimonialFormat) => {
      settingsStore.toggleFormatEnabled(method, formatType);
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

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Testimonial Collection</h1>
        <p className="text-gray-600">
          Configure how and where to collect testimonials from your customers.
        </p>
      </div>

      <MethodTabs
        activeMethod={settingsStore.activeMethod}
        onMethodChange={handleMethodChange}
        methodEnabled={{
          website: settingsStore.settings.website.enabled,
          email: settingsStore.settings.email.enabled,
          chat: settingsStore.settings.chat.enabled,
          social: settingsStore.settings.social.enabled,
          custom: settingsStore.settings.custom.enabled,
          "google-drive": settingsStore.settings["google-drive"].enabled,
          linkedin: settingsStore.settings.linkedin.enabled,
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
            <TabsContent value="google-drive" className="mt-0">
              <GoogleDriveSettings />
            </TabsContent>

            <TabsContent value="linkedin" className="mt-0">
              <LinkedInSettings
                settings={settingsStore.settings.linkedin}
                onFormatToggle={(formatType: string) => 
                  handleFormatToggle("linkedin")(formatType as TestimonialFormat)
                }
                onSettingsChange={(field, value) =>
                  settingsStore.updateSettings("linkedin", field, value)
                }
                onNestedSettingsChange={(parentField, field, value) =>
                  settingsStore.updateNestedSettings(
                    "linkedin",
                    parentField as any,
                    field as any,
                    value
                  )
                }
                showToast={toast}
              />
            </TabsContent>

            <TabsContent value="website" className="mt-0">
              <div className="text-center py-8">
                <p className="text-gray-500">Website settings component not implemented yet.</p>
              </div>
            </TabsContent>

            <TabsContent value="email" className="mt-0">
              <div className="text-center py-8">
                <p className="text-gray-500">Email settings component not implemented yet.</p>
              </div>
            </TabsContent>

            <TabsContent value="chat" className="mt-0">
              <div className="text-center py-8">
                <p className="text-gray-500">Chat settings component not implemented yet.</p>
              </div>
            </TabsContent>

            <TabsContent value="social" className="mt-0">
              <div className="text-center py-8">
                <p className="text-gray-500">Social settings component not implemented yet.</p>
              </div>
            </TabsContent>

            <TabsContent value="custom" className="mt-0">
              <div className="text-center py-8">
                <p className="text-gray-500">Custom settings component not implemented yet.</p>
              </div>
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
    </>
  );
};

export default observer(TestimonialCollectionSettings);
