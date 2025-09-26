package ai

import (
	"context"
	"crypto/md5"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/ifeanyidike/cenphi/internal/cache"
	"github.com/ifeanyidike/cenphi/internal/models"
)

type ContentGenerationService struct {
	aiClient     AIClient
	cacheService cache.RedisCache
}

type ContentRequest struct {
	WorkspaceID  string                            `json:"workspace_id"`
	Testimonials []models.TestimonialInput         `json:"testimonials"`
	BrandContext *models.BrandContext              `json:"brand_context"`
	ContentType  string                            `json:"content_type"`
	CustomPrompt string                            `json:"prompt,omitempty"`
	Source       models.CreateArtifactSourceParams `json:"source"`
}

type ContentResult struct {
	Content          string            `json:"content"`
	ContentType      string            `json:"content_type"`
	Metadata         map[string]string `json:"metadata"`
	WordCount        int               `json:"word_count"`
	CharCount        int               `json:"char_count"`
	Hashtags         []string          `json:"hashtags,omitempty"`
	CallToAction     string            `json:"call_to_action,omitempty"`
	Sections         []ContentSection  `json:"sections,omitempty"`
	ExecutiveSummary string            `json:"executive_summary,omitempty"`
}

type ContentSection struct {
	Title   string `json:"title"`
	Content string `json:"content"`
	Order   int    `json:"order"`
	Type    string `json:"type"` // "introduction", "analysis", "conclusion", etc.
}

func NewContentGenerationService(aiClient AIClient, cacheService cache.RedisCache) ContentGenerationService {
	return ContentGenerationService{
		aiClient:     aiClient,
		cacheService: cacheService,
	}
}

func (s ContentGenerationService) GenerateContentStream(ctx context.Context, request *ContentRequest) (<-chan StreamChunk, error) {
	systemPrompt := "You are an expert business content strategist and writer specializing in creating production-level, high-value business documents and marketing materials that drive revenue and strategic decisions."
	polishPrompt := s.buildContentPrompt(request)

	return s.aiClient.Stream(ctx, polishPrompt, systemPrompt)
}

func (s ContentGenerationService) GenerateContentSync(ctx context.Context, request *ContentRequest) (*ContentResult, error) {
	// Check cache first - include custom prompt in cache key
	var testimonialTexts []string
	for _, t := range request.Testimonials {
		testimonialTexts = append(testimonialTexts, t.Text)
	}

	cacheKey := fmt.Sprintf("content:%x", md5.Sum([]byte(strings.Join(testimonialTexts, "")+request.ContentType+request.CustomPrompt)))
	var cached ContentResult
	if err := s.cacheService.Get(ctx, cacheKey, &cached); err == nil {
		return &cached, nil
	}

	systemPrompt := "You are an expert business content strategist and writer specializing in creating production-level, high-value business documents and marketing materials that drive revenue and strategic decisions."
	contentPrompt := s.buildContentPrompt(request)

	response, err := s.aiClient.Complete(ctx, contentPrompt, systemPrompt)
	if err != nil {
		return nil, fmt.Errorf("content generation failed: %w", err)
	}

	var result ContentResult
	if err := json.Unmarshal([]byte(response), &result); err != nil {
		return nil, fmt.Errorf("failed to parse content response: %w", err)
	}

	// Calculate word and character counts
	result.WordCount = len(strings.Fields(result.Content))
	result.CharCount = len(result.Content)
	result.ContentType = request.ContentType

	s.cacheService.Set(ctx, cacheKey, result, 30*time.Minute)

	return &result, nil
}

// func (s ContentGenerationService) buildContentPrompt(request *ContentRequest) string {
// 	testimonialsJSON, _ := json.Marshal(request.Testimonials)
// 	brandJSON, _ := json.Marshal(request.BrandContext)

// 	contentSpecs := s.getContentTypeSpecs(request.ContentType)

