import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

// Icons
import { Moon, Sun, Type } from "lucide-react";
import { getContrastColor, itemVariants } from "./constants";
import { fontOptions, getFontFamily } from "./fonts";
import { observer } from "mobx-react-lite";
import { brandGuideStore } from "@/stores/brandGuideStore";
import { ColorMode } from "@/types/setup";
import { FC } from "react";

type TypographyProps = {
  setColorMode: React.Dispatch<React.SetStateAction<ColorMode>>;
  colorMode: ColorMode;
};
const Typography: FC<TypographyProps> = ({ colorMode, setColorMode }) => {
  const store = brandGuideStore;
  const { brandData } = store;

  // Calculate font sizes based on ratio
  const calculateFontSizes = () => {
    const { baseSize, ratio } = brandData.typography;
    return {
      xs: Math.round((baseSize / ratio) * 10) / 10,
      sm: Math.round((baseSize / Math.sqrt(ratio)) * 10) / 10,
      base: baseSize,
      lg: Math.round(baseSize * Math.sqrt(ratio) * 10) / 10,
      xl: Math.round(baseSize * ratio * 10) / 10,
      "2xl": Math.round(baseSize * ratio * Math.sqrt(ratio) * 10) / 10,
      "3xl": Math.round(baseSize * ratio * ratio * 10) / 10,
      "4xl": Math.round(baseSize * ratio * ratio * Math.sqrt(ratio) * 10) / 10,
      "5xl": Math.round(baseSize * ratio * ratio * ratio * 10) / 10,
    };
  };

  const fontSizes = calculateFontSizes();
  return (
    <>
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5 text-primary" />
              Typography
            </CardTitle>
            <CardDescription>
              Select fonts and customize typography settings for your brand
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="heading-font">Heading Font</Label>
                  <Select
                    value={brandData.typography.headingFont}
                    onValueChange={(value) =>
                      store.updateBrandData(
                        ["typography", "headingFont"],
                        value
                      )
                    }
                  >
                    <SelectTrigger id="heading-font">
                      <SelectValue placeholder="Select a font" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System UI</SelectItem>
                      <div className="py-1.5 px-2 text-xs font-semibold text-gray-500 bg-gray-50 dark:bg-gray-800">
                        Sans-Serif Fonts
                      </div>
                      {fontOptions
                        .filter((font) => font.category === "sans")
                        .map((font) => (
                          <SelectItem
                            key={font.value}
                            value={font.value}
                            style={{
                              fontFamily: `${font.label}, ${font.fallback}`,
                            }}
                          >
                            {font.label}
                          </SelectItem>
                        ))}
                      <div className="py-1.5 px-2 text-xs font-semibold text-gray-500 bg-gray-50 dark:bg-gray-800">
                        Serif Fonts
                      </div>
                      {fontOptions
                        .filter((font) => font.category === "serif")
                        .map((font) => (
                          <SelectItem
                            key={font.value}
                            value={font.value}
                            style={{
                              fontFamily: `${font.label}, ${font.fallback}`,
                            }}
                          >
                            {font.label}
                          </SelectItem>
                        ))}
                      <div className="py-1.5 px-2 text-xs font-semibold text-gray-500 bg-gray-50 dark:bg-gray-800">
                        Display Fonts
                      </div>
                      {fontOptions
                        .filter((font) => font.category === "display")
                        .map((font) => (
                          <SelectItem
                            key={font.value}
                            value={font.value}
                            style={{
                              fontFamily: `${font.label}, ${font.fallback}`,
                            }}
                          >
                            {font.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Used for headings, titles, and important text
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="body-font">Body Font</Label>
                  <Select
                    value={brandData.typography.bodyFont}
                    onValueChange={(value) =>
                      store.updateBrandData(["typography", "bodyFont"], value)
                    }
                  >
                    <SelectTrigger id="body-font">
                      <SelectValue placeholder="Select a font" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System UI</SelectItem>
                      <div className="py-1.5 px-2 text-xs font-semibold text-gray-500 bg-gray-50 dark:bg-gray-800">
                        Sans-Serif Fonts
                      </div>
                      {fontOptions
                        .filter((font) => font.category === "sans")
                        .map((font) => (
                          <SelectItem
                            key={font.value}
                            value={font.value}
                            style={{
                              fontFamily: `${font.label}, ${font.fallback}`,
                            }}
                          >
                            {font.label}
                          </SelectItem>
                        ))}
                      <div className="py-1.5 px-2 text-xs font-semibold text-gray-500 bg-gray-50 dark:bg-gray-800">
                        Serif Fonts
                      </div>
                      {fontOptions
                        .filter((font) => font.category === "serif")
                        .map((font) => (
                          <SelectItem
                            key={font.value}
                            value={font.value}
                            style={{
                              fontFamily: `${font.label}, ${font.fallback}`,
                            }}
                          >
                            {font.label}
                          </SelectItem>
                        ))}
                      <div className="py-1.5 px-2 text-xs font-semibold text-gray-500 bg-gray-50 dark:bg-gray-800">
                        Monospace Fonts
                      </div>
                      {fontOptions
                        .filter((font) => font.category === "mono")
                        .map((font) => (
                          <SelectItem
                            key={font.value}
                            value={font.value}
                            style={{
                              fontFamily: `${font.label}, ${font.fallback}`,
                            }}
                          >
                            {font.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Used for paragraphs, descriptions, and general text
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="base-size" className="flex justify-between">
                      <span>Base Size</span>
                      <span className="text-xs text-gray-500">
                        {brandData.typography.baseSize}px
                      </span>
                    </Label>
                    <div className="grid grid-cols-[1fr_80px] gap-2">
                      <Slider
                        value={[brandData.typography.baseSize]}
                        min={12}
                        max={20}
                        step={1}
                        onValueChange={(values) =>
                          store.updateBrandData(
                            ["typography", "baseSize"],
                            values[0]
                          )
                        }
                      />
                      <Input
                        id="base-size"
                        type="number"
                        min={12}
                        max={20}
                        value={brandData.typography.baseSize}
                        onChange={(e) =>
                          store.updateBrandData(
                            ["typography", "baseSize"],
                            parseInt(e.target.value) || 16
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="type-scale"
                      className="flex justify-between"
                    >
                      <span>Type Scale</span>
                      <span className="text-xs text-gray-500">
                        {brandData.typography.ratio.toFixed(2)}
                      </span>
                    </Label>
                    <div className="grid grid-cols-[1fr_80px] gap-2">
                      <Slider
                        value={[brandData.typography.ratio]}
                        min={1.1}
                        max={1.5}
                        step={0.05}
                        onValueChange={(values) =>
                          store.updateBrandData(
                            ["typography", "ratio"],
                            values[0]
                          )
                        }
                      />
                      <Input
                        id="type-scale"
                        type="number"
                        min={1.1}
                        max={1.5}
                        step={0.05}
                        value={brandData.typography.ratio}
                        onChange={(e) =>
                          store.updateBrandData(
                            ["typography", "ratio"],
                            parseFloat(e.target.value) || 1.25
                          )
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Font Weights</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="heading-weight"
                        className="text-xs text-gray-500"
                      >
                        Headings
                      </Label>
                      <Select
                        value={brandData.typography.weights.heading.toString()}
                        onValueChange={(value) =>
                          store.updateBrandData(
                            ["typography", "weights", "heading"],
                            parseInt(value)
                          )
                        }
                      >
                        <SelectTrigger id="heading-weight">
                          <SelectValue placeholder="Select weight" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="400">Regular (400)</SelectItem>
                          <SelectItem value="500">Medium (500)</SelectItem>
                          <SelectItem value="600">Semibold (600)</SelectItem>
                          <SelectItem value="700">Bold (700)</SelectItem>
                          <SelectItem value="800">Extrabold (800)</SelectItem>
                          <SelectItem value="900">Black (900)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="body-weight"
                        className="text-xs text-gray-500"
                      >
                        Body Text
                      </Label>
                      <Select
                        value={brandData.typography.weights.body.toString()}
                        onValueChange={(value) =>
                          store.updateBrandData(
                            ["typography", "weights", "body"],
                            parseInt(value)
                          )
                        }
                      >
                        <SelectTrigger id="body-weight">
                          <SelectValue placeholder="Select weight" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="300">Light (300)</SelectItem>
                          <SelectItem value="400">Regular (400)</SelectItem>
                          <SelectItem value="500">Medium (500)</SelectItem>
                          <SelectItem value="600">Semibold (600)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="letter-spacing"
                      className="flex justify-between"
                    >
                      <span>Letter Spacing</span>
                      <span className="text-xs text-gray-500">
                        {brandData.typography.letterSpacing}
                      </span>
                    </Label>
                    <div className="grid grid-cols-[1fr_80px] gap-2">
                      <Slider
                        value={[brandData.typography.letterSpacing]}
                        min={-0.05}
                        max={0.1}
                        step={0.01}
                        onValueChange={(values) =>
                          store.updateBrandData(
                            ["typography", "letterSpacing"],
                            values[0]
                          )
                        }
                      />
                      <Input
                        id="letter-spacing"
                        type="number"
                        min={-0.05}
                        max={0.1}
                        step={0.01}
                        value={brandData.typography.letterSpacing}
                        onChange={(e) =>
                          store.updateBrandData(
                            ["typography", "letterSpacing"],
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="line-height"
                      className="flex justify-between"
                    >
                      <span>Line Height</span>
                      <span className="text-xs text-gray-500">
                        {brandData.typography.lineHeight.toFixed(2)}
                      </span>
                    </Label>
                    <div className="grid grid-cols-[1fr_80px] gap-2">
                      <Slider
                        value={[brandData.typography.lineHeight]}
                        min={1}
                        max={2}
                        step={0.05}
                        onValueChange={(values) =>
                          store.updateBrandData(
                            ["typography", "lineHeight"],
                            values[0]
                          )
                        }
                      />
                      <Input
                        id="line-height"
                        type="number"
                        min={1}
                        max={2}
                        step={0.05}
                        value={brandData.typography.lineHeight}
                        onChange={(e) =>
                          store.updateBrandData(
                            ["typography", "lineHeight"],
                            parseFloat(e.target.value) || 1.5
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="p-3 border-b bg-gray-50 dark:bg-gray-900 flex justify-between">
                  <h3 className="text-sm font-medium">Typography Preview</h3>
                  <div className="flex items-center gap-1">
                    <button
                      className={cn(
                        "p-1 rounded",
                        colorMode === "light"
                          ? "bg-white shadow-sm"
                          : "text-gray-400"
                      )}
                      onClick={() => setColorMode("light")}
                    >
                      <Sun className="h-3.5 w-3.5" />
                    </button>
                    <button
                      className={cn(
                        "p-1 rounded",
                        colorMode === "dark"
                          ? "bg-gray-800 shadow-sm"
                          : "text-gray-400"
                      )}
                      onClick={() => setColorMode("dark")}
                    >
                      <Moon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div
                  className="p-5 space-y-4 overflow-y-auto"
                  style={{
                    height: "500px",
                    color: colorMode === "light" ? "#000" : "#fff",
                    backgroundColor: colorMode === "light" ? "#fff" : "#111",
                  }}
                >
                  <div>
                    <h1
                      style={{
                        fontFamily: getFontFamily(
                          brandData.typography.headingFont
                        ),
                        fontSize: `${fontSizes["4xl"]}px`,
                        fontWeight: brandData.typography.weights.heading,
                        letterSpacing: `${brandData.typography.letterSpacing}em`,
                        lineHeight: brandData.typography.lineHeight,
                      }}
                    >
                      The quick brown fox jumps over the lazy dog
                    </h1>
                    <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>H1 - {fontSizes["4xl"]}px</span>
                      <span>
                        {getFontFamily(brandData.typography.headingFont)}{" "}
                        {brandData.typography.weights.heading}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <h2
                      style={{
                        fontFamily: getFontFamily(
                          brandData.typography.headingFont
                        ),
                        fontSize: `${fontSizes["3xl"]}px`,
                        fontWeight: brandData.typography.weights.heading,
                        letterSpacing: `${brandData.typography.letterSpacing}em`,
                        lineHeight: brandData.typography.lineHeight,
                      }}
                    >
                      The five boxing wizards jump quickly
                    </h2>
                    <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>H2 - {fontSizes["3xl"]}px</span>
                      <span>
                        {getFontFamily(brandData.typography.headingFont)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <h3
                      style={{
                        fontFamily: getFontFamily(
                          brandData.typography.headingFont
                        ),
                        fontSize: `${fontSizes["2xl"]}px`,
                        fontWeight: brandData.typography.weights.heading,
                        letterSpacing: `${brandData.typography.letterSpacing}em`,
                        lineHeight: brandData.typography.lineHeight,
                      }}
                    >
                      How vexingly quick daft zebras jump!
                    </h3>
                    <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>H3 - {fontSizes["2xl"]}px</span>
                      <span>
                        {getFontFamily(brandData.typography.headingFont)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <h4
                      style={{
                        fontFamily: getFontFamily(
                          brandData.typography.headingFont
                        ),
                        fontSize: `${fontSizes["xl"]}px`,
                        fontWeight: brandData.typography.weights.heading,
                        letterSpacing: `${brandData.typography.letterSpacing}em`,
                        lineHeight: brandData.typography.lineHeight,
                      }}
                    >
                      Sphinx of black quartz, judge my vow
                    </h4>
                    <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>H4 - {fontSizes["xl"]}px</span>
                      <span>
                        {getFontFamily(brandData.typography.headingFont)}
                      </span>
                    </div>
                  </div>

                  <div className="my-6 border-t border-gray-200 dark:border-gray-800" />

                  <div>
                    <p
                      style={{
                        fontFamily: getFontFamily(
                          brandData.typography.bodyFont
                        ),
                        fontSize: `${fontSizes.base}px`,
                        fontWeight: brandData.typography.weights.body,
                        letterSpacing: `${brandData.typography.letterSpacing}em`,
                        lineHeight: brandData.typography.lineHeight,
                      }}
                    >
                      Body text looks like this. This demonstrates how your
                      brand's typography will appear in paragraphs and general
                      content. Good typography enhances readability and user
                      experience across all platforms and devices. It helps
                      establish visual hierarchy and guides the reader's eye
                      through the content.
                    </p>
                    <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>Body - {fontSizes.base}px</span>
                      <span>
                        {getFontFamily(brandData.typography.bodyFont)}{" "}
                        {brandData.typography.weights.body}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3">
                    <p
                      style={{
                        fontFamily: getFontFamily(
                          brandData.typography.bodyFont
                        ),
                        fontSize: `${fontSizes.sm}px`,
                        fontWeight: brandData.typography.weights.body,
                        letterSpacing: `${brandData.typography.letterSpacing}em`,
                        lineHeight: brandData.typography.lineHeight,
                        color: colorMode === "light" ? "#6b7280" : "#9ca3af",
                      }}
                    >
                      This is smaller text often used for captions, footnotes,
                      and secondary information. It's still important to
                      maintain readability at this size, especially on smaller
                      devices. The right balance of size, weight, and spacing
                      ensures all text remains legible.
                    </p>
                    <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>Small - {fontSizes.sm}px</span>
                      <span>
                        {getFontFamily(brandData.typography.bodyFont)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex flex-wrap gap-3">
                      <div
                        className="py-2 px-4 rounded-md"
                        style={{
                          fontFamily: getFontFamily(
                            brandData.typography.bodyFont
                          ),
                          fontSize: `${fontSizes.sm}px`,
                          fontWeight: 500,
                          backgroundColor: brandData.colors.primary,
                          color: getContrastColor(brandData.colors.primary),
                        }}
                      >
                        Primary Button
                      </div>

                      <div
                        className="py-2 px-4 rounded-md"
                        style={{
                          fontFamily: getFontFamily(
                            brandData.typography.bodyFont
                          ),
                          fontSize: `${fontSizes.sm}px`,
                          fontWeight: 500,
                          backgroundColor: brandData.colors.secondary,
                          color: getContrastColor(brandData.colors.secondary),
                        }}
                      >
                        Secondary Button
                      </div>

                      <div
                        className="py-2 px-4 rounded-md border"
                        style={{
                          fontFamily: getFontFamily(
                            brandData.typography.bodyFont
                          ),
                          fontSize: `${fontSizes.sm}px`,
                          fontWeight: 500,
                          borderColor: brandData.colors.primary,
                          color: brandData.colors.primary,
                        }}
                      >
                        Outline Button
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
};

export default observer(Typography);
