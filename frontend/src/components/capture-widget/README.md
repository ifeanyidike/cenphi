# Simplified Testimonial Capture Widget

A clean, modern, and professional testimonial capture widget designed for simplicity and performance. This widget focuses on essential functionality while providing an elegant user experience.

## 🎯 Overview

The simplified testimonial widget captures customer experiences through two primary methods:
- **Video testimonials** (recording or file upload)
- **Text testimonials** (written feedback)

## ✨ Key Features

### What's Included
- **Video Recording**: Direct camera recording with portrait orientation support
- **Video Upload**: File upload for existing video testimonials
- **Text Input**: Simple, validated text testimonial capture
- **Professional UI**: Minimal, elegant design with customizable branding
- **Mobile Optimized**: Responsive design for all devices
- **Simple Integration**: Easy embed with minimal configuration

### What Was Removed (for simplicity)
- Multi-step flows and complex navigation
- Profile picture uploads
- Audio-only and image testimonials
- AI features and live translation
- WebSocket connections and streaming
- Excessive configuration options

## 🚀 Quick Start

### 1. Basic Integration

```html
<script>
  window.testimonialWidgetConfig = {
    campaignId: 'your-campaign-id',
    apiBaseUrl: 'https://your-api.com/api',
    companyName: 'Your Company',
    buttonText: 'Share Your Experience'
  };
</script>
<script src="path/to/testimonial-widget.js"></script>
```

### 2. Advanced Configuration

```html
<script>
  window.testimonialWidgetConfig = {
    // Required
    campaignId: 'your-campaign-id',
    apiBaseUrl: 'https://your-api.com/api',

    // Branding
    companyName: 'Your Company',
    companyLogo: 'https://your-logo.com/logo.png',
    buttonText: 'Share Your Story',
    question: 'What has your experience been like?',

    // Styling
    primaryColor: '#4F46E5',
    secondaryColor: '#8B5CF6',
    position: 'bottom-right',
    brandMode: 'gradient',
    roundedCorners: 'rounded',
    darkMode: false,
    dialogScale: 1,

    // Functionality
    maxDuration: 120, // seconds
  };
</script>
<script src="path/to/testimonial-widget.js"></script>
```

## ⚙️ Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `campaignId` | string | **required** | Unique identifier for the testimonial campaign |
| `apiBaseUrl` | string | **required** | Base URL for API endpoints |
| `companyName` | string | `'Cenphi'` | Company name displayed in the widget |
| `companyLogo` | string\|null | `null` | URL to company logo image |
| `buttonText` | string | `'Share Your Story'` | Text displayed on the trigger button |
| `question` | string | `'What has your experience been like with our product?'` | Default question prompt |
| `primaryColor` | string | `'#4F46E5'` | Primary brand color (hex) |
| `secondaryColor` | string | `'#8B5CF6'` | Secondary brand color (hex) |
| `position` | string | `'bottom-right'` | Widget position: `'bottom-right'`, `'bottom-left'`, `'top-right'`, `'top-left'` |
| `maxDuration` | number | `120` | Maximum video recording duration in seconds |
| `darkMode` | boolean | `false` | Enable dark mode styling |
| `brandMode` | string | `'gradient'` | Brand styling: `'gradient'`, `'solid'`, `'minimal'` |
| `roundedCorners` | string | `'rounded'` | Corner style: `'sharp'`, `'rounded'`, `'pill'` |
| `dialogScale` | number | `1` | Scale factor for the modal dialog |

## 📱 User Experience Flow

### Video Testimonials
1. **Selection**: User chooses between "Record Video", "Upload Video", or "Write Text"
2. **Capture**:
   - **Record**: Camera preview with portrait orientation, start/stop recording controls
   - **Upload**: Drag-and-drop or file browser for video files (MP4, WebM, MOV, AVI)
3. **Author Info**: Simple form for name, email, company, position, and consent
4. **Submit**: Testimonial is submitted to the configured API endpoint
5. **Confirmation**: Success message with option to close

### Text Testimonials
1. **Selection**: User chooses "Write Text"
2. **Input**: Text area with character counter (1000 char limit)
3. **Author Info**: Same simple form as video flow
4. **Submit**: Text testimonial submitted to API
5. **Confirmation**: Success message

## 🛠️ Technical Details

### File Format Support
- **Video Recording**: WebM with VP9/Opus codecs
- **Video Upload**: MP4, WebM, QuickTime (MOV), AVI (max 1GB)
- **Text**: Plain text with 1000 character limit

### API Integration
The widget expects API endpoints that accept FormData with these fields:

**Video Testimonials:**
```
video: File (blob or uploaded file)
video_method: 'recorded' | 'uploaded'
author_name: string
author_email: string
author_company: string
author_position: string
campaign_id: string
```

**Text Testimonials:**
```
text_content: string
author_name: string
author_email: string
author_company: string
author_position: string
campaign_id: string
```

### Browser Support
- Modern browsers with MediaRecorder API support
- Mobile Safari 14.3+, Chrome 47+, Firefox 29+, Edge 79+
- Graceful degradation for unsupported features

## 🎨 Customization Examples

### Minimal Style
```javascript
window.testimonialWidgetConfig = {
  brandMode: 'minimal',
  primaryColor: '#000000',
  roundedCorners: 'sharp',
  darkMode: true
};
```

### Corporate Style
```javascript
window.testimonialWidgetConfig = {
  brandMode: 'solid',
  primaryColor: '#1e40af',
  secondaryColor: '#3b82f6',
  roundedCorners: 'rounded'
};
```

### Playful Style
```javascript
window.testimonialWidgetConfig = {
  brandMode: 'gradient',
  primaryColor: '#ec4899',
  secondaryColor: '#8b5cf6',
  roundedCorners: 'pill'
};
```

## 📦 File Structure

```
capture-widget/
├── index.tsx                    # Main entry point
├── SimpleTestimonialWidget.tsx  # Main widget component
├── SimpleCaptureModal.tsx       # Modal with capture flows
├── SimpleVideoUpload.tsx        # Video file upload component
├── types/index.ts              # TypeScript type definitions
├── constants.ts                # Configuration constants
├── example.html               # Integration example
└── README.md                  # This documentation
```

## 🚀 Development

### Components Overview

1. **SimpleTestimonialWidget**: Main floating button with positioning and branding
2. **SimpleCaptureModal**: Modal containing all capture flows and navigation
3. **SimpleVideoUpload**: Drag-and-drop video file upload with progress tracking
4. **Types**: TypeScript definitions for configuration and state management
5. **Constants**: Default configuration values and UI constants

### Key Design Decisions

- **Single Modal**: All flows contained in one modal to reduce complexity
- **Portrait Video**: Default to portrait orientation for mobile-first experience
- **Minimal Steps**: Reduced from 7 steps to 3-4 simple screens
- **No WebSockets**: Removed real-time features for better reliability
- **File-based Upload**: Simple file handling instead of streaming uploads

## 📄 License

This simplified testimonial widget is part of the Cenphi platform. All rights reserved.

---

For questions or support, please refer to the main Cenphi documentation or contact support.