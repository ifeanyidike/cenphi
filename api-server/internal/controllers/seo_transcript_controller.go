package controllers

import (
	"encoding/json"
	"fmt"
	"html/template"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"github.com/ifeanyidike/cenphi/internal/utils"
	"go.uber.org/zap"
)

type SEOTranscriptController struct {
	testimonialRepo repositories.TestimonialRepository
	publicShareRepo *repositories.PublicShareRepository
	logger          *zap.Logger
}

func NewSEOTranscriptController(
	testimonialRepo repositories.TestimonialRepository,
	publicShareRepo *repositories.PublicShareRepository,
	logger *zap.Logger,
) *SEOTranscriptController {
	return &SEOTranscriptController{
		testimonialRepo: testimonialRepo,
		publicShareRepo: publicShareRepo,
		logger:          logger,
	}
}

// SEOTranscriptData holds all data needed for SEO-optimized transcript rendering
type SEOTranscriptData struct {
	// Core content
	TestimonialID   string                        `json:"testimonial_id"`
	Title           string                        `json:"title"`
	Description     string                        `json:"description"`
	Transcript      string                        `json:"transcript"`
	Segments        []models.TranscriptionSegment `json:"segments"`

	// Author info
	AuthorName    string `json:"author_name"`
	AuthorTitle   string `json:"author_title"`
	AuthorCompany string `json:"author_company"`

	// Media
	MediaURL      string `json:"media_url"`
	ThumbnailURL  string `json:"thumbnail_url"`
	Duration      int    `json:"duration_seconds"`

	// Metadata
	PublishedDate string   `json:"published_date"`
	Tags          []string `json:"tags"`
	Rating        float64  `json:"rating"`

	// SEO
	CanonicalURL  string            `json:"canonical_url"`
	ShareURL      string            `json:"share_url"`
	StructuredData map[string]interface{} `json:"structured_data"`
}

// GetSEOTranscript returns SEO-optimized HTML transcript page
// GET /seo/transcript/{shareId}
func (c *SEOTranscriptController) GetSEOTranscript(w http.ResponseWriter, r *http.Request) {
	shareID := chi.URLParam(r, "shareId")
	if shareID == "" {
		http.Error(w, "share ID required", http.StatusBadRequest)
		return
	}

	id, err := uuid.Parse(shareID)
	if err != nil {
		http.Error(w, "invalid share ID", http.StatusBadRequest)
		return
	}

	// Get share with content
	share, err := c.publicShareRepo.GetWithContent(r.Context(), id, nil)
	if err != nil {
		c.logger.Error("Failed to get share",
			zap.Error(err),
			zap.String("share_id", shareID))
		http.Error(w, "share not found", http.StatusNotFound)
		return
	}

	// Check if share is active and public
	if !share.IsActive || !share.IsPublic {
		http.Error(w, "share is not available", http.StatusForbidden)
		return
	}

	// Only works for testimonials
	if share.ShareType != "testimonial" || share.Testimonial == nil {
		http.Error(w, "transcript only available for testimonials", http.StatusBadRequest)
		return
	}

	// Build SEO transcript data
	seoData := c.buildSEOTranscriptData(share.Testimonial, share, r)

	// Check if JSON API response is requested
	if r.URL.Query().Get("format") == "json" {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(seoData)
		return
	}

	// Render HTML template
	tmpl := c.getTranscriptTemplate()
	w.Header().Set("Content-Type", "text/html; charset=utf-8")

	// Add SEO headers
	w.Header().Set("X-Robots-Tag", "index, follow")
	w.Header().Set("Cache-Control", "public, max-age=3600")

	if err := tmpl.Execute(w, seoData); err != nil {
		c.logger.Error("Failed to render template", zap.Error(err))
		http.Error(w, "failed to render page", http.StatusInternalServerError)
		return
	}
}

