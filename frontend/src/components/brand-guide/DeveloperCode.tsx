import React, { FC, useState } from "react";
import { motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import { brandGuideStore } from "@/stores/brandGuideStore";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
// Icons
import {
  ArrowUpRight,
  Check,
  Clipboard,
  ClipboardCheck,
  Code,
  Download,
  Edit3,
  Info,
  Moon,
  Pencil,
  RefreshCw,
  Star,
  Sun,
  User,
} from "lucide-react";
import { ColorMode } from "@/types/setup";
import { itemVariants } from "./constants";
import { fontOptions, getFontFamily } from "./fonts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { cn } from "@/lib/utils";

type DeveloperCodeProps = {
  colorMode: ColorMode;
  customCss: string;
  setCustomCss: React.Dispatch<React.SetStateAction<string>>;
  copyToClipboard: (text: string, field: string) => void;
  copySuccess: Record<string, boolean>;
  setColorMode: React.Dispatch<React.SetStateAction<ColorMode>>;
};
const DeveloperCode: FC<DeveloperCodeProps> = ({
  colorMode,
  customCss,
  setCustomCss,
  copyToClipboard,
  copySuccess,
  setColorMode,
}) => {
  const [customCssOpen, setCustomCssOpen] = useState<boolean>(false);
  const { brandData } = brandGuideStore;

  const generateCssVariables = () => {
    return `/* ${brandData.name} Brand Design System */
  :root {
    /* Colors */
    --color-primary: ${brandData.colors.primary};
    --color-secondary: ${brandData.colors.secondary};
    --color-accent: ${brandData.colors.accent};
    --color-success: ${brandData.colors.success};
    --color-warning: ${brandData.colors.warning};
    --color-error: ${brandData.colors.error};
    --color-background: ${brandData.colors.background};
    --color-foreground: ${brandData.colors.foreground};
    --color-muted: ${brandData.colors.muted};
    --color-surface: ${brandData.colors.surface};
    
    /* Typography */
    --font-heading: ${brandData.typography.headingFont}, ${fontOptions.find((f) => f.value === brandData.typography.headingFont)?.fallback || "sans-serif"};
    --font-body: ${brandData.typography.bodyFont}, ${fontOptions.find((f) => f.value === brandData.typography.bodyFont)?.fallback || "sans-serif"};
    --font-base-size: ${brandData.typography.baseSize}px;
    --font-ratio: ${brandData.typography.ratio};
    --font-h1: calc(var(--font-base-size) * var(--font-ratio) * var(--font-ratio) * var(--font-ratio));
    --font-h2: calc(var(--font-base-size) * var(--font-ratio) * var(--font-ratio));
    --font-h3: calc(var(--font-base-size) * var(--font-ratio));
    --font-small: calc(var(--font-base-size) / var(--font-ratio));
    --font-heading-weight: ${brandData.typography.weights.heading};
    --font-body-weight: ${brandData.typography.weights.body};
    --letter-spacing: ${brandData.typography.letterSpacing}em;
    --line-height: ${brandData.typography.lineHeight};
    
    /* UI */
    --radius: ${brandData.ui.radius}px;
    
    /* Testimonials */
    --testimonial-shadow: ${
      brandData.testimonials.shadow === "none"
        ? "none"
        : brandData.testimonials.shadow === "sm"
          ? "0 1px 2px rgba(0, 0, 0, 0.05)"
          : brandData.testimonials.shadow === "md"
            ? "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
            : "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
    };
  }
  
  /* Dark mode variables */
  .dark-mode {
    --color-background: #111827;
    --color-foreground: #f9fafb;
    --color-muted: #374151;
    --color-surface: #1f2937;
  }
  
  /* Testimonial Styles */
  .testimonial {
    font-family: var(--font-body);
    border-radius: var(--radius);
    ${brandData.testimonials.border ? "border: 1px solid rgba(0, 0, 0, 0.1);" : ""}
    ${brandData.testimonials.shadow !== "none" ? "box-shadow: var(--testimonial-shadow);" : ""}
    overflow: hidden;
  }
  
  .testimonial-author {
    font-family: var(--font-heading);
    font-weight: var(--font-heading-weight);
  }
  
  /* Animation settings */
  ${
    brandData.ui.animation
      ? `
  .testimonial-animate {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .testimonial-animate:hover {
    transform: translateY(-4px);
    box-shadow: var(--testimonial-shadow);
  }
  `
      : ""
  }
  
  /* Custom CSS */
  ${customCss}`;
  };

  const handleExportCss = () => {
    const cssContent = generateCssVariables();
    const dataStr =
      "data:text/css;charset=utf-8," + encodeURIComponent(cssContent);
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute(
      "download",
      `${brandData.name.replace(/\s+/g, "-").toLowerCase()}-variables.css`
    );
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <>
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5 text-primary" />
              Developer Resources
            </CardTitle>
            <CardDescription>
              Access code, CSS variables, and implementation details for
              developers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">CSS Variables</h3>
                <div className="relative">
                  <pre className="p-4 rounded-lg bg-gray-950 text-gray-200 text-xs font-mono overflow-auto max-h-[400px]">
                    {generateCssVariables()}
                  </pre>
                  <div className="absolute top-2 right-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 bg-gray-800 hover:bg-gray-700 text-gray-200"
                      onClick={() =>
                        copyToClipboard(generateCssVariables(), "cssVariables")
                      }
                    >
                      {copySuccess["cssVariables"] ? (
                        <ClipboardCheck className="h-4 w-4" />
                      ) : (
                        <Clipboard className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportCss}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSS Variables
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCustomCssOpen(true)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Custom CSS
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Implementation</h3>

                <Tabs defaultValue="react" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="react">React</TabsTrigger>
                    <TabsTrigger value="html">HTML</TabsTrigger>
                    <TabsTrigger value="config">Config</TabsTrigger>
                  </TabsList>

                  <TabsContent value="react" className="mt-4">
                    <div className="relative">
                      <pre className="p-4 rounded-lg bg-gray-950 text-gray-200 text-xs font-mono overflow-auto max-h-[400px]">
                        {`import React from 'react';

const TestimonialCard = ({ testimonial }) => {
  return (
    <div 
      className="testimonial${brandData.testimonials.animation ? " testimonial-animate" : ""}"
      style={{
        backgroundColor: '${colorMode === "light" ? "#fff" : "#1f2937"}',
      }}
    >
      <div className="p-6">
        {testimonial.rating && (
          <div className="flex mb-3">
            {/* Stars rendering */}
          </div>
        )}
        
        <p className="mb-4">{testimonial.content}</p>
        
        <div className="flex items-center mt-4">
          {testimonial.avatar && (
            <div className="mr-3">
              <img 
                src={testimonial.avatar} 
                alt={testimonial.name}
                className="w-10 h-10"
              />
            </div>
          )}
          
          <div>
            <p className="font-medium testimonial-author">
              {testimonial.name}
            </p>
            
            <div className="text-sm opacity-80">
              {testimonial.company && (
                <span>{testimonial.company}</span>
              )}
              
              {testimonial.date && testimonial.company && (
                <span> • </span>
              )}
              
              {testimonial.date && (
                <span>{testimonial.date}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestimonialCard;`}
                      </pre>
                      <div className="absolute top-2 right-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 bg-gray-800 hover:bg-gray-700 text-gray-200"
                          onClick={() =>
                            copyToClipboard(
                              `import React from 'react';

const TestimonialCard = ({ testimonial }) => {
  return (
    <div 
      className="testimonial${brandData.testimonials.animation ? " testimonial-animate" : ""}"
      style={{
        backgroundColor: '${colorMode === "light" ? "#fff" : "#1f2937"}',
      }}
    >
      <div className="p-6">
        {testimonial.rating && (
          <div className="flex mb-3">
            {/* Stars rendering */}
          </div>
        )}
        
        <p className="mb-4">{testimonial.content}</p>
        
        <div className="flex items-center mt-4">
          {testimonial.avatar && (
            <div className="mr-3">
              <img 
                src={testimonial.avatar} 
                alt={testimonial.name}
                className="w-10 h-10"
              />
            </div>
          )}
          
          <div>
            <p className="font-medium testimonial-author">
              {testimonial.name}
            </p>
            
            <div className="text-sm opacity-80">
              {testimonial.company && (
                <span>{testimonial.company}</span>
              )}
              
              {testimonial.date && testimonial.company && (
                <span> • </span>
              )}
              
              {testimonial.date && (
                <span>{testimonial.date}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestimonialCard;`,
                              "reactComponent"
                            )
                          }
                        >
                          {copySuccess["reactComponent"] ? (
                            <ClipboardCheck className="h-4 w-4" />
                          ) : (
                            <Clipboard className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="html" className="mt-4">
                    <div className="relative">
                      <pre className="p-4 rounded-lg bg-gray-950 text-gray-200 text-xs font-mono overflow-auto max-h-[400px]">
                        {`<div class="testimonial${brandData.testimonials.animation ? " testimonial-animate" : ""}">
  <div class="p-6">
    <!-- Rating (optional) -->
    <div class="flex mb-3">
      <span class="text-yellow-500">★★★★★</span>
    </div>
    
    <!-- Content -->
    <p class="mb-4">
      Working with this company has been an absolute pleasure. The team is responsive, 
      professional, and truly cares about delivering results. I couldn't be happier with my experience!
    </p>
    
    <!-- Author -->
    <div class="flex items-center mt-4">
      <!-- Avatar (optional) -->
      <div class="mr-3">
        <img 
          src="avatar.jpg" 
          alt="Sarah Johnson" 
          class="w-10 h-10 rounded-full"
        >
      </div>
      
      <div>
        <p class="font-medium testimonial-author">
          Sarah Johnson
        </p>
        
        <div class="text-sm opacity-80">
          <!-- Company (optional) -->
          <span>Marketing Director, TechCorp</span>
          
          <!-- Date separator (if both company and date are present) -->
          <span> • </span>
          
          <!-- Date (optional) -->
          <span>Jan 15, 2023</span>
        </div>
      </div>
    </div>
  </div>
</div>`}
                      </pre>
                      <div className="absolute top-2 right-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 bg-gray-800 hover:bg-gray-700 text-gray-200"
                          onClick={() =>
                            copyToClipboard(
                              `<div class="testimonial${brandData.testimonials.animation ? " testimonial-animate" : ""}">
  <div class="p-6">
    <!-- Rating (optional) -->
    <div class="flex mb-3">
      <span class="text-yellow-500">★★★★★</span>
    </div>
    
    <!-- Content -->
    <p class="mb-4">
      Working with this company has been an absolute pleasure. The team is responsive, 
      professional, and truly cares about delivering results. I couldn't be happier with my experience!
    </p>
    
    <!-- Author -->
    <div class="flex items-center mt-4">
      <!-- Avatar (optional) -->
      <div class="mr-3">
        <img 
          src="avatar.jpg" 
          alt="Sarah Johnson" 
          class="w-10 h-10 rounded-full"
        >
      </div>
      
      <div>
        <p class="font-medium testimonial-author">
          Sarah Johnson
        </p>
        
        <div class="text-sm opacity-80">
          <!-- Company (optional) -->
          <span>Marketing Director, TechCorp</span>
          
          <!-- Date separator (if both company and date are present) -->
          <span> • </span>
          
          <!-- Date (optional) -->
          <span>Jan 15, 2023</span>
        </div>
      </div>
    </div>
  </div>
</div>`,
                              "htmlTemplate"
                            )
                          }
                        >
                          {copySuccess["htmlTemplate"] ? (
                            <ClipboardCheck className="h-4 w-4" />
                          ) : (
                            <Clipboard className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="config" className="mt-4">
                    <div className="relative">
                      <pre className="p-4 rounded-lg bg-gray-950 text-gray-200 text-xs font-mono overflow-auto max-h-[400px]">
                        {JSON.stringify(brandData, null, 2)}
                      </pre>
                      <div className="absolute top-2 right-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 bg-gray-800 hover:bg-gray-700 text-gray-200"
                          onClick={() =>
                            copyToClipboard(
                              JSON.stringify(brandData, null, 2),
                              "config"
                            )
                          }
                        >
                          {copySuccess["config"] ? (
                            <ClipboardCheck className="h-4 w-4" />
                          ) : (
                            <Clipboard className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="rounded-lg p-4 border bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-900">
                  <div className="flex gap-3 items-start">
                    <Info className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1.5">
                      <h4 className="text-sm font-medium text-amber-800 dark:text-amber-400">
                        Integration Instructions
                      </h4>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        To implement this testimonial design, add the CSS
                        variables to your stylesheet and use the component
                        templates above. For the best results, include the full
                        CSS file in your project's head section. Configure the
                        testimonial display options to match your settings.
                      </p>
                      <div className="pt-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs bg-amber-100 border-amber-300 hover:bg-amber-200 text-amber-800 dark:bg-amber-900 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-800"
                        >
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          View Full Documentation
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Custom CSS</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="custom-css">Additional CSS overrides</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setCustomCss("")}
                  >
                    <RefreshCw className="h-3 w-3 mr-1.5" />
                    Reset
                  </Button>
                </div>
                <Textarea
                  id="custom-css"
                  value={customCss}
                  onChange={(e) => setCustomCss(e.target.value)}
                  placeholder="/* Add your custom CSS overrides here */
.testimonial:hover {
  transform: translateY(-5px);
}"
                  className="font-mono text-xs min-h-[200px] resize-none"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Custom CSS will be included in the exported CSS file
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Custom CSS Dialog */}
      <Dialog open={customCssOpen} onOpenChange={setCustomCssOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" />
              Custom CSS Editor
            </DialogTitle>
            <DialogDescription>
              Add custom CSS to override or extend your brand styles
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>CSS Editor</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setCustomCss("")}
                  >
                    <RefreshCw className="h-3 w-3 mr-1.5" />
                    Reset
                  </Button>
                </div>
                <Textarea
                  value={customCss}
                  onChange={(e) => setCustomCss(e.target.value)}
                  placeholder="/* Add your custom CSS here */
.testimonial:hover {
  transform: translateY(-5px);
}"
                  className="font-mono text-xs min-h-[400px] resize-none"
                />
              </div>

              <div className="space-y-3">
                <Label>Preview</Label>
                <div className="border rounded-lg overflow-hidden h-[400px] bg-white dark:bg-gray-950">
                  <div className="p-4 border-b bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
                    <h3 className="text-sm font-medium">CSS Preview</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() =>
                        setColorMode(colorMode === "light" ? "dark" : "light")
                      }
                    >
                      {colorMode === "light" ? (
                        <Moon className="h-4 w-4" />
                      ) : (
                        <Sun className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <div className="p-6">
                    <style dangerouslySetInnerHTML={{ __html: customCss }} />
                    <div
                      className={cn(
                        "overflow-hidden transition-all",
                        brandData.testimonials.shape === "rounded" &&
                          "rounded-lg",
                        brandData.testimonials.shape === "square" &&
                          "rounded-none",
                        brandData.testimonials.shape === "circle" &&
                          "rounded-3xl",
                        brandData.testimonials.border &&
                          "border border-gray-200 dark:border-gray-800",
                        brandData.testimonials.shadow === "sm" && "shadow-sm",
                        brandData.testimonials.shadow === "md" && "shadow-md",
                        brandData.testimonials.shadow === "lg" && "shadow-lg",
                        "testimonial"
                      )}
                      style={{
                        backgroundColor:
                          colorMode === "light"
                            ? brandData.testimonials.style === "minimal"
                              ? "transparent"
                              : "white"
                            : brandData.testimonials.style === "minimal"
                              ? "transparent"
                              : "#111827",
                        fontFamily: getFontFamily(
                          brandData.typography.bodyFont
                        ),
                      }}
                    >
                      <div className="p-6">
                        {/* Rating */}
                        <div className="mb-3 flex">
                          {Array(5)
                            .fill(0)
                            .map((_, i) => (
                              <Star
                                key={i}
                                className="h-4 w-4 mr-0.5"
                                fill={
                                  i < 5
                                    ? brandData.colors.primary
                                    : "transparent"
                                }
                                color={brandData.colors.primary}
                              />
                            ))}
                        </div>

                        {/* Content */}
                        <p
                          className={cn(
                            "text-gray-800 dark:text-gray-200 mb-4",
                            brandData.testimonials.style === "quote" && "italic"
                          )}
                        >
                          The service exceeded all my expectations. Their
                          attention to detail and responsive support team made
                          the whole experience exceptional. I highly recommend
                          them to anyone.
                        </p>

                        {/* Author */}
                        <div className="flex items-center mt-4">
                          <div
                            className={cn(
                              "mr-3 flex-shrink-0",
                              brandData.testimonials.shape === "rounded" &&
                                "rounded-lg overflow-hidden",
                              brandData.testimonials.shape === "square" &&
                                "rounded-none overflow-hidden",
                              brandData.testimonials.shape === "circle" &&
                                "rounded-full overflow-hidden"
                            )}
                            style={{
                              width: "40px",
                              height: "40px",
                              backgroundColor: brandData.colors.muted,
                            }}
                          >
                            <User className="h-full w-full p-2 text-gray-400 dark:text-gray-600" />
                          </div>

                          <div>
                            <p
                              className="font-medium text-gray-900 dark:text-white"
                              style={{
                                fontFamily: getFontFamily(
                                  brandData.typography.headingFont
                                ),
                                fontWeight:
                                  brandData.typography.weights.heading,
                              }}
                            >
                              Michael Johnson
                            </p>

                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <span>CEO, TechInnovate</span>
                              <span>•</span>
                              <span>May 12, 2023</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomCssOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                // Apply the custom CSS
                setCustomCssOpen(false);
              }}
            >
              <Check className="h-4 w-4 mr-2" />
              Apply Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default observer(DeveloperCode);
