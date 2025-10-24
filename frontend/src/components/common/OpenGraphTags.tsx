// components/common/OpenGraphTags.tsx
import React from "react";
import { Helmet } from "react-helmet-async";

interface OpenGraphTagsProps {
  title: string;
  description: string;
  url: string;
  type?: "website" | "video.other" | "article";
  image?: string;
  videoUrl?: string;
  videoDuration?: number;
  videoWidth?: number;
  videoHeight?: number;
  siteName?: string;
}

/**
 * OpenGraphTags component for rich social media sharing
 *
 * Renders Open Graph meta tags for:
 * - LinkedIn
 * - Facebook
 * - Twitter/X
 * - WhatsApp
 * - Slack
 * - All platforms that support Open Graph
 *
 * Usage:
 * <OpenGraphTags
 *   title="Customer Success Story"
 *   description="See how we helped this customer..."
 *   url="https://yourapp.com/share/123"
 *   image="https://cdn.yourapp.com/thumbnail.jpg"
 *   videoUrl="https://cdn.yourapp.com/video.mp4"
 * />
 */
const OpenGraphTags: React.FC<OpenGraphTagsProps> = ({
  title,
  description,
  url,
  type = "website",
  image,
  videoUrl,
  videoDuration,
  videoWidth = 1280,
  videoHeight = 720,
  siteName = "Cenphi",
}) => {
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph Tags (LinkedIn, Facebook, WhatsApp, Slack) */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />

      {image && (
        <>
          <meta property="og:image" content={image} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:type" content="image/jpeg" />
          <meta property="og:image:alt" content={title} />
        </>
      )}

      {videoUrl && (
        <>
          <meta property="og:video" content={videoUrl} />
          <meta property="og:video:secure_url" content={videoUrl} />
          <meta property="og:video:type" content="video/mp4" />
          <meta property="og:video:width" content={videoWidth.toString()} />
          <meta property="og:video:height" content={videoHeight.toString()} />
          {videoDuration && (
            <meta property="og:video:duration" content={videoDuration.toString()} />
          )}
        </>
      )}

      {/* Twitter Card Tags (Twitter/X) */}
      <meta name="twitter:card" content={videoUrl ? "player" : "summary_large_image"} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}

      {videoUrl && (
        <>
          <meta name="twitter:player" content={url} />
          <meta name="twitter:player:width" content={videoWidth.toString()} />
          <meta name="twitter:player:height" content={videoHeight.toString()} />
        </>
      )}

      {/* Additional SEO Tags */}
      <meta name="robots" content="index, follow" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </Helmet>
  );
};

export default OpenGraphTags;