// 	var customInstructions string
// 	if request.CustomPrompt != "" {
// 		customInstructions = fmt.Sprintf("\n\nAdditional Instructions:\n%s", request.CustomPrompt)
// 	}

// 	basePrompt := fmt.Sprintf(`Create production-level, business-grade %s content based on the provided testimonials and brand context. This content should be professional enough to present to executives, investors, or high-value prospects.%s

// Testimonials: %s

// Brand Context: %s

// Content Type: %s
// %s
// Format the entire response using proper **Markdown syntax** for headings, bullet points, and emphasis where needed.
// Return ONLY the generated content as flowing, well-formatted text. No JSON, no explanations, no additional formatting - just the complete %s content that's ready to present.

// Content Structure:
// 1. Start with a compelling executive summary
// 2. Include specific metrics and quantifiable outcomes from testimonials
// 3. Use professional business language throughout
// 4. Incorporate testimonial insights as credible evidence
// 5. Address business pain points and strategic objectives
// 6. Include actionable recommendations and next steps
// 7. End with a clear call-to-action

// Content Standards:
// - Production-ready quality suitable for executive presentation
// - Include specific metrics, data points, and quantifiable outcomes
// - Use professional business language and formatting
// - Incorporate testimonial insights as credible evidence
// - Address business pain points and strategic objectives
// - Include actionable recommendations and next steps
// - Ensure content justifies investment and drives decision-making
// - Follow industry best practices and professional standards
// - Include risk assessment and mitigation strategies where relevant%s

// Write the content so it flows naturally and can be read progressively as it generates.`,
// 		request.ContentType, customInstructions, string(testimonialsJSON), string(brandJSON), request.ContentType, contentSpecs, request.ContentType,
// 		func() string {
// 			if request.CustomPrompt != "" {
// 				return "\n- Follow the additional instructions provided above"
// 			}
// 			return ""
// 		}())

// 	return basePrompt
// }

// func (s ContentGenerationService) getContentTypeSpecs(contentType string) string {
// 	specs := map[string]string{
// 		"email": `
// PROFESSIONAL EMAIL CONTENT:
// - Length: 300-600 words, scannable format
// - Subject Line: Compelling and action-oriented
// - Executive Summary: 2-3 sentences highlighting key value proposition
// - Business Impact: Quantified ROI, revenue implications, or cost savings from testimonials
// - Social Proof: Integrated customer testimonials as credible evidence
// - Clear Call-to-Action: Specific next steps with timeline
// - Professional Tone: Confident, data-driven, respectful of executive time
// - Formatting: Bullet points for key metrics, bold for critical information
// - Email-optimized: Easy to scan, mobile-friendly, executive-ready`,

// 		"blog": `
// PROFESSIONAL BLOG POST CONTENT:
// - Length: 1200-2500 words with clear structure and SEO optimization
// - Industry Authority: Position as subject matter expert with unique insights
// - Market Analysis: Current trends and future predictions backed by customer evidence
// - Customer Stories: Integrated testimonials as real-world validation and proof points
// - Data-Driven Insights: Include specific metrics and quantified outcomes from testimonials
// - Actionable Framework: Step-by-step methodology readers can implement
// - Professional Voice: Authoritative yet accessible, avoiding jargon
// - Engagement Elements: Clear sections, bullet points, and quotable moments
// - SEO-Friendly: Structured for search engines with natural keyword integration
// - Call-to-Action: Lead generation or consultation booking`,

// 		"fundraising_talking_points": `
// FUNDRAISING PRESENTATION TALKING POINTS:
// - Length: 800-1200 words organized as clear talking points
// - Investment Thesis: Clear value proposition with market opportunity
// - Market Validation: Customer testimonials as proof of product-market fit
// - Traction Evidence: Growth metrics, customer adoption, and revenue indicators from testimonials
// - Business Model: Revenue streams and unit economics with customer examples
// - Competitive Advantage: Unique differentiators validated by customer feedback
// - Financial Projections: Growth trajectory supported by customer success patterns
// - Team Excellence: Founder credibility and domain expertise
// - Use of Funds: Specific funding requirements and milestone achievements
// - Risk Mitigation: Address potential concerns with customer-validated solutions
// - Clear Ask: Specific funding amount and timeline
// - Investor-Ready: Formatted as bullet points for easy presentation delivery`,