// GetTranscriptData returns JSON data for a transcript
// GET /api/transcripts/{shareId}
func (c *SEOTranscriptController) GetTranscriptData(w http.ResponseWriter, r *http.Request) {
	shareID := chi.URLParam(r, "shareId")
	if shareID == "" {
		utils.RespondWithError(w, http.StatusBadRequest, "share ID required")
		return
	}

	id, err := uuid.Parse(shareID)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "invalid share ID")
		return
	}

	share, err := c.publicShareRepo.GetWithContent(r.Context(), id, nil)
	if err != nil {
		c.logger.Error("Failed to get share", zap.Error(err))
		utils.RespondWithError(w, http.StatusNotFound, "share not found")
		return
	}

	if !share.IsActive || !share.IsPublic {
		utils.RespondWithError(w, http.StatusForbidden, "share is not available")
		return
	}

	if share.ShareType != "testimonial" || share.Testimonial == nil {
		utils.RespondWithError(w, http.StatusBadRequest, "transcript only available for testimonials")
		return
	}

	seoData := c.buildSEOTranscriptData(share.Testimonial, share, r)
	utils.RespondWithJSON(w, http.StatusOK, seoData)
}

func (c *SEOTranscriptController) buildSEOTranscriptData(
	testimonial *models.Testimonial,
	share *models.PublicShareWithContent,
	r *http.Request,
) *SEOTranscriptData {
	// Extract transcript text
	transcript := c.extractTranscriptText(testimonial)
	segments := c.extractSegments(testimonial)

	// Build URLs
	scheme := "https"
	if r.TLS == nil {
		scheme = "http"
	}
	baseURL := scheme + "://" + r.Host
	shareURL := baseURL + "/share/" + share.ID.String()
	canonicalURL := baseURL + "/seo/transcript/" + share.ID.String()

	// Extract author info
	authorName := "Anonymous"
	if testimonial.AuthorName != nil {
		authorName = *testimonial.AuthorName
	}

	authorTitle := ""
	if testimonial.AuthorTitle != nil {
		authorTitle = *testimonial.AuthorTitle
	}

	authorCompany := ""
	if testimonial.AuthorCompany != nil {
		authorCompany = *testimonial.AuthorCompany
	}

	// Build title and description
	title := fmt.Sprintf("%s - Testimonial Transcript", authorName)
	if authorCompany != "" {
		title = fmt.Sprintf("%s from %s - Testimonial Transcript", authorName, authorCompany)
	}

	description := c.generateDescription(transcript, authorName, authorCompany)

	// Media info
	mediaURL := ""
	if testimonial.MediaURL != nil {
		mediaURL = *testimonial.MediaURL
	}

	// Calculate duration from segments
	duration := c.calculateDuration(segments)

	// Rating
	rating := 5.0
	if testimonial.Rating != nil {
		rating = float64(*testimonial.Rating)
	}

	data := &SEOTranscriptData{
		TestimonialID: testimonial.ID.String(),
		Title:         title,
		Description:   description,
		Transcript:    transcript,
		Segments:      segments,
		AuthorName:    authorName,
		AuthorTitle:   authorTitle,
		AuthorCompany: authorCompany,
		MediaURL:      mediaURL,
		ThumbnailURL:  c.generateThumbnailURL(mediaURL),
		Duration:      duration,
		PublishedDate: testimonial.CreatedAt.Format(time.RFC3339),
		Tags:          testimonial.Tags,
		Rating:        rating,
		CanonicalURL:  canonicalURL,
		ShareURL:      shareURL,
	}

	// Build structured data
	data.StructuredData = c.buildStructuredData(data)

	return data
}

func (c *SEOTranscriptController) extractTranscriptText(testimonial *models.Testimonial) string {
	if testimonial.TranscriptSegments == nil {
		return ""
	}

	segments := *testimonial.TranscriptSegments
	var texts []string
	for _, seg := range segments {
		if seg.Text != "" {
			texts = append(texts, seg.Text)
		}
	}

	return strings.Join(texts, " ")
}

func (c *SEOTranscriptController) extractSegments(testimonial *models.Testimonial) []models.TranscriptionSegment {
	if testimonial.TranscriptSegments == nil {
		return []models.TranscriptionSegment{}
	}

	return *testimonial.TranscriptSegments
}

