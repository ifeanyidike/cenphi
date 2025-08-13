// internal/mailing/template_renderer.go
package mailing

import (
	"context"
	"fmt"
	"html/template"
	"log"
	"strings"
	textTemplate "text/template"
	"time"

	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/models"
	"github.com/ifeanyidike/cenphi/internal/repositories"
	"go.uber.org/zap"
)

type templateRenderer struct {
	repository repositories.TestimonialRequestRepository
	logger     *zap.Logger
	templates  map[string]*models.EmailTemplate // In-memory cache
	isLoaded   bool                             // Prevent double loading
}

func NewTemplateRenderer(repository repositories.TestimonialRequestRepository, logger *zap.Logger) TemplateRenderer {
	renderer := &templateRenderer{
		repository: repository,
		logger:     logger,
		templates:  make(map[string]*models.EmailTemplate),
		isLoaded:   false,
	}

	// Load default templates on initialization
	if err := renderer.LoadDefaultTemplates(); err != nil {
		logger.Error("Failed to load default templates", zap.Error(err))
	}

	return renderer
}

func (r *templateRenderer) RenderTemplate(templateName string, data models.TemplateData) (*models.RenderedEmail, error) {
	// Get template (from cache or database)
	tmpl, err := r.GetTemplate(templateName)
	log.Println("template name", templateName)
	if err != nil {
		return nil, fmt.Errorf("failed to get template: %w", err)
	}

	// Enhanced template functions with robust error handling
	funcMap := template.FuncMap{
		"default": func(defaultValue, value interface{}) interface{} {
			if value == nil || value == "" {
				return defaultValue
			}
			return value
		},
		"lower":    strings.ToLower,
		"upper":    strings.ToUpper,
		"title":    strings.Title,
		"contains": strings.Contains,
		"replace": func(old, new, text string) string {
			return strings.ReplaceAll(text, old, new)
		},
		"truncate": func(length int, text string) string {
			if len(text) <= length {
				return text
			}
			return text[:length] + "..."
		},
		"formatDate": func(date time.Time) string {
			return date.Format("January 2, 2006")
		},
		"formatDateTime": func(date time.Time) string {
			return date.Format("January 2, 2006 at 3:04 PM")
		},
		"safeHTML": func(html string) template.HTML {
			return template.HTML(html)
		},
		"safeCSS": func(css string) template.CSS {
			return template.CSS(css)
		},
		"brandColor": func(colorName string, defaultColor string) string {
			if data.BrandColors == nil {
				return defaultColor
			}
			if color, ok := data.BrandColors[colorName].(string); ok && color != "" {
				return color
			}
			return defaultColor
		},
	}

	// Render HTML content
	htmlTmpl, err := template.New("html").Funcs(funcMap).Parse(tmpl.HTMLContent)
	if err != nil {
		return nil, fmt.Errorf("failed to parse HTML template: %w", err)
	}

	var htmlBuffer strings.Builder
	if err := htmlTmpl.Execute(&htmlBuffer, data); err != nil {
		return nil, fmt.Errorf("failed to execute HTML template: %w", err)
	}

	// Render text content
	textFuncMap := textTemplate.FuncMap{}
	for k, v := range funcMap {
		if k != "safeHTML" && k != "safeCSS" { // HTML-specific functions
			textFuncMap[k] = v
		}
	}

	textTmpl, err := textTemplate.New("text").Funcs(textFuncMap).Parse(tmpl.TextContent)
	if err != nil {
		return nil, fmt.Errorf("failed to parse text template: %w", err)
	}

	var textBuffer strings.Builder
	if err := textTmpl.Execute(&textBuffer, data); err != nil {
		return nil, fmt.Errorf("failed to execute text template: %w", err)
	}

	// Render subject
	subjectTmpl, err := textTemplate.New("subject").Funcs(textFuncMap).Parse(tmpl.Subject)
	if err != nil {
		return nil, fmt.Errorf("failed to parse subject template: %w", err)
	}

	var subjectBuffer strings.Builder
	if err := subjectTmpl.Execute(&subjectBuffer, data); err != nil {
		return nil, fmt.Errorf("failed to execute subject template: %w", err)
	}

	return &models.RenderedEmail{
		Subject:     subjectBuffer.String(),
		HTMLContent: htmlBuffer.String(),
		TextContent: textBuffer.String(),
	}, nil
}

func (r *templateRenderer) GetTemplate(name string) (*models.EmailTemplate, error) {
	// Check cache first
	if tmpl, exists := r.templates[name]; exists {
		return tmpl, nil
	}

	// Try loading from database
	ctx := context.Background()
	tmpl, err := r.repository.GetTemplate(ctx, name)
	if err != nil {
		// If template not found, try creating defaults
		if err.Error() == "sql: no rows in result set" {
			r.logger.Warn("Template not found, creating defaults", zap.String("template", name))
			if loadErr := r.LoadDefaultTemplates(); loadErr != nil {
				return nil, fmt.Errorf("template '%s' not found and failed to create defaults: %w", name, loadErr)
			}
			// Try again after creating defaults
			if tmpl, exists := r.templates[name]; exists {
				return tmpl, nil
			}
		}
		return nil, fmt.Errorf("template '%s' not found: %w", name, err)
	}

	// Cache it
	r.templates[name] = tmpl
	return tmpl, nil
}

