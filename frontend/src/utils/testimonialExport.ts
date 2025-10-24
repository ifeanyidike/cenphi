import { Testimonial } from "@/types/testimonial";

export type ExportFormat = "csv" | "json" | "markdown" | "html";

interface ExportOptions {
  format: ExportFormat;
  includeMetrics?: boolean;
  includeSentiment?: boolean;
  includeTranscript?: boolean;
}

/**
 * Export testimonials to CSV format
 */
export const exportToCSV = (
  testimonials: Testimonial[],
  options: ExportOptions
): string => {
  const headers = [
    "ID",
    "Type",
    "Author Name",
    "Author Email",
    "Author Company",
    "Author Title",
    "Rating",
    "Content",
    "Created Date",
    "Status",
  ];

  if (options.includeSentiment) {
    headers.push("Sentiment Score", "Sentiment Label");
  }

  if (options.includeMetrics) {
    headers.push("Conversions", "Views");
  }

  if (options.includeTranscript) {
    headers.push("Transcript", "Duration");
  }

  headers.push("Media URL");

  const rows = testimonials.map((t) => {
    const getSentimentLabel = (score: number) => {
      if (score >= 0.7) return "Positive";
      if (score >= 0.4) return "Neutral";
      return "Negative";
    };

    const row = [
      t.id,
      t.type,
      t.author_name || "",
      t.author_email || "",
      t.author_company || "",
      t.author_title || "",
      t.rating?.toString() || "",
      `"${(t.content || "").replace(/"/g, '""')}"`, // Escape quotes
      new Date(t.created_at).toLocaleDateString(),
      t.status,
    ];

    if (options.includeSentiment) {
      row.push(
        t.sentiment_score?.toFixed(2) || "",
        t.sentiment_score ? getSentimentLabel(t.sentiment_score) : ""
      );
    }

    if (options.includeMetrics) {
      row.push(
        t.conversion_count?.toString() || "0",
        t.view_count?.toString() || "0"
      );
    }

    if (options.includeTranscript) {
      row.push(
        `"${(t.transcript || "").replace(/"/g, '""')}"`,
        t.duration?.toString() || ""
      );
    }

    row.push(t.media_url || "");

    return row;
  });

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
};

/**
 * Export testimonials to JSON format
 */
export const exportToJSON = (
  testimonials: Testimonial[],
  options: ExportOptions
): string => {
  const data = testimonials.map((t) => {
    const base = {
      id: t.id,
      type: t.type,
      author: {
        name: t.author_name,
        email: t.author_email,
        company: t.author_company,
        title: t.author_title,
        avatar_url: t.author_avatar_url,
      },
      rating: t.rating,
      content: t.content,
      created_at: t.created_at,
      status: t.status,
      processing_status: t.processing_status,
      media_url: t.media_url,
    };

    if (options.includeSentiment && t.sentiment_score) {
      Object.assign(base, {
        sentiment: {
          score: t.sentiment_score,
          label:
            t.sentiment_score >= 0.7
              ? "positive"
              : t.sentiment_score >= 0.4
                ? "neutral"
                : "negative",
        },
      });
    }

    if (options.includeMetrics) {
      Object.assign(base, {
        metrics: {
          conversions: t.conversion_count || 0,
          views: t.view_count || 0,
        },
      });
    }

    if (options.includeTranscript && t.transcript) {
      Object.assign(base, {
        transcript: t.transcript,
        duration: t.duration,
      });
    }

    return base;
  });

  return JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      total_count: testimonials.length,
      testimonials: data,
    },
    null,
    2
  );
};

/**
 * Export testimonials to Markdown format
 */