func (c *SEOTranscriptController) calculateDuration(segments []models.TranscriptionSegment) int {
	if len(segments) == 0 {
		return 0
	}

	lastSegment := segments[len(segments)-1]
	return int(lastSegment.EndTime)
}

func (c *SEOTranscriptController) generateDescription(transcript, authorName, authorCompany string) string {
	maxLen := 160

	prefix := fmt.Sprintf("Read the full transcript of %s's testimonial", authorName)
	if authorCompany != "" {
		prefix = fmt.Sprintf("Read the full transcript of %s from %s's testimonial", authorName, authorCompany)
	}

	// Add snippet of transcript
	snippet := transcript
	if len(snippet) > maxLen-len(prefix)-10 {
		snippet = snippet[:maxLen-len(prefix)-10] + "..."
	}

	if snippet != "" {
		return fmt.Sprintf("%s: %s", prefix, snippet)
	}

	return prefix + "."
}

func (c *SEOTranscriptController) generateThumbnailURL(mediaURL string) string {
	// In production, this would generate an actual thumbnail
	// For now, return a placeholder or the media URL
	if mediaURL == "" {
		return ""
	}

	// Could use a service like Cloudinary or similar to generate thumbnails
	return mediaURL
}

func (c *SEOTranscriptController) buildStructuredData(data *SEOTranscriptData) map[string]interface{} {
	// Schema.org VideoObject with transcript
	return map[string]interface{}{
		"@context": "https://schema.org",
		"@type":    "VideoObject",
		"name":     data.Title,
		"description": data.Description,
		"thumbnailUrl": data.ThumbnailURL,
		"uploadDate":   data.PublishedDate,
		"duration":     fmt.Sprintf("PT%dS", data.Duration),
		"contentUrl":   data.MediaURL,
		"embedUrl":     data.ShareURL,
		"transcript": map[string]interface{}{
			"@type": "TranscriptObject",
			"text":  data.Transcript,
		},
		"author": map[string]interface{}{
			"@type": "Person",
			"name":  data.AuthorName,
			"jobTitle": data.AuthorTitle,
			"worksFor": map[string]interface{}{
				"@type": "Organization",
				"name":  data.AuthorCompany,
			},
		},
		"aggregateRating": map[string]interface{}{
			"@type":       "AggregateRating",
			"ratingValue": data.Rating,
			"bestRating":  5,
			"worstRating": 1,
			"ratingCount": 1,
		},
		"keywords": strings.Join(data.Tags, ", "),
	}
}

