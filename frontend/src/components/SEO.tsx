import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "product";
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    tags?: string[];
  };
  noindex?: boolean;
  canonical?: string;
  structuredData?: object;
}

const SEO: React.FC<SEOProps> = ({
  title = "Cenphi - AI-Powered Video Testimonial Platform | Turn Customer Stories into Growth",
  description = "Cenphi helps businesses collect, manage, and leverage video testimonials with AI. Automatically generate clips, social posts, and marketing content from customer stories. Boost trust and conversions with authentic video reviews.",
  keywords = "video testimonials, customer testimonials, video reviews, AI video editing, social proof, customer stories, testimonial management, video marketing, UGC content, user generated content, testimonial software",
  image = "https://cenphi.io/og-image.jpg",
  url = "https://cenphi.io",
  type = "website",
  article,
  noindex = false,
  canonical,
  structuredData,
}) => {
  const siteTitle = title.includes("Cenphi") ? title : `${title} | Cenphi`;
  const fullUrl = url.startsWith("http") ? url : `https://cenphi.io${url}`;
  const imageUrl = image.startsWith("http")
    ? image
    : `https://cenphi.io${image}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{siteTitle}</title>
      <meta name="title" content={siteTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {!noindex && <meta name="robots" content="index, follow" />}
      {canonical && <link rel="canonical" href={canonical} />}
      {!canonical && <link rel="canonical" href={fullUrl} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Cenphi" />

      {/* Article specific tags */}
      {article && (
        <>
          {article.publishedTime && (
            <meta
              property="article:published_time"
              content={article.publishedTime}
            />
          )}
          {article.modifiedTime && (
            <meta
              property="article:modified_time"
              content={article.modifiedTime}
            />
          )}
          {article.author && (
            <meta property="article:author" content={article.author} />
          )}
          {article.tags &&
            article.tags.map((tag) => (
              <meta key={tag} property="article:tag" content={tag} />
            ))}
        </>
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:creator" content="@cenphi" />
      <meta name="twitter:site" content="@cenphi" />

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