// 		"case_study": `
//  CASE STUDY REQUIREMENTS:
// - Length: 2000-4000 words with structured sections
// - Executive Summary (200-300 words)
// - Challenge/Problem Statement with quantified pain points
// - Solution Overview with detailed methodology
// - Implementation Timeline with milestones and resources
// - Results & Metrics with specific ROI calculations
// - Lessons Learned and Best Practices
// - Future Recommendations and Scalability Assessment
// - Include charts, graphs, and data visualization descriptions
// - Professional formatting with clear section headers
// - Credible testimonial quotes integrated throughout
// - Risk analysis and mitigation strategies covered`,

// 		"white_paper": `
// WHITE PAPER SPECIFICATIONS:
// - Length: 3000-6000 words, research-backed content
// - Abstract and Executive Summary
// - Industry analysis with market trends and data
// - Problem identification with quantified impact
// - Solution framework with detailed methodology
// - Case studies and proof points from testimonials
// - Implementation roadmap with phases and timelines
// - ROI analysis with financial projections
// - Risk assessment and mitigation strategies
// - Conclusion with strategic recommendations
// - Appendices with supporting data and resources
// - Professional citations and references`,

// 		"sales_deck": `
// EXECUTIVE SALES PRESENTATION CONTENT:
// - 15-25 slide narrative structure
// - Compelling value proposition and differentiation
// - Market opportunity and competitive landscape
// - Problem/solution fit with customer pain points
// - Product demonstration flow and key features
// - Customer success stories and testimonial integration
// - ROI calculator and business case development
// - Implementation timeline and resource requirements
// - Pricing strategy and package options
// - Risk mitigation and success guarantees
// - Next steps and decision framework
// - Appendix with technical specifications and references`,

// 		"roi_analysis": `
// ROI ANALYSIS DOCUMENT:
// - Executive summary with key financial metrics
// - Baseline cost analysis and current state assessment
// - Solution cost breakdown with implementation expenses
// - Benefit quantification with revenue impact projections
// - Payback period calculation and break-even analysis
// - 3-5 year financial projection with scenario planning
// - Risk assessment with sensitivity analysis
// - Implementation timeline with cost distribution
// - Success metrics and KPI framework
// - Comparison with alternative solutions
// - Recommendation with investment justification`,

// 		"competitive_analysis": `
// STRATEGIC COMPETITIVE ANALYSIS REPORT:
// - Market landscape overview with player positioning
// - Competitor profiles with strengths/weaknesses analysis
// - Feature comparison matrix with detailed evaluation
// - Pricing analysis with value proposition assessment
// - Customer feedback analysis including testimonial insights
// - Market share and growth trend analysis
// - Competitive threats and opportunity identification
// - Differentiation strategy recommendations
// - Go-to-market positioning suggestions
// - Win/loss analysis with strategic implications`,

// 		"business_proposal": `
// FORMAL BUSINESS PROPOSAL DOCUMENT:
// - Executive summary with key recommendations
// - Situation analysis and opportunity assessment
// - Proposed solution with detailed scope and deliverables
// - Implementation methodology and project phases
// - Resource requirements and team structure
// - Timeline with milestones and dependencies
// - Investment requirements and cost breakdown
// - Expected outcomes and success metrics
// - Risk analysis and mitigation strategies
// - Terms and conditions with legal considerations
// - Next steps and decision timeline`,

// 		"thought_leadership_article": `
// INDUSTRY THOUGHT LEADERSHIP CONTENT:
// - Length: 1500-2500 words of expert analysis
// - Industry trend analysis with market implications
// - Original insights backed by customer testimonials
// - Strategic framework or methodology development
// - Future predictions with supporting rationale
// - Actionable recommendations for business leaders
// - Case study integration with lessons learned
// - Professional tone establishing credibility
// - SEO optimization for industry visibility
// - Social sharing optimization with key quotes`,

