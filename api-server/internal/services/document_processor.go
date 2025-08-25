// ============================================================================
// COMPLETE DOC FILE EXTRACTION IMPLEMENTATION
// Add this to your file_processor.go
// ============================================================================

package services

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/xml"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"time"
	"unicode"
	"unicode/utf8"

	"github.com/google/uuid"
	"github.com/ledongthuc/pdf"
	"go.uber.org/zap"
)

type DocumentProcessor struct {
	logger *zap.Logger
}

func NewDocumentProcessor(logger *zap.Logger) *DocumentProcessor {
	return &DocumentProcessor{logger: logger}
}

func (fp *DocumentProcessor) ProcessDocument(ctx context.Context, file multipart.File, header *multipart.FileHeader) (string, error) {
	// Reset file pointer to beginning
	file.Seek(0, 0)

	contentType := header.Header.Get("Content-Type")
	if contentType == "" {
		contentType = guessContentTypeFromFilename(header.Filename)
	}

	fp.logger.Info("Processing document",
		zap.String("filename", header.Filename),
		zap.String("content_type", contentType))

	return fp.extractTextFromDocument(file, contentType, header.Filename)
}

// ProcessDocumentFromReader extracts text from an io.Reader (for Google Drive downloads)
func (fp *DocumentProcessor) ProcessDocumentFromReader(reader io.Reader, mimeType, filename string) (string, error) {
	fp.logger.Info("Processing document from reader",
		zap.String("filename", filename),
		zap.String("mime_type", mimeType))

	return fp.extractTextFromDocument(reader, mimeType, filename)
}

// extractTextFromDocument is the core text extraction method
func (fp *DocumentProcessor) extractTextFromDocument(reader io.Reader, mimeType string, filename string) (string, error) {
	switch {
	case mimeType == "application/pdf":
		return fp.extractFromPDF(reader)

	case strings.Contains(mimeType, "officedocument.wordprocessingml.document"):
		return fp.extractFromDOCX(reader)

	case strings.Contains(mimeType, "msword"):
		return fp.extractFromDOC(reader)

	case mimeType == "text/plain" || strings.HasPrefix(mimeType, "text/"):
		return fp.extractFromText(reader)

	case strings.Contains(mimeType, "rtf"):
		return fp.extractFromRTF(reader)

	default:
		fp.logger.Warn("Unsupported document type, attempting plain text extraction",
			zap.String("mime_type", mimeType),
			zap.String("filename", filename))
		return fp.extractFromText(reader)
	}
}

// extractFromPDF extracts text from PDF documents
func (fp *DocumentProcessor) extractFromPDF(reader io.Reader) (string, error) {
	// Read all data into memory
	data, err := io.ReadAll(reader)
	if err != nil {
		return "", fmt.Errorf("failed to read PDF data: %w", err)
	}

	if len(data) == 0 {
		return "", fmt.Errorf("PDF file is empty")
	}

	// Parse PDF
	pdfReader, err := pdf.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return "", fmt.Errorf("failed to parse PDF: %w", err)
	}

	var textContent strings.Builder
	totalPages := pdfReader.NumPage()

	fp.logger.Debug("Extracting text from PDF", zap.Int("total_pages", totalPages))

	// Build font map for text extraction
	fontMap := make(map[string]*pdf.Font)

	// Extract text from each page
	for i := 1; i <= totalPages; i++ {
		page := pdfReader.Page(i)
		if page.V.IsNull() {
			fp.logger.Debug("Skipping null page", zap.Int("page", i))
			continue
		}

		// FIXED: Pass the font map to GetPlainText
		text, err := page.GetPlainText(fontMap)
		if err != nil {
			fp.logger.Warn("Failed to extract text from page",
				zap.Int("page", i),
				zap.Error(err))
			continue
		}

		cleanText := cleanAndValidateText(text)
		if cleanText != "" {
			textContent.WriteString(cleanText)
			textContent.WriteString("\n\n") // Separate pages
		}
	}

	result := strings.TrimSpace(textContent.String())
	if result == "" {
		return "", fmt.Errorf("no text content found in PDF")
	}

	fp.logger.Info("Successfully extracted text from PDF",
		zap.Int("pages", totalPages),
		zap.Int("text_length", len(result)))

	return result, nil
}

