import { motion } from "framer-motion";

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
import { Label } from "@/components/ui/label";
// Icons
import { Type } from "lucide-react";
import { itemVariants } from "./constants";
import { getFontFamily } from "./fonts";
import { observer } from "mobx-react-lite";
import { brandGuideStore } from "@/stores/brandGuideStore";
import { ColorMode } from "@/types/setup";
import { FC } from "react";

type TypographyProps = {
  setColorMode: React.Dispatch<React.SetStateAction<ColorMode>>;
  colorMode: ColorMode;
};
const Typography: FC<TypographyProps> = () => {
  const store = brandGuideStore;
  const { brandData } = store;

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
              {/* Simplified Font Selection */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-font">Primary Font</Label>
                  <Select
                    value={brandData.typography.headingFont}
                    onValueChange={(value) =>
                      store.updateBrandData(
                        ["typography", "headingFont"],
                        value
                      )
                    }
                  >
                    <SelectTrigger id="primary-font">
                      <SelectValue placeholder="Select a font" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System UI</SelectItem>
                      <SelectItem value="inter">Inter</SelectItem>
                      <SelectItem value="poppins">Poppins</SelectItem>
                      <SelectItem value="roboto">Roboto</SelectItem>
                      <SelectItem value="open-sans">Open Sans</SelectItem>
                      <SelectItem value="montserrat">Montserrat</SelectItem>
                      <SelectItem value="playfair-display">Playfair Display</SelectItem>
                      <SelectItem value="merriweather">Merriweather</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Your main brand font for headings and important text
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
                      <SelectItem value="inter">Inter</SelectItem>
                      <SelectItem value="poppins">Poppins</SelectItem>
                      <SelectItem value="roboto">Roboto</SelectItem>
                      <SelectItem value="open-sans">Open Sans</SelectItem>
                      <SelectItem value="source-sans-pro">Source Sans Pro</SelectItem>
                      <SelectItem value="lato">Lato</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Font for body text and general content
                  </p>
                </div>
              </div>

              {/* Simple Typography Preview */}
              <div className="space-y-3">
                <Label>Preview</Label>
                <div className="border rounded-lg p-4 bg-white space-y-4">
                  <div>
                    <h1
                      style={{
                        fontFamily: getFontFamily(
                          brandData.typography.headingFont
                        ),
                        fontSize: "24px",
                        fontWeight: "600",
                        color: "#1a202c",
                        marginBottom: "8px",
                      }}
                    >
                      Your Brand Heading
                    </h1>
                    <p className="text-xs text-gray-500">
                      {getFontFamily(brandData.typography.headingFont)} - 24px Bold
                    </p>
                  </div>

                  <div>
                    <p
                      style={{
                        fontFamily: getFontFamily(
                          brandData.typography.bodyFont
                        ),
                        fontSize: "16px",
                        fontWeight: "400",
                        color: "#4a5568",
                        lineHeight: "1.5",
                        marginBottom: "4px",
                      }}
                    >
                      This is how your body text will look. It should be readable and complement your heading font nicely.
                    </p>
                    <p className="text-xs text-gray-500">
                      {getFontFamily(brandData.typography.bodyFont)} - 16px Regular
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      className="px-4 py-2 rounded-md text-white text-sm font-medium"
                      style={{
                        backgroundColor: brandData.colors.primary,
                        fontFamily: getFontFamily(brandData.typography.bodyFont),
                      }}
                    >
                      Button Example
                    </button>
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