// 		"customer_success_story": `
// COMPREHENSIVE SUCCESS NARRATIVE:
// - Detailed customer profile and business context
// - Challenge description with quantified pain points
// - Solution journey with implementation details
// - Results achieved with specific metrics and ROI
// - Customer testimonial integration throughout
// - Lessons learned and best practices identified
// - Scalability assessment and future opportunities
// - Industry-specific insights and applications
// - Credible data points and verification methods
// - Professional presentation suitable for prospects`,

// 		"market_research_report": `
// PROFESSIONAL MARKET RESEARCH DOCUMENT:
// - Market size and growth projections with data sources
// - Industry trends and driving factors analysis
// - Customer segmentation and persona development
// - Competitive landscape with market positioning
// - Technology adoption patterns and barriers
// - Regulatory environment and compliance requirements
// - Customer testimonial analysis for market validation
// - Opportunity assessment with revenue potential
// - Strategic recommendations for market entry/expansion
// - Risk analysis and market threats evaluation`,

// 		"sales_enablement_guide": `
// COMPREHENSIVE SALES RESOURCE PACKAGE:
// - Target customer profiles and qualification criteria
// - Value proposition framework with messaging guidance
// - Objection handling scripts with testimonial support
// - Competitive positioning and differentiation talking points
// - ROI calculator with business case templates
// - Customer success stories organized by use case
// - Technical specification sheets and feature comparisons
// - Implementation methodology and timeline templates
// - Pricing strategy and negotiation guidelines
// - Follow-up sequences and nurturing strategies`,

// 		"implementation_guide": `
// DETAILED IMPLEMENTATION METHODOLOGY:
// - Pre-implementation assessment and requirements gathering
// - Phase-by-phase implementation roadmap with timelines
// - Resource allocation and team structure requirements
// - Technology stack and integration specifications
// - Training and change management protocols
// - Success metrics and KPI tracking framework
// - Risk mitigation strategies and contingency planning
// - Quality assurance and testing procedures
// - Go-live checklist and validation criteria
// - Post-implementation optimization and scaling guidelines`,

// 		"quarterly_business_review": `
// EXECUTIVE QUARTERLY REVIEW DOCUMENT:
// - Performance summary with key metric achievements
// - Customer satisfaction analysis with testimonial insights
// - Revenue impact and ROI realization assessment
// - Implementation progress and milestone completion
// - Challenge identification and resolution strategies
// - Success story highlights with quantified outcomes
// - Strategic recommendations for next quarter
// - Resource optimization and efficiency improvements
// - Market opportunity analysis and expansion potential
// - Executive dashboard with visual performance indicators`,
// 	}

// 	if spec, exists := specs[contentType]; exists {
// 		return spec
// 	}

// 	return `CUSTOM CONTENT REQUIREMENTS:
// - Create professional, business-grade content
// - Include specific metrics and quantifiable outcomes
// - Follow industry best practices and standards
// - Integrate testimonial insights as supporting evidence
// - Provide actionable recommendations and next steps`
// }