export const exportToMarkdown = (
  testimonials: Testimonial[],
  options: ExportOptions
): string => {
  const lines = [
    "# Testimonials Export",
    "",
    `**Exported:** ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
    `**Total Testimonials:** ${testimonials.length}`,
    "",
    "---",
    "",
  ];

  testimonials.forEach((t, index) => {
    lines.push(`## ${index + 1}. ${t.author_name || "Anonymous"}`);
    lines.push("");

    if (t.author_company || t.author_title) {
      lines.push(
        `**${t.author_title || ""}${t.author_title && t.author_company ? " at " : ""}${t.author_company || ""}**`
      );
      lines.push("");
    }

    // Rating
    if (t.rating) {
      lines.push(`**Rating:** ${"⭐".repeat(t.rating)} (${t.rating}/5)`);
      lines.push("");
    }

    // Type and Date
    lines.push(
      `**Type:** ${t.type === "video" ? "🎥 Video" : "📝 Text"} | **Date:** ${new Date(t.created_at).toLocaleDateString()}`
    );
    lines.push("");

    // Sentiment
    if (options.includeSentiment && t.sentiment_score) {
      const emoji =
        t.sentiment_score >= 0.7 ? "😊" : t.sentiment_score >= 0.4 ? "😐" : "😞";
      lines.push(
        `**Sentiment:** ${emoji} ${(t.sentiment_score * 100).toFixed(0)}%`
      );
      lines.push("");
    }

    // Content
    lines.push("### Testimonial");
    lines.push("");
    lines.push(`> ${t.content || "No content available"}`);
    lines.push("");

    // Transcript for videos
    if (options.includeTranscript && t.transcript && t.type === "video") {
      lines.push("### Transcript");
      lines.push("");
      lines.push(t.transcript);
      lines.push("");
    }

    // Metrics
    if (options.includeMetrics) {
      lines.push("### Performance");
      lines.push("");
      lines.push(`- **Conversions:** ${t.conversion_count || 0}`);
      lines.push(`- **Views:** ${t.view_count || 0}`);
      lines.push("");
    }

    // Media URL
    if (t.media_url) {
      lines.push(
        `[View ${t.type === "video" ? "Video" : "Media"}](${t.media_url})`
      );
      lines.push("");
    }

    lines.push("---");
    lines.push("");
  });

  return lines.join("\n");
};

/**
 * Export testimonials to HTML format
 */