func (r *templateRenderer) LoadDefaultTemplates() error {
	// Check if default template already exists
	ctx := context.Background()
	if _, err := r.repository.GetTemplate(ctx, "testimonial_request"); err == nil {
		r.logger.Info("Default templates already exist, skipping creation")
		return nil
	}

	// Create simple default template
	defaultTemplate := &models.EmailTemplate{
		ID:      uuid.New(),
		Name:    "testimonial_request",
		Subject: `We'd love your feedback, {{.ContactName}}!`,
		HTMLContent: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>We'd love your feedback</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f9fafb;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
            <td style="padding: 20px;">
                <!-- Main container -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #667eea; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0 0 8px 0; color: #ffffff; font-size: 28px; font-weight: normal;">👋 Hi {{.ContactName}}!</h1>
                            <p style="margin: 0; color: #e5e7eb; font-size: 16px;">We'd love to hear from you</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            
                            <!-- Greeting -->
                            <p style="margin: 0 0 20px 0; font-size: 18px; font-weight: bold; color: #1f2937;">Hope you're doing well!</p>
                            
                            <!-- Main message -->
                            <p style="margin: 0 0 24px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
                                We would love to hear about your experience with {{.CompanyName}}. Your feedback means the world to us and helps others discover our services.
                            </p>
                            
                            <!-- Custom message -->
                            {{if .CustomMessage}}
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
                                <tr>
                                    <td style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; border-radius: 0 8px 8px 0;">
                                        <p style="margin: 0; color: #0c4a6e; font-style: italic; line-height: 1.6;">{{.CustomMessage}}</p>
                                    </td>
                                </tr>
                            </table>
                            {{end}}
                            
                            <!-- Features box -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
                                <tr>
                                    <td style="background-color: #f8fafc; padding: 24px; border-radius: 8px;">
                                        <h3 style="margin: 0 0 16px 0; color: #1e293b; font-size: 16px; font-weight: bold;">⚡ Quick &amp; Easy - Just 2-3 minutes</h3>
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding: 8px 0; color: #475569; font-size: 15px;">✓ Share your experience in your own words</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #475569; font-size: 15px;">✓ Upload a photo or video (completely optional)</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #475569; font-size: 15px;">✓ Help others like you make great decisions</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- CTA Button -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0;">
                                <tr>
                                    <td style="text-align: center;">
                                        <a href="{{.CollectionURL}}" style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">Share Your Experience</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Signature -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                                <tr>
                                    <td>
                                        <p style="margin: 0 0 4px 0; color: #374151; font-size: 16px;">Thank you so much for your time!</p>
                                        <p style="margin: 0 0 4px 0; color: #374151; font-size: 16px;">Best regards,</p>
                                        <p style="margin: 0 0 4px 0; color: #1f2937; font-size: 16px; font-weight: bold;">{{.SenderName}}</p>
                                        {{if .SenderTitle}}<p style="margin: 0; color: #6b7280; font-size: 14px;">{{.SenderTitle}}</p>{{end}}
                                        {{if .SenderCompany}}<p style="margin: 0; color: #6b7280; font-size: 14px;">{{.SenderCompany}}</p>{{end}}
                                    </td>
                                </tr>
                            </table>
                            
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 24px 30px; text-align: center; color: #6b7280; font-size: 14px; line-height: 1.5; border-radius: 0 0 8px 8px;">
                            <p style="margin: 0 0 8px 0;">🔒 Your privacy matters - you can review everything before it's published</p>
                            <p style="margin: 0;">This testimonial helps others discover amazing services like ours</p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
		TextContent: `Hi {{.ContactName}}!

I hope this email finds you well! We would love to hear about your experience with {{.CompanyName}}.

{{if .CustomMessage}}
{{.CustomMessage}}
{{end}}

Would you mind sharing a brief testimonial about your experience? It will help others discover our services.

It'll only take 2-3 minutes:
• Share your experience in your own words  
• Upload a photo or video (optional)
• Help others like you

👉 Share your experience: {{.CollectionURL}}

Thank you so much for your time!

Best regards,
{{.SenderName}}{{if .SenderTitle}}
{{.SenderTitle}}{{end}}{{if .SenderCompany}}
{{.SenderCompany}}{{end}}`,
		Variables: models.JSONArray{
			"ContactName", "CompanyName", "CollectionURL", "SenderName",
			"CustomMessage", "SenderTitle", "SenderCompany",
		},
		IsDefault: true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Actually save to database (this was missing!)
	if err := r.repository.CreateTemplate(ctx, defaultTemplate); err != nil {
		r.logger.Error("Failed to create default template", zap.Error(err))
		return fmt.Errorf("failed to create default template: %w", err)
	}

	// Cache it
	r.templates[defaultTemplate.Name] = defaultTemplate

	r.logger.Info("Default email template created successfully")
	return nil
}