func (s ContentGenerationService) buildContentPrompt(request *ContentRequest) string {
	testimonialsJSON, _ := json.Marshal(request.Testimonials)
	brandJSON, _ := json.Marshal(request.BrandContext)

	contentSpecs := s.getContentTypeSpecs(request.ContentType)

	var customInstructions string
	if request.CustomPrompt != "" {
		customInstructions = fmt.Sprintf("\n\nADDITIONAL CUSTOM INSTRUCTIONS:\n%s", request.CustomPrompt)
	}

	// REVOLUTIONARY TESTIMONIAL-FIRST PROMPT STRUCTURE
	basePrompt := fmt.Sprintf(`TESTIMONIAL ANALYSIS & CONTENT CREATION

STEP 1 - DEEP TESTIMONIAL ANALYSIS:
First, thoroughly analyze these customer testimonials to extract:
- Specific challenges customers faced before your solution
- Exact metrics, numbers, and quantified outcomes mentioned
- Unique emotional language and authentic phrasing customers use
- Specific features/benefits that customers actually valued
- Real implementation details and timeline customers experienced
- Genuine pain points and how they were resolved
- Actual ROI, cost savings, or revenue impact mentioned
- Competitive advantages customers discovered
- Unexpected benefits or outcomes customers found

TESTIMONIALS TO ANALYZE:
%s

BRAND CONTEXT:
%s

STEP 2 - CREATE TESTIMONIAL-DRIVEN %s:
Using ONLY the insights from the testimonial analysis above, create compelling %s content that:

AUTHENTICITY REQUIREMENTS:
✓ Ground every claim in actual customer testimonial evidence
✓ Use direct customer quotes and specific metrics from testimonials
✓ Reference real customer challenges and outcomes mentioned in testimonials
✓ Avoid generic business language - use authentic customer language
✓ Include specific customer stories and implementation details from testimonials
✓ Highlight unique differentiators that customers actually experienced

BUSINESS-GRADE QUALITY:
✓ Professional presentation suitable for executives and decision-makers
✓ Quantified ROI and business impact directly from customer testimonials
✓ Strategic insights derived from customer success patterns
✓ Actionable recommendations based on customer implementation experiences
✓ Risk mitigation strategies proven by customer experiences

%s

CRITICAL SUCCESS FACTORS:
- Every paragraph should connect back to specific testimonial insights
- Use actual customer metrics and outcomes as proof points
- Maintain authentic customer voice while elevating to business-grade presentation
- Focus on unique value propositions that customers actually experienced
- Avoid industry jargon unless customers specifically mentioned it
- Create content so compelling that prospects will want to become similar success stories%s

FORMATTING: Use proper **Markdown syntax** with headers, bullet points, and emphasis.
OUTPUT: Return ONLY the final %s content - no analysis sections, no explanations.`,
		string(testimonialsJSON), string(brandJSON), request.ContentType, request.ContentType,
		contentSpecs, customInstructions, request.ContentType)

	return basePrompt
}

