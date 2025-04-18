import React, { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Eye, Loader, Save } from "lucide-react";
import { cn } from "@/lib/utils";

// Tabs
import AppearanceTab from "./SettingsTab/AppearanceTab";
import BehaviorTab from "./SettingsTab/BehaviorTab";
import TriggersTab from "./SettingsTab/TriggersTab";
import IncentivesTab from "./SettingsTab/IncentivesTab";
import ContentTab from "./SettingsTab/ContentTab";
import AnalyticsTab from "./SettingsTab/AnalyticsTab";

// Types
import {
  DisplayRules,
  WidgetCustomization,
  IncentiveConfig,
  EnhancedTriggerOption,
  FormatOption,
} from "@/types/setup";
import { containerVariants, itemVariants } from "./constants";
import { observer } from "mobx-react-lite";
import { BusinessEventType } from "@/types/setup";
import TestimonialPreview from "./preview/TestimonialPreview";

export interface TestimonialWebsiteSettings {
  initialCustomization?: WidgetCustomization;
  initialDisplayRules?: DisplayRules;
  initialIncentives?: IncentiveConfig;
  initialTriggers?: EnhancedTriggerOption<BusinessEventType>[];
  initialFormats?: FormatOption[];
  onSave?: (settings: {
    customization: WidgetCustomization;
    displayRules: DisplayRules;
    incentives: IncentiveConfig;
    triggers: EnhancedTriggerOption<BusinessEventType>[];
    formats: FormatOption[];
  }) => Promise<void>;
}

const TestimonialWebsiteSettings: React.FC<TestimonialWebsiteSettings> =
  observer(() => {
    // State
    const [activeTab, setActiveTab] = useState("appearance");
    const [showPreview, setShowPreview] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const { toast } = useToast();

    // Handle saving settings
    const handleSave = async () => {
      // if (!onSave) return;

      setIsSaving(true);

      try {
        // await onSave({
        //   customization,
        //   displayRules,
        //   incentives,
        //   triggers,
        //   formats,
        // });

        setSaveSuccess(true);
        setHasChanges(false);

        toast({
          title: "Settings saved successfully",
          description:
            "Your testimonial widget configuration has been updated.",
          variant: "default",
        });

        // Reset success indicator after 2 seconds
        setTimeout(() => setSaveSuccess(false), 2000);
      } catch (error: any) {
        toast({
          title: "Error saving settings",
          description:
            "There was a problem saving your configuration. Please try again.",
          variant: "destructive",
        });
        console.log("error", error.message);
      } finally {
        setIsSaving(false);
      }
    };

    // Open preview dialog
    const handleShowPreview = () => {
      setShowPreview(true);
    };

    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header with save button */}
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold">Testimonial Widget Settings</h1>
            <p className="text-muted-foreground">
              Configure how your testimonial collection widget looks, behaves,
              and performs
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleShowPreview}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              <span>Preview</span>
            </Button>

            <Button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className={cn(
                "relative",
                saveSuccess && "bg-green-600 hover:bg-green-700"
              )}
            >
              {isSaving ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  <span>Save Changes</span>
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Main tabs */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-0">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="w-full p-0 h-auto bg-transparent border-b rounded-none">
                  <div className="flex w-full overflow-x-auto">
                    <TabsTrigger
                      value="appearance"
                      className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3 px-4"
                    >
                      Appearance
                    </TabsTrigger>
                    <TabsTrigger
                      value="behavior"
                      className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3 px-4"
                    >
                      Behavior
                    </TabsTrigger>
                    <TabsTrigger
                      value="triggers"
                      className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3 px-4"
                    >
                      Triggers
                    </TabsTrigger>
                    <TabsTrigger
                      value="incentives"
                      className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3 px-4"
                    >
                      Incentives
                    </TabsTrigger>
                    <TabsTrigger
                      value="content"
                      className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3 px-4"
                    >
                      Content
                    </TabsTrigger>
                    <TabsTrigger
                      value="analytics"
                      className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3 px-4"
                    >
                      Analytics
                    </TabsTrigger>
                  </div>
                </TabsList>

                <div className="p-6">
                  <TabsContent value="appearance" className="mt-0">
                    <AppearanceTab onShowPreview={handleShowPreview} />
                  </TabsContent>

                  <TabsContent value="behavior" className="mt-0">
                    <BehaviorTab onShowPreview={handleShowPreview} />
                  </TabsContent>

                  <TabsContent value="triggers" className="mt-0">
                    <TriggersTab />
                  </TabsContent>

                  <TabsContent value="incentives" className="mt-0">
                    <IncentivesTab onShowPreview={handleShowPreview} />
                  </TabsContent>

                  <TabsContent value="content" className="mt-0">
                    <ContentTab onShowPreview={handleShowPreview} />
                  </TabsContent>

                  <TabsContent value="analytics" className="mt-0">
                    <AnalyticsTab />
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* Preview Dialog */}
        {/* <WidgetPreviewDialog
          open={showPreview}
          onOpenChange={setShowPreview}
          mode={previewMode}
          tab={previewTab}
          onModeChange={setPreviewMode}
          onTabChange={setPreviewTab}
        /> */}
        <TestimonialPreview
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
        />
      </motion.div>
    );
  });

export default TestimonialWebsiteSettings;
