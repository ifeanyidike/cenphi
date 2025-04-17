import { FC, useState } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Icons
import {
  Eye,
  Fullscreen,
  Layout,
  Mail,
  MessageSquare,
  Monitor,
  Moon,
  Smartphone,
  Star,
  Sun,
  Tablet,
  User,
  X,
} from "lucide-react";
import { ColorMode, DeviceView } from "@/types/setup";
import { getFontFamily } from "./fonts";
import { getContrastColor, itemVariants } from "./constants";

type PreviewProps = {
  setColorMode: React.Dispatch<React.SetStateAction<ColorMode>>;
  colorMode: ColorMode;
};
const Preview: FC<PreviewProps> = ({ setColorMode, colorMode }) => {
  const { brandData } = brandGuideStore;
  const [deviceView, setDeviceView] = useState<DeviceView>("desktop");
  const [previewTab, setPreviewTab] = useState<string>("testimonial");
  return (
    <motion.div variants={itemVariants}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Live Preview
          </CardTitle>
          <CardDescription>
            See how your brand will appear in different contexts
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-b">
            <div className="flex justify-between items-center px-6 py-2">
              <Tabs
                value={previewTab}
                onValueChange={setPreviewTab}
                className="w-full"
              >
                <TabsList className="h-9">
                  <TabsTrigger value="testimonial" className="text-xs">
                    <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                    Testimonial
                  </TabsTrigger>
                  <TabsTrigger value="widget" className="text-xs">
                    <Layout className="h-3.5 w-3.5 mr-1.5" />
                    Widget
                  </TabsTrigger>
                  <TabsTrigger value="email" className="text-xs">
                    <Mail className="h-3.5 w-3.5 mr-1.5" />
                    Email
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0",
                    deviceView === "desktop" && "bg-gray-100 dark:bg-gray-800"
                  )}
                  onClick={() => setDeviceView("desktop")}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0",
                    deviceView === "tablet" && "bg-gray-100 dark:bg-gray-800"
                  )}
                  onClick={() => setDeviceView("tablet")}
                >
                  <Tablet className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0",
                    deviceView === "mobile" && "bg-gray-100 dark:bg-gray-800"
                  )}
                  onClick={() => setDeviceView("mobile")}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-gray-100 dark:bg-gray-900 overflow-auto">
            <div
              className={cn(
                "mx-auto transition-all transform",
                deviceView === "mobile"
                  ? "w-[375px] h-[640px]"
                  : deviceView === "tablet"
                    ? "w-[768px] h-[768px]"
                    : "w-full h-[640px]"
              )}
            >
              {/* Testimonial Preview */}
              {previewTab === "testimonial" && (
                <div
                  className="h-full"
                  style={{
                    backgroundColor:
                      colorMode === "light"
                        ? brandData.colors.background
                        : "#111827",
                    color:
                      colorMode === "light"
                        ? brandData.colors.foreground
                        : "#f9fafb",
                    fontFamily: getFontFamily(brandData.typography.bodyFont),
                  }}
                >
                  <header className="border-b px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {brandData.logo.main ? (
                          <img
                            src={brandData.logo.main}
                            alt={brandData.name}
                            className="h-8"
                          />
                        ) : (
                          <div
                            className="h-8 px-3 py-1.5 font-medium rounded"
                            style={{
                              backgroundColor: brandData.colors.primary,
                              color: getContrastColor(brandData.colors.primary),
                            }}
                          >
                            {brandData.name}
                          </div>
                        )}
                      </div>

                      <nav className="hidden md:flex items-center gap-6">
                        <a href="#" className="text-sm hover:text-primary">
                          Home
                        </a>
                        <a href="#" className="text-sm hover:text-primary">
                          Products
                        </a>
                        <a
                          href="#"
                          className="text-sm"
                          style={{
                            color: brandData.colors.primary,
                          }}
                        >
                          Testimonials
                        </a>
                        <a href="#" className="text-sm hover:text-primary">
                          About
                        </a>
                        <a href="#" className="text-sm hover:text-primary">
                          Contact
                        </a>
                      </nav>

                      <div>
                        <button
                          className="py-2 px-4 rounded-md text-sm font-medium"
                          style={{
                            backgroundColor: brandData.colors.primary,
                            color: getContrastColor(brandData.colors.primary),
                            borderRadius: `${brandData.ui.radius}px`,
                          }}
                        >
                          Get Started
                        </button>
                      </div>
                    </div>
                  </header>

                  <main className="p-6">
                    <div className="max-w-6xl mx-auto">
                      <div className="text-center mb-10">
                        <h2
                          className="text-3xl mb-3"
                          style={{
                            fontFamily: getFontFamily(
                              brandData.typography.headingFont
                            ),
                            fontWeight: brandData.typography.weights.heading,
                          }}
                        >
                          What Our Customers Say
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
                          Don't just take our word for it. See what real
                          customers have to say about their experiences.
                        </p>
                      </div>

                      <div
                        className={cn(
                          "grid gap-6",
                          brandData.testimonials.layout === "grid" &&
                            "grid-cols-1 md:grid-cols-3",
                          brandData.testimonials.layout === "masonry" &&
                            "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
                          brandData.testimonials.layout === "list" &&
                            "grid-cols-1 max-w-3xl mx-auto",
                          brandData.testimonials.layout === "carousel" &&
                            "flex overflow-x-auto gap-6 pb-4"
                        )}
                      >
                        {/* Testimonial 1 */}
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
                            brandData.testimonials.shadow === "sm" &&
                              "shadow-sm",
                            brandData.testimonials.shadow === "md" &&
                              "shadow-md",
                            brandData.testimonials.shadow === "lg" &&
                              "shadow-lg",
                            brandData.testimonials.style === "bubble" &&
                              "relative after:content-[''] after:absolute after:bottom-[-12px] after:left-6 after:w-0 after:h-0 after:border-l-[12px] after:border-l-transparent after:border-t-[12px] after:border-t-white dark:after:border-t-gray-800 after:border-r-[12px] after:border-r-transparent",
                            brandData.testimonials.style === "highlight" &&
                              "border-l-4",
                            brandData.testimonials.style === "highlight" &&
                              `border-l-${brandData.colors.primary}`,
                            brandData.testimonials.layout === "carousel" &&
                              "min-w-[300px] md:min-w-[350px]",
                            brandData.testimonials.animation &&
                              "hover:-translate-y-1 hover:shadow-md"
                          )}
                          style={{
                            backgroundColor:
                              colorMode === "light"
                                ? brandData.testimonials.style === "minimal"
                                  ? "transparent"
                                  : "white"
                                : brandData.testimonials.style === "minimal"
                                  ? "transparent"
                                  : "#1f2937",
                            borderLeftColor:
                              brandData.testimonials.style === "highlight"
                                ? brandData.colors.primary
                                : undefined,
                            transition:
                              "transform 0.3s ease, box-shadow 0.3s ease",
                          }}
                        >
                          <div
                            className={cn(
                              "p-6",
                              brandData.testimonials.style === "minimal" &&
                                "p-0",
                              brandData.testimonials.style === "modern" &&
                                "bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 p-6"
                            )}
                          >
                            {/* Rating */}
                            {brandData.testimonials.showRating && (
                              <div className="mb-3 flex">
                                {brandData.testimonials.ratingStyle ===
                                  "stars" && (
                                  <>
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
                                  </>
                                )}

                                {brandData.testimonials.ratingStyle ===
                                  "number" && (
                                  <span
                                    className="text-sm font-medium"
                                    style={{
                                      color: brandData.colors.primary,
                                    }}
                                  >
                                    5.0/5
                                  </span>
                                )}

                                {brandData.testimonials.ratingStyle ===
                                  "text" && (
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
                                  brandData.testimonials.style === "quote" &&
                                    "italic",
                                  brandData.testimonials.style === "minimal" &&
                                    "text-base",
                                  brandData.testimonials.style === "card" &&
                                    "text-base",
                                  brandData.testimonials.style === "bubble" &&
                                    "text-sm",
                                  brandData.testimonials.style ===
                                    "highlight" && "text-base relative pl-4",
                                  brandData.testimonials.style === "modern" &&
                                    "text-base font-medium"
                                )}
                              >
                                The service exceeded all my expectations. Their
                                attention to detail and responsive support team
                                made the whole experience exceptional. I highly
                                recommend them to anyone.
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
                                    brandData.testimonials.shape ===
                                      "rounded" && "rounded-lg overflow-hidden",
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
                                    fontWeight:
                                      brandData.typography.weights.heading,
                                  }}
                                >
                                  Michael Johnson
                                </p>

                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                  {brandData.testimonials.showCompany && (
                                    <span>CEO, TechInnovate</span>
                                  )}

                                  {brandData.testimonials.showDate &&
                                    brandData.testimonials.showCompany && (
                                      <span>•</span>
                                    )}

                                  {brandData.testimonials.showDate && (
                                    <span>May 12, 2023</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Testimonial 2 */}
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
                            brandData.testimonials.shadow === "sm" &&
                              "shadow-sm",
                            brandData.testimonials.shadow === "md" &&
                              "shadow-md",
                            brandData.testimonials.shadow === "lg" &&
                              "shadow-lg",
                            brandData.testimonials.style === "bubble" &&
                              "relative after:content-[''] after:absolute after:bottom-[-12px] after:left-6 after:w-0 after:h-0 after:border-l-[12px] after:border-l-transparent after:border-t-[12px] after:border-t-white dark:after:border-t-gray-800 after:border-r-[12px] after:border-r-transparent",
                            brandData.testimonials.style === "highlight" &&
                              "border-l-4",
                            brandData.testimonials.style === "highlight" &&
                              `border-l-${brandData.colors.primary}`,
                            brandData.testimonials.layout === "carousel" &&
                              "min-w-[300px] md:min-w-[350px]",
                            brandData.testimonials.animation &&
                              "hover:-translate-y-1 hover:shadow-md"
                          )}
                          style={{
                            backgroundColor:
                              colorMode === "light"
                                ? brandData.testimonials.style === "minimal"
                                  ? "transparent"
                                  : "white"
                                : brandData.testimonials.style === "minimal"
                                  ? "transparent"
                                  : "#1f2937",
                            borderLeftColor:
                              brandData.testimonials.style === "highlight"
                                ? brandData.colors.primary
                                : undefined,
                            transition:
                              "transform 0.3s ease, box-shadow 0.3s ease",
                          }}
                        >
                          <div
                            className={cn(
                              "p-6",
                              brandData.testimonials.style === "minimal" &&
                                "p-0",
                              brandData.testimonials.style === "modern" &&
                                "bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 p-6"
                            )}
                          >
                            {/* Rating */}
                            {brandData.testimonials.showRating && (
                              <div className="mb-3 flex">
                                {brandData.testimonials.ratingStyle ===
                                  "stars" && (
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

                                {brandData.testimonials.ratingStyle ===
                                  "number" && (
                                  <span
                                    className="text-sm font-medium"
                                    style={{
                                      color: brandData.colors.primary,
                                    }}
                                  >
                                    4.0/5
                                  </span>
                                )}

                                {brandData.testimonials.ratingStyle ===
                                  "text" && (
                                  <span
                                    className="text-sm font-medium"
                                    style={{
                                      color: brandData.colors.primary,
                                    }}
                                  >
                                    Great
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
                                  brandData.testimonials.style === "quote" &&
                                    "italic",
                                  brandData.testimonials.style === "minimal" &&
                                    "text-base",
                                  brandData.testimonials.style === "card" &&
                                    "text-base",
                                  brandData.testimonials.style === "bubble" &&
                                    "text-sm",
                                  brandData.testimonials.style ===
                                    "highlight" && "text-base relative pl-4",
                                  brandData.testimonials.style === "modern" &&
                                    "text-base font-medium"
                                )}
                              >
                                As a small business owner, I was looking for an
                                affordable solution. Not only was this within my
                                budget, but the value it provides is incredible.
                                The ROI was evident within weeks.
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
                                    brandData.testimonials.shape ===
                                      "rounded" && "rounded-lg overflow-hidden",
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
                                    fontWeight:
                                      brandData.typography.weights.heading,
                                  }}
                                >
                                  Sarah Williams
                                </p>

                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                  {brandData.testimonials.showCompany && (
                                    <span>Founder, CreativeStudio</span>
                                  )}

                                  {brandData.testimonials.showDate &&
                                    brandData.testimonials.showCompany && (
                                      <span>•</span>
                                    )}

                                  {brandData.testimonials.showDate && (
                                    <span>Jun 3, 2023</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Testimonial 3 */}
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
                            brandData.testimonials.shadow === "sm" &&
                              "shadow-sm",
                            brandData.testimonials.shadow === "md" &&
                              "shadow-md",
                            brandData.testimonials.shadow === "lg" &&
                              "shadow-lg",
                            brandData.testimonials.style === "bubble" &&
                              "relative after:content-[''] after:absolute after:bottom-[-12px] after:left-6 after:w-0 after:h-0 after:border-l-[12px] after:border-l-transparent after:border-t-[12px] after:border-t-white dark:after:border-t-gray-800 after:border-r-[12px] after:border-r-transparent",
                            brandData.testimonials.style === "highlight" &&
                              "border-l-4",
                            brandData.testimonials.style === "highlight" &&
                              `border-l-${brandData.colors.primary}`,
                            brandData.testimonials.layout === "carousel" &&
                              "min-w-[300px] md:min-w-[350px]",
                            brandData.testimonials.animation &&
                              "hover:-translate-y-1 hover:shadow-md"
                          )}
                          style={{
                            backgroundColor:
                              colorMode === "light"
                                ? brandData.testimonials.style === "minimal"
                                  ? "transparent"
                                  : "white"
                                : brandData.testimonials.style === "minimal"
                                  ? "transparent"
                                  : "#1f2937",
                            borderLeftColor:
                              brandData.testimonials.style === "highlight"
                                ? brandData.colors.primary
                                : undefined,
                            transition:
                              "transform 0.3s ease, box-shadow 0.3s ease",
                          }}
                        >
                          <div
                            className={cn(
                              "p-6",
                              brandData.testimonials.style === "minimal" &&
                                "p-0",
                              brandData.testimonials.style === "modern" &&
                                "bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 p-6"
                            )}
                          >
                            {/* Rating */}
                            {brandData.testimonials.showRating && (
                              <div className="mb-3 flex">
                                {brandData.testimonials.ratingStyle ===
                                  "stars" && (
                                  <>
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
                                  </>
                                )}

                                {brandData.testimonials.ratingStyle ===
                                  "number" && (
                                  <span
                                    className="text-sm font-medium"
                                    style={{
                                      color: brandData.colors.primary,
                                    }}
                                  >
                                    5.0/5
                                  </span>
                                )}

                                {brandData.testimonials.ratingStyle ===
                                  "text" && (
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
                                  brandData.testimonials.style === "quote" &&
                                    "italic",
                                  brandData.testimonials.style === "minimal" &&
                                    "text-base",
                                  brandData.testimonials.style === "card" &&
                                    "text-base",
                                  brandData.testimonials.style === "bubble" &&
                                    "text-sm",
                                  brandData.testimonials.style ===
                                    "highlight" && "text-base relative pl-4",
                                  brandData.testimonials.style === "modern" &&
                                    "text-base font-medium"
                                )}
                              >
                                Their customer service team went above and
                                beyond to help us implement the solution for our
                                specific needs. Couldn't be happier with our
                                choice to work with them.
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
                                    brandData.testimonials.shape ===
                                      "rounded" && "rounded-lg overflow-hidden",
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
                                    fontWeight:
                                      brandData.typography.weights.heading,
                                  }}
                                >
                                  David Chen
                                </p>

                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                  {brandData.testimonials.showCompany && (
                                    <span>CTO, TechSolutions</span>
                                  )}

                                  {brandData.testimonials.showDate &&
                                    brandData.testimonials.showCompany && (
                                      <span>•</span>
                                    )}

                                  {brandData.testimonials.showDate && (
                                    <span>Jul 28, 2023</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-10 text-center">
                        <button
                          className="py-2.5 px-6 rounded-md text-sm font-medium transition-colors"
                          style={{
                            backgroundColor: brandData.colors.primary,
                            color: getContrastColor(brandData.colors.primary),
                            borderRadius: `${brandData.ui.radius}px`,
                          }}
                        >
                          {brandData.voice.ctas[0] || "Share your experience"}
                        </button>
                      </div>
                    </div>
                  </main>
                </div>
              )}

              {/* Widget Preview */}
              {previewTab === "widget" && (
                <div
                  className="h-full relative"
                  style={{
                    backgroundColor: "rgba(0,0,0,0.05)",
                    backgroundImage:
                      "linear-gradient(0deg, rgba(156,163,175,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(156,163,175,0.2) 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                    backgroundPosition: "-1px -1px",
                  }}
                >
                  {/* Testimonial Request Widget */}
                  <div
                    className={cn(
                      "absolute bottom-4 right-4 w-72 overflow-hidden shadow-lg",
                      brandData.testimonials.shape === "rounded" &&
                        "rounded-lg",
                      brandData.testimonials.shape === "square" &&
                        "rounded-none",
                      brandData.testimonials.shape === "circle" && "rounded-3xl"
                    )}
                    style={{
                      backgroundColor:
                        colorMode === "light" ? "#fff" : "#1f2937",
                      color:
                        colorMode === "light"
                          ? brandData.colors.foreground
                          : "#f9fafb",
                      fontFamily: getFontFamily(brandData.typography.bodyFont),
                      boxShadow:
                        "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    }}
                  >
                    <div
                      className="p-4 flex items-center justify-between"
                      style={{
                        backgroundColor: brandData.colors.primary,
                        color: getContrastColor(brandData.colors.primary),
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {brandData.logo.main ? (
                          <img
                            src={brandData.logo.main}
                            alt={brandData.name}
                            className="h-6 w-auto"
                          />
                        ) : (
                          <div
                            className="h-6 w-6 rounded-full flex items-center justify-center"
                            style={{
                              backgroundColor: "rgba(255,255,255,0.2)",
                              fontFamily: getFontFamily(
                                brandData.typography.headingFont
                              ),
                              fontWeight: brandData.typography.weights.heading,
                            }}
                          >
                            {brandData.name.charAt(0)}
                          </div>
                        )}
                        <h3
                          className="text-sm font-medium"
                          style={{
                            fontFamily: getFontFamily(
                              brandData.typography.headingFont
                            ),
                            fontWeight: brandData.typography.weights.heading,
                          }}
                        >
                          Share Your Feedback
                        </h3>
                      </div>
                      <button className="text-white opacity-70 hover:opacity-100">
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="p-4">
                      <p className="text-sm mb-4">
                        {brandData.voice.requestTemplates.website.replace(
                          /{{brand}}/g,
                          brandData.name
                        )}
                      </p>

                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="widget-rating" className="text-xs">
                            Your Rating
                          </Label>
                          <div className="flex gap-1">
                            {Array(5)
                              .fill(0)
                              .map((_, i) => (
                                <Star
                                  key={i}
                                  className="h-6 w-6 cursor-pointer"
                                  color={brandData.colors.primary}
                                  fill={
                                    i < 4 ? brandData.colors.primary : "none"
                                  }
                                />
                              ))}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="widget-feedback" className="text-xs">
                            Your Feedback
                          </Label>
                          <Textarea
                            id="widget-feedback"
                            placeholder="Tell us what you think..."
                            className={cn(
                              "text-sm min-h-[80px] resize-none",
                              brandData.testimonials.shape === "rounded" &&
                                "rounded-lg",
                              brandData.testimonials.shape === "square" &&
                                "rounded-none",
                              brandData.testimonials.shape === "circle" &&
                                "rounded-3xl"
                            )}
                          />
                        </div>

                        <div className="pt-2">
                          <button
                            className={cn(
                              "w-full py-2 text-sm font-medium transition-colors",
                              brandData.testimonials.shape === "rounded" &&
                                "rounded-lg",
                              brandData.testimonials.shape === "square" &&
                                "rounded-none",
                              brandData.testimonials.shape === "circle" &&
                                "rounded-3xl"
                            )}
                            style={{
                              backgroundColor: brandData.colors.primary,
                              color: getContrastColor(brandData.colors.primary),
                            }}
                          >
                            Submit Feedback
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "fixed bottom-4 right-20 p-3 cursor-pointer shadow-lg",
                      brandData.testimonials.shape === "rounded" &&
                        "rounded-lg",
                      brandData.testimonials.shape === "square" &&
                        "rounded-none",
                      brandData.testimonials.shape === "circle" &&
                        "rounded-full"
                    )}
                    style={{
                      backgroundColor: brandData.colors.primary,
                      color: getContrastColor(brandData.colors.primary),
                    }}
                  >
                    <MessageSquare className="h-6 w-6" />
                  </div>
                </div>
              )}

              {/* Email Preview */}
              {previewTab === "email" && (
                <div className="h-full bg-gray-100 dark:bg-gray-900 overflow-auto p-6">
                  <div
                    className="max-w-[600px] mx-auto overflow-hidden bg-white dark:bg-gray-800 shadow-md"
                    style={{
                      borderRadius: `${brandData.ui.radius}px`,
                      fontFamily: getFontFamily(brandData.typography.bodyFont),
                    }}
                  >
                    <div
                      className="px-6 py-4"
                      style={{
                        backgroundColor: brandData.colors.primary,
                        color: getContrastColor(brandData.colors.primary),
                      }}
                    >
                      <div className="text-center">
                        {brandData.logo.main ? (
                          <img
                            src={
                              colorMode === "light"
                                ? brandData.logo.main
                                : brandData.logo.darkMode || brandData.logo.main
                            }
                            alt={brandData.name}
                            className="h-8 mx-auto mb-2"
                          />
                        ) : (
                          <h1
                            className="text-xl font-bold"
                            style={{
                              fontFamily: getFontFamily(
                                brandData.typography.headingFont
                              ),
                              fontWeight: brandData.typography.weights.heading,
                            }}
                          >
                            {brandData.name}
                          </h1>
                        )}
                      </div>
                    </div>

                    <div
                      className="px-8 py-6"
                      style={{
                        color:
                          colorMode === "light"
                            ? brandData.colors.foreground
                            : "#f9fafb",
                      }}
                    >
                      <h2
                        className="text-xl mb-4"
                        style={{
                          fontFamily: getFontFamily(
                            brandData.typography.headingFont
                          ),
                          fontWeight: brandData.typography.weights.heading,
                        }}
                      >
                        We'd Love Your Feedback
                      </h2>

                      <div className="mb-6 text-sm whitespace-pre-line">
                        {brandData.voice.requestTemplates.email
                          .replace(/{{name}}/g, "Alex Thompson")
                          .replace(/{{brand}}/g, brandData.name)
                          .replace(/{{product}}/g, "Premium Plan")
                          .split("\n\n")
                          .map((paragraph, i) => (
                            <p key={i} className="mb-3">
                              {paragraph}
                            </p>
                          ))}
                      </div>

                      <div className="my-6 text-center">
                        <a
                          href="#"
                          className={cn(
                            "inline-block px-6 py-3 text-center text-sm font-medium no-underline",
                            brandData.testimonials.shape === "rounded" &&
                              "rounded-lg",
                            brandData.testimonials.shape === "square" &&
                              "rounded-none",
                            brandData.testimonials.shape === "circle" &&
                              "rounded-3xl"
                          )}
                          style={{
                            backgroundColor: brandData.colors.primary,
                            color: getContrastColor(brandData.colors.primary),
                          }}
                        >
                          {brandData.voice.ctas[0] || "Share Your Experience"}
                        </a>
                      </div>

                      <div
                        className="mt-6 pt-6 border-t text-center"
                        style={{
                          borderColor:
                            colorMode === "light" ? "#e5e7eb" : "#374151",
                        }}
                      >
                        <p
                          className="text-xs"
                          style={{
                            color:
                              colorMode === "light" ? "#6b7280" : "#9ca3af",
                          }}
                        >
                          Thank you for being a valued customer.
                          <br />© {new Date().getFullYear()} {brandData.name}.
                          All rights reserved.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              This preview shows how your brand will appear to customers
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() =>
                  setColorMode(colorMode === "light" ? "dark" : "light")
                }
              >
                {colorMode === "light" ? (
                  <>
                    <Moon className="h-3.5 w-3.5 mr-1.5" />
                    <span className="text-xs">Dark</span>
                  </>
                ) : (
                  <>
                    <Sun className="h-3.5 w-3.5 mr-1.5" />
                    <span className="text-xs">Light</span>
                  </>
                )}
              </Button>

              <Button variant="outline" size="sm" className="h-8">
                <Fullscreen className="h-3.5 w-3.5 mr-1.5" />
                <span className="text-xs">Fullscreen</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default observer(Preview);
