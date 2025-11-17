// internal/ai/brand_context_service.go
package ai

import (
	"context"
	"crypto/md5"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github.com/google/uuid"
	"github.com/ifeanyidike/cenphi/internal/cache"
	"github.com/ifeanyidike/cenphi/internal/config"
	"github.com/ifeanyidike/cenphi/internal/models"
)

type BrandContextService struct {
	httpClient   *http.Client
	cacheService cache.RedisCache
	cfg          config.Config
}

func NewBrandContextService(cacheService cache.RedisCache, cfg config.Config) BrandContextService {
	return BrandContextService{
		cacheService: cacheService,
		cfg:          cfg,
		httpClient: &http.Client{
			Timeout: 90 * time.Second, // Increased timeout
		},
	}
}

// CRITICAL FIX: Added comprehensive validation and error handling
func (s BrandContextService) ExtractBrandContext(ctx context.Context, websiteURL string, workspaceID uuid.UUID) (models.BrandContext, error) {
	// Check cache first
	cacheKey := fmt.Sprintf("brand_context:%x", md5.Sum([]byte(websiteURL)))
	var cached models.BrandContext
	if err := s.cacheService.Get(ctx, cacheKey, &cached); err == nil {
		return cached, nil
	}

	fmt.Printf("🔍 Starting brand extraction for: %s\n", websiteURL)

	// Normalize URL with validation
	normalizedURL, err := s.normalizeAndValidateURL(websiteURL)
	if err != nil {
		return s.createDefaultBrandContext(workspaceID), fmt.Errorf("invalid URL: %w", err)
	}

	// Smart page discovery with timeout handling
	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	pages := s.discoverExistingPages(ctx, normalizedURL)
	fmt.Printf("📄 Found %d pages to analyze\n", len(pages))

	// CRITICAL FIX: Early validation for empty results
	if len(pages) == 0 {
		fmt.Printf("⚠️  No accessible pages found, returning default brand context\n")
		return s.createDefaultBrandContext(workspaceID), nil
	}

	// Scrape all pages with error handling
	pageData := s.scrapePages(ctx, pages)
	fmt.Printf("✅ Scraped %d pages successfully\n", len(pageData))

	// CRITICAL FIX: Validate scraped content
	if len(pageData) == 0 {
		fmt.Printf("⚠️  No content scraped successfully, returning default brand context\n")
		return s.createDefaultBrandContext(workspaceID), nil
	}

	// Validate content quality
	totalContent := s.getTotalContentLength(pageData)
	fmt.Printf("📄 Analyzing %d characters of content\n", totalContent)

	if totalContent < 50 {
		fmt.Printf("⚠️  Insufficient content scraped (%d chars), returning default brand context\n", totalContent)
		return s.createDefaultBrandContext(workspaceID), nil
	}

	// Extract brand context using safe analysis
	brandContext := s.extractBrandData(normalizedURL, pageData, workspaceID)

	// Cache for 24 hours
	s.cacheService.Set(ctx, cacheKey, brandContext, 24*time.Hour)

	return brandContext, nil
}

// CRITICAL FIX: URL validation and normalization
func (s *BrandContextService) normalizeAndValidateURL(websiteURL string) (string, error) {
	if websiteURL == "" {
		return "", fmt.Errorf("empty URL provided")
	}

	// Add protocol if missing
	if !strings.HasPrefix(websiteURL, "http") {
		websiteURL = "https://" + websiteURL
	}

	// Parse and validate URL
	parsedURL, err := url.Parse(websiteURL)
	if err != nil {
		return "", fmt.Errorf("invalid URL format: %w", err)
	}

	if parsedURL.Host == "" {
		return "", fmt.Errorf("URL missing host")
	}

	return websiteURL, nil
}

// CRITICAL FIX: Create default brand context for failed extractions
func (s *BrandContextService) createDefaultBrandContext(workspaceID uuid.UUID) models.BrandContext {
	now := time.Now()
	return models.BrandContext{
		WorkspaceID:      workspaceID,
		AboutInfo:        "",
		Keywords:         []string{},
		Tone:             "professional",
		BrandColors:      models.JSONMap{},
		ColorSlice:       []string{},
		BrandFonts:       models.JSONMap{},
		LogoURL:          "",
		Values:           []string{},
		Tagline:          "",
		TargetAudience:   "",
		MissionStatement: "",
		BusinessModel:    "",
		CompanySize:      "",
		ExtractedData:    models.JSONMap{},
		CreatedAt:        now,
		UpdatedAt:        now,
	}
}

// CRITICAL FIX: Safe content length calculation
func (s *BrandContextService) getTotalContentLength(pageData map[string]PageData) int {
	if pageData == nil {
		return 0
	}

	total := 0
	for _, data := range pageData {
		total += len(data.Content)
		total += len(data.Title)
		for _, heading := range data.Headings {
			total += len(heading)
		}
	}
	return total
}

