import React from "react";
import { CollectionSettings, TestimonialFormat } from "@/types/setup";

interface FollowUpTemplateProps {
  senderName: string;
  primaryColor: string;
  formats: TestimonialFormat[];
  previewMode?: boolean;
  replyToEmail?: string;
  signatureTemplate?: CollectionSettings["email"]["signatureTemplate"];
  companyLogo?: string;
  signatureText?: string;
  senderType?: "personal" | "company";
}

// Constants for demo data
const LOGO_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24'%3E%3Cpath fill='%23333' d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'/%3E%3C/svg%3E";
// const DEFAULT_HEADER =
//   "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='150' viewBox='0 0 600 150'%3E%3Crect width='600' height='150' fill='%23EBF4FF'/%3E%3Cpath fill='%23BFDBFE' d='M0 50L50 45C100 40 200 30 300 35C400 40 500 60 550 70L600 80V150H550C500 150 400 150 300 150C200 150 100 150 50 150H0V50Z'/%3E%3Cpath fill='%2393C5FD' d='M0 80L50 85C100 90 200 100 300 95C400 90 500 70 550 60L600 50V150H550C500 150 400 150 300 150C200 150 100 150 50 150H0V80Z'/%3E%3C/svg%3E";

// Current date formatted nicely for the email
const currentDate = new Date().toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const FollowUpTemplate: React.FC<FollowUpTemplateProps> = ({
  senderName = "Your Company",
  primaryColor = "#4F46E5",
  formats = [],
  replyToEmail = "support@yourcompany.com",
  companyLogo = LOGO_PLACEHOLDER,
}) => {
  // Get the primary format
  const primaryFormat = formats.length > 0 ? formats[0] : "text";

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

  // Get CTA text based on format
  const getCtaText = (formatType: string) => {
    const type = formatType.toLowerCase();
    if (type.includes("star") || type.includes("rating"))
      return "Rate Your Experience";
    if (type.includes("video")) return "Share a Video";
    if (type.includes("text")) return "Share Your Thoughts";
    return "Leave Your Feedback";
  };

  // Time estimate based on format
  const getTimeEstimate = (formatType: string) => {
    const type = formatType.toLowerCase();
    if (type.includes("star") || type.includes("rating")) return "30 seconds";
    if (type.includes("video")) return "1 minute";
    if (type.includes("text")) return "2 minutes";
    return "1 minute";
  };

  return (
    <div className="font-sans">
      {/* Email Container - table-based layout for email client compatibility */}
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
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        }}
      >
        <tbody>
          {/* Header Section */}
          <tr>
            <td
              align="center"
              valign="top"
              style={{
                padding: 0,
                backgroundColor: "#f9fafb",
              }}
            >
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
                      {/* Header with wave design and logo */}
                      <div
                        style={{
                          position: "relative",
                          textAlign: "center",
                          paddingTop: "40px",
                          paddingBottom: "40px",
                          backgroundColor: "#f9fafb",
                          borderRadius: "8px 8px 0 0",
                        }}
                      >
                        {/* Company logo and branding */}
                        <table
                          cellPadding="0"
                          cellSpacing="0"
                          border={0}
                          width="100%"
                        >
                          <tbody>
                            <tr>
                              <td align="center">
                                {/* Logo container */}
                                <div
                                  style={{
                                    display: "inline-block",
                                    backgroundColor: "#ffffff",
                                    borderRadius: "16px",
                                    padding: "16px",
                                    boxShadow:
                                      "0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 15px rgba(0, 0, 0, 0.03)",
                                    marginBottom: "24px",
                                  }}
                                >
                                  <img
                                    src={companyLogo}
                                    alt={senderName}
                                    width="48"
                                    height="48"
                                    style={{ display: "block" }}
                                  />
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td align="center">
                                <h1
                                  style={{
                                    color: "#1f2937",
                                    fontSize: "28px",
                                    fontWeight: "bold",
                                    margin: "0 0 8px 0",
                                    lineHeight: "1.2",
                                  }}
                                >
                                  We're still waiting to hear from you
                                </h1>
                                <p
                                  style={{
                                    color: "#6b7280",
                                    fontSize: "18px",
                                    margin: "0 16px",
                                    lineHeight: "1.5",
                                  }}
                                >
                                  Your feedback would mean a lot to us
                                </p>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Wave decoration at bottom */}
                        <div
                          style={{
                            position: "absolute",
                            bottom: "0",
                            left: "0",
                            right: "0",
                          }}
                        >
                          <img
                            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'%3E%3Cpath d='M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z' fill='%23ffffff'%3E%3C/path%3E%3C/svg%3E"
                            style={{
                              width: "100%",
                              height: "24px",
                              display: "block",
                            }}
                            alt="wave"
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* Content Section */}
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
                        padding: "48px 24px",
                        backgroundColor: "#ffffff",
                      }}
                    >
                      {/* Personal greeting */}
                      <table
                        cellPadding="0"
                        cellSpacing="0"
                        border={0}
                        width="100%"
                        style={{ marginBottom: "32px" }}
                      >
                        <tbody>
                          <tr>
                            <td>
                              <p
                                style={{
                                  fontSize: "16px",
                                  lineHeight: "1.6",
                                  color: "#4b5563",
                                  margin: "0 0 16px 0",
                                }}
                              >
                                Hello there,
                              </p>
                              <p
                                style={{
                                  fontSize: "16px",
                                  lineHeight: "1.6",
                                  color: "#4b5563",
                                  margin: "0 0 16px 0",
                                }}
                              >
                                We noticed you haven't had a chance to share
                                your feedback with us yet. We know you're busy,
                                but we'd really value hearing about your
                                experience with {senderName}.
                              </p>
                              <p
                                style={{
                                  fontSize: "16px",
                                  lineHeight: "1.6",
                                  color: "#4b5563",
                                  margin: "0",
                                }}
                              >
                                It will only take{" "}
                                <strong style={{ color: colorStyles.text }}>
                                  {getTimeEstimate(primaryFormat)}
                                </strong>{" "}
                                of your time, and your insights would be
                                incredibly helpful to us and future customers.
                              </p>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Colorful box for main CTA */}
                      <table
                        cellPadding="0"
                        cellSpacing="0"
                        border={0}
                        width="100%"
                        style={{
                          marginBottom: "32px",
                          backgroundColor: "#ffffff",
                          border: `1px solid ${colorStyles.light}`,
                          borderRadius: "12px",
                          overflow: "hidden",
                          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.03)",
                        }}
                      >
                        <tbody>
                          {/* Header */}
                          <tr>
                            <td
                              style={{
                                backgroundColor: colorStyles.light,
                                padding: "24px 24px 16px 24px",
                              }}
                            >
                              <h2
                                style={{
                                  color: colorStyles.text,
                                  fontSize: "20px",
                                  fontWeight: "bold",
                                  margin: "0 0 8px 0",
                                  lineHeight: "1.3",
                                }}
                              >
                                Share Your Experience
                              </h2>
                              <p
                                style={{
                                  color: "#4b5563",
                                  fontSize: "15px",
                                  margin: "0",
                                  lineHeight: "1.6",
                                }}
                              >
                                Your feedback helps us improve and helps others
                                make decisions.
                              </p>
                            </td>
                          </tr>

                          {/* Quick stats */}
                          <tr>
                            <td style={{ padding: "8px 24px 24px 24px" }}>
                              <table
                                cellPadding="0"
                                cellSpacing="0"
                                border={0}
                                width="100%"
                              >
                                <tbody>
                                  <tr>
                                    <td style={{ padding: "16px 0" }}>
                                      <table
                                        cellPadding="0"
                                        cellSpacing="0"
                                        border={0}
                                        width="100%"
                                      >
                                        <tbody>
                                          <tr>
                                            <td
                                              width="33%"
                                              style={{
                                                padding: "0 8px",
                                                textAlign: "center",
                                              }}
                                            >
                                              <div
                                                style={{
                                                  display: "inline-block",
                                                  width: "48px",
                                                  height: "48px",
                                                  borderRadius: "24px",
                                                  backgroundColor:
                                                    colorStyles.lighter,
                                                  marginBottom: "8px",
                                                  position: "relative",
                                                }}
                                              >
                                                <img
                                                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'%3E%3C/circle%3E%3Cpolyline points='12 6 12 12 16 14'%3E%3C/polyline%3E%3C/svg%3E"
                                                  alt="Clock icon"
                                                  width="24"
                                                  height="24"
                                                  style={{
                                                    position: "absolute",
                                                    top: "50%",
                                                    left: "50%",
                                                    transform:
                                                      "translate(-50%, -50%)",
                                                    filter: `opacity(0.6) drop-shadow(0 0 0 ${primaryColor})`,
                                                  }}
                                                />
                                              </div>
                                              <div
                                                style={{
                                                  fontSize: "15px",
                                                  fontWeight: "600",
                                                  color: "#1f2937",
                                                  margin: "0 0 4px 0",
                                                }}
                                              >
                                                {getTimeEstimate(primaryFormat)}
                                              </div>
                                              <div
                                                style={{
                                                  fontSize: "13px",
                                                  color: "#6b7280",
                                                  lineHeight: "1.4",
                                                }}
                                              >
                                                Is all it takes
                                              </div>
                                            </td>
                                            <td
                                              width="33%"
                                              style={{
                                                padding: "0 8px",
                                                textAlign: "center",
                                              }}
                                            >
                                              <div
                                                style={{
                                                  display: "inline-block",
                                                  width: "48px",
                                                  height: "48px",
                                                  borderRadius: "24px",
                                                  backgroundColor:
                                                    colorStyles.lighter,
                                                  marginBottom: "8px",
                                                  position: "relative",
                                                }}
                                              >
                                                <img
                                                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z'%3E%3C/path%3E%3C/svg%3E"
                                                  alt="Bookmark icon"
                                                  width="24"
                                                  height="24"
                                                  style={{
                                                    position: "absolute",
                                                    top: "50%",
                                                    left: "50%",
                                                    transform:
                                                      "translate(-50%, -50%)",
                                                    filter: `opacity(0.6) drop-shadow(0 0 0 ${primaryColor})`,
                                                  }}
                                                />
                                              </div>
                                              <div
                                                style={{
                                                  fontSize: "15px",
                                                  fontWeight: "600",
                                                  color: "#1f2937",
                                                  margin: "0 0 4px 0",
                                                }}
                                              >
                                                Valuable
                                              </div>
                                              <div
                                                style={{
                                                  fontSize: "13px",
                                                  color: "#6b7280",
                                                  lineHeight: "1.4",
                                                }}
                                              >
                                                For future customers
                                              </div>
                                            </td>
                                            <td
                                              width="33%"
                                              style={{
                                                padding: "0 8px",
                                                textAlign: "center",
                                              }}
                                            >
                                              <div
                                                style={{
                                                  display: "inline-block",
                                                  width: "48px",
                                                  height: "48px",
                                                  borderRadius: "24px",
                                                  backgroundColor:
                                                    colorStyles.lighter,
                                                  marginBottom: "8px",
                                                  position: "relative",
                                                }}
                                              >
                                                <img
                                                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4'%3E%3C/path%3E%3Cpath d='M4 6v12c0 1.1.9 2 2 2h14v-4'%3E%3C/path%3E%3Cpath d='M18 12a2 2 0 0 0 0 4h4v-4Z'%3E%3C/path%3E%3C/svg%3E"
                                                  alt="Gift icon"
                                                  width="24"
                                                  height="24"
                                                  style={{
                                                    position: "absolute",
                                                    top: "50%",
                                                    left: "50%",
                                                    transform:
                                                      "translate(-50%, -50%)",
                                                    filter: `opacity(0.6) drop-shadow(0 0 0 ${primaryColor})`,
                                                  }}
                                                />
                                              </div>
                                              <div
                                                style={{
                                                  fontSize: "15px",
                                                  fontWeight: "600",
                                                  color: "#1f2937",
                                                  margin: "0 0 4px 0",
                                                }}
                                              >
                                                Rewarded
                                              </div>
                                              <div
                                                style={{
                                                  fontSize: "13px",
                                                  color: "#6b7280",
                                                  lineHeight: "1.4",
                                                }}
                                              >
                                                With our thanks
                                              </div>
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

                          {/* CTA Button */}
                          <tr>
                            <td style={{ padding: "0 24px 24px 24px" }}>
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
                                          padding: "16px 32px",
                                          backgroundColor: primaryColor,
                                          color: "#ffffff",
                                          fontWeight: "600",
                                          fontSize: "16px",
                                          borderRadius: "8px",
                                          textDecoration: "none",
                                          textAlign: "center",
                                          boxShadow: `0 2px 4px ${colorStyles.light}, 0 0 0 3px ${colorStyles.lighter}`,
                                          lineHeight: "20px",
                                        }}
                                      >
                                        {getCtaText(primaryFormat)} →
                                      </a>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Testimonial Impact Section */}
                      <table
                        cellPadding="0"
                        cellSpacing="0"
                        border={0}
                        width="100%"
                        style={{
                          marginBottom: "32px",
                          backgroundColor: "#f9fafb",
                          borderRadius: "12px",
                          overflow: "hidden",
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
                                    <td style={{ paddingBottom: "16px" }}>
                                      <h3
                                        style={{
                                          fontSize: "16px",
                                          fontWeight: "600",
                                          color: "#1f2937",
                                          margin: "0",
                                        }}
                                      >
                                        Why Your Feedback Matters
                                      </h3>
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
                                            <td
                                              width="24"
                                              style={{
                                                paddingRight: "12px",
                                                paddingTop: "3px",
                                              }}
                                            >
                                              <img
                                                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M22 11.08V12a10 10 0 1 1-5.93-9.14'%3E%3C/path%3E%3Cpolyline points='22 4 12 14.01 9 11.01'%3E%3C/polyline%3E%3C/svg%3E"
                                                alt="Checkmark"
                                                width="16"
                                                height="16"
                                                style={{
                                                  filter: `opacity(0.6) drop-shadow(0 0 0 ${primaryColor})`,
                                                }}
                                              />
                                            </td>
                                            <td
                                              style={{ paddingBottom: "12px" }}
                                            >
                                              <p
                                                style={{
                                                  fontSize: "14px",
                                                  lineHeight: "1.5",
                                                  color: "#4b5563",
                                                  margin: "0",
                                                }}
                                              >
                                                <strong>
                                                  Helps us improve
                                                </strong>{" "}
                                                our products and services based
                                                on your experience
                                              </p>
                                            </td>
                                          </tr>
                                          <tr>
                                            <td
                                              width="24"
                                              style={{
                                                paddingRight: "12px",
                                                paddingTop: "3px",
                                              }}
                                            >
                                              <img
                                                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M22 11.08V12a10 10 0 1 1-5.93-9.14'%3E%3C/path%3E%3Cpolyline points='22 4 12 14.01 9 11.01'%3E%3C/polyline%3E%3C/svg%3E"
                                                alt="Checkmark"
                                                width="16"
                                                height="16"
                                                style={{
                                                  filter: `opacity(0.6) drop-shadow(0 0 0 ${primaryColor})`,
                                                }}
                                              />
                                            </td>
                                            <td
                                              style={{ paddingBottom: "12px" }}
                                            >
                                              <p
                                                style={{
                                                  fontSize: "14px",
                                                  lineHeight: "1.5",
                                                  color: "#4b5563",
                                                  margin: "0",
                                                }}
                                              >
                                                <strong>
                                                  Guides other customers
                                                </strong>{" "}
                                                in making informed decisions
                                              </p>
                                            </td>
                                          </tr>
                                          <tr>
                                            <td
                                              width="24"
                                              style={{
                                                paddingRight: "12px",
                                                paddingTop: "3px",
                                              }}
                                            >
                                              <img
                                                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M22 11.08V12a10 10 0 1 1-5.93-9.14'%3E%3C/path%3E%3Cpolyline points='22 4 12 14.01 9 11.01'%3E%3C/polyline%3E%3C/svg%3E"
                                                alt="Checkmark"
                                                width="16"
                                                height="16"
                                                style={{
                                                  filter: `opacity(0.6) drop-shadow(0 0 0 ${primaryColor})`,
                                                }}
                                              />
                                            </td>
                                            <td>
                                              <p
                                                style={{
                                                  fontSize: "14px",
                                                  lineHeight: "1.5",
                                                  color: "#4b5563",
                                                  margin: "0",
                                                }}
                                              >
                                                <strong>
                                                  Recognizes our team
                                                </strong>{" "}
                                                for the hard work they put in
                                                every day
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

                      {/* Urgency Message */}
                      <table
                        cellPadding="0"
                        cellSpacing="0"
                        border={0}
                        width="100%"
                        style={{
                          marginBottom: "32px",
                          backgroundColor: "#ffffff",
                          border: "1px dashed #e5e7eb",
                          borderRadius: "8px",
                        }}
                      >
                        <tbody>
                          <tr>
                            <td style={{ padding: "16px" }}>
                              <table
                                cellPadding="0"
                                cellSpacing="0"
                                border={0}
                                width="100%"
                              >
                                <tbody>
                                  <tr>
                                    <td
                                      width="40"
                                      valign="top"
                                      style={{ paddingRight: "16px" }}
                                    >
                                      <img
                                        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='%23EF4444' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'%3E%3C/circle%3E%3Cline x1='12' y1='8' x2='12' y2='12'%3E%3C/line%3E%3Cline x1='12' y1='16' x2='12.01' y2='16'%3E%3C/line%3E%3C/svg%3E"
                                        alt="Alert icon"
                                        width="32"
                                        height="32"
                                      />
                                    </td>
                                    <td>
                                      <p
                                        style={{
                                          fontSize: "14px",
                                          lineHeight: "1.5",
                                          color: "#4b5563",
                                          margin: "0",
                                        }}
                                      >
                                        <strong>
                                          Limited Time Opportunity:
                                        </strong>{" "}
                                        Our feedback window closes in 7 days.
                                        Share your thoughts now to make sure
                                        your voice is heard and to receive your
                                        special thank you offer.
                                      </p>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Secondary CTAs - Quick Options */}
                      <table
                        cellPadding="0"
                        cellSpacing="0"
                        border={0}
                        width="100%"
                        style={{ marginBottom: "32px" }}
                      >
                        <tbody>
                          <tr>
                            <td style={{ paddingBottom: "16px" }}>
                              <p
                                style={{
                                  fontSize: "15px",
                                  lineHeight: "1.5",
                                  color: "#4b5563",
                                  margin: "0",
                                  textAlign: "center",
                                }}
                              >
                                Short on time? Quick options:
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
                                    <td
                                      width="50%"
                                      style={{ padding: "0 8px 0 0" }}
                                    >
                                      <a
                                        href="#positive-feedback"
                                        style={{
                                          display: "block",
                                          padding: "12px 16px",
                                          backgroundColor: colorStyles.light,
                                          color: colorStyles.text,
                                          border: `1px solid ${colorStyles.light}`,
                                          borderRadius: "8px",
                                          textDecoration: "none",
                                          textAlign: "center",
                                          fontSize: "14px",
                                          fontWeight: "500",
                                        }}
                                      >
                                        I had a great experience! 👍
                                      </a>
                                    </td>
                                    <td
                                      width="50%"
                                      style={{ padding: "0 0 0 8px" }}
                                    >
                                      <a
                                        href="#improvements-feedback"
                                        style={{
                                          display: "block",
                                          padding: "12px 16px",
                                          backgroundColor: "#ffffff",
                                          color: "#4b5563",
                                          border: "1px solid #e5e7eb",
                                          borderRadius: "8px",
                                          textDecoration: "none",
                                          textAlign: "center",
                                          fontSize: "14px",
                                          fontWeight: "500",
                                        }}
                                      >
                                        There's room for improvement ✓
                                      </a>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Testimonial Example */}
                      <table
                        cellPadding="0"
                        cellSpacing="0"
                        border={0}
                        width="100%"
                        style={{
                          marginBottom: "32px",
                          backgroundColor: "#ffffff",
                          border: "1px solid #f3f4f6",
                          borderRadius: "12px",
                          overflow: "hidden",
                          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
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
                                    <td style={{ paddingBottom: "16px" }}>
                                      <h3
                                        style={{
                                          fontSize: "16px",
                                          fontWeight: "600",
                                          color: "#1f2937",
                                          margin: "0 0 4px 0",
                                        }}
                                      >
                                        See what others are saying
                                      </h3>
                                      <p
                                        style={{
                                          fontSize: "14px",
                                          color: "#6b7280",
                                          margin: "0",
                                        }}
                                      >
                                        Join others who have shared their
                                        experiences
                                      </p>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td style={{ paddingBottom: "16px" }}>
                                      <div
                                        style={{
                                          padding: "16px",
                                          backgroundColor: "#f9fafb",
                                          borderRadius: "8px",
                                          border: "1px solid #f3f4f6",
                                        }}
                                      >
                                        <div style={{ marginBottom: "8px" }}>
                                          <img
                                            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='16' viewBox='0 0 120 20'%3E%3Cpath fill='%23FBBF24' d='M12 2L14.2 8.2H22L15.9 12.3L18.1 18.5L12 14.4L5.9 18.5L8.1 12.3L2 8.2H9.8L12 2ZM36 2L38.2 8.2H46L39.9 12.3L42.1 18.5L36 14.4L29.9 18.5L32.1 12.3L26 8.2H33.8L36 2ZM60 2L62.2 8.2H70L63.9 12.3L66.1 18.5L60 14.4L53.9 18.5L56.1 12.3L50 8.2H57.8L60 2ZM84 2L86.2 8.2H94L87.9 12.3L90.1 18.5L84 14.4L77.9 18.5L80.1 12.3L74 8.2H81.8L84 2ZM108 2L110.2 8.2H118L111.9 12.3L114.1 18.5L108 14.4L101.9 18.5L104.1 12.3L98 8.2H105.8L108 2Z'/%3E%3C/svg%3E"
                                            alt="5 stars"
                                            width="96"
                                            height="16"
                                            style={{ display: "block" }}
                                          />
                                        </div>
                                        <p
                                          style={{
                                            fontSize: "14px",
                                            fontStyle: "italic",
                                            color: "#4b5563",
                                            margin: "0 0 8px 0",
                                            lineHeight: "1.5",
                                          }}
                                        >
                                          "I was hesitant to leave a review, but
                                          I'm so glad I did. The process was
                                          quick and easy, and I love knowing
                                          that my feedback is helping others."
                                        </p>
                                        <div
                                          style={{
                                            fontSize: "13px",
                                            color: "#6b7280",
                                          }}
                                        >
                                          – Michael T., Customer since 2022
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Final CTA */}
                      <table
                        cellPadding="0"
                        cellSpacing="0"
                        border={0}
                        width="100%"
                        style={{ marginBottom: "32px" }}
                      >
                        <tbody>
                          <tr>
                            <td
                              style={{
                                paddingBottom: "16px",
                                textAlign: "center",
                              }}
                            >
                              <p
                                style={{
                                  fontSize: "16px",
                                  lineHeight: "1.5",
                                  color: "#1f2937",
                                  margin: "0",
                                  fontWeight: "500",
                                }}
                              >
                                Ready to share your experience?
                              </p>
                            </td>
                          </tr>
                          <tr>
                            <td align="center">
                              <a
                                href="#feedback-main-link"
                                target="_blank"
                                style={{
                                  display: "inline-block",
                                  padding: "16px 28px",
                                  backgroundColor: primaryColor,
                                  color: "#ffffff",
                                  fontWeight: "600",
                                  fontSize: "16px",
                                  borderRadius: "8px",
                                  textDecoration: "none",
                                  textAlign: "center",
                                  boxShadow: `0 4px 6px rgba(0, 0, 0, 0.1)`,
                                  lineHeight: "20px",
                                }}
                              >
                                Share Feedback Now →
                              </a>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Footer */}
                      <table
                        cellPadding="0"
                        cellSpacing="0"
                        border={0}
                        width="100%"
                        style={{
                          marginTop: "24px",
                          paddingTop: "24px",
                          borderTop: "1px solid #e5e7eb",
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
                                        align="left"
                                      >
                                        <tbody>
                                          <tr>
                                            <td valign="top" width="48">
                                              <div
                                                style={{
                                                  width: "48px",
                                                  height: "48px",
                                                  backgroundColor: "#f3f4f6",
                                                  borderRadius: "8px",
                                                  display: "table-cell",
                                                  verticalAlign: "middle",
                                                  textAlign: "center",
                                                }}
                                              >
                                                <img
                                                  src={companyLogo}
                                                  alt={senderName}
                                                  width="32"
                                                  height="32"
                                                  style={{
                                                    display: "inline-block",
                                                    maxWidth: "32px",
                                                  }}
                                                />
                                              </div>
                                            </td>
                                            <td style={{ paddingLeft: "12px" }}>
                                              <p
                                                style={{
                                                  fontSize: "14px",
                                                  fontWeight: "500",
                                                  color: "#1f2937",
                                                  margin: "0 0 4px 0",
                                                  lineHeight: "1.5",
                                                }}
                                              >
                                                {senderName}
                                              </p>
                                              <p
                                                style={{
                                                  fontSize: "12px",
                                                  color: "#6b7280",
                                                  margin: "0",
                                                  lineHeight: "1.5",
                                                }}
                                              >
                                                {currentDate}
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
                          <tr>
                            <td style={{ paddingBottom: "24px" }}>
                              <p
                                style={{
                                  fontSize: "13px",
                                  color: "#6b7280",
                                  margin: "0 0 8px 0",
                                  lineHeight: "1.5",
                                }}
                              >
                                Thank you for being a valued customer. If you
                                have any questions, please don't hesitate to
                                contact us.
                              </p>
                              <p
                                style={{
                                  fontSize: "13px",
                                  color: "#6b7280",
                                  margin: "0",
                                  lineHeight: "1.5",
                                }}
                              >
                                Email:{" "}
                                <a
                                  href={`mailto:${replyToEmail}`}
                                  style={{
                                    color: primaryColor,
                                    textDecoration: "none",
                                  }}
                                >
                                  {replyToEmail}
                                </a>
                              </p>
                            </td>
                          </tr>
                          <tr>
                            <td style={{ textAlign: "center" }}>
                              <p
                                style={{
                                  fontSize: "12px",
                                  color: "#9ca3af",
                                  margin: "0 0 8px 0",
                                  lineHeight: "1.5",
                                }}
                              >
                                © {new Date().getFullYear()} {senderName}. All
                                rights reserved.
                              </p>
                              <p
                                style={{
                                  fontSize: "12px",
                                  color: "#9ca3af",
                                  margin: "0",
                                  lineHeight: "1.5",
                                }}
                              >
                                <a
                                  href="#unsubscribe"
                                  style={{
                                    color: "#9ca3af",
                                    textDecoration: "underline",
                                  }}
                                >
                                  Unsubscribe
                                </a>{" "}
                                •
                                <a
                                  href="#privacy"
                                  style={{
                                    color: "#9ca3af",
                                    textDecoration: "underline",
                                  }}
                                >
                                  {" "}
                                  Privacy Policy
                                </a>{" "}
                                •
                                <a
                                  href="#terms"
                                  style={{
                                    color: "#9ca3af",
                                    textDecoration: "underline",
                                  }}
                                >
                                  {" "}
                                  Terms
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

export default FollowUpTemplate;
