import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { CheckCircle, Flag, Sparkles, Users } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { cn } from "@/lib/utils";
import { observer } from "mobx-react-lite";
import { cardTransition, itemVariants } from "./constants";
import { FC } from "react";
import { brandGuideStore } from "@/stores/brandGuideStore";

type EssentialsProps = {
  handleApplyPreset: (presetId: string) => void;
  selectedPreset: string | null;
};
const Essentials: FC<EssentialsProps> = ({
  handleApplyPreset,
  selectedPreset,
}) => {
  const store = brandGuideStore;
  const { brandData, brandPresets } = store;
  return (
    <>
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Flag className="h-4 w-4 text-primary" />
              Brand Essentials
            </CardTitle>
            <CardDescription className="text-xs">
              Define the core elements that make your brand unique and
              recognizable
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
            {/* Brand identity */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brand-name" className="text-xs">
                  Brand Name
                </Label>
                <Input
                  id="brand-name"
                  placeholder="Your Brand Name"
                  defaultValue={brandData.name}
                  onChange={(e) =>
                    store.updateBrandData(["name"], e.target.value)
                  }
                  className="text-xs h-8"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand-tagline" className="text-xs">
                  Tagline
                </Label>
                <Input
                  id="brand-tagline"
                  placeholder="Your compelling tagline"
                  value={brandData.tagline}
                  onChange={(e) =>
                    store.updateBrandData(["tagline"], e.target.value)
                  }
                  className="text-xs h-8"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  A concise phrase that captures your brand's value proposition
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand-description" className="text-xs">
                  Brand Description
                </Label>
                <Textarea
                  id="brand-description"
                  placeholder="Briefly describe what makes your brand unique"
                  value={brandData.description}
                  onChange={(e) =>
                    store.updateBrandData(["description"], e.target.value)
                  }
                  className="min-h-[80px] text-xs"
                />
              </div>
            </div>

            {/* Brand logo - Simplified */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logo-url" className="text-xs">
                  Logo URL
                </Label>
                <Input
                  id="logo-url"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={brandData.logo.main || ""}
                  onChange={(e) =>
                    store.updateBrandData(["logo", "main"], e.target.value)
                  }
                  className="text-xs h-8"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Paste the direct URL to your logo image (PNG, JPG, or SVG)
                </p>
              </div>

              {/* Live Preview */}
              {brandData.logo.main && (
                <div className="space-y-2">
                  <Label className="text-xs">Live Preview</Label>
                  <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                    <div className="max-w-48 max-h-20 mx-auto">
                      <img
                        src={brandData.logo.main}
                        alt="Logo Preview"
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Brand Voice & Context */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-primary" />
              Brand Voice & Context
            </CardTitle>
            <CardDescription className="text-xs">
              Define your brand's personality, values, and target audience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="industry" className="text-xs">
                    Industry
                  </Label>
                  <Input
                    id="industry"
                    placeholder="e.g., Technology, Healthcare, Finance"
                    value={brandData.voice?.attributes?.[0] || ""}
                    onChange={(e) => {
                      const currentAttributes =
                        brandData.voice?.attributes || [];
                      const newAttributes = e.target.value
                        ? [e.target.value, ...currentAttributes.slice(1)]
                        : currentAttributes.slice(1);
                      store.updateBrandData(
                        ["voice", "attributes"],
                        newAttributes
                      );
                    }}
                    className="text-xs h-8"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Your primary business industry or sector
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tone" className="text-xs">
                    Brand Tone
                  </Label>
                  <Select
                    value={brandData.voice?.tone || ""}
                    onValueChange={(value) =>
                      store.updateBrandData(["voice", "tone"], value)
                    }
                  >
                    <SelectTrigger id="tone" className="text-xs h-8">
                      <SelectValue placeholder="Select brand tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="authoritative">
                        Authoritative
                      </SelectItem>
                      <SelectItem value="inspiring">Inspiring</SelectItem>
                      <SelectItem value="playful">Playful</SelectItem>
                      <SelectItem value="sophisticated">
                        Sophisticated
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    The general tone of voice for your brand communications
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="values" className="text-xs">
                    Brand Values
                  </Label>
                  <Input
                    id="values"
                    placeholder="e.g., innovation, reliability, customer-first"
                    value={brandData.voice?.personality?.join(", ") || ""}
                    onChange={(e) => {
                      const values = e.target.value
                        .split(",")
                        .map((v) => v.trim())
                        .filter((v) => v);
                      store.updateBrandData(["voice", "personality"], values);
                    }}
                    className="text-xs h-8"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Core values that define your brand (comma-separated)
                  </p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mission" className="text-xs">
                    Mission Statement
                  </Label>
                  <Textarea
                    id="mission"
                    placeholder="A brief description of your company's mission and purpose"
                    value={brandData.mission || ""}
                    onChange={(e) =>
                      store.updateBrandData(["mission"], e.target.value)
                    }
                    rows={3}
                    className="text-xs"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Your company's mission and core purpose
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audience" className="text-xs">
                    Target Audience
                  </Label>
                  <Textarea
                    id="audience"
                    placeholder="Describe your ideal customers and target market"
                    value={brandData.audience || ""}
                    onChange={(e) =>
                      store.updateBrandData(["audience"], e.target.value)
                    }
                    rows={3}
                    className="text-xs"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Who your products or services are designed for
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              Brand Presets
            </CardTitle>
            <CardDescription className="text-xs">
              Start with a predefined style and customize to fit your brand
              identity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {brandPresets.map((preset) => (
                <motion.div
                  key={preset.id}
                  className={cn(
                    "border rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-md",
                    selectedPreset === preset.id && "ring-2 ring-primary"
                  )}
                  onClick={() => handleApplyPreset(preset.id)}
                  whileHover={{ y: -4 }}
                  transition={cardTransition}
                >
                  <div
                    className="h-28 grid grid-cols-4"
                    style={{ gridTemplateRows: "1fr 1fr" }}
                  >
                    <div
                      className="col-span-2 row-span-2"
                      style={{ background: preset.colors.primary }}
                    />
                    <div style={{ background: preset.colors.secondary }} />
                    <div style={{ background: preset.colors.accent }} />
                    <div style={{ background: preset.colors.success }} />
                    <div style={{ background: preset.colors.warning }} />
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-xs">{preset.name}</h3>
                      {selectedPreset === preset.id && (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {preset.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
};

export default observer(Essentials);