export const exportToHTML = (
  testimonials: Testimonial[],
  options: ExportOptions
): string => {
  const getSentimentColor = (score: number) => {
    if (score >= 0.7) return "#10b981"; // green
    if (score >= 0.4) return "#f59e0b"; // amber
    return "#ef4444"; // red
  };

  const getSentimentLabel = (score: number) => {
    if (score >= 0.7) return "Positive";
    if (score >= 0.4) return "Neutral";
    return "Negative";
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Testimonials Export</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: #f9fafb;
            padding: 2rem;
        }
        .container { max-width: 900px; margin: 0 auto; }
        .header {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            color: white;
            padding: 2rem;
            border-radius: 12px;
            margin-bottom: 2rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header h1 { font-size: 2rem; margin-bottom: 0.5rem; }
        .header p { opacity: 0.9; font-size: 0.875rem; }
        .testimonial-card {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            border-left: 4px solid #3b82f6;
        }
        .author-info {
            display: flex;
            align-items: center;
            margin-bottom: 1rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #e5e7eb;
        }
        .author-details { flex: 1; }
        .author-name { font-size: 1.125rem; font-weight: 600; color: #111827; }
        .author-title { font-size: 0.875rem; color: #6b7280; }
        .rating { display: flex; align-items: center; gap: 0.25rem; margin-top: 0.25rem; }
        .star { color: #fbbf24; }
        .type-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
        }
        .video-badge { background: #dbeafe; color: #1e40af; }
        .text-badge { background: #e0e7ff; color: #3730a3; }
        .content {
            margin: 1rem 0;
            padding: 1rem;
            background: #f9fafb;
            border-radius: 8px;
            font-size: 0.9375rem;
            line-height: 1.7;
            font-style: italic;
        }
        .sentiment {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            font-size: 0.875rem;
            font-weight: 500;
            margin: 0.5rem 0;
        }
        .metrics {
            display: flex;
            gap: 1.5rem;
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid #e5e7eb;
        }
        .metric { font-size: 0.875rem; color: #6b7280; }
        .metric strong { color: #111827; font-weight: 600; }
        .transcript {
            margin-top: 1rem;
            padding: 1rem;
            background: #f3f4f6;
            border-radius: 8px;
            font-size: 0.875rem;
            color: #4b5563;
            white-space: pre-wrap;
        }
        .transcript-label {
            font-weight: 600;
            color: #374151;
            margin-bottom: 0.5rem;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .footer {
            text-align: center;
            padding: 2rem;
            color: #6b7280;
            font-size: 0.875rem;
        }
        a { color: #3b82f6; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Testimonials Export</h1>
            <p>Exported on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()} • ${testimonials.length} testimonial${testimonials.length !== 1 ? "s" : ""}</p>
        </div>

        ${testimonials
          .map(
            (t, index) => `
        <div class="testimonial-card">
            <div class="author-info">
                <div class="author-details">
                    <div class="author-name">${t.author_name || "Anonymous"}</div>
                    ${t.author_title || t.author_company ? `<div class="author-title">${t.author_title || ""}${t.author_title && t.author_company ? " • " : ""}${t.author_company || ""}</div>` : ""}
                    ${
                      t.rating
                        ? `<div class="rating">${Array.from({ length: t.rating }, () => '<span class="star">★</span>').join("")}</div>`
                        : ""
                    }
                </div>
                <span class="${t.type === "video" ? "video-badge" : "text-badge"} type-badge">
                    ${t.type === "video" ? "🎥 Video" : "📝 Text"}
                </span>
            </div>

            ${
              options.includeSentiment && t.sentiment_score
                ? `
            <div class="sentiment" style="background: ${getSentimentColor(t.sentiment_score)}15; color: ${getSentimentColor(t.sentiment_score)};">
                <span style="font-size: 1.25rem;">${t.sentiment_score >= 0.7 ? "😊" : t.sentiment_score >= 0.4 ? "😐" : "😞"}</span>
                <span>${getSentimentLabel(t.sentiment_score)} (${(t.sentiment_score * 100).toFixed(0)}%)</span>
            </div>
            `
                : ""
            }

            <div class="content">
                "${t.content || "No content available"}"
            </div>

            ${
              options.includeTranscript && t.transcript && t.type === "video"
                ? `
            <div class="transcript">
                <div class="transcript-label">Transcript</div>
                ${t.transcript}
            </div>
            `
                : ""
            }

            ${
              options.includeMetrics
                ? `
            <div class="metrics">
                <div class="metric"><strong>${t.conversion_count || 0}</strong> Conversions</div>
                <div class="metric"><strong>${t.view_count || 0}</strong> Views</div>
                <div class="metric"><strong>${new Date(t.created_at).toLocaleDateString()}</strong> Created</div>
            </div>
            `
                : ""
            }

            ${
              t.media_url
                ? `
            <div style="margin-top: 1rem;">
                <a href="${t.media_url}" target="_blank">View ${t.type === "video" ? "Video" : "Media"} →</a>
            </div>
            `
                : ""
            }
        </div>
        `
          )
          .join("")}

        <div class="footer">
            <p>Generated by Cenphi Testimonial Platform</p>
        </div>
    </div>
</body>
</html>`;

  return html;
};

/**
 * Download file helper
 */
export const downloadFile = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Main export function
 */
export const exportTestimonials = (
  testimonials: Testimonial[],
  options: ExportOptions
): void => {
  const timestamp = new Date().toISOString().split("T")[0];
  const baseFilename = `testimonials_${timestamp}`;

  let content = "";
  let filename = "";

  switch (options.format) {
    case "csv":
      content = exportToCSV(testimonials, options);
      filename = `${baseFilename}.csv`;
      break;
    case "json":
      content = exportToJSON(testimonials, options);
      filename = `${baseFilename}.json`;
      break;
    case "markdown":
      content = exportToMarkdown(testimonials, options);
      filename = `${baseFilename}.md`;
      break;
    case "html":
      content = exportToHTML(testimonials, options);
      filename = `${baseFilename}.html`;
      break;
  }

  downloadFile(content, filename);
};
