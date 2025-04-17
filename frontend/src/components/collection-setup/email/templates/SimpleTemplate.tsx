import React from "react";
import {
  Button,
  Container,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TestimonialFormat } from "@/types/setup";

/**
 * A professional testimonial request email template.
 * Designed for maximum deliverability, engagement, and brand consistency.
 */

export type SimpleTemplateProps = {
  // Required properties from original template
  senderName: string;
  primaryColor: string;
  formats: TestimonialFormat[];
  previewMode?: boolean;
  replyToEmail: string;
  signatureTemplate?: "minimal" | "standard" | "branded" | "social";
  senderType?: string;
  companyLogo?: string;
  signatureText?: string;
  personAvatar?: string; // Added separate avatar for person

  // Optional additions for completeness
  companyName?: string;
  recipientName?: string;
  theme?: "light" | "dark";
  customMessage?: string;
  callToAction?: string;
  preheaderText?: string;
  testimonialLink?: string;
  personTitle?: string;
  companyWebsite?: string;
};

export const SimpleTemplate: React.FC<SimpleTemplateProps> = ({
  // Set default values for all props
  senderType,
  companyLogo = "",
  senderName,
  replyToEmail = "{{replyToEmail}}",

  recipientName = "{{recipientName}}",

  primaryColor = "#4F46E5",
  theme = "light",

  customMessage = "We value your feedback and would love to hear about your experience with our product. Your testimonial helps us improve and lets others know about your experience.",
  callToAction = "Share Your Feedback",
  preheaderText = "Share your experience with us",

  formats = ["text"],
  testimonialLink = "{{testimonialLink}}",

  signatureTemplate = "personal",
  signatureText = "",
  personTitle = "",
  previewMode,
  companyWebsite = "https://example.com",
}) => {
  // Theme-based styling
  const bgColor = theme === "dark" ? "#1F2937" : "#FFFFFF";
  const textColor = theme === "dark" ? "#F9FAFB" : "#111827";
  const secondaryBgColor = theme === "dark" ? "#374151" : "#F9FAFB";
  const secondaryTextColor = theme === "dark" ? "#D1D5DB" : "#6B7280";
  const borderColor = theme === "dark" ? "#374151" : "#E5E7EB";
  const companyName =
    senderType === "personal"
      ? senderName || "{{senderName}}"
      : senderName || "{{companyName}}";

  // Format options with carefully selected icons
  const formatOptions = {
    text: { icon: "✍️", label: "Written" },
    video: { icon: "🎬", label: "Video" },
    audio: { icon: "🎙️", label: "Audio" },
    image: { icon: "📸", label: "Photo" },
  };

  return (
    <Html>
      {previewMode && <Preview>{preheaderText}</Preview>}
      <Section
        style={{
          backgroundColor: bgColor,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
          color: textColor,
          margin: "0 auto",
          padding: "0",
        }}
      >
        <Container
          style={{ maxWidth: "580px", margin: "0 auto", padding: "32px 24px" }}
        >
          {/* Header */}
          <Section style={{ textAlign: "center", marginBottom: "28px" }}>
            {companyLogo && (
              <Img
                src={companyLogo}
                alt={companyName || "Company"}
                height={100}
                width={100}
                style={{
                  margin: "0 auto 14px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  aspectRatio: "1/1",
                }}
              />
            )}
            <Heading
              as="h1"
              style={{
                fontSize: "26px",
                fontWeight: "700",
                margin: "0 0 10px",
                color: textColor,
                lineHeight: "1.3",
              }}
            >
              We Value Your Feedback
            </Heading>
            <Text
              style={{
                fontSize: "16px",
                lineHeight: "24px",
                color: secondaryTextColor,
                margin: "0 0 8px",
              }}
            >
              Hello {recipientName},
            </Text>
          </Section>

          {/* Main Content */}
          <Section
            style={{
              backgroundColor: secondaryBgColor,
              padding: "24px 20px",
              borderRadius: "8px",
              marginBottom: "28px",
              border: `1px solid ${borderColor}`,
            }}
          >
            <Text
              style={{
                fontSize: "16px",
                lineHeight: "26px",
                color: textColor,
                margin: "0 0 24px",
              }}
            >
              {customMessage}
            </Text>

            <Section
              style={{
                textAlign: "center",
                margin: "32px 0",
              }}
            >
              <Button
                href={testimonialLink}
                style={{
                  backgroundColor: primaryColor,
                  color: "#FFFFFF",
                  padding: "12px 28px",
                  fontSize: "15px",
                  fontWeight: "600",
                  borderRadius: "6px",
                  textDecoration: "none",
                  textTransform: "none",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  display: "inline-block",
                }}
              >
                {callToAction}
              </Button>
            </Section>

            <Text
              style={{
                fontSize: "13px",
                lineHeight: "20px",
                color: secondaryTextColor,
                marginTop: "18px",
                fontStyle: "italic",
                textAlign: "center",
                paddingTop: "8px",
                borderTop: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"}`,
              }}
            >
              This will only take a minute of your time and will help us
              tremendously.
            </Text>
          </Section>

          {/* Testimonial Format Options */}
          {formats && formats.length > 0 && (
            <Section
              style={{
                marginBottom: "28px",
                padding: "16px 0",
                backgroundColor: bgColor,
              }}
            >
              <Text
                style={{
                  margin: "0 0 12px",
                  fontSize: "15px",
                  fontWeight: "600",
                  color: textColor,
                  textAlign: "center",
                }}
              >
                Choose how to share your experience:
              </Text>
              <Section style={{ textAlign: "center" }}>
                {formats.map(
                  (format) =>
                    format in formatOptions && (
                      <Section
                        key={format}
                        style={{
                          display: "inline-block",
                          width: "82px",
                          margin: "8px 8px",
                          verticalAlign: "top",
                          backgroundColor: secondaryBgColor,
                          borderRadius: "8px",
                          padding: "12px 4px",
                          border: `1px solid ${borderColor}`,
                        }}
                      >
                        <Link
                          href={`${testimonialLink}?format=${format}`}
                          style={{
                            textDecoration: "none",
                            color: primaryColor,
                            display: "block",
                          }}
                        >
                          <Text
                            style={{
                              margin: "0 0 8px",
                              fontSize: "28px",
                              lineHeight: "1",
                            }}
                          >
                            {formatOptions[format].icon}
                          </Text>
                          <Text
                            style={{
                              margin: "0",
                              fontSize: "13px",
                              color: textColor,
                              fontWeight: "500",
                            }}
                          >
                            {formatOptions[format].label}
                          </Text>
                        </Link>
                      </Section>
                    )
                )}
              </Section>
            </Section>
          )}

          {/* Signature */}
          <Section
            style={{
              marginBottom: "20px",
              paddingTop: "16px",
              borderTop: `1px solid ${borderColor}`,
            }}
          >
            {signatureTemplate === "personal" ? (
              <Section
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "0 12px",
                }}
              >
                <Avatar
                  style={{
                    height: "42px",
                    width: "42px",
                    borderRadius: "50%",
                    overflow: "hidden",
                  }}
                >
                  <AvatarImage
                    src={companyLogo}
                    alt={companyName}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <AvatarFallback
                    style={{
                      backgroundColor: primaryColor,
                      color: "#FFFFFF",
                      fontSize: "20px",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    {companyName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Section>
                  <Text
                    style={{
                      fontSize: "15px",
                      fontWeight: "bold",
                      margin: "0 0 4px",
                      color: textColor,
                    }}
                  >
                    {companyName}
                  </Text>
                  {personTitle && (
                    <Text
                      style={{
                        fontSize: "14px",
                        margin: "0",
                        color: secondaryTextColor,
                      }}
                    >
                      {personTitle}
                    </Text>
                  )}
                </Section>
              </Section>
            ) : signatureTemplate === "company" ? (
              <Section style={{ textAlign: "center" }}>
                <Img
                  src={companyLogo}
                  alt={companyName || "Company"}
                  height={18}
                  width={18}
                  style={{
                    margin: "0 auto 8px",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
                <Text
                  style={{
                    fontSize: "16px",
                    margin: "0",
                    color: textColor,
                  }}
                >
                  {companyName}
                </Text>
              </Section>
            ) : (
              <Text
                style={{
                  fontSize: "15px",
                  margin: "0",
                  color: textColor,
                  textAlign: "center",
                }}
              >
                {signatureText || `Best regards,\n${companyName}`}
              </Text>
            )}
          </Section>

          {/* Footer */}
          <Section
            style={{
              textAlign: "center",
              fontSize: "12px",
              color: secondaryTextColor,
              paddingTop: "24px",
              borderTop: `1px solid ${borderColor}`,
            }}
          >
            <Text style={{ margin: "0 0 8px" }}>
              © {new Date().getFullYear()} {companyName}. All rights reserved.
            </Text>
            <Link
              href={companyWebsite}
              style={{
                color: primaryColor,
                textDecoration: "none",
              }}
            >
              {companyWebsite.replace(/^https?:\/\//i, "")}
            </Link>

            <Section style={{ marginTop: "16px" }}>
              <Text style={{ margin: "0 0 8px", fontSize: "11px" }}>
                This email was sent to {recipientName} at {`{email}`}
              </Text>
              <Link
                href="{{unsubscribe}}"
                style={{
                  color: secondaryTextColor,
                  textDecoration: "underline",
                  fontSize: "11px",
                }}
              >
                Unsubscribe
              </Link>
              {" · "}
              <Link
                href="{{privacyPolicy}}"
                style={{
                  color: secondaryTextColor,
                  textDecoration: "underline",
                  fontSize: "11px",
                }}
              >
                Privacy Policy
              </Link>
            </Section>

            {replyToEmail && (
              <Text style={{ margin: "16px 0 0", fontSize: "11px" }}>
                If you have any questions, please contact us at:{" "}
                <Link
                  href={`mailto:${replyToEmail}`}
                  style={{ color: primaryColor }}
                >
                  {replyToEmail}
                </Link>
              </Text>
            )}
          </Section>
        </Container>
      </Section>
    </Html>
  );
};

export default SimpleTemplate;
