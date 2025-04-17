import React from "react";
import { EmailTemplate, TestimonialFormat } from "@/types/setup";

interface MediaRichTemplateProps {
  template: EmailTemplate;
  formats: TestimonialFormat[];
  primaryColor: string;
  companyName: string;
  previewMode: boolean;
  onToggleFormat: (formatId: string) => void;
  onUpdateTemplate: (template: EmailTemplate) => void;
  replyToEmail?: string;
  signatureText?: string;
  senderName?: string;
}

const HEADER_IMAGE =
  "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&auto=format&fit=crop&q=80";
const LOGO_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24'%3E%3Cpath fill='%23333' d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'/%3E%3C/svg%3E";
const CUSTOMER_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle fill='%23DDD' cx='12' cy='7' r='5'/%3E%3Cpath fill='%23DDD' d='M3 19a9 9 0 0 1 18 0 1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z'/%3E%3C/svg%3E";

const MediaRichTemplate: React.FC<MediaRichTemplateProps> = ({
  template,
  formats,
  primaryColor,
  companyName,
  replyToEmail = "support@company.com",
  signatureText = "The Team",
}) => {
  // Use the first format as the default
  const primaryFormat = formats[0] || {
    id: "default",
    name: "Testimonial",
    type: "text",
  };

  // Generate a style object from the primary color
  const getStylesFromColor = (color: string) => {
    // Convert hex to RGB for manipulations
    const hexToRgb = (
      hex: string
    ): { r: number; g: number; b: number } | null => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : null;
    };

    const rgb = hexToRgb(color);
    if (!rgb) return { main: color, light: `${color}33`, dark: color };

    return {
      main: color,
      light: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`,
      lighter: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05)`,
      dark: `rgb(${Math.max(0, rgb.r - 30)}, ${Math.max(0, rgb.g - 30)}, ${Math.max(0, rgb.b - 30)})`,
      text: `rgb(${Math.max(0, rgb.r - 60)}, ${Math.max(0, rgb.g - 60)}, ${Math.max(0, rgb.b - 60)})`,
      rgbValues: `${rgb.r}, ${rgb.g}, ${rgb.b}`,
    };
  };

  const colorStyles = getStylesFromColor(primaryColor);

  // Testimonial request title based on format
  const getFormatTitle = (format: TestimonialFormat) => {
    const type = format.toLowerCase();

    if (type.includes("star") || type.includes("rating"))
      return "How was your experience?";
    if (type.includes("video")) return "Share a video testimonial";
    if (type.includes("quote")) return "Tell us about your experience";
    if (type.includes("like") || type.includes("thumb"))
      return "Would you recommend us?";
    if (type.includes("love") || type.includes("heart"))
      return "Share your story";

    return "We'd love your feedback";
  };

  // Button text based on format
  const getButtonText = (format: TestimonialFormat) => {
    const type = format.toLowerCase();

    if (type.includes("star") || type.includes("rating"))
      return "Rate Your Experience";
    if (type.includes("video")) return "Record a Video";
    if (type.includes("quote")) return "Write a Testimonial";
    if (type.includes("like") || type.includes("thumb"))
      return "Leave Feedback";
    if (type.includes("love") || type.includes("heart"))
      return "Share Your Recommendation";

    return "Share Your Feedback";
  };

  // Get format description
  const getFormatDescription = (format: TestimonialFormat) => {
    const type = format.toLowerCase();

    if (type.includes("star") || type.includes("rating"))
      return "Let us know how we did! Your rating helps us improve and assists others in making decisions.";
    if (type.includes("video"))
      return "A quick video testimonial is worth a thousand words. Share your experience in a brief 30-second clip.";
    if (type.includes("quote"))
      return "We'd love to hear about your experience. Your testimonial helps us improve and grow.";
    if (type.includes("like") || type.includes("thumb"))
      return "Would you recommend us to a friend or colleague? Quick feedback takes just seconds.";

    return "We value your opinion. Please take a moment to share your experience with us.";
  };

  return (
    <div className="font-sans text-gray-800">
      {/* Email Container - Using table-based structure for email client compatibility */}
      <table
        cellPadding="0"
        cellSpacing="0"
        border={0}
        width="100%"
        style={{
          maxWidth: "100%",
          margin: 0,
          padding: 0,
          backgroundColor: "#ffffff",
        }}
      >
        <tbody>
          {/* Header Image Row */}
          <tr>
            <td align="center" valign="top" style={{ padding: 0 }}>
              {/* Header with Image */}
              <table
                cellPadding="0"
                cellSpacing="0"
                border={0}
                width="100%"
                style={{ maxWidth: "600px" }}
              >
                <tbody>
                  <tr>
                    <td>
                      <div
                        style={{
                          position: "relative",
                          height: "180px",
                          //@ts-expect-error headerImage not defined yet
                          backgroundImage: `url(${template.design?.headerImage || HEADER_IMAGE})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundColor: colorStyles.light,
                          borderTopLeftRadius: "8px",
                          borderTopRightRadius: "8px",
                        }}
                      >
                        {/* Dark overlay */}
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background:
                              "linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.1))",
                            borderTopLeftRadius: "8px",
                            borderTopRightRadius: "8px",
                          }}
                        ></div>

                        {/* Company logo */}
                        <div
                          style={{
                            position: "absolute",
                            top: "24px",
                            left: "24px",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              height: "36px",
                              width: "36px",
                              backgroundColor: "#ffffff",
                              borderRadius: "6px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              marginRight: "12px",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            }}
                          >
                            <img
                              src={LOGO_PLACEHOLDER}
                              alt={companyName}
                              style={{
                                height: "24px",
                                width: "24px",
                                objectFit: "contain",
                              }}
                            />
                          </div>
                          <div
                            style={{
                              color: "#ffffff",
                              fontSize: "18px",
                              fontWeight: "bold",
                            }}
                          >
                            {companyName}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* Content Row */}
          <tr>
            <td align="center" valign="top" style={{ padding: 0 }}>
              <table
                cellPadding="0"
                cellSpacing="0"
                border={0}
                width="100%"
                style={{ maxWidth: "600px" }}
              >
                <tbody>
                  <tr>
                    <td
                      style={{
                        padding: "32px 24px",
                        backgroundColor: "#ffffff",
                      }}
                    >
                      {/* Greeting */}
                      <h1
                        style={{
                          fontSize: "24px",
                          fontWeight: "bold",
                          marginBottom: "16px",
                          color: "#1f2937",
                        }}
                      >
                        We'd Love Your Feedback
                      </h1>
                      <p
                        style={{
                          fontSize: "16px",
                          lineHeight: "1.5",
                          color: "#4b5563",
                          marginBottom: "24px",
                        }}
                      >
                        Thank you for choosing {companyName}. We're committed to
                        providing the best experience possible, and your
                        feedback is invaluable to us. Would you take a moment to
                        share your experience?
                      </p>

                      {/* Featured Customer Story */}
                      <table
                        cellPadding="0"
                        cellSpacing="0"
                        border={0}
                        width="100%"
                        style={{
                          marginBottom: "32px",
                          backgroundColor: "#f9fafb",
                          borderRadius: "12px",
                          border: "1px solid #f3f4f6",
                        }}
                      >
                        <tbody>
                          <tr>
                            <td style={{ padding: "24px" }}>
                              <table
                                cellPadding="0"
                                cellSpacing="0"
                                border={0}
                                width="100%"
                              >
                                <tbody>
                                  <tr>
                                    <td width="48" valign="top">
                                      <img
                                        src={CUSTOMER_AVATAR}
                                        alt="Customer"
                                        style={{
                                          width: "48px",
                                          height: "48px",
                                          borderRadius: "24px",
                                          backgroundColor: "#d1d5db",
                                        }}
                                      />
                                    </td>
                                    <td style={{ paddingLeft: "16px" }}>
                                      <div style={{ marginBottom: "4px" }}>
                                        <img
                                          src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='16' viewBox='0 0 80 16'%3E%3Cpath fill='%23FBBF24' d='M8 0L9.8 5.4h6.2l-5 3.6 2 5.4-5-3.6-5 3.6 2-5.4-5-3.6h6.2L8 0zm16 0l1.8 5.4h6.2l-5 3.6 2 5.4-5-3.6-5 3.6 2-5.4-5-3.6h6.2L24 0zm16 0l1.8 5.4h6.2l-5 3.6 2 5.4-5-3.6-5 3.6 2-5.4-5-3.6h6.2L40 0zm16 0l1.8 5.4h6.2l-5 3.6 2 5.4-5-3.6-5 3.6 2-5.4-5-3.6h6.2L56 0zm16 0l1.8 5.4H80l-5 3.6 2 5.4-5-3.6-5 3.6 2-5.4-5-3.6h6.2L72 0z'/%3E%3C/svg%3E"
                                          alt="5 stars"
                                          style={{
                                            height: "16px",
                                            marginBottom: "8px",
                                          }}
                                        />
                                      </div>
                                      <p
                                        style={{
                                          fontSize: "14px",
                                          fontStyle: "italic",
                                          color: "#4b5563",
                                          marginBottom: "8px",
                                          lineHeight: "1.4",
                                          margin: "0 0 8px 0",
                                        }}
                                      >
                                        "{companyName} exceeded my expectations.
                                        Their service was exceptional, and I've
                                        already recommended them to several
                                        friends."
                                      </p>
                                      <div
                                        style={{
                                          display: "flex",
                                          justifyContent: "space-between",
                                        }}
                                      >
                                        <span
                                          style={{
                                            fontSize: "14px",
                                            fontWeight: "500",
                                            color: "#1f2937",
                                          }}
                                        >
                                          Sarah Johnson
                                        </span>
                                        <span
                                          style={{
                                            fontSize: "12px",
                                            color: "#6b7280",
                                          }}
                                        >
                                          Verified Customer
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Testimonial Request Section */}
                      <h2
                        style={{
                          fontSize: "18px",
                          fontWeight: "600",
                          marginBottom: "16px",
                          color: "#1f2937",
                        }}
                      >
                        {getFormatTitle(primaryFormat)}
                      </h2>

                      {/* Primary format CTA */}
                      <table
                        cellPadding="0"
                        cellSpacing="0"
                        border={0}
                        width="100%"
                        style={{
                          marginBottom: "32px",
                          backgroundColor: colorStyles.lighter,
                          borderRadius: "12px",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        <tbody>
                          <tr>
                            <td style={{ padding: "24px" }}>
                              <div style={{ marginBottom: "16px" }}>
                                <p
                                  style={{
                                    fontSize: "16px",
                                    lineHeight: "1.5",
                                    color: "#4b5563",
                                    margin: "0",
                                  }}
                                >
                                  {getFormatDescription(primaryFormat)}
                                </p>
                              </div>

                              {/* Format-specific preview */}
                              {primaryFormat.includes("star") && (
                                <div
                                  style={{
                                    marginBottom: "20px",
                                    textAlign: "center",
                                  }}
                                >
                                  <img
                                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='224' height='32' viewBox='0 0 224 32'%3E%3Cpath fill='%23E5E7EB' d='M16 0L19.6 10.8h12.4l-10 7.2 4 10.8-10-7.2-10 7.2 4-10.8-10-7.2h12.4L16 0zm48 0l3.6 10.8H80l-10 7.2 4 10.8-10-7.2-10 7.2 4-10.8-10-7.2h12.4L64 0zm48 0l3.6 10.8h12.4l-10 7.2 4 10.8-10-7.2-10 7.2 4-10.8-10-7.2h12.4L112 0zm48 0l3.6 10.8h12.4l-10 7.2 4 10.8-10-7.2-10 7.2 4-10.8-10-7.2h12.4L160 0zm48 0l3.6 10.8h12.4l-10 7.2 4 10.8-10-7.2-10 7.2 4-10.8-10-7.2h12.4L208 0z'/%3E%3C/svg%3E"
                                    alt="Rating stars"
                                    style={{ height: "32px" }}
                                  />
                                  <div
                                    style={{
                                      marginTop: "8px",
                                      fontSize: "14px",
                                      color: "#6b7280",
                                    }}
                                  >
                                    Click below to rate your experience
                                  </div>
                                </div>
                              )}

                              {primaryFormat.includes("video") && (
                                <div
                                  style={{
                                    marginBottom: "20px",
                                    textAlign: "center",
                                    backgroundColor: "#f3f4f6",
                                    padding: "32px",
                                    borderRadius: "8px",
                                  }}
                                >
                                  <img
                                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24'%3E%3Cpath fill='%239CA3AF' d='M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2zm.5 3a.5.5 0 00-.5.5v9a.5.5 0 00.5.5h13a.5.5 0 00.5-.5v-9a.5.5 0 00-.5-.5h-13zM12 8a4 4 0 110 8 4 4 0 010-8zm0 2a2 2 0 100 4 2 2 0 000-4z'/%3E%3C/svg%3E"
                                    alt="Camera icon"
                                    style={{
                                      height: "48px",
                                      marginBottom: "12px",
                                    }}
                                  />
                                  <div
                                    style={{
                                      fontSize: "14px",
                                      color: "#6b7280",
                                    }}
                                  >
                                    Click below to record a video testimonial
                                  </div>
                                </div>
                              )}

                              {primaryFormat.includes("text") &&
                                !primaryFormat.includes("video") && (
                                  <div
                                    style={{
                                      marginBottom: "20px",
                                      backgroundColor: "#ffffff",
                                      padding: "16px",
                                      borderRadius: "8px",
                                      border: "1px solid #e5e7eb",
                                    }}
                                  >
                                    <div
                                      style={{
                                        fontSize: "14px",
                                        color: "#9ca3af",
                                        fontStyle: "italic",
                                        textAlign: "center",
                                      }}
                                    >
                                      Click the button below to share your
                                      thoughts...
                                    </div>
                                  </div>
                                )}

                              {/* CTA Button */}
                              <table
                                cellPadding="0"
                                cellSpacing="0"
                                border={0}
                                width="100%"
                              >
                                <tbody>
                                  <tr>
                                    <td align="center">
                                      <a
                                        href="#feedback-link"
                                        target="_blank"
                                        style={{
                                          display: "inline-block",
                                          padding: "14px 28px",
                                          backgroundColor: primaryColor,
                                          color: "#ffffff",
                                          fontWeight: "500",
                                          fontSize: "16px",
                                          borderRadius: "8px",
                                          textDecoration: "none",
                                          textAlign: "center",
                                          boxShadow: `0 2px 5px ${colorStyles.light}`,
                                          lineHeight: "20px",
                                        }}
                                      >
                                        {getButtonText(primaryFormat)} →
                                      </a>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* If there are multiple formats, show them as buttons */}
                      {formats.length > 1 && (
                        <table
                          cellPadding="0"
                          cellSpacing="0"
                          border={0}
                          width="100%"
                          style={{ marginBottom: "24px" }}
                        >
                          <tbody>
                            <tr>
                              <td style={{ paddingBottom: "16px" }}>
                                <p
                                  style={{
                                    fontSize: "14px",
                                    color: "#6b7280",
                                    margin: "0",
                                    textAlign: "center",
                                  }}
                                >
                                  Or choose another way to share your feedback:
                                </p>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <table
                                  cellPadding="0"
                                  cellSpacing="0"
                                  border={0}
                                  width="100%"
                                >
                                  <tbody>
                                    <tr>
                                      {formats
                                        .slice(1, 3)
                                        .map((format, index) => (
                                          <td
                                            key={format}
                                            width="50%"
                                            style={{
                                              padding:
                                                index === 0
                                                  ? "0 8px 0 0"
                                                  : "0 0 0 8px",
                                            }}
                                          >
                                            <a
                                              href={`#${format}-feedback`}
                                              target="_blank"
                                              style={{
                                                display: "block",
                                                padding: "12px 16px",
                                                backgroundColor: "#ffffff",
                                                color: "#374151",
                                                border: "1px solid #e5e7eb",
                                                borderRadius: "8px",
                                                textDecoration: "none",
                                                textAlign: "center",
                                                fontSize: "14px",
                                                fontWeight: "500",
                                              }}
                                            >
                                              {format.includes("star")
                                                ? "Rate Us"
                                                : format.includes("video")
                                                  ? "Record Video"
                                                  : format.includes("text")
                                                    ? "Write Review"
                                                    : "Leave Feedback"}
                                            </a>
                                          </td>
                                        ))}
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      )}

                      {/* Incentive Section */}
                      <table
                        cellPadding="0"
                        cellSpacing="0"
                        border={0}
                        width="100%"
                        style={{
                          marginBottom: "32px",
                          backgroundColor: "#f9fafb",
                          borderRadius: "12px",
                          border: "1px dashed #d1d5db",
                        }}
                      >
                        <tbody>
                          <tr>
                            <td style={{ padding: "24px" }}>
                              <table
                                cellPadding="0"
                                cellSpacing="0"
                                border={0}
                                width="100%"
                              >
                                <tbody>
                                  <tr>
                                    <td width="40" valign="top">
                                      <div
                                        style={{
                                          width: "40px",
                                          height: "40px",
                                          borderRadius: "20px",

                                          backgroundColor: colorStyles.light,
                                          textAlign: "center",
                                          lineHeight: "40px",
                                        }}
                                      >
                                        <img
                                          src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 12v10H4V12'%3E%3C/path%3E%3Cpath d='M2 7h20v5H2z'%3E%3C/path%3E%3Cpath d='M12 22V7'%3E%3C/path%3E%3Cpath d='M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z'%3E%3C/path%3E%3Cpath d='M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z'%3E%3C/path%3E%3C/svg%3E"
                                          alt="Gift icon"
                                          style={{
                                            height: "20px",
                                            width: "20px",
                                            verticalAlign: "middle",
                                            filter: `opacity(0.6) drop-shadow(0 0 0 ${primaryColor})`,
                                          }}
                                        />
                                      </div>
                                    </td>
                                    <td style={{ paddingLeft: "16px" }}>
                                      <h3
                                        style={{
                                          fontSize: "16px",
                                          fontWeight: "600",
                                          marginTop: "0",
                                          marginBottom: "4px",
                                          color: "#1f2937",
                                        }}
                                      >
                                        Special Thank You Offer
                                      </h3>
                                      <p
                                        style={{
                                          fontSize: "14px",
                                          color: "#4b5563",
                                          marginBottom: "8px",
                                          lineHeight: "1.5",
                                          marginTop: "0",
                                        }}
                                      >
                                        As a token of our appreciation, we'll
                                        send you a special discount code after
                                        you submit your feedback.
                                      </p>
                                      <div
                                        style={{
                                          display: "inline-block",
                                          backgroundColor: colorStyles.light,
                                          color: colorStyles.text,
                                          padding: "4px 8px",
                                          borderRadius: "4px",
                                          fontSize: "12px",
                                          fontWeight: "500",
                                        }}
                                      >
                                        10% OFF YOUR NEXT PURCHASE
                                      </div>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* How It Works */}
                      <table
                        cellPadding="0"
                        cellSpacing="0"
                        border={0}
                        width="100%"
                        style={{ marginBottom: "32px" }}
                      >
                        <tbody>
                          <tr>
                            <td style={{ paddingBottom: "12px" }}>
                              <h3
                                style={{
                                  fontSize: "12px",
                                  fontWeight: "500",
                                  color: "#6b7280",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em",
                                  margin: "0",
                                }}
                              >
                                How It Works
                              </h3>
                            </td>
                          </tr>

                          {[
                            {
                              text: "Share your feedback through our simple form",
                            },
                            {
                              text: "Your review helps others discover our services",
                            },
                            {
                              text: "Receive a special thank you offer as our appreciation",
                            },
                          ].map((step, index) => (
                            <tr key={index}>
                              <td
                                style={{
                                  paddingBottom: index !== 2 ? "12px" : "0",
                                }}
                              >
                                <table
                                  cellPadding="0"
                                  cellSpacing="0"
                                  border={0}
                                  width="100%"
                                >
                                  <tbody>
                                    <tr>
                                      <td width="24" valign="top">
                                        <div
                                          style={{
                                            width: "24px",
                                            height: "24px",
                                            borderRadius: "12px",
                                            backgroundColor: colorStyles.light,
                                            textAlign: "center",
                                            lineHeight: "24px",
                                            fontSize: "12px",
                                            fontWeight: "bold",
                                            color: colorStyles.main,
                                          }}
                                        >
                                          {index + 1}
                                        </div>
                                      </td>
                                      <td style={{ paddingLeft: "12px" }}>
                                        <p
                                          style={{
                                            fontSize: "14px",
                                            color: "#4b5563",
                                            lineHeight: "1.5",
                                            margin: "0",
                                          }}
                                        >
                                          {step.text}
                                        </p>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Footer */}
                      <table
                        cellPadding="0"
                        cellSpacing="0"
                        border={0}
                        width="100%"
                        style={{
                          borderTop: "1px solid #e5e7eb",
                          paddingTop: "24px",
                        }}
                      >
                        <tbody>
                          <tr>
                            <td style={{ paddingBottom: "24px" }}>
                              <table
                                cellPadding="0"
                                cellSpacing="0"
                                border={0}
                                width="100%"
                              >
                                <tbody>
                                  <tr>
                                    <td>
                                      <table
                                        cellPadding="0"
                                        cellSpacing="0"
                                        border={0}
                                        width="100%"
                                      >
                                        <tbody>
                                          <tr>
                                            <td width="32">
                                              <div
                                                style={{
                                                  width: "32px",
                                                  height: "32px",
                                                  backgroundColor: "#f3f4f6",
                                                  borderRadius: "6px",
                                                  display: "flex",
                                                  alignItems: "center",
                                                  justifyContent: "center",
                                                }}
                                              >
                                                <img
                                                  src={LOGO_PLACEHOLDER}
                                                  alt={companyName}
                                                  style={{
                                                    height: "24px",
                                                    width: "24px",
                                                    objectFit: "contain",
                                                  }}
                                                />
                                              </div>
                                            </td>
                                            <td style={{ paddingLeft: "8px" }}>
                                              <span
                                                style={{
                                                  fontSize: "14px",
                                                  fontWeight: "500",
                                                  color: "#1f2937",
                                                }}
                                              >
                                                {companyName}
                                              </span>
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td style={{ paddingTop: "12px" }}>
                                      <p
                                        style={{
                                          fontSize: "12px",
                                          color: "#6b7280",
                                          margin: "0",
                                          lineHeight: "1.5",
                                        }}
                                      >
                                        If you have any questions, please
                                        contact us at:
                                        <br />
                                        <a
                                          href={`mailto:${replyToEmail}`}
                                          style={{
                                            color: "#2563eb",
                                            textDecoration: "none",
                                          }}
                                        >
                                          {replyToEmail}
                                        </a>
                                      </p>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td
                              align="center"
                              style={{ paddingBottom: "24px" }}
                            >
                              <p
                                style={{
                                  fontSize: "12px",
                                  color: "#9ca3af",
                                  margin: "0 0 4px 0",
                                  lineHeight: "1.5",
                                }}
                              >
                                Thank you for your business,
                                <br />
                                <span style={{ fontWeight: "500" }}>
                                  {signatureText || "The Team"}
                                </span>
                              </p>
                            </td>
                          </tr>
                          <tr>
                            <td align="center">
                              <p
                                style={{
                                  fontSize: "12px",
                                  color: "#9ca3af",
                                  margin: "0 0 4px 0",
                                }}
                              >
                                © {new Date().getFullYear()} {companyName}. All
                                rights reserved.
                              </p>
                              <p
                                style={{
                                  fontSize: "12px",
                                  color: "#9ca3af",
                                  margin: "0",
                                }}
                              >
                                <a
                                  href="#unsubscribe"
                                  style={{
                                    color: "#9ca3af",
                                    textDecoration: "none",
                                  }}
                                >
                                  Unsubscribe
                                </a>{" "}
                                |
                                <a
                                  href="#privacy"
                                  style={{
                                    color: "#9ca3af",
                                    textDecoration: "none",
                                  }}
                                >
                                  {" "}
                                  Privacy Policy
                                </a>
                              </p>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default MediaRichTemplate;