// extractFromDOCX extracts text from DOCX documents
func (fp *DocumentProcessor) extractFromDOCX(reader io.Reader) (string, error) {
	// Read all data
	data, err := io.ReadAll(reader)
	if err != nil {
		return "", fmt.Errorf("failed to read DOCX data: %w", err)
	}

	// Open as ZIP archive
	zipReader, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return "", fmt.Errorf("failed to open DOCX as ZIP: %w", err)
	}

	// Find document.xml file
	var documentXML *zip.File
	for _, file := range zipReader.File {
		if file.Name == "word/document.xml" {
			documentXML = file
			break
		}
	}

	if documentXML == nil {
		return "", fmt.Errorf("document.xml not found in DOCX file")
	}

	// Read document.xml
	rc, err := documentXML.Open()
	if err != nil {
		return "", fmt.Errorf("failed to open document.xml: %w", err)
	}
	defer rc.Close()

	xmlData, err := io.ReadAll(rc)
	if err != nil {
		return "", fmt.Errorf("failed to read document.xml: %w", err)
	}

	// Parse XML and extract text
	text, err := fp.parseWordDocumentXML(xmlData)
	if err != nil {
		return "", fmt.Errorf("failed to parse document XML: %w", err)
	}

	result := cleanAndValidateText(text)
	if result == "" {
		return "", fmt.Errorf("no text content found in DOCX")
	}

	fp.logger.Info("Successfully extracted text from DOCX",
		zap.Int("text_length", len(result)))

	return result, nil
}

// parseWordDocumentXML parses Word document XML and extracts text
func (fp *DocumentProcessor) parseWordDocumentXML(xmlData []byte) (string, error) {
	// Simple XML parser for Word documents
	type Text struct {
		Content string `xml:",chardata"`
	}

	type Run struct {
		Text []Text `xml:"t"`
	}

	type Paragraph struct {
		Runs []Run `xml:"r"`
	}

	type Body struct {
		Paragraphs []Paragraph `xml:"p"`
	}

	type Document struct {
		Body Body `xml:"body"`
	}

	var doc Document
	err := xml.Unmarshal(xmlData, &doc)
	if err != nil {
		return "", fmt.Errorf("failed to unmarshal XML: %w", err)
	}

	var textContent strings.Builder

	for _, paragraph := range doc.Body.Paragraphs {
		var paragraphText strings.Builder

		for _, run := range paragraph.Runs {
			for _, text := range run.Text {
				paragraphText.WriteString(text.Content)
			}
		}

		if paragraphText.Len() > 0 {
			textContent.WriteString(strings.TrimSpace(paragraphText.String()))
			textContent.WriteString("\n\n")
		}
	}

	return textContent.String(), nil
}

// extractFromDOC handles legacy .doc files (basic implementation)

// extractFromRTF handles RTF (Rich Text Format) files
func (fp *DocumentProcessor) extractFromRTF(reader io.Reader) (string, error) {
	data, err := io.ReadAll(reader)
	if err != nil {
		return "", fmt.Errorf("failed to read RTF data: %w", err)
	}

	content := string(data)

	// Basic RTF text extraction (removes RTF control codes)
	text := fp.stripRTFCodes(content)
	result := cleanAndValidateText(text)

	if result == "" {
		return "", fmt.Errorf("no text content found in RTF")
	}

	return result, nil
}

