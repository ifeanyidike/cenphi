// src/components/collection/email/templates/IncentiveTemplate.tsx
import React from "react";
import {
  Gift,
  Star,
  ArrowRight,
  Clock,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormatOption } from "@/types/setup";

interface IncentiveTemplateProps {
  companyName: string;
  companyLogo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  incentiveType: "discount" | "gift" | "feature" | "credit" | "donation";
  incentiveValue: string;
  incentiveCode?: string;
  expiryDays?: number;
  recipientName?: string;
  productName?: string;
  supportedFormats?: FormatOption[];
  customMessage?: string;
  ctaText?: string;
  ctaUrl?: string;
  isPreview?: boolean;
}

/**
 * Premium email template for testimonial requests with incentives
 * This template is designed to maximize conversion by highlighting the incentive
 */
const IncentiveTemplate: React.FC<IncentiveTemplateProps> = ({
  companyName = "Your Company",
  companyLogo,
  primaryColor = "#4F46E5",
  incentiveType = "discount",
  incentiveValue = "10% off your next purchase",
  incentiveCode,
  expiryDays = 30,
  recipientName = "Valued Customer",
  productName = "our product",
  supportedFormats = [],
  customMessage,
  ctaText = "Share Your Experience",
  isPreview = false,
}) => {
  // Calculate expiry date
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + expiryDays);

  // Format expiry date in a user-friendly way
  const formattedExpiryDate = expiryDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Determine incentive icon based on type
  const IncentiveIcon = () => {
    switch (incentiveType) {
      case "discount":
        return (
          <Badge
            className="bg-amber-100 text-amber-800 p-1.5"
            variant="outline"
          >
            <Gift className="h-4 w-4" />
          </Badge>
        );
      case "gift":
        return (
          <Badge
            className="bg-purple-100 text-purple-800 p-1.5"
            variant="outline"
          >
            <Gift className="h-4 w-4" />
          </Badge>
        );
      case "feature":
        return (
          <Badge className="bg-blue-100 text-blue-800 p-1.5" variant="outline">
            <Star className="h-4 w-4" />
          </Badge>
        );
      case "credit":
        return (
          <Badge
            className="bg-green-100 text-green-800 p-1.5"
            variant="outline"
          >
            <CheckCircle className="h-4 w-4" />
          </Badge>
        );
      case "donation":
        return (
          <Badge className="bg-red-100 text-red-800 p-1.5" variant="outline">
            <Sparkles className="h-4 w-4" />
          </Badge>
        );
      default:
        return (
          <Badge
            className="bg-slate-100 text-slate-800 p-1.5"
            variant="outline"
          >
            <Gift className="h-4 w-4" />
          </Badge>
        );
    }
  };

  // Determine which formats are enabled
  const enabledFormats = supportedFormats.filter((format) => format.enabled);

  // Function to get format display name
  const getFormatDisplayName = (type: string) => {
    switch (type) {
      case "video":
        return "Video";
      case "audio":
        return "Audio";
      case "text":
        return "Written";
      case "image":
        return "Photo";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  return (
    <div
      className={`email-template-preview ${
        isPreview
          ? "max-w-2xl mx-auto border shadow-sm rounded-lg overflow-hidden"
          : ""
      }`}
    >
      {/* Email Header with Logo */}
      <div className="py-8 px-8" style={{ backgroundColor: primaryColor }}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {companyLogo ? (
              <img
                src={companyLogo}
                alt={companyName}
                className="h-10 w-auto bg-white p-1 rounded"
              />
            ) : (
              <div
                className="h-10 w-10 rounded bg-white text-center flex items-center justify-center text-xl font-bold"
                style={{ color: primaryColor }}
              >
                {companyName.charAt(0)}
              </div>
            )}
            <h1 className="text-white text-xl font-bold">{companyName}</h1>
          </div>
          {isPreview && (
            <Badge
              variant="outline"
              className="bg-white/20 text-white border-white/30"
            >
              Preview
            </Badge>
          )}
        </div>
      </div>

      {/* Email Body */}
      <div className="bg-white p-8 space-y-6">
        {/* Greeting */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Hi {recipientName},</h2>
          <p className="text-gray-700">
            Thank you for choosing {productName}. We're committed to delivering
            the best experience possible and your feedback is incredibly
            valuable to us.
          </p>
          <p className="text-gray-700">
            {customMessage ||
              `We'd love to hear about your experience with ${productName}. Your insights help us improve and assist other customers in making informed decisions.`}
          </p>
        </div>

        {/* Special Offer Card */}
        <Card
          className="border-2 border-dashed"
          style={{ borderColor: `${primaryColor}40` }}
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span
                  className="inline-flex items-center justify-center p-1.5 rounded-full"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <Gift className="h-5 w-5" style={{ color: primaryColor }} />
                </span>
                <span>Special Offer Just For You</span>
              </CardTitle>
              <IncentiveIcon />
            </div>
          </CardHeader>
          <CardContent className="pb-3 space-y-3">
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100 text-center">
              <h3
                className="text-xl font-bold mb-1"
                style={{ color: primaryColor }}
              >
                {incentiveValue}
              </h3>
              <p className="text-gray-600 text-sm">
                Share your testimonial to claim this exclusive reward
              </p>

              {incentiveCode && (
                <div className="mt-3 flex items-center justify-center">
                  <div
                    className="px-4 py-2 bg-white border-2 rounded-md inline-block font-mono font-bold text-lg tracking-wide"
                    style={{ borderColor: primaryColor }}
                  >
                    {incentiveCode}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Clock className="h-3.5 w-3.5" />
              <span>Offer expires on {formattedExpiryDate}</span>
            </div>
          </CardContent>
          <CardFooter className="pt-0 flex justify-center">
            <Button
              className="px-6 text-white"
              style={{ backgroundColor: primaryColor }}
            >
              {ctaText} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        {/* Testimonial Options */}
        <div className="space-y-3">
          <h3 className="font-medium">Choose how to share your experience:</h3>
          <div className="grid grid-cols-2 gap-3">
            {enabledFormats.map((format) => (
              <div
                key={format.type}
                className="p-4 border rounded-lg flex items-center gap-3 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <div
                  className="p-2 rounded-full bg-white"
                  style={{ color: primaryColor }}
                >
                  {format.type === "video" && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="23 7 16 12 23 17 23 7"></polygon>
                      <rect
                        x="1"
                        y="5"
                        width="15"
                        height="14"
                        rx="2"
                        ry="2"
                      ></rect>
                    </svg>
                  )}
                  {format.type === "audio" && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" y1="19" x2="12" y2="23"></line>
                      <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                  )}
                  {format.type === "text" && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  )}
                  {format.type === "image" && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                      ></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                  )}
                </div>
                <div>
                  <div className="font-medium">
                    {getFormatDisplayName(format.type)} Testimonial
                  </div>
                  <div className="text-xs text-gray-500">
                    {format.type === "video" && "Record a short video"}
                    {format.type === "audio" && "Share your voice review"}
                    {format.type === "text" && "Write a text review"}
                    {format.type === "image" && "Upload photos with comments"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Closing Message */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-gray-700">
            Thank you for taking the time to share your feedback. Your insights
            will help us continue to improve and grow.
          </p>
          <p className="mt-4 text-gray-700">
            Best regards,
            <br />
            The {companyName} Team
          </p>
        </div>
      </div>

      {/* Email Footer */}
      <div className="bg-gray-100 p-6 text-center text-sm text-gray-500 space-y-3">
        <p>
          © {new Date().getFullYear()} {companyName}. All rights reserved.
        </p>
        <p>
          <a href="#" className="text-gray-600 underline">
            Privacy Policy
          </a>{" "}
          •
          <a href="#" className="text-gray-600 underline mx-2">
            Terms of Service
          </a>{" "}
          •
          <a href="#" className="text-gray-600 underline">
            Unsubscribe
          </a>
        </p>
      </div>
    </div>
  );
};

export default IncentiveTemplate;
