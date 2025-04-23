import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { CheckCircle, Flag, Image, Sparkles, Upload, X } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { observer } from "mobx-react-lite";
import { cardTransition, itemVariants } from "./constants";
import { FC } from "react";
import { brandGuideStore } from "@/stores/brandGuideStore";
import { useDropzone } from "react-dropzone";

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
  // Logo upload dropzone

  const handleLogoUpload = (
    field: "main" | "alt" | "favicon" | "darkMode",
    file: File
  ) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        store.updateBrandData(["logo", field], e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const {
    getRootProps: getMainLogoProps,
    getInputProps: getMainLogoInputProps,
  } = useDropzone({
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".svg"],
    },
    maxFiles: 1,
    onDrop: (files) => handleLogoUpload("main", files[0]),
  });

  const {
    getRootProps: getDarkLogoProps,
    getInputProps: getDarkLogoInputProps,
  } = useDropzone({
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".svg"],
    },
    maxFiles: 1,
    onDrop: (files) => handleLogoUpload("darkMode", files[0]),
  });

  const { getRootProps: getFaviconProps, getInputProps: getFaviconInputProps } =
    useDropzone({
      accept: {
        "image/*": [".jpeg", ".jpg", ".png", ".svg", ".ico"],
      },
      maxFiles: 1,
      onDrop: (files) => handleLogoUpload("favicon", files[0]),
    });
  return (
    <>
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-primary" />
              Brand Essentials
            </CardTitle>
            <CardDescription>
              Define the core elements that make your brand unique and
              recognizable
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
            {/* Brand identity */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brand-name">Brand Name</Label>
                <Input
                  id="brand-name"
                  placeholder="Your Brand Name"
                  defaultValue={brandData.name}
                  onChange={(e) =>
                    store.updateBrandData(["name"], e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand-tagline">Tagline</Label>
                <Input
                  id="brand-tagline"
                  placeholder="Your compelling tagline"
                  value={brandData.tagline}
                  onChange={(e) =>
                    store.updateBrandData(["tagline"], e.target.value)
                  }
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  A concise phrase that captures your brand's value proposition
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand-description">Brand Description</Label>
                <Textarea
                  id="brand-description"
                  placeholder="Briefly describe what makes your brand unique"
                  value={brandData.description}
                  onChange={(e) =>
                    store.updateBrandData(["description"], e.target.value)
                  }
                  className="min-h-[100px]"
                />
              </div>
            </div>

            {/* Brand logo */}
            <div className="space-y-5">
              <div className="space-y-3">
                <Label>Primary Logo</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    className="border border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    {...getMainLogoProps()}
                  >
                    <input {...getMainLogoInputProps()} />
                    {brandData.logo.main ? (
                      <div className="relative group">
                        <div className="aspect-video w-full flex items-center justify-center p-4 bg-white rounded-md">
                          <img
                            src={brandData.logo.main}
                            alt="Brand Logo"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="mr-2"
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            Change
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              store.updateBrandData(["logo", "main"], null);
                            }}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Image className="h-10 w-10 text-gray-400 mb-2" />
                        <p className="text-sm font-medium mb-1">
                          Upload primary logo
                        </p>
                        <p className="text-xs text-gray-500 text-center">
                          SVG, PNG or JPG (max. 2MB)
                          <br />
                          Recommended size: 400x200px
                        </p>
                      </>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div
                      className="border border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                      {...getDarkLogoProps()}
                    >
                      <input {...getDarkLogoInputProps()} />
                      {brandData.logo.darkMode ? (
                        <div className="relative group">
                          <div className="h-16 w-full flex items-center justify-center p-2 bg-gray-900 rounded-md">
                            <img
                              src={brandData.logo.darkMode}
                              alt="Dark Mode Logo"
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                store.updateBrandData(
                                  ["logo", "darkMode"],
                                  null
                                );
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-1">
                          <p className="text-xs font-medium mb-1">
                            Dark Mode Logo
                          </p>
                        </div>
                      )}
                    </div>

                    <div
                      className="border border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                      {...getFaviconProps()}
                    >
                      <input {...getFaviconInputProps()} />
                      {brandData.logo.favicon ? (
                        <div className="relative group">
                          <div className="h-12 w-12 mx-auto flex items-center justify-center p-1 bg-white rounded-md">
                            <img
                              src={brandData.logo.favicon}
                              alt="Favicon"
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                store.updateBrandData(
                                  ["logo", "favicon"],
                                  null
                                );
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-1">
                          <p className="text-xs font-medium mb-1">Favicon</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Label className="mb-2 block">Logo Guidelines</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                    <h4 className="font-medium mb-1 text-sm">Minimum Size</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Never display your logo smaller than 32px in height to
                      ensure legibility.
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                    <h4 className="font-medium mb-1 text-sm">Clear Space</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Maintain clear space around the logo of at least the
                      height of the logo's "x-height".
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Brand Presets
            </CardTitle>
            <CardDescription>
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
                      <h3 className="font-medium text-sm">{preset.name}</h3>
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