// stripRTFCodes removes RTF formatting codes to extract plain text
func (fp *DocumentProcessor) stripRTFCodes(rtfContent string) string {
	// Remove RTF control words and groups
	re := regexp.MustCompile(`\\[a-zA-Z]+\d*\s*|\{|\}|\\['"][0-9a-fA-F]{2}`)
	text := re.ReplaceAllString(rtfContent, " ")

	// Clean up multiple spaces and newlines
	re = regexp.MustCompile(`\s+`)
	text = re.ReplaceAllString(text, " ")

	return strings.TrimSpace(text)
}

// extractFromText handles plain text files with encoding validation
func (fp *DocumentProcessor) extractFromText(reader io.Reader) (string, error) {
	content, err := io.ReadAll(reader)
	if err != nil {
		return "", fmt.Errorf("failed to read text content: %w", err)
	}

	if len(content) == 0 {
		return "", fmt.Errorf("text file is empty")
	}

	// Convert to string and validate/clean UTF-8
	text := string(content)
	result := cleanAndValidateText(text)

	if result == "" {
		return "", fmt.Errorf("no valid text content found")
	}

	fp.logger.Info("Successfully extracted text from plain text file",
		zap.Int("text_length", len(result)))

	return result, nil
}

// Helper functions

// cleanAndValidateText cleans and validates UTF-8 text
func cleanAndValidateText(text string) string {
	// Remove null bytes and other problematic characters
	text = strings.ReplaceAll(text, "\x00", "")
	text = strings.ReplaceAll(text, "\ufffd", "") // Remove replacement characters

	// Remove all control characters (0x00-0x1F except \t, \n, \r)
	controlCharRegex := regexp.MustCompile(`[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]`)
	text = controlCharRegex.ReplaceAllString(text, "")

	// Ensure valid UTF-8
	if !utf8.ValidString(text) {
		// Convert invalid UTF-8 to valid UTF-8
		text = strings.ToValidUTF8(text, "")
	}

	// Clean up excessive whitespace while preserving structure
	lines := strings.Split(text, "\n")
	var cleanLines []string

	for _, line := range lines {
		cleanLine := strings.TrimSpace(line)
		cleanLines = append(cleanLines, cleanLine)
	}

	// Join and clean up multiple empty lines
	result := strings.Join(cleanLines, "\n")
	re := regexp.MustCompile(`\n\s*\n\s*\n`)
	result = re.ReplaceAllString(result, "\n\n")

	return strings.TrimSpace(result)
}

// guessContentTypeFromFilename guesses content type based on file extension
func guessContentTypeFromFilename(filename string) string {
	filename = strings.ToLower(filename)

	switch {
	case strings.HasSuffix(filename, ".pdf"):
		return "application/pdf"
	case strings.HasSuffix(filename, ".docx"):
		return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	case strings.HasSuffix(filename, ".doc"):
		return "application/msword"
	case strings.HasSuffix(filename, ".rtf"):
		return "application/rtf"
	case strings.HasSuffix(filename, ".txt"):
		return "text/plain"
	case strings.HasSuffix(filename, ".html") || strings.HasSuffix(filename, ".htm"):
		return "text/html"
	default:
		return "application/octet-stream"
	}
}