// CRITICAL FIX: Safe brand data extraction with comprehensive error handling
func (s *BrandContextService) extractBrandData(websiteURL string, pageData map[string]PageData, workspaceID uuid.UUID) models.BrandContext {
	now := time.Now()
	brandContext := models.BrandContext{
		WorkspaceID: workspaceID,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	// CRITICAL FIX: Validate pageData before processing
	if pageData == nil {
		return s.createDefaultBrandContext(workspaceID)
	}

	// Combine all content safely
	allContent := s.combineContent(pageData)
	fmt.Printf("📄 Analyzing %d characters of content\n", len(allContent))

	// Debug: Print sample content to understand what we're analyzing
	if len(allContent) > 200 {
		fmt.Printf("📝 Content sample: %s...\n", allContent[:200])
	} else {
		fmt.Printf("📝 Full content: %s\n", allContent)
	}

	// Extract each field with error handling but full functionality
	brandContext.AboutInfo = s.extractAboutInfo(allContent, pageData)
	brandContext.Keywords = s.extractKeywords(allContent, pageData)
	brandContext.Tone = s.extractTone(allContent)

	colorMaps, colorSlice := s.extractColorsAsJSONMap(pageData)
	brandContext.BrandColors = colorMaps
	brandContext.ColorSlice = colorSlice

	brandContext.BrandFonts = s.extractFontsAsJSONMap(pageData)
	brandContext.LogoURL = s.extractLogo(pageData, websiteURL)
	brandContext.Values = s.extractValues(allContent, pageData)
	brandContext.Tagline = s.extractTagline(pageData)
	brandContext.TargetAudience = s.extractTargetAudience(allContent)
	brandContext.MissionStatement = s.extractMission(allContent, pageData)
	brandContext.BusinessModel = s.extractBusinessModel(allContent)
	brandContext.CompanySize = s.extractCompanySize(allContent)
	brandContext.ExtractedData = s.extractAdditionalData(allContent, pageData)

	return brandContext
}

// CRITICAL FIX: Safe content combination
func (s *BrandContextService) combineContent(pageData map[string]PageData) string {
	if pageData == nil {
		return ""
	}

	var allContent strings.Builder

	// Prioritize homepage and about pages
	for _, data := range pageData {
		if data.PageType == "home" || data.PageType == "about" {
			allContent.WriteString(data.Content + " ")
			// Add headings with extra weight
			for _, heading := range data.Headings {
				if heading != "" {
					allContent.WriteString(heading + " " + heading + " ") // Double weight
				}
			}
			// Add meta descriptions
			if data.MetaData != nil {
				if desc, exists := data.MetaData["description"]; exists && desc != "" {
					allContent.WriteString(desc + " ")
				}
			}
		}
	}

	// Add other pages
	for _, data := range pageData {
		if data.PageType != "home" && data.PageType != "about" {
			allContent.WriteString(data.Content + " ")
		}
	}

	return allContent.String()
}

// ROBUST EXTRACTION METHODS - Full functionality with safety

func (s *BrandContextService) extractAboutInfo(allContent string, pageData map[string]PageData) string {
	if pageData == nil {
		return "No about information could be extracted."
	}

	// Look for about page first
	for _, page := range pageData {
		if page.PageType == "about" && len(page.Content) > 50 {
			// Take first meaningful paragraph
			sentences := strings.Split(page.Content, ".")
			if len(sentences) > 0 {
				result := ""
				for _, sentence := range sentences {
					sentence = strings.TrimSpace(sentence)
					if len(sentence) > 20 && len(result+sentence) < 500 {
						result += sentence + ". "
					}
					if len(result) > 200 {
						break
					}
				}
				if result != "" {
					return strings.TrimSpace(result)
				}
			}
		}
	}

	// Fallback to homepage content
	for _, page := range pageData {
		if page.PageType == "home" && len(page.Content) > 50 {
			sentences := strings.Split(page.Content, ".")
			if len(sentences) > 0 {
				result := ""
				for i, sentence := range sentences {
					if i >= 3 { // Take first 3 sentences max
						break
					}
					sentence = strings.TrimSpace(sentence)
					if len(sentence) > 20 {
						result += sentence + ". "
					}
				}
				if result != "" {
					return strings.TrimSpace(result)
				}
			}
		}
	}

	return "Company information could not be extracted automatically."
}

func (s *BrandContextService) extractKeywords(allContent string, pageData map[string]PageData) []string {
	if allContent == "" {
		return []string{}
	}

	// Clean and prepare content
	contentLower := strings.ToLower(allContent)
	words := strings.Fields(contentLower)

	if len(words) == 0 {
		return []string{}
	}

	keywordFreq := make(map[string]float64)
	stopWords := map[string]bool{
		"the": true, "and": true, "or": true, "but": true, "in": true, "on": true, "at": true, "to": true, "for": true, "of": true, "with": true, "by": true, "a": true, "an": true, "is": true, "are": true, "was": true, "were": true, "be": true, "been": true, "have": true, "has": true, "had": true, "do": true, "does": true, "did": true, "will": true, "would": true, "could": true, "should": true, "may": true, "might": true, "must": true, "can": true, "this": true, "that": true, "these": true, "those": true, "we": true, "you": true, "they": true, "it": true, "he": true, "she": true, "i": true, "me": true, "my": true, "your": true, "our": true, "their": true,
	}

	// Count word frequencies
	for _, word := range words {
		cleaned := strings.Trim(word, ".,!?\"';:()")
		if len(cleaned) > 3 && len(cleaned) < 20 && !stopWords[cleaned] {
			keywordFreq[cleaned] += 1.0
		}
	}

	// Add bonus for words in headings and titles

	for _, page := range pageData {
		// Boost title words
		titleWords := strings.Fields(strings.ToLower(page.Title))
		for _, word := range titleWords {
			cleaned := strings.Trim(word, ".,!?\"';:()")
			if len(cleaned) > 3 && len(cleaned) < 20 && !stopWords[cleaned] {
				keywordFreq[cleaned] += 2.0 // Boost title words
			}
		}

		// Boost heading words
		for _, heading := range page.Headings {
			headingWords := strings.Fields(strings.ToLower(heading))
			for _, word := range headingWords {
				cleaned := strings.Trim(word, ".,!?\"';:()")
				if len(cleaned) > 3 && len(cleaned) < 20 && !stopWords[cleaned] {
					keywordFreq[cleaned] += 1.5 // Boost heading words
				}
			}
		}
	}

	if len(keywordFreq) == 0 {
		return []string{}
	}

	// Sort and get top keywords
	type keywordScore struct {
		word  string
		score float64
	}

	var keywordScores []keywordScore
	for word, score := range keywordFreq {
		if score >= 2.0 {
			keywordScores = append(keywordScores, keywordScore{word, score})
		}
	}

	sort.Slice(keywordScores, func(i, j int) bool {
		return keywordScores[i].score > keywordScores[j].score
	})

	result := []string{}
	maxKeywords := 15
	if len(keywordScores) < maxKeywords {
		maxKeywords = len(keywordScores)
	}

	for i := 0; i < maxKeywords; i++ {
		result = append(result, keywordScores[i].word)
	}

	if len(result) > 0 {
		fmt.Printf("🔑 Keywords: %v\n", result)
	}

	return result
}

func (s *BrandContextService) extractTone(allContent string) string {
	if allContent == "" {
		return "professional"
	}

	contentLower := strings.ToLower(allContent)

	tones := map[string]struct {
		keywords []string
		minScore float64
	}{
		"professional": {
			keywords: []string{"professional", "enterprise", "business", "industry", "expertise", "proven", "established", "corporate", "solutions", "services"},
			minScore: 4.0,
		},
		"friendly": {
			keywords: []string{"friendly", "welcome", "community", "help", "support", "love", "care", "personal", "warm", "approachable"},
			minScore: 4.0,
		},
		"innovative": {
			keywords: []string{"innovative", "cutting-edge", "revolutionary", "breakthrough", "next-generation", "advanced", "pioneering", "future"},
			minScore: 3.0,
		},
		"casual": {
			keywords: []string{"easy", "simple", "fun", "awesome", "cool", "amazing", "super", "quick", "effortless", "straightforward"},
			minScore: 3.0,
		},
		"authoritative": {
			keywords: []string{"leading", "authority", "expert", "specialist", "premier", "top", "ultimate", "trusted", "reliable"},
			minScore: 3.0,
		},
	}

	toneScores := make(map[string]float64)

	for tone, data := range tones {
		score := 0.0
		for _, keyword := range data.keywords {
			count := float64(strings.Count(contentLower, keyword))
			score += count * 1.5
		}
		if score >= data.minScore {
			toneScores[tone] = score
		}
	}

	maxTone := "professional" // Default fallback
	maxScore := 0.0
	for tone, score := range toneScores {
		if score > maxScore {
			maxTone = tone
			maxScore = score
		}
	}

	if maxScore > 0 {
		fmt.Printf("🎵 Tone: %s (score: %.1f)\n", maxTone, maxScore)
	}

	return maxTone
}

func (s *BrandContextService) extractColorsAsJSONMap(pageData map[string]PageData) (models.JSONMap, []string) {
	if pageData == nil {
		return models.JSONMap{}, []string{}
	}

	colorFreq := make(map[string]int)
	excludedColors := map[string]bool{
		"#FFFFFF": true, "#000000": true, "#FFF": true, "#000": true,
		"#FAFAFA": true, "#F5F5F5": true, "#EEEEEE": true,
	}

	colorPatterns := []*regexp.Regexp{
		regexp.MustCompile(`#[a-fA-F0-9]{6}`),                            // #RRGGBB
		regexp.MustCompile(`#[a-fA-F0-9]{3}`),                            // #RGB
		regexp.MustCompile(`rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)`), // rgb(r,g,b)
	}

	for _, page := range pageData {
		if page.CSSContent != "" {
			// Extract hex colors
			for i, pattern := range colorPatterns {
				if i < 2 { // Hex patterns
					matches := pattern.FindAllString(page.CSSContent, -1)
					for _, match := range matches {
						color := strings.ToUpper(match)
						if !excludedColors[color] && len(color) >= 4 {
							colorFreq[color]++
						}
					}
				} else { // RGB pattern
					matches := pattern.FindAllStringSubmatch(page.CSSContent, -1)
					for _, match := range matches {
						if len(match) == 4 {
							r, _ := strconv.Atoi(match[1])
							g, _ := strconv.Atoi(match[2])
							b, _ := strconv.Atoi(match[3])
							if r <= 255 && g <= 255 && b <= 255 {
								hex := fmt.Sprintf("#%02X%02X%02X", r, g, b)
								if !excludedColors[hex] {
									colorFreq[hex]++
								}
							}
						}
					}
				}
			}
		}
	}

	result := models.JSONMap{}
	colorSlice := []string{}

	if len(colorFreq) > 0 {
		type colorInfo struct {
			hex   string
			count int
		}

		var colors []colorInfo
		for hex, count := range colorFreq {
			if count >= 2 {
				colors = append(colors, colorInfo{hex, count})
			}
		}

		sort.Slice(colors, func(i, j int) bool {
			return colors[i].count > colors[j].count
		})

		primary := []string{}
		secondary := []string{}

		maxColors := len(colors)
		if maxColors > 8 {
			maxColors = 8
		}

		for i := 0; i < maxColors; i++ {
			colorSlice = append(colorSlice, colors[i].hex)
			if i < 3 {
				primary = append(primary, colors[i].hex)
			} else {
				secondary = append(secondary, colors[i].hex)
			}
		}

		if len(primary) > 0 {
			result["primary"] = primary
		}
		if len(secondary) > 0 {
			result["secondary"] = secondary
		}

		result["total_found"] = len(colors)

		fmt.Printf("🎨 Colors: Found %d unique colors, %d primary\n", len(colors), len(primary))
	}

	return result, colorSlice
}

func (s *BrandContextService) extractFontsAsJSONMap(pageData map[string]PageData) models.JSONMap {
	if pageData == nil {
		return models.JSONMap{}
	}

	fontFreq := make(map[string]int)
	fontPattern := regexp.MustCompile(`font-family\s*:\s*([^;}]+)`)
	genericFonts := map[string]bool{
		"serif": true, "sans-serif": true, "monospace": true, "cursive": true,
		"fantasy": true, "inherit": true, "initial": true, "unset": true,
	}

	for _, page := range pageData {
		if page.CSSContent != "" {
			matches := fontPattern.FindAllStringSubmatch(page.CSSContent, -1)
			for _, match := range matches {
				if len(match) > 1 {
					fonts := s.parseFontFamily(match[1])
					for _, font := range fonts {
						fontLower := strings.ToLower(font)
						if !genericFonts[fontLower] && len(font) > 2 && len(font) < 50 {
							fontFreq[font]++
						}
					}
				}
			}
		}
	}

	result := models.JSONMap{}

	if len(fontFreq) > 0 {
		type fontInfo struct {
			name  string
			count int
		}

		var fonts []fontInfo
		for font, count := range fontFreq {
			if count >= 1 {
				fonts = append(fonts, fontInfo{font, count})
			}
		}

		sort.Slice(fonts, func(i, j int) bool {
			return fonts[i].count > fonts[j].count
		})

		primary := []string{}
		secondary := []string{}

		for i, font := range fonts {
			if i < 3 {
				primary = append(primary, font.name)
			} else if i < 8 {
				secondary = append(secondary, font.name)
			}
		}

		if len(primary) > 0 {
			result["primary"] = primary
		}
		if len(secondary) > 0 {
			result["secondary"] = secondary
		}

		result["total_found"] = len(fonts)

		fmt.Printf("🔤 Fonts: Found %d unique fonts, %d primary\n", len(fonts), len(primary))
	}

	return result
}

func (s *BrandContextService) parseFontFamily(fontFamily string) []string {
	// Clean up the font family string
	fontFamily = strings.TrimSpace(fontFamily)
	fontFamily = strings.Trim(fontFamily, "\"'")

	// Split by comma
	fonts := strings.Split(fontFamily, ",")

	result := []string{}
	for _, font := range fonts {
		font = strings.TrimSpace(font)
		font = strings.Trim(font, "\"'")
		if font != "" {
			result = append(result, font)
		}
	}

	return result
}

func (s *BrandContextService) extractLogo(pageData map[string]PageData, websiteURL string) string {
	if pageData == nil || websiteURL == "" {
		return ""
	}

	// Look for logo on homepage first
	for _, page := range pageData {
		if page.PageType == "home" {
			for _, img := range page.Images {
				parts := strings.Split(img, "|")
				if len(parts) >= 2 {
					src := parts[0]
					alt := parts[1]
					class := ""
					if len(parts) > 2 {
						class = parts[2]
					}

					srcLower := strings.ToLower(src)
					altLower := strings.ToLower(alt)
					classLower := strings.ToLower(class)

					// Enhanced logo detection
					logoIndicators := []string{"logo", "brand", "company", "site-logo", "header-logo"}
					isLogo := false

					for _, indicator := range logoIndicators {
						if strings.Contains(srcLower, indicator) ||
							strings.Contains(altLower, indicator) ||
							strings.Contains(classLower, indicator) {
							isLogo = true
							break
						}
					}

					if isLogo {
						if strings.HasPrefix(src, "/") {
							parsedURL, _ := url.Parse(websiteURL)
							logoURL := fmt.Sprintf("%s://%s%s", parsedURL.Scheme, parsedURL.Host, src)
							fmt.Printf("🖼️  Logo: %s\n", logoURL)
							return logoURL
						} else if strings.HasPrefix(src, "http") {
							fmt.Printf("🖼️  Logo: %s\n", src)
							return src
						}
					}
				}
			}
		}
	}

	// Fallback: look for logo on any page
	for _, page := range pageData {
		for _, img := range page.Images {
			parts := strings.Split(img, "|")
			if len(parts) >= 2 {
				src := parts[0]

				if strings.Contains(strings.ToLower(src), "logo") {
					if strings.HasPrefix(src, "/") {
						parsedURL, _ := url.Parse(websiteURL)
						logoURL := fmt.Sprintf("%s://%s%s", parsedURL.Scheme, parsedURL.Host, src)
						fmt.Printf("🖼️  Logo: %s (fallback)\n", logoURL)
						return logoURL
					} else if strings.HasPrefix(src, "http") {
						fmt.Printf("🖼️  Logo: %s (fallback)\n", src)
						return src
					}
				}
			}
		}
	}

	return ""
}

func (s *BrandContextService) extractValues(allContent string, pageData map[string]PageData) []string {
	if allContent == "" {
		return []string{}
	}

	contentLower := strings.ToLower(allContent)

	values := map[string]struct {
		keywords []string
		minScore float64
	}{
		"Innovation": {
			keywords: []string{"innovation", "innovative", "cutting-edge", "revolutionary", "breakthrough", "pioneering"},
			minScore: 3.0,
		},
		"Quality": {
			keywords: []string{"quality", "excellence", "premium", "superior", "best", "top-quality", "high-quality"},
			minScore: 3.0,
		},
		"Customer Service": {
			keywords: []string{"customer service", "customer support", "customer care", "customer satisfaction", "customer-focused"},
			minScore: 3.0,
		},
		"Integrity": {
			keywords: []string{"integrity", "honest", "transparency", "ethical", "trustworthy", "reliable", "dependable"},
			minScore: 3.0,
		},
		"Teamwork": {
			keywords: []string{"teamwork", "collaboration", "team", "together", "partnership", "community", "cooperation"},
			minScore: 3.0,
		},
		"Excellence": {
			keywords: []string{"excellence", "excellent", "outstanding", "exceptional", "superior", "world-class"},
			minScore: 3.0,
		},
		"Sustainability": {
			keywords: []string{"sustainability", "sustainable", "green", "eco-friendly", "environmental", "responsible"},
			minScore: 3.0,
		},
		"Security": {
			keywords: []string{"security", "secure", "safe", "protection", "privacy", "trust", "safety"},
			minScore: 3.0,
		},
	}

	valueScores := make(map[string]float64)

	for value, data := range values {
		score := 0.0
		for _, keyword := range data.keywords {
			count := float64(strings.Count(contentLower, keyword))
			score += count * 2.0
		}
		if score >= data.minScore {
			valueScores[value] = score
		}
	}

	type valueScore struct {
		value string
		score float64
	}

	var valueList []valueScore
	for value, score := range valueScores {
		valueList = append(valueList, valueScore{value, score})
	}

	sort.Slice(valueList, func(i, j int) bool {
		return valueList[i].score > valueList[j].score
	})

	result := []string{}
	maxValues := 8
	if len(valueList) < maxValues {
		maxValues = len(valueList)
	}

	for i := 0; i < maxValues; i++ {
		result = append(result, valueList[i].value)
	}

	if len(result) > 0 {
		fmt.Printf("💎 Values: %v\n", result)
	}

	return result
}

func (s *BrandContextService) extractTagline(pageData map[string]PageData) string {
	if pageData == nil {
		return ""
	}

	// Try homepage meta description first
	for _, page := range pageData {
		if page.PageType == "home" {
			if page.MetaData != nil {
				if desc, exists := page.MetaData["description"]; exists {
					desc = strings.TrimSpace(desc)
					if len(desc) > 15 && len(desc) < 160 && !s.isGeneric(desc) && s.isTaglineCandidate(desc) {
						fmt.Printf("🏷️  Tagline: %s\n", desc)
						return desc
					}
				}

				// Try og:description
				if desc, exists := page.MetaData["og:description"]; exists {
					desc = strings.TrimSpace(desc)
					if len(desc) > 15 && len(desc) < 140 && !s.isGeneric(desc) && s.isTaglineCandidate(desc) {
						fmt.Printf("🏷️  Tagline: %s\n", desc)
						return desc
					}
				}
			}

			// Try first meaningful heading
			for _, heading := range page.Headings {
				if len(heading) > 15 && len(heading) < 100 && !s.isGeneric(heading) && s.isTaglineCandidate(heading) {
					fmt.Printf("🏷️  Tagline: %s\n", heading)
					return heading
				}
			}
		}
	}

	return ""
}

func (s *BrandContextService) isTaglineCandidate(text string) bool {
	textLower := strings.ToLower(text)

	// Common tagline indicators
	indicators := []string{
		"we", "your", "the future", "solution", "platform", "way", "better", "best", "leading", "next",
	}

	for _, indicator := range indicators {
		if strings.Contains(textLower, indicator) {
			return true
		}
	}

	// Check for action words
	actionWords := []string{"build", "create", "help", "enable", "power", "drive", "transform", "deliver"}
	for _, word := range actionWords {
		if strings.Contains(textLower, word) {
			return true
		}
	}

	return false
}

func (s *BrandContextService) isGeneric(text string) bool {
	genericPhrases := []string{
		"home", "welcome", "page", "website", "site", "default", "index",
		"404", "error", "not found", "coming soon", "under construction",
	}

	textLower := strings.ToLower(text)
	for _, phrase := range genericPhrases {
		if strings.Contains(textLower, phrase) {
			return true
		}
	}

	return false
}

func (s *BrandContextService) extractTargetAudience(allContent string) string {
	if allContent == "" {
		return ""
	}

	contentLower := strings.ToLower(allContent)

	audiences := map[string]struct {
		keywords []string
		minScore float64
	}{
		"developers": {
			keywords: []string{"developers", "engineers", "programmers", "api", "sdk", "code", "technical", "devs", "coding"},
			minScore: 3.0,
		},
		"businesses": {
			keywords: []string{"business", "companies", "organizations", "enterprises", "teams", "professional", "corporate"},
			minScore: 4.0,
		},
		"startups": {
			keywords: []string{"startups", "entrepreneurs", "small business", "growing", "scaling", "founders", "early-stage"},
			minScore: 3.0,
		},
		"consumers": {
			keywords: []string{"everyone", "people", "individuals", "personal", "family", "home", "everyday", "anyone"},
			minScore: 3.0,
		},
		"enterprises": {
			keywords: []string{"enterprise", "large", "multinational", "corporation", "global", "scalable", "enterprise-grade"},
			minScore: 3.0,
		},
		"creative professionals": {
			keywords: []string{"designers", "artists", "creative", "agencies", "studios", "freelancers", "creators"},
			minScore: 3.0,
		},
	}

	audienceScores := make(map[string]float64)

	for audience, data := range audiences {
		score := 0.0
		for _, keyword := range data.keywords {
			count := float64(strings.Count(contentLower, keyword))
			score += count * 1.5
		}
		if score >= data.minScore {
			audienceScores[audience] = score
		}
	}

	maxAudience := ""
	maxScore := 0.0
	for audience, score := range audienceScores {
		if score > maxScore {
			maxAudience = audience
			maxScore = score
		}
	}

	if maxAudience != "" {
		fmt.Printf("👥 Audience: %s (score: %.1f)\n", maxAudience, maxScore)
	}

	return maxAudience
}

func (s *BrandContextService) extractMission(allContent string, pageData map[string]PageData) string {
	if allContent == "" {
		return ""
	}

	// Enhanced patterns for mission detection
	patterns := []*regexp.Regexp{
		regexp.MustCompile(`(?i)our mission is:?\s*([^.]{50,400}\.)`),
		regexp.MustCompile(`(?i)mission:?\s*([^.]{50,350}\.)`),
		regexp.MustCompile(`(?i)we believe\s+([^.]{50,350}\.)`),
		regexp.MustCompile(`(?i)our purpose is\s+([^.]{50,350}\.)`),
		regexp.MustCompile(`(?i)we exist to\s+([^.]{50,350}\.)`),
		regexp.MustCompile(`(?i)our goal is to\s+([^.]{50,350}\.)`),
	}

	for _, pattern := range patterns {
		matches := pattern.FindStringSubmatch(allContent)
		if len(matches) > 1 {
			mission := strings.TrimSpace(matches[1])
			if mission != "" {
				fmt.Printf("🎯 Mission: %s\n", mission)
				return mission
			}
		}
	}

	// Look specifically in mission/about pages

	for _, page := range pageData {
		if page.PageType == "mission" || page.PageType == "about" {
			sentences := strings.Split(page.Content, ".")
			for _, sentence := range sentences {
				sentence = strings.TrimSpace(sentence)
				if len(sentence) > 50 && len(sentence) < 400 {
					sentenceLower := strings.ToLower(sentence)
					if strings.Contains(sentenceLower, "mission") ||
						strings.Contains(sentenceLower, "purpose") ||
						strings.Contains(sentenceLower, "believe") {
						fmt.Printf("🎯 Mission: %s\n", sentence)
						return sentence + "."
					}
				}
			}
		}
	}

	return ""
}

func (s *BrandContextService) extractBusinessModel(allContent string) string {
	if allContent == "" {
		return ""
	}

	contentLower := strings.ToLower(allContent)

	models := map[string]struct {
		keywords []string
		minScore float64
	}{
		"SaaS": {
			keywords: []string{"saas", "software as a service", "subscription", "monthly", "annual", "cloud", "platform"},
			minScore: 3.0,
		},
		"E-commerce": {
			keywords: []string{"shop", "store", "buy", "sell", "products", "cart", "checkout", "marketplace"},
			minScore: 3.0,
		},
		"Marketplace": {
			keywords: []string{"marketplace", "buyers", "sellers", "commission", "platform", "connect"},
			minScore: 3.0,
		},
		"Consulting": {
			keywords: []string{"consulting", "consultant", "advisory", "services", "expertise", "guidance"},
			minScore: 3.0,
		},
		"Freemium": {
			keywords: []string{"free", "premium", "upgrade", "basic", "pro", "pricing tiers"},
			minScore: 3.0,
		},
		"Enterprise": {
			keywords: []string{"enterprise", "b2b", "business", "corporate", "contracts"},
			minScore: 3.0,
		},
	}

	modelScores := make(map[string]float64)

	for model, data := range models {
		score := 0.0
		for _, keyword := range data.keywords {
			count := float64(strings.Count(contentLower, keyword))
			score += count * 2.0
		}
		if score >= data.minScore {
			modelScores[model] = score
		}
	}

	maxModel := ""
	maxScore := 0.0
	for model, score := range modelScores {
		if score > maxScore {
			maxModel = model
			maxScore = score
		}
	}

	if maxModel != "" {
		fmt.Printf("💼 Business Model: %s (score: %.1f)\n", maxModel, maxScore)
	}

	return maxModel
}

func (s *BrandContextService) extractCompanySize(allContent string) string {
	if allContent == "" {
		return ""
	}

	contentLower := strings.ToLower(allContent)

	// Look for explicit employee counts
	employeePatterns := []*regexp.Regexp{
		regexp.MustCompile(`(\d+)\+?\s*(?:employees?|people|team members?|staff)`),
		regexp.MustCompile(`team of (\d+)`),
		regexp.MustCompile(`(\d+)\s*person team`),
	}

	for _, pattern := range employeePatterns {
		matches := pattern.FindAllStringSubmatch(contentLower, -1)
		for _, match := range matches {
			if len(match) > 1 {
				count, err := strconv.Atoi(match[1])
				if err == nil && count > 0 && count < 100000 {
					size := s.classifyByCount(count)
					fmt.Printf("🏢 Company Size: %s (%d employees)\n", size, count)
					return size
				}
			}
		}
	}

	// Context-based indicators
	sizeIndicators := map[string]struct {
		keywords []string
		minScore float64
	}{
		"startup": {
			keywords: []string{"startup", "founded", "launched", "early stage", "seed", "small team", "bootstrapped", "new company"},
			minScore: 3.0,
		},
		"small": {
			keywords: []string{"small business", "boutique", "specialized", "local", "regional", "independent", "small team"},
			minScore: 3.0,
		},
		"medium": {
			keywords: []string{"growing", "expanding", "scaling", "established", "regional", "national", "mid-size"},
			minScore: 3.0,
		},
		"large": {
			keywords: []string{"enterprise", "corporation", "multinational", "global", "fortune", "industry leader", "worldwide"},
			minScore: 4.0,
		},
	}

	sizeScores := make(map[string]float64)

	for size, data := range sizeIndicators {
		score := 0.0
		for _, keyword := range data.keywords {
			count := float64(strings.Count(contentLower, keyword))
			score += count * 2.0
		}
		if score >= data.minScore {
			sizeScores[size] = score
		}
	}

	maxSize := ""
	maxScore := 0.0
	for size, score := range sizeScores {
		if score > maxScore {
			maxSize = size
			maxScore = score
		}
	}

	if maxSize != "" {
		fmt.Printf("🏢 Company Size: %s (score: %.1f)\n", maxSize, maxScore)
	}

	return maxSize
}

func (s *BrandContextService) classifyByCount(count int) string {
	if count <= 10 {
		return "startup"
	} else if count <= 50 {
		return "small"
	} else if count <= 500 {
		return "medium"
	} else {
		return "large"
	}
}

func (s *BrandContextService) extractAdditionalData(allContent string, pageData map[string]PageData) models.JSONMap {
	defer func() {
		if r := recover(); r != nil {
			fmt.Printf("⚠️  Panic recovered in extractAdditionalData: %v\n", r)
		}
	}()

	data := models.JSONMap{}

	if allContent == "" || pageData == nil {
		return data
	}

	// Industry classification
	if industry := s.extractIndustryClassification(allContent, pageData); industry != "" {
		data["industry"] = industry
	}

	// Social media links
	if socialMedia := s.extractSocialMedia(pageData); len(socialMedia) > 0 {
		data["social_media"] = socialMedia
	}

	// Contact information
	if contactInfo := s.extractContactInfo(allContent); len(contactInfo) > 0 {
		data["contact_info"] = contactInfo
	}

	// Technologies used
	if technologies := s.extractTechnologies(pageData); len(technologies) > 0 {
		data["technologies"] = technologies
	}

	// Competitors mentioned
	if competitors := s.extractCompetitors(allContent); len(competitors) > 0 {
		data["competitors"] = competitors
	}

	// Page structure info
	if pageStructure := s.extractPageStructure(pageData); len(pageStructure) > 0 {
		data["page_structure"] = pageStructure
	}

	// SEO metadata
	if seoData := s.extractSEOData(pageData); len(seoData) > 0 {
		data["seo_data"] = seoData
	}

	return data
}

func (s *BrandContextService) extractIndustryClassification(allContent string, pageData map[string]PageData) string {
	if allContent == "" {
		return ""
	}

	contentLower := strings.ToLower(allContent)

	industries := map[string]struct {
		keywords []string
		minScore float64
	}{
		"technology": {
			keywords: []string{"software", "tech", "saas", "platform", "api", "cloud", "ai", "ml", "digital", "app", "developer", "engineering", "programming", "code", "data", "analytics", "automation", "innovation", "technical"},
			minScore: 5.0,
		},
		"fintech": {
			keywords: []string{"payment", "payments", "financial", "finance", "fintech", "banking", "money", "transaction", "billing", "wallet", "crypto", "trading", "investment"},
			minScore: 4.0,
		},
		"ecommerce": {
			keywords: []string{"ecommerce", "e-commerce", "retail", "shop", "store", "marketplace", "shopping", "product", "cart", "buy", "sell", "commerce"},
			minScore: 4.0,
		},
		"healthcare": {
			keywords: []string{"healthcare", "health", "medical", "medicine", "patient", "doctor", "clinic", "hospital", "therapy", "treatment", "wellness"},
			minScore: 3.0,
		},
		"education": {
			keywords: []string{"education", "learning", "school", "university", "course", "training", "student", "teacher", "academic", "knowledge"},
			minScore: 3.0,
		},
		"marketing": {
			keywords: []string{"marketing", "advertising", "promotion", "brand", "campaign", "social media", "seo", "digital marketing"},
			minScore: 3.0,
		},
	}

	industryScores := make(map[string]float64)

	for industry, data := range industries {
		score := 0.0
		for _, keyword := range data.keywords {
			count := float64(strings.Count(contentLower, keyword))
			score += count * 1.5
		}
		if score >= data.minScore {
			industryScores[industry] = score
		}
	}

	maxIndustry := ""
	maxScore := 0.0
	for industry, score := range industryScores {
		if score > maxScore {
			maxIndustry = industry
			maxScore = score
		}
	}

	if maxIndustry != "" {
		fmt.Printf("🏭 Industry: %s (score: %.1f)\n", maxIndustry, maxScore)
	}

	return maxIndustry
}

func (s *BrandContextService) extractSocialMedia(pageData map[string]PageData) map[string]string {
	if pageData == nil {
		return map[string]string{}
	}

	socialMedia := make(map[string]string)

	socialPatterns := map[string]*regexp.Regexp{
		"twitter":   regexp.MustCompile(`https?://(?:www\.)?twitter\.com/([a-zA-Z0-9_]+)`),
		"facebook":  regexp.MustCompile(`https?://(?:www\.)?facebook\.com/([a-zA-Z0-9._]+)`),
		"linkedin":  regexp.MustCompile(`https?://(?:www\.)?linkedin\.com/(?:company|in)/([a-zA-Z0-9_-]+)`),
		"instagram": regexp.MustCompile(`https?://(?:www\.)?instagram\.com/([a-zA-Z0-9_.]+)`),
		"youtube":   regexp.MustCompile(`https?://(?:www\.)?youtube\.com/(?:channel|user|c)/([a-zA-Z0-9_-]+)`),
		"github":    regexp.MustCompile(`https?://(?:www\.)?github\.com/([a-zA-Z0-9_-]+)`),
	}

	for _, page := range pageData {
		content := page.Content + " " + page.CSSContent
		for platform, pattern := range socialPatterns {
			matches := pattern.FindStringSubmatch(content)
			if len(matches) > 1 {
				socialMedia[platform] = matches[0]
			}
		}
	}

	return socialMedia
}

func (s *BrandContextService) extractContactInfo(allContent string) map[string]string {
	if allContent == "" {
		return map[string]string{}
	}

	contact := make(map[string]string)

	// Email pattern
	emailPattern := regexp.MustCompile(`[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`)
	emails := emailPattern.FindAllString(allContent, -1)
	if len(emails) > 0 {
		contact["email"] = emails[0]
	}

	// Phone pattern
	phonePattern := regexp.MustCompile(`\+?[\d\s\-\(\)]{10,}`)
	phones := phonePattern.FindAllString(allContent, -1)
	for _, phone := range phones {
		digits := regexp.MustCompile(`\d`).FindAllString(phone, -1)
		if len(digits) >= 10 {
			contact["phone"] = phone
			break
		}
	}

	return contact
}

func (s *BrandContextService) extractTechnologies(pageData map[string]PageData) []string {
	if pageData == nil {
		return []string{}
	}

	technologies := make(map[string]bool)

	techIndicators := []string{
		"react", "vue", "angular", "bootstrap", "tailwind", "jquery", "wordpress", "shopify",
		"google analytics", "gtag", "facebook pixel", "intercom", "zendesk", "stripe",
		"aws", "cloudflare", "vercel", "netlify", "heroku",
	}

	for _, page := range pageData {
		content := strings.ToLower(page.Content + " " + page.CSSContent)
		for _, tech := range techIndicators {
			if strings.Contains(content, tech) {
				technologies[tech] = true
			}
		}
	}

	result := []string{}
	for tech := range technologies {
		result = append(result, tech)
	}

	return result
}

func (s *BrandContextService) extractCompetitors(allContent string) []string {
	if allContent == "" {
		return []string{}
	}

	patterns := []*regexp.Regexp{
		regexp.MustCompile(`(?i)unlike ([A-Z][a-zA-Z]+)`),
		regexp.MustCompile(`(?i)vs\.?\s+([A-Z][a-zA-Z]+)`),
		regexp.MustCompile(`(?i)alternative to ([A-Z][a-zA-Z]+)`),
		regexp.MustCompile(`(?i)better than ([A-Z][a-zA-Z]+)`),
		regexp.MustCompile(`(?i)compared to ([A-Z][a-zA-Z]+)`),
	}

	competitors := []string{}

	for _, pattern := range patterns {
		matches := pattern.FindAllStringSubmatch(allContent, -1)
		for _, match := range matches {
			if len(match) > 1 {
				competitor := strings.TrimSpace(match[1])
				if len(competitor) > 2 && len(competitor) < 30 {
					competitors = append(competitors, competitor)
				}
			}
		}
	}

	// Remove duplicates
	seen := make(map[string]bool)
	unique := []string{}
	for _, comp := range competitors {
		if !seen[comp] && len(unique) < 5 {
			seen[comp] = true
			unique = append(unique, comp)
		}
	}

	return unique
}

func (s *BrandContextService) extractPageStructure(pageData map[string]PageData) map[string]interface{} {
	if pageData == nil {
		return map[string]interface{}{}
	}

	structure := map[string]interface{}{
		"total_pages":  len(pageData),
		"page_types":   make(map[string]int),
		"avg_headings": 0,
		"has_blog":     false,
		"has_products": false,
		"has_services": false,
	}

	totalHeadings := 0
	for _, page := range pageData {
		// Count page types
		if counts, exists := structure["page_types"].(map[string]int); exists {
			counts[page.PageType]++
		}

		totalHeadings += len(page.Headings)

		// Check for specific page types
		urlLower := strings.ToLower(page.URL)
		if strings.Contains(urlLower, "blog") || strings.Contains(urlLower, "news") {
			structure["has_blog"] = true
		}
		if strings.Contains(urlLower, "product") || strings.Contains(urlLower, "shop") {
			structure["has_products"] = true
		}
		if strings.Contains(urlLower, "service") {
			structure["has_services"] = true
		}
	}

	if len(pageData) > 0 {
		structure["avg_headings"] = totalHeadings / len(pageData)
	}

	return structure
}

func (s *BrandContextService) extractSEOData(pageData map[string]PageData) map[string]interface{} {
	if pageData == nil {
		return map[string]interface{}{}
	}

	seoData := map[string]interface{}{
		"meta_descriptions": 0,
		"meta_keywords":     0,
		"og_tags":           0,
		"twitter_tags":      0,
		"avg_title_length":  0,
	}

	totalTitleLength := 0
	metaDescCount := 0
	metaKeywordCount := 0
	ogTagCount := 0
	twitterTagCount := 0

	for _, page := range pageData {
		if page.Title != "" {
			totalTitleLength += len(page.Title)
		}

		if page.MetaData != nil {
			for key := range page.MetaData {
				keyLower := strings.ToLower(key)
				if keyLower == "description" {
					metaDescCount++
				}
				if keyLower == "keywords" {
					metaKeywordCount++
				}
				if strings.HasPrefix(keyLower, "og:") {
					ogTagCount++
				}
				if strings.HasPrefix(keyLower, "twitter:") {
					twitterTagCount++
				}
			}
		}
	}

	if len(pageData) > 0 {
		seoData["avg_title_length"] = totalTitleLength / len(pageData)
	}
	seoData["meta_descriptions"] = metaDescCount
	seoData["meta_keywords"] = metaKeywordCount
	seoData["og_tags"] = ogTagCount
	seoData["twitter_tags"] = twitterTagCount

	return seoData
}

// Keep existing methods that don't need changes
func (s *BrandContextService) discoverExistingPages(ctx context.Context, baseURL string) []string {
	parsedURL, _ := url.Parse(baseURL)
	baseHost := fmt.Sprintf("%s://%s", parsedURL.Scheme, parsedURL.Host)

	existingPages := []string{baseURL} // Always include homepage

	// Test common paths that might exist
	testPaths := []string{
		"/about", "/about-us", "/company", "/story", "/who-we-are",
		"/mission", "/vision", "/values", "/culture", "/purpose",
		"/team", "/people", "/leadership", "/founders",
		"/contact", "/contact-us", "/get-in-touch",
		"/careers", "/jobs", "/work-with-us",
		"/services", "/products", "/solutions",
		"/blog", "/news", "/press", "/media",
	}

	// Test paths concurrently but limit to avoid overwhelming the server
	var wg sync.WaitGroup
	resultChan := make(chan string, len(testPaths))
	semaphore := make(chan struct{}, 3) // Max 3 concurrent requests

	for _, path := range testPaths {
		wg.Add(1)
		go func(testPath string) {
			defer wg.Done()
			semaphore <- struct{}{}        // Acquire
			defer func() { <-semaphore }() // Release

			testURL := baseHost + testPath
			if s.pageExists(ctx, testURL) {
				resultChan <- testURL
			}
		}(path)
	}

	go func() {
		wg.Wait()
		close(resultChan)
	}()

	for page := range resultChan {
		existingPages = append(existingPages, page)
	}

	return existingPages
}

func (s *BrandContextService) pageExists(ctx context.Context, pageURL string) bool {
	req, err := http.NewRequestWithContext(ctx, "HEAD", pageURL, nil)
	if err != nil {
		return false
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; BrandBot/1.0)")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return false
	}
	defer resp.Body.Close()

	return resp.StatusCode == 200
}

