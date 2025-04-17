import { motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import { brandGuideStore } from "@/stores/brandGuideStore";
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// Icons
import {
  ArrowRight,
  CloudLightning,
  FileText,
  Grid,
  Layout,
  MessageSquare,
  Moon,
  PanelLeft,
  Pencil,
  Redo,
  Star,
  Sun,
  User,
} from "lucide-react";
import {
  ColorMode,
  TestimonialLayout,
  TestimonialShape,
  TestimonialStyle,
} from "@/types/setup";
import { itemVariants, testimonialStyles } from "./constants";
import { getFontFamily } from "./fonts";
import { FC } from "react";

type TestimonialProps = {
  setColorMode: React.Dispatch<React.SetStateAction<ColorMode>>;
  colorMode: ColorMode;
};
const Testimonials: FC<TestimonialProps> = ({ setColorMode, colorMode }) => {
  const store = brandGuideStore;
  const { brandData } = brandGuideStore;
  return (
    <motion.div variants={itemVariants}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Testimonial Display Style
          </CardTitle>
          <CardDescription>
            Define how testimonials will appear across your website and
            marketing materials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-5">
              {/* Testimonial style selection */}
              <div className="space-y-3">
                <Label htmlFor="testimonial-style">Testimonial Style</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {testimonialStyles.map((style) => (
                    <div
                      key={style.id}
                      className={cn(
                        "border rounded-lg p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors",
                        brandData.testimonials.style === style.id &&
                          "border-primary bg-primary/5"
                      )}
                      onClick={() =>
                        store.updateBrandData(
                          ["testimonials", "style"],
                          style.id as TestimonialStyle
                        )
                      }
                    >
                      <div className="h-14 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded mb-2">
                        <MessageSquare
                          className={cn(
                            "h-6 w-6",
                            style.id === "quote" && "text-gray-400",
                            style.id === "card" && "text-gray-500",
                            style.id === "bubble" && "text-primary",
                            style.id === "minimal" && "text-gray-600",
                            style.id === "highlight" && "text-primary",
                            style.id === "modern" && "text-indigo-500",
                            style.id === "classic" && "text-gray-700"
                          )}
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">{style.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                          {style.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shape settings */}
              <div className="space-y-3">
                <Label htmlFor="testimonial-shape">Shape</Label>
                <div className="flex gap-3">
                  {["rounded", "square", "circle"].map((shape) => (
                    <div
                      key={shape}
                      className={cn(
                        "border rounded-lg p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex-1 text-center",
                        brandData.testimonials.shape === shape &&
                          "border-primary bg-primary/5"
                      )}
                      onClick={() =>
                        store.updateBrandData(
                          ["testimonials", "shape"],
                          shape as TestimonialShape
                        )
                      }
                    >
                      <div
                        className={cn(
                          "h-10 w-10 bg-primary mx-auto mb-2",
                          shape === "rounded" && "rounded-lg",
                          shape === "square" && "rounded-none",
                          shape === "circle" && "rounded-full"
                        )}
                      />
                      <p className="text-sm capitalize">{shape}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Layout settings */}
              <div className="space-y-3">
                <Label htmlFor="testimonial-layout">Layout</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {["grid", "carousel", "masonry", "list"].map((layout) => (
                    <div
                      key={layout}
                      className={cn(
                        "border rounded-lg p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-center",
                        brandData.testimonials.layout === layout &&
                          "border-primary bg-primary/5"
                      )}
                      onClick={() =>
                        store.updateBrandData(
                          ["testimonials", "layout"],
                          layout as TestimonialLayout
                        )
                      }
                    >
                      <div className="h-10 flex items-center justify-center mb-1">
                        {layout === "grid" && <Grid className="h-5 w-5" />}
                        {layout === "carousel" && (
                          <ArrowRight className="h-5 w-5" />
                        )}
                        {layout === "masonry" && <Layout className="h-5 w-5" />}
                        {layout === "list" && <PanelLeft className="h-5 w-5" />}
                      </div>
                      <p className="text-sm capitalize">{layout}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Display options */}
              <div className="space-y-3">
                <Label>Display Options</Label>
                <div className="space-y-2 border rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-gray-500" />
                      <Label
                        htmlFor="show-rating"
                        className="text-sm cursor-pointer"
                      >
                        Show Rating
                      </Label>
                    </div>
                    <Switch
                      id="show-rating"
                      checked={brandData.testimonials.showRating}
                      onCheckedChange={(checked) =>
                        store.updateBrandData(
                          ["testimonials", "showRating"],
                          checked
                        )
                      }
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <Label
                        htmlFor="show-avatar"
                        className="text-sm cursor-pointer"
                      >
                        Show Avatar
                      </Label>
                    </div>
                    <Switch
                      id="show-avatar"
                      checked={brandData.testimonials.showAvatar}
                      onCheckedChange={(checked) =>
                        store.updateBrandData(
                          ["testimonials", "showAvatar"],
                          checked
                        )
                      }
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <Label
                        htmlFor="show-company"
                        className="text-sm cursor-pointer"
                      >
                        Show Company
                      </Label>
                    </div>
                    <Switch
                      id="show-company"
                      checked={brandData.testimonials.showCompany}
                      onCheckedChange={(checked) =>
                        store.updateBrandData(
                          ["testimonials", "showCompany"],
                          checked
                        )
                      }
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <Label
                        htmlFor="show-date"
                        className="text-sm cursor-pointer"
                      >
                        Show Date
                      </Label>
                    </div>
                    <Switch
                      id="show-date"
                      checked={brandData.testimonials.showDate}
                      onCheckedChange={(checked) =>
                        store.updateBrandData(
                          ["testimonials", "showDate"],
                          checked
                        )
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Appearance settings */}
              <div className="space-y-3">
                <Label>Appearance Settings</Label>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="shadow-style" className="text-sm">
                        Shadow Style
                      </Label>
                      <Select
                        value={brandData.testimonials.shadow}
                        onValueChange={(value) =>
                          store.updateBrandData(
                            ["testimonials", "shadow"],
                            value as "none" | "sm" | "md" | "lg"
                          )
                        }
                      >
                        <SelectTrigger id="shadow-style">
                          <SelectValue placeholder="Select shadow style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="sm">Subtle</SelectItem>
                          <SelectItem value="md">Medium</SelectItem>
                          <SelectItem value="lg">Strong</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rating-style" className="text-sm">
                        Rating Style
                      </Label>
                      <Select
                        value={brandData.testimonials.ratingStyle}
                        onValueChange={(value) =>
                          store.updateBrandData(
                            ["testimonials", "ratingStyle"],
                            value as "stars" | "number" | "text"
                          )
                        }
                      >
                        <SelectTrigger id="rating-style">
                          <SelectValue placeholder="Select rating style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stars">Stars</SelectItem>
                          <SelectItem value="number">Number (4.5/5)</SelectItem>
                          <SelectItem value="text">Text (Excellent)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-between items-center px-1">
                    <div className="flex items-center gap-2">
                      <Pencil className="h-4 w-4 text-gray-500" />
                      <Label
                        htmlFor="show-border"
                        className="text-sm cursor-pointer"
                      >
                        Show Border
                      </Label>
                    </div>
                    <Switch
                      id="show-border"
                      checked={brandData.testimonials.border}
                      onCheckedChange={(checked) =>
                        store.updateBrandData(
                          ["testimonials", "border"],
                          checked
                        )
                      }
                    />
                  </div>

                  <div className="flex justify-between items-center px-1">
                    <div className="flex items-center gap-2">
                      <CloudLightning className="h-4 w-4 text-gray-500" />
                      <Label
                        htmlFor="show-animation"
                        className="text-sm cursor-pointer"
                      >
                        Enable Animation
                      </Label>
                    </div>
                    <Switch
                      id="show-animation"
                      checked={brandData.testimonials.animation}
                      onCheckedChange={(checked) =>
                        store.updateBrandData(
                          ["testimonials", "animation"],
                          checked
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial Preview */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-900 border-b p-3 flex justify-between items-center">
                <h3 className="text-sm font-medium">Testimonial Preview</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
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
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Redo className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div
                className={cn(
                  "p-6",
                  colorMode === "light" ? "bg-white" : "bg-gray-950"
                )}
              >
                <div
                  className={cn(
                    "overflow-hidden transition-all",
                    brandData.testimonials.shape === "rounded" && "rounded-lg",
                    brandData.testimonials.shape === "square" && "rounded-none",
                    brandData.testimonials.shape === "circle" && "rounded-3xl",
                    brandData.testimonials.border &&
                      "border border-gray-200 dark:border-gray-800",
                    brandData.testimonials.shadow === "sm" && "shadow-sm",
                    brandData.testimonials.shadow === "md" && "shadow-md",
                    brandData.testimonials.shadow === "lg" && "shadow-lg",
                    brandData.testimonials.style === "bubble" &&
                      "relative after:content-[''] after:absolute after:bottom-[-12px] after:left-6 after:w-0 after:h-0 after:border-l-[12px] after:border-l-transparent after:border-t-[12px] after:border-t-white dark:after:border-t-gray-800 after:border-r-[12px] after:border-r-transparent",
                    brandData.testimonials.style === "highlight" &&
                      "border-l-4",
                    brandData.testimonials.style === "highlight" &&
                      `border-l-${brandData.colors.primary}`
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
                    borderLeftColor:
                      brandData.testimonials.style === "highlight"
                        ? brandData.colors.primary
                        : undefined,
                    fontFamily: getFontFamily(brandData.typography.bodyFont),
                  }}
                >
                  <div
                    className={cn(
                      "p-6",
                      brandData.testimonials.style === "minimal" && "p-0",
                      brandData.testimonials.style === "modern" &&
                        "bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 p-6"
                    )}
                  >
                    {/* Rating */}
                    {brandData.testimonials.showRating && (
                      <div className="mb-3 flex">
                        {brandData.testimonials.ratingStyle === "stars" && (
                          <>
                            {Array(5)
                              .fill(0)
                              .map((_, i) => (
                                <Star
                                  key={i}
                                  className="h-4 w-4 mr-0.5"
                                  fill={
                                    i < 4
                                      ? brandData.colors.primary
                                      : "transparent"
                                  }
                                  color={brandData.colors.primary}
                                />
                              ))}
                          </>
                        )}

                        {brandData.testimonials.ratingStyle === "number" && (
                          <span
                            className="text-sm font-medium"
                            style={{
                              color: brandData.colors.primary,
                            }}
                          >
                            4.5/5
                          </span>
                        )}

                        {brandData.testimonials.ratingStyle === "text" && (
                          <span
                            className="text-sm font-medium"
                            style={{
                              color: brandData.colors.primary,
                            }}
                          >
                            Excellent
                          </span>
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="mb-4">
                      {brandData.testimonials.style === "quote" && (
                        <div className="text-4xl font-serif text-gray-200 dark:text-gray-700 leading-none mb-2">
                          "
                        </div>
                      )}
                      <p
                        className={cn(
                          "text-gray-800 dark:text-gray-200",
                          brandData.testimonials.style === "quote" && "italic",
                          brandData.testimonials.style === "minimal" &&
                            "text-base",
                          brandData.testimonials.style === "card" &&
                            "text-base",
                          brandData.testimonials.style === "bubble" &&
                            "text-sm",
                          brandData.testimonials.style === "highlight" &&
                            "text-base relative pl-4",
                          brandData.testimonials.style === "modern" &&
                            "text-base font-medium"
                        )}
                        style={{
                          fontFamily: getFontFamily(
                            brandData.typography.bodyFont
                          ),
                          lineHeight: brandData.typography.lineHeight,
                        }}
                      >
                        Working with this company has been an absolute pleasure.
                        The team is responsive, professional, and truly cares
                        about delivering results. I couldn't be happier with my
                        experience!
                      </p>
                      {brandData.testimonials.style === "quote" && (
                        <div className="text-4xl font-serif text-gray-200 dark:text-gray-700 leading-none mt-1 text-right">
                          "
                        </div>
                      )}
                    </div>

                    {/* Author */}
                    <div className="flex items-center mt-4">
                      {brandData.testimonials.showAvatar && (
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
                      )}

                      <div>
                        <p
                          className="font-medium text-gray-900 dark:text-white"
                          style={{
                            fontFamily: getFontFamily(
                              brandData.typography.headingFont
                            ),
                            fontWeight: brandData.typography.weights.heading,
                          }}
                        >
                          Sarah Johnson
                        </p>

                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          {brandData.testimonials.showCompany && (
                            <span>Marketing Director, TechCorp</span>
                          )}

                          {brandData.testimonials.showDate &&
                            brandData.testimonials.showCompany && (
                              <span>•</span>
                            )}

                          {brandData.testimonials.showDate && (
                            <span>Jan 15, 2023</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 border-t p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  This preview shows how your testimonials will appear with the
                  selected style, layout, and display options.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default observer(Testimonials);