func isValidTestimonialContent(content string) (bool, string) {
	content = strings.TrimSpace(content)

	if len(content) < 20 {
		return false, "content too short (minimum 20 characters)"
	}

	if len(content) > 50000 {
		return false, "content too long (maximum 50,000 characters)"
	}

	// Count different character types
	var (
		alphaCount  = 0
		digitCount  = 0
		punctCount  = 0
		spaceCount  = 0
		symbolCount = 0
		totalChars  = len(content)
	)

	for _, r := range content {
		switch {
		case unicode.IsLetter(r):
			alphaCount++
		case unicode.IsDigit(r):
			digitCount++
		case unicode.IsPunct(r):
			punctCount++
		case unicode.IsSpace(r):
			spaceCount++
		default:
			symbolCount++
		}
	}

	// Calculate ratios
	alphaRatio := float64(alphaCount) / float64(totalChars)
	punctRatio := float64(punctCount) / float64(totalChars)
	symbolRatio := float64(symbolCount) / float64(totalChars)

	// Quality checks
	if alphaRatio < 0.4 {
		return false, fmt.Sprintf("too few letters (%.1f%%, need at least 40%%)", alphaRatio*100)
	}

	if punctRatio > 0.3 {
		return false, fmt.Sprintf("too much punctuation (%.1f%%, max 30%%)", punctRatio*100)
	}

	if symbolRatio > 0.1 {
		return false, fmt.Sprintf("too many symbols (%.1f%%, max 10%%)", symbolRatio*100)
	}

	// Check for actual words (sequences of letters)
	wordPattern := regexp.MustCompile(`[a-zA-Z]{3,}`)
	words := wordPattern.FindAllString(content, -1)

	if len(words) < 5 {
		return false, fmt.Sprintf("too few words found (%d, need at least 5)", len(words))
	}

	// Check average word length
	totalWordChars := 0
	for _, word := range words {
		totalWordChars += len(word)
	}
	avgWordLength := float64(totalWordChars) / float64(len(words))

	if avgWordLength < 3.0 {
		return false, fmt.Sprintf("average word length too short (%.1f, need at least 3.0)", avgWordLength)
	}

	// Check for common English words (basic heuristic)
	commonWords := []string{"the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by"}
	commonWordCount := 0
	contentLower := strings.ToLower(content)

	for _, word := range commonWords {
		if strings.Contains(contentLower, " "+word+" ") ||
			strings.HasPrefix(contentLower, word+" ") ||
			strings.HasSuffix(contentLower, " "+word) {
			commonWordCount++
		}
	}

	// Should have at least 2 common English words for meaningful text
	if commonWordCount < 2 {
		return false, fmt.Sprintf("too few common words (%d, need at least 2)", commonWordCount)
	}

	// Check for repetitive patterns (like "######" or "......")
	repetitivePatterns := []*regexp.Regexp{
		regexp.MustCompile(`[!]{6,}`),   // 6+ exclamation marks
		regexp.MustCompile(`[.]{6,}`),   // 6+ periods
		regexp.MustCompile(`[#]{6,}`),   // 6+ hash symbols
		regexp.MustCompile(`[$]{6,}`),   // 6+ dollar signs
		regexp.MustCompile(`[%]{6,}`),   // 6+ percent signs
		regexp.MustCompile(`[&]{6,}`),   // 6+ ampersands
		regexp.MustCompile(`[*]{6,}`),   // 6+ asterisks
		regexp.MustCompile(`[-]{6,}`),   // 6+ dashes
		regexp.MustCompile(`[=]{6,}`),   // 6+ equals signs
		regexp.MustCompile(`[\s]{10,}`), // 10+ consecutive spaces
	}

	for _, pattern := range repetitivePatterns {
		if pattern.MatchString(content) {
			return false, "contains repetitive character patterns"
		}
	}

	// All checks passed
	return true, "content is valid"
}

// ValidateDocumentContent validates that extracted content is suitable for testimonials
func (fp *DocumentProcessor) ValidateDocumentContent(content string) error {
	// Basic validation
	if content == "" {
		return fmt.Errorf("document content is empty")
	}

	// Ensure it's valid UTF-8
	if !utf8.ValidString(content) {
		return fmt.Errorf("document contains invalid UTF-8 characters")
	}

	// Quality validation
	isValid, reason := isValidTestimonialContent(content)
	if !isValid {
		return fmt.Errorf("document content quality insufficient: %s", reason)
	}

	return nil
}

