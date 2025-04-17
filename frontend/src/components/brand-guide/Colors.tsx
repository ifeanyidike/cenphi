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
import { getContrastColor, itemVariants } from "./constants";

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
            {/* Brand Colors */}
            <div>
              <h3 className="text-sm font-medium mb-3">Brand Colors</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="primary-color"
                    className="flex justify-between"
                  >
                    <span>Primary</span>
                    <span className="text-xs text-gray-500">
                      {brandData.colors.primary}
                    </span>
                  </Label>
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
                    Main brand color used for primary actions and key elements
                  </p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="secondary-color"
                    className="flex justify-between"
                  >
                    <span>Secondary</span>
                    <span className="text-xs text-gray-500">
                      {brandData.colors.secondary}
                    </span>
                  </Label>
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
                    Complementary color used for secondary actions and accents
                  </p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="accent-color"
                    className="flex justify-between"
                  >
                    <span>Accent</span>
                    <span className="text-xs text-gray-500">
                      {brandData.colors.accent}
                    </span>
                  </Label>
                  <div className="flex items-center gap-3">
                    <ColorPicker
                      color={brandData.colors.accent}
                      onChange={(color) =>
                        store.updateBrandData(["colors", "accent"], color)
                      }
                      showHexInput={false}
                    />
                    <Input
                      id="accent-color"
                      value={brandData.colors.accent}
                      onChange={(e) =>
                        store.updateBrandData(
                          ["colors", "accent"],
                          e.target.value
                        )
                      }
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Highlight color to draw attention to specific elements
                  </p>
                </div>
              </div>
            </div>

            {/* Functional Colors */}
            <div>
              <h3 className="text-sm font-medium mb-3">Functional Colors</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="success-color"
                    className="flex justify-between"
                  >
                    <span>Success</span>
                    <span className="text-xs text-gray-500">
                      {brandData.colors.success}
                    </span>
                  </Label>
                  <div className="flex items-center gap-3">
                    <ColorPicker
                      color={brandData.colors.success}
                      onChange={(color) =>
                        store.updateBrandData(["colors", "success"], color)
                      }
                      showHexInput={false}
                    />
                    <Input
                      id="success-color"
                      value={brandData.colors.success}
                      onChange={(e) =>
                        store.updateBrandData(
                          ["colors", "success"],
                          e.target.value
                        )
                      }
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="warning-color"
                    className="flex justify-between"
                  >
                    <span>Warning</span>
                    <span className="text-xs text-gray-500">
                      {brandData.colors.warning}
                    </span>
                  </Label>
                  <div className="flex items-center gap-3">
                    <ColorPicker
                      color={brandData.colors.warning}
                      onChange={(color) =>
                        store.updateBrandData(["colors", "warning"], color)
                      }
                      showHexInput={false}
                    />
                    <Input
                      id="warning-color"
                      value={brandData.colors.warning}
                      onChange={(e) =>
                        store.updateBrandData(
                          ["colors", "warning"],
                          e.target.value
                        )
                      }
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="error-color" className="flex justify-between">
                    <span>Error</span>
                    <span className="text-xs text-gray-500">
                      {brandData.colors.error}
                    </span>
                  </Label>
                  <div className="flex items-center gap-3">
                    <ColorPicker
                      color={brandData.colors.error}
                      onChange={(color) =>
                        store.updateBrandData(["colors", "error"], color)
                      }
                      showHexInput={false}
                    />
                    <Input
                      id="error-color"
                      value={brandData.colors.error}
                      onChange={(e) =>
                        store.updateBrandData(
                          ["colors", "error"],
                          e.target.value
                        )
                      }
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Interface Colors */}
            <div>
              <h3 className="text-sm font-medium mb-3">Interface Colors</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="background-color"
                    className="flex justify-between"
                  >
                    <span>Background</span>
                    <span className="text-xs text-gray-500">
                      {brandData.colors.background}
                    </span>
                  </Label>
                  <div className="flex items-center gap-3">
                    <ColorPicker
                      color={brandData.colors.background}
                      onChange={(color) =>
                        store.updateBrandData(["colors", "background"], color)
                      }
                      showHexInput={false}
                    />
                    <Input
                      id="background-color"
                      value={brandData.colors.background}
                      onChange={(e) =>
                        store.updateBrandData(
                          ["colors", "background"],
                          e.target.value
                        )
                      }
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="foreground-color"
                    className="flex justify-between"
                  >
                    <span>Foreground</span>
                    <span className="text-xs text-gray-500">
                      {brandData.colors.foreground}
                    </span>
                  </Label>
                  <div className="flex items-center gap-3">
                    <ColorPicker
                      color={brandData.colors.foreground}
                      onChange={(color) =>
                        store.updateBrandData(["colors", "foreground"], color)
                      }
                      showHexInput={false}
                    />
                    <Input
                      id="foreground-color"
                      value={brandData.colors.foreground}
                      onChange={(e) =>
                        store.updateBrandData(
                          ["colors", "foreground"],
                          e.target.value
                        )
                      }
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="muted-color" className="flex justify-between">
                    <span>Muted</span>
                    <span className="text-xs text-gray-500">
                      {brandData.colors.muted}
                    </span>
                  </Label>
                  <div className="flex items-center gap-3">
                    <ColorPicker
                      color={brandData.colors.muted}
                      onChange={(color) =>
                        store.updateBrandData(["colors", "muted"], color)
                      }
                      showHexInput={false}
                    />
                    <Input
                      id="muted-color"
                      value={brandData.colors.muted}
                      onChange={(e) =>
                        store.updateBrandData(
                          ["colors", "muted"],
                          e.target.value
                        )
                      }
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="surface-color"
                    className="flex justify-between"
                  >
                    <span>Surface</span>
                    <span className="text-xs text-gray-500">
                      {brandData.colors.surface}
                    </span>
                  </Label>
                  <div className="flex items-center gap-3">
                    <ColorPicker
                      color={brandData.colors.surface}
                      onChange={(color) =>
                        store.updateBrandData(["colors", "surface"], color)
                      }
                      showHexInput={false}
                    />
                    <Input
                      id="surface-color"
                      value={brandData.colors.surface}
                      onChange={(e) =>
                        store.updateBrandData(
                          ["colors", "surface"],
                          e.target.value
                        )
                      }
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Color Preview */}
            <div className="pt-6">
              <h3 className="text-sm font-medium mb-3">Color Preview</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className="h-24 rounded-lg flex items-center justify-center transition-all"
                      style={{
                        backgroundColor: brandData.colors.primary,
                        color: getContrastColor(brandData.colors.primary),
                      }}
                    >
                      <div className="text-center">
                        <p className="font-semibold">Primary</p>
                        <p className="text-xs opacity-90 mt-1">
                          {brandData.colors.primary}
                        </p>
                      </div>
                    </div>

                    <div
                      className="h-24 rounded-lg flex items-center justify-center transition-all"
                      style={{
                        backgroundColor: brandData.colors.secondary,
                        color: getContrastColor(brandData.colors.secondary),
                      }}
                    >
                      <div className="text-center">
                        <p className="font-semibold">Secondary</p>
                        <p className="text-xs opacity-90 mt-1">
                          {brandData.colors.secondary}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className="h-16 rounded-lg flex items-center justify-center transition-all"
                    style={{
                      backgroundColor: brandData.colors.accent,
                      color: getContrastColor(brandData.colors.accent),
                    }}
                  >
                    <div className="text-center">
                      <p className="font-semibold">Accent</p>
                      <p className="text-xs opacity-90 mt-1">
                        {brandData.colors.accent}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div
                      className="h-16 rounded-lg flex items-center justify-center transition-all"
                      style={{
                        backgroundColor: brandData.colors.success,
                        color: getContrastColor(brandData.colors.success),
                      }}
                    >
                      <div className="text-center">
                        <p className="font-semibold">Success</p>
                        <p className="text-xs opacity-90 mt-1">
                          {brandData.colors.success.substring(0, 7)}
                        </p>
                      </div>
                    </div>

                    <div
                      className="h-16 rounded-lg flex items-center justify-center transition-all"
                      style={{
                        backgroundColor: brandData.colors.warning,
                        color: getContrastColor(brandData.colors.warning),
                      }}
                    >
                      <div className="text-center">
                        <p className="font-semibold">Warning</p>
                        <p className="text-xs opacity-90 mt-1">
                          {brandData.colors.warning.substring(0, 7)}
                        </p>
                      </div>
                    </div>

                    <div
                      className="h-16 rounded-lg flex items-center justify-center transition-all"
                      style={{
                        backgroundColor: brandData.colors.error,
                        color: getContrastColor(brandData.colors.error),
                      }}
                    >
                      <div className="text-center">
                        <p className="font-semibold">Error</p>
                        <p className="text-xs opacity-90 mt-1">
                          {brandData.colors.error.substring(0, 7)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div
                    className="h-full"
                    style={{
                      backgroundColor: brandData.colors.background,
                      color: brandData.colors.foreground,
                    }}
                  >
                    <div
                      className="p-4 border-b"
                      style={{ borderColor: "rgba(0,0,0,0.1)" }}
                    >
                      <h3 className="text-base font-semibold mb-1">
                        UI Preview
                      </h3>
                      <p
                        className="text-sm"
                        style={{
                          color: brandData.colors.foreground + "99",
                        }}
                      >
                        How your colors look in a typical interface
                      </p>
                    </div>

                    <div className="p-4 space-y-4">
                      <div
                        className="p-4 rounded-lg"
                        style={{
                          backgroundColor: brandData.colors.surface,
                        }}
                      >
                        <h4 className="text-sm font-medium mb-2">
                          Card Component
                        </h4>
                        <p
                          className="text-xs"
                          style={{
                            color: brandData.colors.foreground + "99",
                          }}
                        >
                          This shows how a card element would appear with your
                          colors
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          className="px-3 py-1.5 rounded-md text-sm font-medium"
                          style={{
                            backgroundColor: brandData.colors.primary,
                            color: getContrastColor(brandData.colors.primary),
                          }}
                        >
                          Primary Button
                        </button>

                        <button
                          className="px-3 py-1.5 rounded-md text-sm font-medium"
                          style={{
                            backgroundColor: brandData.colors.secondary,
                            color: getContrastColor(brandData.colors.secondary),
                          }}
                        >
                          Secondary
                        </button>

                        <button
                          className="px-3 py-1.5 rounded-md text-sm font-medium border"
                          style={{
                            borderColor: brandData.colors.primary,
                            color: brandData.colors.primary,
                          }}
                        >
                          Outline
                        </button>
                      </div>

                      <div
                        className="rounded-md p-2 text-xs"
                        style={{
                          backgroundColor: brandData.colors.muted,
                          color: brandData.colors.foreground + "99",
                        }}
                      >
                        This is a muted background element with subdued text
                      </div>

                      <div
                        className="mt-4 pt-3 border-t"
                        style={{ borderColor: "rgba(0,0,0,0.1)" }}
                      >
                        <div className="flex items-center gap-2 text-sm">
                          <div
                            className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium"
                            style={{
                              backgroundColor: brandData.colors.primary,
                              color: getContrastColor(brandData.colors.primary),
                            }}
                          >
                            JD
                          </div>
                          <div>
                            <p className="font-medium">Jane Doe</p>
                            <p
                              className="text-xs"
                              style={{
                                color: brandData.colors.foreground + "99",
                              }}
                            >
                              Product Manager
                            </p>
                          </div>
                        </div>
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