// Scrape all discovered pages
func (s *BrandContextService) scrapePages(ctx context.Context, pageURLs []string) map[string]PageData {
	pageData := make(map[string]PageData)
	var mu sync.Mutex
	var wg sync.WaitGroup

	semaphore := make(chan struct{}, 5) // Max 5 concurrent scrapes

	for _, pageURL := range pageURLs {
		wg.Add(1)
		go func(url string) {
			defer wg.Done()
			semaphore <- struct{}{}        // Acquire
			defer func() { <-semaphore }() // Release

			data, err := s.scrapePage(ctx, url)
			if err != nil {
				fmt.Printf("⚠️  Failed to scrape %s: %v\n", url, err)
				return
			}

			mu.Lock()
			pageData[url] = data
			mu.Unlock()

			fmt.Printf("✅ Scraped: %s\n", url)
		}(pageURL)
	}

	wg.Wait()
	return pageData
}

type PageData struct {
	URL        string
	Title      string
	Content    string
	MetaData   map[string]string
	Headings   []string
	CSSContent string
	Images     []string
	PageType   string
}

func (s *BrandContextService) scrapePage(ctx context.Context, pageURL string) (PageData, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", pageURL, nil)
	if err != nil {
		return PageData{}, err
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return PageData{}, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return PageData{}, fmt.Errorf("HTTP %d", resp.StatusCode)
	}

	// Read with size limit
	limitedReader := io.LimitReader(resp.Body, 2*1024*1024) // 2MB limit

	doc, err := goquery.NewDocumentFromReader(limitedReader)
	if err != nil {
		return PageData{}, err
	}

	pageData := PageData{
		URL:      pageURL,
		MetaData: make(map[string]string),
	}

	// Extract title
	pageData.Title = strings.TrimSpace(doc.Find("title").First().Text())

	// Extract meta data
	doc.Find("meta").Each(func(i int, sel *goquery.Selection) {
		name, hasName := sel.Attr("name")
		property, hasProperty := sel.Attr("property")
		content, hasContent := sel.Attr("content")

		if hasContent {
			if hasName {
				pageData.MetaData[name] = content
			}
			if hasProperty {
				pageData.MetaData[property] = content
			}
		}
	})

	// Extract headings
	doc.Find("h1, h2, h3, h4, h5, h6").Each(func(i int, sel *goquery.Selection) {
		text := strings.TrimSpace(sel.Text())
		if text != "" && len(text) > 3 {
			pageData.Headings = append(pageData.Headings, text)
		}
	})

	// Extract images for logo detection
	doc.Find("img[src]").Each(func(i int, sel *goquery.Selection) {
		src, _ := sel.Attr("src")
		alt, _ := sel.Attr("alt")
		class, _ := sel.Attr("class")
		if src != "" {
			pageData.Images = append(pageData.Images, src+"|"+alt+"|"+class)
		}
	})

	// Extract CSS content
	cssContent := ""
	doc.Find("style").Each(func(i int, sel *goquery.Selection) {
		cssContent += sel.Text() + "\n"
	})

	// Also extract inline styles
	doc.Find("[style]").Each(func(i int, sel *goquery.Selection) {
		style, _ := sel.Attr("style")
		if style != "" {
			cssContent += style + "\n"
		}
	})

	pageData.CSSContent = cssContent

	// Clean and extract text content
	doc.Find("script, style, nav, footer, header").Remove()
	pageData.Content = strings.TrimSpace(doc.Find("body").Text())

	// Identify page type
	pageData.PageType = s.identifyPageType(pageURL)

	return pageData, nil
}

func (s *BrandContextService) identifyPageType(pageURL string) string {
	urlLower := strings.ToLower(pageURL)

	if strings.Contains(urlLower, "/about") || strings.Contains(urlLower, "/company") || strings.Contains(urlLower, "/story") {
		return "about"
	}
	if strings.Contains(urlLower, "/contact") {
		return "contact"
	}
	if strings.Contains(urlLower, "/team") || strings.Contains(urlLower, "/people") || strings.Contains(urlLower, "/leadership") {
		return "team"
	}
	if strings.Contains(urlLower, "/mission") || strings.Contains(urlLower, "/vision") || strings.Contains(urlLower, "/purpose") {
		return "mission"
	}
	if strings.Contains(urlLower, "/values") || strings.Contains(urlLower, "/culture") {
		return "values"
	}
	if strings.Contains(urlLower, "/services") || strings.Contains(urlLower, "/products") || strings.Contains(urlLower, "/solutions") {
		return "services"
	}

	return "home"
}