// ExtractDocumentMetadata extracts metadata from document content
func (fp *DocumentProcessor) ExtractDocumentMetadata(content string) map[string]interface{} {
	metadata := make(map[string]interface{})

	// Basic content analysis
	metadata["character_count"] = len(content)
	metadata["word_count"] = len(strings.Fields(content))
	metadata["line_count"] = len(strings.Split(content, "\n"))

	// Language detection (basic)
	metadata["language"] = "unknown" // You can implement language detection here

	// Content type analysis
	if strings.Contains(strings.ToLower(content), "testimonial") ||
		strings.Contains(strings.ToLower(content), "review") ||
		strings.Contains(strings.ToLower(content), "feedback") {
		metadata["likely_testimonial"] = true
	} else {
		metadata["likely_testimonial"] = false
	}

	return metadata
}

func (fp *DocumentProcessor) extractFromDOC(reader io.Reader) (string, error) {
	// Read all data into memory
	data, err := io.ReadAll(reader)
	if err != nil {
		return "", fmt.Errorf("failed to read DOC data: %w", err)
	}

	if len(data) == 0 {
		return "", fmt.Errorf("DOC file is empty")
	}

	// Try multiple extraction methods in order of preference
	methods := []struct {
		name string
		fn   func([]byte) (string, error)
	}{
		{"antiword", fp.extractDOCWithAntiword},
		{"catdoc", fp.extractDOCWithCatdoc},
		{"libreoffice", fp.extractDOCWithLibreOffice},
		{"textutil", fp.extractDOCWithTextutil}, // macOS only
		{"basic_parser", fp.extractDOCBasicParser},
	}

	var lastErr error
	for _, method := range methods {
		fp.logger.Debug("Trying DOC extraction method", zap.String("method", method.name))

		text, err := method.fn(data)
		if err == nil && strings.TrimSpace(text) != "" {
			fp.logger.Info("Successfully extracted text from DOC",
				zap.String("method", method.name),
				zap.Int("text_length", len(text)))
			return cleanAndValidateText(text), nil
		}

		if err != nil {
			fp.logger.Debug("DOC extraction method failed",
				zap.String("method", method.name),
				zap.Error(err))
			lastErr = err
		}
	}

	return "", fmt.Errorf("all DOC extraction methods failed, last error: %w", lastErr)
}

// extractDOCWithAntiword uses the antiword command-line tool
func (fp *DocumentProcessor) extractDOCWithAntiword(data []byte) (string, error) {
	// Check if antiword is available
	if !fp.isCommandAvailable("antiword") {
		return "", fmt.Errorf("antiword command not available")
	}

	// Create temporary file
	tempFile, err := fp.createTempFile(data, ".doc")
	if err != nil {
		return "", fmt.Errorf("failed to create temp file: %w", err)
	}
	defer os.Remove(tempFile)

	// Run antiword
	cmd := exec.Command("antiword", tempFile)
	output, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("antiword execution failed: %w", err)
	}

	return string(output), nil
}

// extractDOCWithCatdoc uses the catdoc command-line tool
func (fp *DocumentProcessor) extractDOCWithCatdoc(data []byte) (string, error) {
	// Check if catdoc is available
	if !fp.isCommandAvailable("catdoc") {
		return "", fmt.Errorf("catdoc command not available")
	}

	// Create temporary file
	tempFile, err := fp.createTempFile(data, ".doc")
	if err != nil {
		return "", fmt.Errorf("failed to create temp file: %w", err)
	}
	defer os.Remove(tempFile)

	// Run catdoc
	cmd := exec.Command("catdoc", tempFile)
	output, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("catdoc execution failed: %w", err)
	}

	return string(output), nil
}

