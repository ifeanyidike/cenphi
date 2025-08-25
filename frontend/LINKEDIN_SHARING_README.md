# LinkedIn Testimonial Sharing Feature

This document describes the LinkedIn testimonial sharing functionality implemented in the frontend.

## Overview

The LinkedIn testimonial sharing feature allows users to share testimonials directly to their LinkedIn profiles. It includes:

- LinkedIn OAuth connection
- Testimonial content customization
- Media upload support (images/videos)
- Hashtag management
- Post visibility controls
- Draft saving functionality

## Components

### 1. LinkedInShareModal (`src/components/testimonial/LinkedInShareModal.tsx`)

The main modal component for sharing testimonials to LinkedIn.

**Features:**
- LinkedIn connection status check
- Content editor with character count
- Post type selection (text, image, video)
- Visibility controls (public, connections, private)
- Include/exclude options (media, rating, author info)
- Hashtag management
- Draft saving

**Props:**
```typescript
interface LinkedInShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  testimonial: Testimonial;
}
```

### 2. LinkedInShareButton (`src/components/testimonial/LinkedInShareButton.tsx`)

A reusable button component that opens the LinkedIn share modal.

**Features:**
- Multiple variants (default, outline, ghost)
- Different sizes (sm, md, lg)
- Icon-only or text+icon options
- Customizable styling

**Props:**
```typescript
interface LinkedInShareButtonProps {
  testimonial: Testimonial;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
  showText?: boolean;
  onSuccess?: () => void;
}
```

### 3. LinkedInShareService (`src/services/linkedInShareService.ts`)

Service class for handling LinkedIn API interactions.

**Methods:**
- `shareTestimonial(data: LinkedInShareData): Promise<LinkedInShareResponse>`
- `checkLinkedInConnection(): Promise<boolean>`
- `connectLinkedIn(): Promise<LinkedInShareResponse>`
- `getConnectionStatus(): Promise<{ isConnected: boolean; expiresAt?: Date }>`
- `disconnectLinkedIn(): Promise<LinkedInShareResponse>`
- `generateHashtags(tags?: string[]): string[]`
- `formatContent(content: string, ...): string`

## Integration

### 1. Action Toolbar Integration

The LinkedIn share button has been integrated into the testimonial action toolbar:

```typescript
// In ActionToolBar.tsx
<LinkedInShareButton
  testimonial={{
    id: testimonial.id,
    author_name: testimonial.customer_profile?.name,
    author_company: testimonial.customer_profile?.company,
    author_title: testimonial.customer_profile?.title,
    content: testimonial.content,
    media_url: testimonial.media_url,
    type: testimonial.type,
    format: testimonial.format,
    rating: testimonial.rating,
    tags: testimonial.tags
  }}
  variant="ghost"
  size="sm"
  showText={false}
  className={`px-3 py-2 rounded text-sm ${
    isDarkMode ? "text-blue-400 hover:bg-slate-700" : "text-blue-600 hover:bg-slate-200"
  } transition-colors`}
  onSuccess={() => {
    console.log('Testimonial shared to LinkedIn successfully!');
  }}
/>
```

### 2. Share Drawer Integration

LinkedIn is included in the existing share drawer platforms array and can be selected for sharing.

## Backend Integration

The feature uses the existing backend endpoints:

- **OAuth Connection**: `/api/v1/workspaces/{workspaceID}/social/auth/linkedin`
- **Create Post**: `/api/v1/workspaces/{workspaceID}/social/linkedin/posts`
- **OAuth Callback**: `/api/social/oauth/callback`

## Usage Examples

### Basic Usage

```typescript
import LinkedInShareButton from '@/components/testimonial/LinkedInShareButton';

const MyComponent = () => {
  const testimonial = {
    id: '123',
    author_name: 'John Doe',
    content: 'Great product!',
    // ... other testimonial data
  };

  return (
    <LinkedInShareButton
      testimonial={testimonial}
      onSuccess={() => console.log('Shared successfully!')}
    />
  );
};
```

### Advanced Usage

```typescript
import LinkedInShareModal from '@/components/testimonial/LinkedInShareModal';

const MyComponent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>
        Share to LinkedIn
      </button>
      
      <LinkedInShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          console.log('Shared successfully!');
          setIsModalOpen(false);
        }}
        testimonial={testimonial}
      />
    </>
  );
};
```

## Testing

A test page has been created at `/linkedin-test` to demonstrate all the features:

- Different button variants
- Modal functionality
- Sample testimonial data
- Success/error handling

## Configuration

### Environment Variables

The following environment variables are used:

```env
VITE_API_URL=http://localhost:8081
```

### LinkedIn OAuth Configuration

LinkedIn OAuth is configured in the backend with:

```env
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:8081/api/social/oauth/callback
```

## Error Handling

The feature includes comprehensive error handling:

- LinkedIn connection status validation
- API error responses
- Network connectivity issues
- Token expiration handling
- User-friendly error messages

## Future Enhancements

Potential improvements for the future:

1. **Scheduled Posts**: Allow users to schedule posts for later
2. **Analytics**: Track post performance and engagement
3. **Bulk Sharing**: Share multiple testimonials at once
4. **Template System**: Pre-defined post templates
5. **A/B Testing**: Test different post formats
6. **Integration with Other Platforms**: Extend to Facebook, Twitter, etc.

## Troubleshooting

### Common Issues

1. **LinkedIn Not Connected**
   - Ensure LinkedIn OAuth is properly configured
   - Check if the user has completed the OAuth flow
   - Verify token expiration

2. **API Errors**
   - Check backend logs for detailed error messages
   - Verify workspace ID and authentication
   - Ensure proper API endpoint configuration

3. **Media Upload Issues**
   - Check file format support (images: JPG, PNG; videos: MP4)
   - Verify file size limits
   - Ensure media URLs are accessible

### Debug Mode

Enable debug logging by setting:

```typescript
localStorage.setItem('debug', 'linkedin-sharing');
```

## Contributing

When contributing to this feature:

1. Follow the existing code style and patterns
2. Add proper TypeScript types
3. Include error handling
4. Write tests for new functionality
5. Update this documentation

## Dependencies

- React 18+
- TypeScript
- Framer Motion (for animations)
- Lucide React (for icons)
- Tailwind CSS (for styling)
