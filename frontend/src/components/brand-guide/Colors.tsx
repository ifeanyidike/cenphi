import { motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import { brandGuideStore } from "@/stores/brandGuideStore";
import ColorPicker from "./ColorPickerComponent";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Icons
import { Palette } from "lucide-react";
import { itemVariants } from "./constants";

const Colors = () => {
  const store = brandGuideStore;
  const { brandData } = store;
  return (
    <motion.div variants={itemVariants}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Color System
          </CardTitle>
          <CardDescription>
            Define your brand's color palette for consistent visual
            representation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Essential Brand Colors Only */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex items-center gap-3">
                    <ColorPicker
                      color={brandData.colors.primary}
                      onChange={(color) =>
                        store.updateBrandData(["colors", "primary"], color)
                      }
                      showHexInput={false}
                    />
                    <Input
                      id="primary-color"
                      value={brandData.colors.primary}
                      onChange={(e) =>
                        store.updateBrandData(
                          ["colors", "primary"],
                          e.target.value
                        )
                      }
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Your main brand color
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="flex items-center gap-3">
                    <ColorPicker
                      color={brandData.colors.secondary}
                      onChange={(color) =>
                        store.updateBrandData(["colors", "secondary"], color)
                      }
                      showHexInput={false}
                    />
                    <Input
                      id="secondary-color"
                      value={brandData.colors.secondary}
                      onChange={(e) =>
                        store.updateBrandData(
                          ["colors", "secondary"],
                          e.target.value
                        )
                      }
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Complementary brand color
                  </p>
                </div>
              </div>

              {/* Live Color Preview */}
              <div className="space-y-3">
                <Label>Preview</Label>
                <div className="border rounded-lg overflow-hidden bg-white">
                  <div className="p-4 space-y-3">
                    <div className="flex gap-2">
                      <button
                        className="px-4 py-2 rounded-md text-sm font-medium text-white"
                        style={{
                          backgroundColor: brandData.colors.primary,
                        }}
                      >
                        Primary Button
                      </button>
                      <button
                        className="px-4 py-2 rounded-md text-sm font-medium text-white"
                        style={{
                          backgroundColor: brandData.colors.secondary,
                        }}
                      >
                        Secondary
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <div
                        className="flex-1 h-12 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                        style={{
                          backgroundColor: brandData.colors.primary,
                        }}
                      >
                        {brandData.colors.primary}
                      </div>
                      <div
                        className="flex-1 h-12 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                        style={{
                          backgroundColor: brandData.colors.secondary,
                        }}
                      >
                        {brandData.colors.secondary}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default observer(Colors);