// extractDOCWithLibreOffice uses LibreOffice to convert DOC to text
func (fp *DocumentProcessor) extractDOCWithLibreOffice(data []byte) (string, error) {
	// Check if libreoffice is available
	if !fp.isCommandAvailable("libreoffice") {
		return "", fmt.Errorf("libreoffice command not available")
	}

	// Create temporary directory for conversion
	tempDir, err := os.MkdirTemp("", "doc_conversion_*")
	if err != nil {
		return "", fmt.Errorf("failed to create temp dir: %w", err)
	}
	defer os.RemoveAll(tempDir)

	// Create temporary DOC file
	docFile := filepath.Join(tempDir, "document.doc")
	err = os.WriteFile(docFile, data, 0644)
	if err != nil {
		return "", fmt.Errorf("failed to write temp DOC file: %w", err)
	}

	// Convert to text using LibreOffice
	cmd := exec.Command("libreoffice", "--headless", "--convert-to", "txt", "--outdir", tempDir, docFile)
	cmd.Env = append(os.Environ(), "HOME="+tempDir) // Avoid LibreOffice user profile issues

	// Set timeout for the conversion
	timeout := 30 * time.Second
	done := make(chan error, 1)
	go func() {
		done <- cmd.Run()
	}()

	select {
	case err := <-done:
		if err != nil {
			return "", fmt.Errorf("libreoffice conversion failed: %w", err)
		}
	case <-time.After(timeout):
		cmd.Process.Kill()
		return "", fmt.Errorf("libreoffice conversion timed out")
	}

	// Read the converted text file
	txtFile := filepath.Join(tempDir, "document.txt")
	textData, err := os.ReadFile(txtFile)
	if err != nil {
		return "", fmt.Errorf("failed to read converted text file: %w", err)
	}

	return string(textData), nil
}

// extractDOCWithTextutil uses macOS textutil command (macOS only)
func (fp *DocumentProcessor) extractDOCWithTextutil(data []byte) (string, error) {
	// Check if textutil is available (macOS only)
	if !fp.isCommandAvailable("textutil") {
		return "", fmt.Errorf("textutil command not available")
	}

	// Create temporary file
	tempFile, err := fp.createTempFile(data, ".doc")
	if err != nil {
		return "", fmt.Errorf("failed to create temp file: %w", err)
	}
	defer os.Remove(tempFile)

	// Run textutil
	cmd := exec.Command("textutil", "-convert", "txt", "-stdout", tempFile)
	output, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("textutil execution failed: %w", err)
	}

	return string(output), nil
}

// extractDOCBasicParser attempts basic text extraction from DOC binary format
func (fp *DocumentProcessor) extractDOCBasicParser(data []byte) (string, error) {
	// This is a very basic implementation that tries to extract readable text
	// from the binary DOC format. It's not perfect but can work for simple documents.

	if len(data) < 512 {
		return "", fmt.Errorf("DOC file too small to be valid")
	}

	// Check if it's actually a DOC file by looking for OLE signature
	if !bytes.HasPrefix(data, []byte{0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1}) {
		return "", fmt.Errorf("not a valid DOC file (missing OLE signature)")
	}

	// Extract text using a simple approach: find printable ASCII sequences
	var textParts []string
	var currentText strings.Builder

	for i := 0; i < len(data); i++ {
		b := data[i]

		// Check if byte is printable ASCII (excluding control characters)
		if (b >= 32 && b <= 126) || b == 9 || b == 10 || b == 13 {
			currentText.WriteByte(b)
		} else {
			// End of text sequence
			if currentText.Len() > 3 { // Only consider sequences longer than 3 characters
				text := strings.TrimSpace(currentText.String())
				if len(text) > 3 && fp.looksLikeText(text) {
					textParts = append(textParts, text)
				}
			}
			currentText.Reset()
		}
	}

	// Add final text if any
	if currentText.Len() > 3 {
		text := strings.TrimSpace(currentText.String())
		if len(text) > 3 && fp.looksLikeText(text) {
			textParts = append(textParts, text)
		}
	}

	if len(textParts) == 0 {
		return "", fmt.Errorf("no readable text found in DOC file")
	}

	// Join text parts and clean up
	result := strings.Join(textParts, " ")
	result = fp.cleanExtractedDOCText(result)

	if len(strings.TrimSpace(result)) < 10 {
		return "", fmt.Errorf("extracted text too short to be meaningful")
	}

	fp.logger.Info("Extracted text using basic DOC parser",
		zap.Int("text_parts", len(textParts)),
		zap.Int("final_length", len(result)))

	return result, nil
}