func (c *SEOTranscriptController) getTranscriptTemplate() *template.Template {
	// Helper functions for the template
	funcMap := template.FuncMap{
		"formatTime": func(seconds float64) string {
			minutes := int(seconds) / 60
			secs := int(seconds) % 60
			return fmt.Sprintf("%02d:%02d", minutes, secs)
		},
		"formatDate": func(dateStr string) string {
			t, err := time.Parse(time.RFC3339, dateStr)
			if err != nil {
				return dateStr
			}
			return t.Format("January 2, 2006")
		},
		"formatDuration": func(seconds int) string {
			minutes := seconds / 60
			secs := seconds % 60
			if minutes > 0 {
				return fmt.Sprintf("%d:%02d", minutes, secs)
			}
			return fmt.Sprintf("%d seconds", secs)
		},
		"year": func() string {
			return fmt.Sprintf("%d", time.Now().Year())
		},
		"toJSON": func(v interface{}) string {
			b, _ := json.Marshal(v)
			return string(b)
		},
	}

	tmplStr := `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{.Title}}</title>
    <meta name="description" content="{{.Description}}">
    <link rel="canonical" href="{{.CanonicalURL}}">

    <!-- Open Graph -->
    <meta property="og:title" content="{{.Title}}">
    <meta property="og:description" content="{{.Description}}">
    <meta property="og:type" content="video.other">
    <meta property="og:url" content="{{.CanonicalURL}}">
    <meta property="og:image" content="{{.ThumbnailURL}}">
    <meta property="og:video" content="{{.MediaURL}}">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="player">
    <meta name="twitter:title" content="{{.Title}}">
    <meta name="twitter:description" content="{{.Description}}">
    <meta name="twitter:image" content="{{.ThumbnailURL}}">
    <meta name="twitter:player" content="{{.ShareURL}}">

    <!-- Structured Data -->
    <script type="application/ld+json">
    {{toJSON .StructuredData}}
    </script>

    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
            padding: 20px;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        header {
            margin-bottom: 30px;
            border-bottom: 2px solid #eee;
            padding-bottom: 20px;
        }

        h1 {
            font-size: 28px;
            margin-bottom: 10px;
            color: #1a1a1a;
        }

        .meta {
            color: #666;
            font-size: 14px;
        }

        .author {
            margin: 15px 0;
        }

        .author-name {
            font-weight: 600;
            font-size: 18px;
            color: #1a1a1a;
        }

        .author-title {
            color: #666;
            font-size: 14px;
        }

        .video-container {
            margin: 30px 0;
            position: relative;
            padding-bottom: 56.25%;
            height: 0;
            overflow: hidden;
            background: #000;
            border-radius: 8px;
        }

        .video-container video,
        .video-container iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }

        .transcript-section {
            margin-top: 40px;
        }

        .transcript-section h2 {
            font-size: 22px;
            margin-bottom: 20px;
            color: #1a1a1a;
        }

        .transcript-text {
            background: #f9f9f9;
            padding: 25px;
            border-radius: 6px;
            border-left: 4px solid #4a90e2;
            line-height: 1.8;
            font-size: 16px;
        }

        .segment {
            margin-bottom: 15px;
            padding: 10px;
            background: white;
            border-radius: 4px;
        }

        .segment-time {
            color: #4a90e2;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 5px;
        }

        .segment-text {
            color: #333;
        }

        .tags {
            margin-top: 30px;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        .tag {
            background: #e8f4fd;
            color: #4a90e2;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 500;
        }

        footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            color: #999;
            font-size: 13px;
        }

        .cta-button {
            display: inline-block;
            margin-top: 20px;
            padding: 12px 24px;
            background: #4a90e2;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            transition: background 0.3s;
        }

        .cta-button:hover {
            background: #357abd;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>{{.Title}}</h1>
            <div class="meta">
                Published on {{formatDate .PublishedDate}} • {{formatDuration .Duration}}
            </div>
        </header>

        <div class="author">
            <div class="author-name">{{.AuthorName}}</div>
            {{if .AuthorTitle}}
            <div class="author-title">{{.AuthorTitle}}{{if .AuthorCompany}} at {{.AuthorCompany}}{{end}}</div>
            {{end}}
        </div>

        {{if .MediaURL}}
        <div class="video-container">
            <video controls>
                <source src="{{.MediaURL}}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
        </div>
        {{end}}

        <div class="transcript-section">
            <h2>Full Transcript</h2>

            {{if .Segments}}
            <div class="transcript-segments">
                {{range .Segments}}
                <div class="segment">
                    <div class="segment-time">{{formatTime .StartTime}}</div>
                    <div class="segment-text">{{.Text}}</div>
                </div>
                {{end}}
            </div>
            {{else}}
            <div class="transcript-text">
                {{.Transcript}}
            </div>
            {{end}}
        </div>

        {{if .Tags}}
        <div class="tags">
            {{range .Tags}}
            <span class="tag">{{.}}</span>
            {{end}}
        </div>
        {{end}}

        <div style="text-align: center;">
            <a href="{{.ShareURL}}" class="cta-button">Watch Full Video</a>
        </div>

        <footer>
            <p>This transcript is provided for accessibility and SEO purposes.</p>
            <p>&copy; {{year}} All rights reserved.</p>
        </footer>
    </div>
</body>
</html>`

	return template.Must(template.New("transcript").Funcs(funcMap).Parse(tmplStr))
}