func (s ContentGenerationService) getContentTypeSpecs(contentType string) string {
	specs := map[string]string{
		"email": `
EMAIL CONTENT SPECIFICATIONS:
- CUSTOMER-DRIVEN SUBJECT: Use actual customer outcomes or compelling testimonial insights
- TESTIMONIAL HOOK: Open with most impactful customer quote or metric
- CUSTOMER SUCCESS PATTERN: Show 2-3 similar customer outcomes from testimonials  
- SOCIAL PROOF INTEGRATION: Weave customer quotes naturally throughout
- QUANTIFIED RESULTS: Use specific numbers and ROI from customer testimonials
- AUTHENTIC PAIN POINTS: Address real challenges customers mentioned facing
- PROVEN SOLUTION PATH: Outline approach based on successful customer implementations
- CREDIBLE CALL-TO-ACTION: Invite prospect to achieve similar customer outcomes
- LENGTH: 300-500 words maximum for executive readability
- TONE: Confident but authentic, using customer language patterns`,

		"blog": `
BLOG POST SPECIFICATIONS:
- CUSTOMER INSIGHT HEADLINE: Create compelling title based on testimonial revelations
- TESTIMONIAL-LED NARRATIVE: Structure around customer journey and outcomes
- AUTHENTIC CUSTOMER VOICES: Include 3-5 direct customer quotes with attribution
- REAL-WORLD APPLICATIONS: Show specific use cases mentioned by customers
- QUANTIFIED IMPACT SECTION: Dedicated section highlighting metrics from testimonials
- CUSTOMER CHALLENGE ANALYSIS: Deep dive into problems customers actually faced
- PROVEN METHODOLOGY: Framework derived from successful customer implementations
- INDUSTRY-SPECIFIC INSIGHTS: Tailor to sectors/roles mentioned in testimonials
- SOCIAL PROOF THROUGHOUT: Integrate customer evidence in every major section
- LENGTH: 1200-1800 words with customer stories as primary content structure
- SEO INTEGRATION: Use keywords naturally from customer testimonials`,

		"case_study": `
CASE STUDY SPECIFICATIONS:
- CUSTOMER-CENTRIC STRUCTURE: Build entire narrative around specific customer testimonials
- EXECUTIVE SUMMARY: Leading with most compelling customer outcomes and metrics
- CHALLENGE DEEP-DIVE: Detailed analysis of problems customers actually described
- CUSTOMER VOICE INTEGRATION: Include verbatim customer quotes describing their experience
- SOLUTION WALKTHROUGH: Implementation steps exactly as customers experienced them
- METRICS & OUTCOMES: Comprehensive quantified results directly from customer testimonials
- LESSONS LEARNED: Insights from customer feedback on what worked best
- SCALABILITY PROOF: Evidence from testimonials about broader impact potential
- COMPETITIVE ADVANTAGE: Differentiation factors customers specifically mentioned
- IMPLEMENTATION TIMELINE: Actual timeframes and milestones from customer experiences
- VISUAL ELEMENTS: Suggest charts/graphics based on customer-provided metrics
- LENGTH: 1500-2500 words focused on customer narrative rather than generic frameworks`,

		"white_paper": `
WHITE PAPER SPECIFICATIONS:
- CUSTOMER-VALIDATED THESIS: Central argument proven by testimonial patterns across customers
- MARKET REALITY CHECK: Industry analysis grounded in customer experiences and challenges
- TESTIMONIAL-BASED RESEARCH: Use customer outcomes as primary research data
- CUSTOMER JOURNEY MAPPING: Detailed analysis of paths taken by successful customers
- PROVEN SOLUTION FRAMEWORK: Methodology derived from successful customer implementations
- QUANTIFIED BUSINESS CASE: ROI analysis using actual customer metrics and outcomes
- RISK MITIGATION STRATEGIES: Address concerns based on customer implementation experiences
- INDUSTRY BENCHMARKING: Compare outcomes across different customer sectors/sizes
- SCALABILITY ANALYSIS: Growth potential evidenced by customer expansion stories
- FUTURE ROADMAP: Recommendations based on customer feedback and requests
- CREDIBILITY FACTORS: Academic rigor supported by real-world customer validation
- LENGTH: 3000-4000 words with customer testimonials as foundational evidence`,

		"fundraising_talking_points": `
FUNDRAISING TALKING POINTS:
- MARKET VALIDATION PROOF: Customer adoption patterns and growth metrics from testimonials
- PRODUCT-MARKET FIT EVIDENCE: Specific customer outcomes proving demand
- TRACTION DEMONSTRATION: Customer acquisition timeline and expansion from testimonials
- REVENUE VALIDATION: Customer payment behavior and expansion revenue from testimonials
- CUSTOMER LOVE INDICATORS: Net promoter evidence and customer retention from testimonials
- COMPETITIVE DIFFERENTIATION: Unique advantages customers specifically experienced vs competitors
- SCALABILITY EVIDENCE: Customer growth patterns and implementation speed from testimonials
- TEAM VALIDATION: Customer feedback on team expertise and execution capability
- MARKET OPPORTUNITY: Size and growth potential evidenced by customer demand patterns
- USE OF FUNDS JUSTIFICATION: Investment needs based on customer scaling requirements
- INVESTOR-READY FORMATTING: Bullet points with customer metrics and quotes as proof points
- LENGTH: 800-1000 words structured as presentation talking points`,

		"sales_enablement_guide": `
SALES ENABLEMENT GUIDE:
- CUSTOMER PERSONA PROFILES: Built from actual testimonial patterns and customer characteristics
- VALUE PROPOSITION PROOF: Messaging framework grounded in customer testimonial language
- OBJECTION HANDLING SCRIPTS: Address concerns using actual customer experience responses
- CUSTOMER SUCCESS STORIES: Organized by use case, role, and industry from testimonials
- COMPETITIVE POSITIONING: Differentiation talking points from customer competitive experiences
- ROI CALCULATOR: Based on actual customer metrics and implementation costs/benefits
- CUSTOMER CONVERSATION STARTERS: Questions and topics derived from successful customer discussions
- TESTIMONIAL ASSET LIBRARY: Organized quotes and stories for different sales scenarios
- IMPLEMENTATION ROADMAP: Timeline and process based on successful customer onboarding
- SUCCESS METRICS FRAMEWORK: KPIs and benchmarks derived from customer achievement patterns
- CUSTOMER REFERENCES: Strategic use of testimonials for different prospect types
- LENGTH: Comprehensive guide with customer evidence supporting every sales technique`,

		"thought_leadership_article": `
THOUGHT LEADERSHIP ARTICLE:
- CUSTOMER-DRIVEN INSIGHTS: Industry predictions based on customer experience patterns
- TESTIMONIAL-BACKED AUTHORITY: Establish expertise through customer success facilitation
- TREND ANALYSIS FROM CUSTOMERS: Market movements evidenced by customer behavior changes
- CUSTOMER SUCCESS METHODOLOGY: Framework derived from successful customer implementations
- INDUSTRY TRANSFORMATION PROOF: Show change through customer adoption and outcomes
- BEST PRACTICE DERIVATION: Guidelines developed from customer success patterns
- FUTURE PREDICTIONS: Market direction based on customer needs and feedback evolution
- STRATEGIC RECOMMENDATIONS: Actionable advice proven by customer implementation success
- CUSTOMER VOICE AMPLIFICATION: Elevate customer insights while establishing thought leadership
- CREDIBILITY FOUNDATION: Build authority on proven customer outcome facilitation
- LENGTH: 1500-2000 words positioning as expert through customer success enablement`,

		"customer_success_story": `
CUSTOMER SUCCESS STORY:
- AUTHENTIC CUSTOMER NARRATIVE: Tell story exactly as customer experienced it
- CUSTOMER VOICE PRIMARY: Structure around direct customer quotes and perspectives
- CHALLENGE DEEP-DIVE: Detailed exploration of customer's original situation and pain points
- JOURNEY DOCUMENTATION: Step-by-step process as customer experienced implementation
- OUTCOME CELEBRATION: Comprehensive results using customer's own metrics and language
- LESSONS INTEGRATION: What customer learned and would recommend to others
- RELATIONSHIP FOCUS: Highlight partnership aspects and ongoing customer value
- PEER INFLUENCE DESIGN: Create story that resonates with similar prospects
- AUTHENTICITY MAINTENANCE: Keep customer's genuine voice and avoid over-polishing
- QUANTIFIED IMPACT: Specific numbers and metrics as provided by customer
- SCALABILITY INDICATORS: Evidence of continued success and expansion potential
- LENGTH: 1000-1500 words maintaining authentic customer narrative throughout`,
	}

	if spec, exists := specs[contentType]; exists {
		return spec
	}

	return `CUSTOM TESTIMONIAL-DRIVEN CONTENT:
- CUSTOMER INSIGHT FOUNDATION: Build content around actual customer experiences and outcomes
- TESTIMONIAL EVIDENCE REQUIRED: Every claim must be supported by customer testimonial data
- AUTHENTIC CUSTOMER VOICE: Use genuine customer language and phrasing patterns
- QUANTIFIED CUSTOMER OUTCOMES: Include specific metrics and results from testimonials
- CUSTOMER SUCCESS PATTERNS: Identify and highlight common themes across customer experiences
- PROVEN VALUE DEMONSTRATION: Show ROI and benefits exactly as customers experienced them
- CUSTOMER-VALIDATED MESSAGING: Use language and positioning that resonates with customer testimonials`
}