// Helper functions for DOC extraction

// isCommandAvailable checks if a command-line tool is available
func (fp *DocumentProcessor) isCommandAvailable(command string) bool {
	_, err := exec.LookPath(command)
	return err == nil
}

// createTempFile creates a temporary file with the given data
func (fp *DocumentProcessor) createTempFile(data []byte, extension string) (string, error) {
	tempFile := filepath.Join(os.TempDir(), fmt.Sprintf("doc_extract_%s%s", uuid.New().String(), extension))
	err := os.WriteFile(tempFile, data, 0644)
	if err != nil {
		return "", err
	}
	return tempFile, nil
}

// looksLikeText uses heuristics to determine if a string looks like readable text
func (fp *DocumentProcessor) looksLikeText(text string) bool {
	// Filter out strings that are likely not meaningful text
	text = strings.TrimSpace(text)

	// Too short
	if len(text) < 4 {
		return false
	}

	// Contains too many non-alphabetic characters
	alphaCount := 0
	for _, r := range text {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') {
			alphaCount++
		}
	}

	// At least 30% should be alphabetic
	if float64(alphaCount)/float64(len(text)) < 0.3 {
		return false
	}

	// Common DOC metadata/formatting strings to filter out
	blacklist := []string{
		"Microsoft", "Word", "Normal", "Times", "Arial", "Calibri",
		"Document", "Page", "Header", "Footer", "Table", "Cell",
		"_Toc", "_Ref", "HYPERLINK", "STYLEREF", "FORMTEXT",
	}

	upperText := strings.ToUpper(text)
	for _, blacklisted := range blacklist {
		if strings.Contains(upperText, strings.ToUpper(blacklisted)) {
			return false
		}
	}

	return true
}

// cleanExtractedDOCText cleans up text extracted from DOC files
func (fp *DocumentProcessor) cleanExtractedDOCText(text string) string {
	// Remove common DOC artifacts
	text = strings.ReplaceAll(text, "\x00", "")
	text = strings.ReplaceAll(text, "\x01", "")
	text = strings.ReplaceAll(text, "\x02", "")
	text = strings.ReplaceAll(text, "\x03", "")
	text = strings.ReplaceAll(text, "\x04", "")
	text = strings.ReplaceAll(text, "\x05", "")
	text = strings.ReplaceAll(text, "\x06", "")
	text = strings.ReplaceAll(text, "\x07", "")
	text = strings.ReplaceAll(text, "\x08", "")

	// Clean up excessive whitespace
	text = strings.ReplaceAll(text, "\r\n", "\n")
	text = strings.ReplaceAll(text, "\r", "\n")

	// Remove multiple consecutive spaces
	for strings.Contains(text, "  ") {
		text = strings.ReplaceAll(text, "  ", " ")
	}

	// Remove multiple consecutive newlines
	for strings.Contains(text, "\n\n\n") {
		text = strings.ReplaceAll(text, "\n\n\n", "\n\n")
	}

	return strings.TrimSpace(text)
}

// GetDOCExtractionCapabilities returns information about available DOC extraction methods
func (fp *DocumentProcessor) GetDOCExtractionCapabilities() map[string]bool {
	capabilities := map[string]bool{
		"antiword":     fp.isCommandAvailable("antiword"),
		"catdoc":       fp.isCommandAvailable("catdoc"),
		"libreoffice":  fp.isCommandAvailable("libreoffice"),
		"textutil":     fp.isCommandAvailable("textutil"),
		"basic_parser": true, // Always available
	}

	fp.logger.Info("DOC extraction capabilities", zap.Any("capabilities", capabilities))
	return capabilities
}
