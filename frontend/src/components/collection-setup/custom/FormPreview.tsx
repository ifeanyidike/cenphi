import React, { useState, FC } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckIcon,
  MousePointerClick,
  Info,
  SunIcon,
  MoonIcon,
  Laptop,
  Smartphone,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Import component for drag-and-drop functionality
import { CollectionSettings, CustomSettings } from "@/types/setup";
import { itemVariants, standardFieldOptions } from "./constants";
import { observer } from "mobx-react-lite";

type FormPreviewProps = {
  previewRef: React.RefObject<HTMLDivElement>;
  settings: CollectionSettings["custom"];
};
const FormPreview: FC<FormPreviewProps> = ({ previewRef, settings }) => {
  const [activePreviewTab, setActivePreviewTab] = useState<string>("desktop");
  const [previewTheme, setPreviewTheme] = useState<"light" | "dark">("light");

  const getCustomFormFields = (): NonNullable<
    CustomSettings["customForm"]
  >["fields"] => {
    return settings.customForm?.fields || [];
  };

  const isStandardFieldEnabled = (fieldId: string) => {
    return (
      fieldId === "name" ||
      fieldId === "email" ||
      getCustomFormFields().some((f) => f.name === fieldId)
    );
  };
  return (
    <motion.div
      variants={itemVariants}
      className="col-span-1 xl:col-span-2 space-y-6"
      ref={previewRef}
    >
      <div className="sticky top-6">
        <Card className="overflow-hidden shadow-xl border-0 rounded-xl h-auto">
          <CardHeader className="bg-gradient-to-r from-purple-50 via-violet-50 to-indigo-50 px-6 py-5 border-b">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
                  <MousePointerClick className="w-4 h-4" />
                </div>
                <CardTitle className="text-gray-900">Live Preview</CardTitle>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex h-9 items-center gap-1 bg-white rounded-md p-0.5 border shadow-sm">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 px-2 rounded-sm",
                      activePreviewTab === "desktop" &&
                        "bg-violet-100 text-violet-700"
                    )}
                    onClick={() => setActivePreviewTab("desktop")}
                  >
                    <Laptop className="h-4 w-4 mr-1.5" />
                    <span className="text-xs">Desktop</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 px-2 rounded-sm",
                      activePreviewTab === "mobile" &&
                        "bg-violet-100 text-violet-700"
                    )}
                    onClick={() => setActivePreviewTab("mobile")}
                  >
                    <Smartphone className="h-4 w-4 mr-1.5" />
                    <span className="text-xs">Mobile</span>
                  </Button>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800"
                    >
                      {previewTheme === "light" ? (
                        <SunIcon className="h-4 w-4" />
                      ) : (
                        <MoonIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setPreviewTheme("light")}
                      className="flex gap-2"
                    >
                      <SunIcon className="h-4 w-4" />
                      <span>Light Mode</span>
                      {previewTheme === "light" && (
                        <CheckIcon className="h-4 w-4 ml-auto" />
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setPreviewTheme("dark")}
                      className="flex gap-2"
                    >
                      <MoonIcon className="h-4 w-4" />
                      <span>Dark Mode</span>
                      {previewTheme === "dark" && (
                        <CheckIcon className="h-4 w-4 ml-auto" />
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div
              className={cn(
                "p-8 transition-colors",
                previewTheme === "dark" ? "bg-gray-900" : "bg-gray-50"
              )}
            >
              <div
                className={cn(
                  "mx-auto rounded-xl shadow-lg overflow-hidden transition-all duration-300 border",
                  previewTheme === "dark"
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200",
                  activePreviewTab === "mobile" ? "max-w-xs" : "max-w-full"
                )}
              >
                {/* Browser chrome simulation for desktop */}
                {activePreviewTab === "desktop" && (
                  <div
                    className={cn(
                      "flex items-center px-4 py-2 border-b",
                      previewTheme === "dark"
                        ? "bg-gray-900 border-gray-700"
                        : "bg-gray-50 border-gray-200"
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div
                      className={cn(
                        "mx-auto flex items-center px-3 py-1 rounded-md text-xs max-w-xs",
                        previewTheme === "dark"
                          ? "bg-gray-800 text-gray-400"
                          : "bg-white text-gray-500"
                      )}
                    >
                      <span className="truncate">
                        https://testimonials.yourbrand.com
                      </span>
                    </div>
                  </div>
                )}

                {/* Mobile status bar for mobile */}
                {activePreviewTab === "mobile" && (
                  <div
                    className={cn(
                      "px-4 py-2 flex justify-between items-center",
                      previewTheme === "dark"
                        ? "bg-gray-900 text-gray-200"
                        : "bg-gray-100 text-gray-800"
                    )}
                  >
                    <div className="text-xs font-medium">9:41</div>
                    <div className="flex items-center gap-1">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M18.5 9.5c.83 0 1.5.67 1.5 1.5v4c0 .83-.67 1.5-1.5 1.5h-13A1.5 1.5 0 014 15v-4c0-.83.67-1.5 1.5-1.5h13zm-13-2A3.5 3.5 0 002 11v4a3.5 3.5 0 003.5 3.5h13a3.5 3.5 0 003.5-3.5v-4a3.5 3.5 0 00-3.5-3.5h-13z"
                          fill="currentColor"
                        />
                        <path
                          d="M7 15h2v2H7v-2zm3 0h2v2h-2v-2zm3 0h2v2h-2v-2z"
                          fill="currentColor"
                        />
                      </svg>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M15.5 5c.83 0 1.5.67 1.5 1.5v10c0 .83-.67 1.5-1.5 1.5h-7A1.5 1.5 0 017 16.5v-10C7 5.67 7.67 5 8.5 5h7zm-7-2A3.5 3.5 0 005 6.5v10A3.5 3.5 0 008.5 20h7a3.5 3.5 0 003.5-3.5v-10A3.5 3.5 0 0015.5 3h-7z"
                          fill="currentColor"
                        />
                        <path
                          d="M12 16.5a1 1 0 100 2 1 1 0 000-2z"
                          fill="currentColor"
                        />
                      </svg>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M17 5.5h1.5a1.5 1.5 0 011.5 1.5v10a1.5 1.5 0 01-1.5 1.5H17v1.5c0 .83-.67 1.5-1.5 1.5h-7A1.5 1.5 0 017 20V3.5C7 2.67 7.67 2 8.5 2h7c.83 0 1.5.67 1.5 1.5V5z"
                          fill="currentColor"
                        />
                      </svg>
                    </div>
                  </div>
                )}

                <div
                  className={cn(
                    "p-6 space-y-8",
                    previewTheme === "dark" ? "bg-gray-800" : "bg-white"
                  )}
                >
                  {/* Preview Header */}
                  <div className="space-y-2.5">
                    <h3
                      className={cn(
                        "text-xl font-semibold text-center",
                        previewTheme === "dark" ? "text-white" : "text-gray-900"
                      )}
                    >
                      {settings.customForm?.mainQuestion ||
                        "Share Your Experience"}
                    </h3>
                    {settings.customForm?.instructions && (
                      <p
                        className={cn(
                          "text-center text-sm",
                          previewTheme === "dark"
                            ? "text-gray-300"
                            : "text-gray-600"
                        )}
                      >
                        {settings.customForm.instructions}
                      </p>
                    )}
                  </div>

                  {/* Preview Form Fields */}
                  <div
                    className={cn(
                      "space-y-6",
                      settings.customForm?.layout === "horizontal"
                        ? "sm:grid sm:grid-cols-2 sm:gap-5 sm:space-y-0"
                        : settings.customForm?.layout === "grid"
                          ? "grid grid-cols-2 gap-5 space-y-0"
                          : "space-y-6"
                    )}
                  >
                    {/* Standard Fields */}
                    {standardFieldOptions
                      .filter((field) => isStandardFieldEnabled(field.id))
                      .map((field) => (
                        <div key={field.id} className="space-y-2">
                          <Label
                            className={cn(
                              "flex items-center gap-1.5",
                              previewTheme === "dark"
                                ? "text-gray-200"
                                : "text-gray-700"
                            )}
                          >
                            {field.label}
                            {(field.id === "name" ||
                              field.id === "email" ||
                              getCustomFormFields().find(
                                (f) => f.name === field.id
                              )?.required) && (
                              <span className="text-red-500">*</span>
                            )}
                          </Label>
                          {field.type === "textarea" ? (
                            <Textarea
                              placeholder={`Enter your ${field.label.toLowerCase()}`}
                              className={cn(
                                "resize-none",
                                previewTheme === "dark"
                                  ? "bg-gray-700 border-gray-600 text-gray-200 placeholder:text-gray-500 focus:border-violet-500 focus:ring-violet-500"
                                  : "border-gray-300 focus:border-violet-300 focus:ring-violet-200"
                              )}
                              disabled
                              rows={3}
                            />
                          ) : (
                            <Input
                              type={field.type}
                              placeholder={`Enter your ${field.label.toLowerCase()}`}
                              className={cn(
                                previewTheme === "dark"
                                  ? "bg-gray-700 border-gray-600 text-gray-200 placeholder:text-gray-500 focus:border-violet-500 focus:ring-violet-500"
                                  : "border-gray-300 focus:border-violet-300 focus:ring-violet-200"
                              )}
                              disabled
                            />
                          )}
                        </div>
                      ))}

                    {/* Custom Fields */}
                    {getCustomFormFields()
                      .filter(
                        (field) =>
                          !standardFieldOptions.some(
                            (std) => std.id === field.name
                          )
                      )
                      .map((field) => (
                        <div key={field.name} className="space-y-2">
                          <Label
                            className={cn(
                              "flex items-center gap-1.5",
                              previewTheme === "dark"
                                ? "text-gray-200"
                                : "text-gray-700"
                            )}
                          >
                            {field.label}{" "}
                            {field.required && (
                              <span className="text-red-500">*</span>
                            )}
                          </Label>
                          {field.type === "textarea" ? (
                            <Textarea
                              placeholder={
                                field.placeholder ||
                                `Enter your ${field.label.toLowerCase()}`
                              }
                              className={cn(
                                "resize-none",
                                previewTheme === "dark"
                                  ? "bg-gray-700 border-gray-600 text-gray-200 placeholder:text-gray-500 focus:border-violet-500 focus:ring-violet-500"
                                  : "border-gray-300 focus:border-violet-300 focus:ring-violet-200"
                              )}
                              disabled
                              rows={3}
                            />
                          ) : field.type === "select" ? (
                            <Select disabled>
                              <SelectTrigger
                                className={cn(
                                  previewTheme === "dark"
                                    ? "bg-gray-700 border-gray-600 text-gray-200"
                                    : "border-gray-300"
                                )}
                              >
                                <SelectValue
                                  placeholder={
                                    field.placeholder ||
                                    `Select ${field.label.toLowerCase()}`
                                  }
                                />
                              </SelectTrigger>
                            </Select>
                          ) : (
                            <Input
                              type={field.type}
                              placeholder={
                                field.placeholder ||
                                `Enter your ${field.label.toLowerCase()}`
                              }
                              className={cn(
                                previewTheme === "dark"
                                  ? "bg-gray-700 border-gray-600 text-gray-200 placeholder:text-gray-500 focus:border-violet-500 focus:ring-violet-500"
                                  : "border-gray-300 focus:border-violet-300 focus:ring-violet-200"
                              )}
                              disabled
                            />
                          )}
                        </div>
                      ))}
                  </div>

                  {/* Testimonial Question */}
                  <div className="space-y-2">
                    <Label
                      className={cn(
                        "flex items-center gap-1.5",
                        previewTheme === "dark"
                          ? "text-gray-200"
                          : "text-gray-700"
                      )}
                    >
                      {settings.customForm?.mainQuestion ||
                        "What has been your experience with our product/service?"}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      className={cn(
                        "resize-none min-h-[120px]",
                        previewTheme === "dark"
                          ? "bg-gray-700 border-gray-600 text-gray-200 placeholder:text-gray-500 focus:border-violet-500 focus:ring-violet-500"
                          : "border-gray-300 focus:border-violet-300 focus:ring-violet-200"
                      )}
                      placeholder="Share your experience here..."
                      disabled
                      rows={4}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <Button
                      className={cn(
                        "w-full h-12 text-white shadow-md",
                        previewTheme === "dark"
                          ? "bg-violet-600 hover:bg-violet-700"
                          : "bg-violet-600 hover:bg-violet-700"
                      )}
                      disabled
                    >
                      <span className="text-base">
                        {settings.customForm?.submitButtonText ||
                          "Submit Testimonial"}
                      </span>
                    </Button>
                  </div>
                </div>

                {/* Mobile home indicator for mobile */}
                {activePreviewTab === "mobile" && (
                  <div
                    className={cn(
                      "flex justify-center items-center py-2",
                      previewTheme === "dark"
                        ? "bg-gray-900 text-gray-200"
                        : "bg-gray-100 text-gray-800"
                    )}
                  >
                    <div className="w-32 h-1 rounded-full bg-gray-400"></div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>

          <CardFooter className="bg-gradient-to-r from-purple-50 via-violet-50 to-indigo-50 p-4 border-t">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Info className="h-4 w-4 text-violet-500" />
                <span>Live preview updates as you make changes</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  onClick={() => {}}
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-gray-600 hover:text-violet-700"
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  <span className="text-xs">Looks Good</span>
                </Button>

                <Button
                  onClick={() => {}}
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-gray-600 hover:text-violet-700"
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                  <span className="text-xs">Needs Work</span>
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </motion.div>
  );
};

export default observer(FormPreview);
