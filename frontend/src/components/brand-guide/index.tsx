import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import { brandGuideStore } from "@/stores/brandGuideStore";
import { workspaceHub } from "@/repo/workspace_hub";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

// Icons
import { Loader2, Save, Shield } from "lucide-react";
import Essentials from "./Essentials";
import { BrandGuide as BrandGuideType } from "@/types/setup";
import { containerVariants, itemVariants } from "./constants";
import Colors from "./Colors";
import Typography from "./Typography";
// import Testimonials from "./Testimonials";
import TabListElement from "./TabList";

interface BrandGuideProps {
  onSave?: (data: BrandGuideType) => void;
  className?: string;
}

const BrandGuide: React.FC<BrandGuideProps> = observer(
  ({ onSave, className }) => {
    // State from MobX store
    const { brandData, saveChanges, applyPreset } = brandGuideStore;

    // Local component state
    const [activeTab, setActiveTab] = useState<string>("essentials");
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

    // Initialize from workspace brand context on mount
    useEffect(() => {
      if (workspaceHub.workspace?.brand_context) {
        brandGuideStore.initializeFromWorkspace(
          workspaceHub.workspace.brand_context
        );
      }
    }, [workspaceHub.workspace?.brand_context]);

    // Handle save action
    const handleSave = async () => {
      setIsSaving(true);
      try {
        await saveChanges();
        if (onSave) {
          onSave(brandData);
        }
        setTimeout(() => {
          setIsSaving(false);
        }, 1000);
      } catch (error) {
        console.error("Error saving brand guide:", error);
        setIsSaving(false);
      }
    };

    // Apply preset and track selection
    const handleApplyPreset = (presetId: string) => {
      setSelectedPreset(presetId);
      applyPreset(presetId);
    };

    return (
      <div
        className={cn("w-full", className)}
        style={
          {
            "--primary-color": brandData.colors.primary,
            "--secondary-color": brandData.colors.secondary,
          } as React.CSSProperties
        }
      >
        <motion.div
          className="min-h-screen bg-white dark:bg-gray-950"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Header with progress and actions */}
          <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800">
            <div className="container flex h-16 items-center justify-between">
              <motion.div className="flex items-center" variants={itemVariants}>
                <Shield className="h-5 w-5 text-primary mr-2" />
                <h1 className="text-xl font-bold">Brand Guide</h1>
              </motion.div>

              <motion.div
                className="flex items-center gap-2"
                variants={itemVariants}
              >
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="relative"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      <span>Save Changes</span>
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </header>

          <main className="container py-6">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-6"
            >
              <TabListElement />

              {/* Brand Essentials */}
              <TabsContent value="essentials" className="space-y-6">
                <Essentials
                  handleApplyPreset={handleApplyPreset}
                  selectedPreset={selectedPreset}
                />
              </TabsContent>

              {/* Colors */}
              <TabsContent value="colors" className="space-y-6">
                <Colors />
              </TabsContent>

              {/* Typography */}
              <TabsContent value="typography" className="space-y-6">
                <Typography colorMode="light" setColorMode={() => {}} />
              </TabsContent>
            </Tabs>
          </main>
        </motion.div>
      </div>
    );
  }
);

export default BrandGuide;
