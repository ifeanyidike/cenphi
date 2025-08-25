import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Save, 
  Linkedin,
  Image,
  Video,
  FileText,
  Star,
  User,
  Building2,
  Eye,
  Users as UsersIcon,
  Lock,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { linkedInShareService } from '@/services/linkedInShareService';

interface Testimonial {
  id: string;
  author_name?: string;
  author_company?: string;
  author_title?: string;
  content?: string;
  media_url?: string;
  type: string;
  format: string;
  rating?: number;
  tags?: string[];
}

interface LinkedInShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  testimonial: Testimonial;
}

type PostType = 'text' | 'image' | 'video';
type VisibilityType = 'public' | 'connections' | 'private';

const LinkedInShareModal: React.FC<LinkedInShareModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  testimonial 
}) => {
  const [isLinkedInConnected, setIsLinkedInConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<PostType>('text');
  const [visibility, setVisibility] = useState<VisibilityType>('public');
  const [includeMedia, setIncludeMedia] = useState(true);
  const [includeRating, setIncludeRating] = useState(true);
  const [includeAuthor, setIncludeAuthor] = useState(true);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [customHashtag, setCustomHashtag] = useState('');

  useEffect(() => {
    if (isOpen) {
      checkLinkedInConnection();
      generateInitialContent();
    }
  }, [isOpen, testimonial]);

  const checkLinkedInConnection = async () => {
    try {
      const status = await linkedInShareService.getConnectionStatus();
      setIsLinkedInConnected(status.isConnected);
    } catch (error) {
      console.error('Error checking LinkedIn connection:', error);
      setIsLinkedInConnected(false);
    }
  };

  const generateInitialContent = () => {
    let generatedContent = '';
    
    // Add testimonial content
    if (testimonial.content) {
      generatedContent += testimonial.content;
    }
    
    // Add author info if enabled
    if (includeAuthor && testimonial.author_name) {
      generatedContent += `\n\n- ${testimonial.author_name}`;
      if (testimonial.author_title) {
        generatedContent += `, ${testimonial.author_title}`;
      }
      if (testimonial.author_company) {
        generatedContent += ` at ${testimonial.author_company}`;
      }
    }
    
    // Add rating if enabled
    if (includeRating && testimonial.rating) {
      const stars = '⭐'.repeat(testimonial.rating);
      generatedContent += `\n${stars}`;
    }
    
    // Add hashtags
    const allHashtags = [...hashtags, ...(testimonial.tags || [])];
    if (allHashtags.length > 0) {
      generatedContent += `\n\n${allHashtags.map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ')}`;
    }
    
    setContent(generatedContent);
  };

  const handleLinkedInConnect = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const result = await linkedInShareService.connectLinkedIn();
      if (result.success) {
        await checkLinkedInConnection();
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Error connecting to LinkedIn:', error);
      setError('Failed to connect to LinkedIn. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handlePublish = async () => {
    if (!isLinkedInConnected) {
      setError('Please connect your LinkedIn account first.');
      return;
    }

    if (!content.trim()) {
      setError('Please enter content for your post.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const postData = {
        content: content.trim(),
        post_type: postType,
        media_urls: includeMedia && testimonial.media_url ? [testimonial.media_url] : [],
        hashtags: hashtags,
        testimonial_id: testimonial.id
      };

      const result = await linkedInShareService.shareTestimonial(postData);
      
      if (result.success) {
        setSuccess(result.message);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Error publishing to LinkedIn:', error);
      setError(error instanceof Error ? error.message : 'Failed to publish post');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!content.trim()) {
      setError('Please enter content for your post.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Save draft locally for now (could be enhanced to save to backend)
      const draft = {
        content: content.trim(),
        post_type: postType,
        media_urls: includeMedia && testimonial.media_url ? [testimonial.media_url] : [],
        hashtags: hashtags,
        testimonial_id: testimonial.id,
        created_at: new Date().toISOString()
      };

      // Save to localStorage
      const drafts = JSON.parse(localStorage.getItem('linkedin_drafts') || '[]');
      drafts.push(draft);
      localStorage.setItem('linkedin_drafts', JSON.stringify(drafts));
      
      setSuccess('Draft saved successfully!');
      setTimeout(() => {
        setSuccess(null);
      }, 2000);
    } catch (error) {
      console.error('Error saving draft:', error);
      setError('Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  const addHashtag = (hashtag: string) => {
    if (hashtag && !hashtags.includes(hashtag)) {
      setHashtags([...hashtags, hashtag]);
      setCustomHashtag('');
    }
  };

  const removeHashtag = (hashtag: string) => {
    setHashtags(hashtags.filter(h => h !== hashtag));
  };



  const getPostTypeIcon = () => {
    switch (testimonial.format) {
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'image':
        return <Image className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getVisibilityIcon = () => {
    switch (visibility) {
      case 'public':
        return <Eye className="w-4 h-4" />;
      case 'connections':
        return <UsersIcon className="w-4 h-4" />;
      case 'private':
        return <Lock className="w-4 h-4" />;
    }
  };

  const getVisibilityText = () => {
    switch (visibility) {
      case 'public':
        return 'Everyone';
      case 'connections':
        return 'Connections only';
      case 'private':
        return 'Just you';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Linkedin className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Share to LinkedIn</h2>
                  <p className="text-sm text-gray-600">Share this testimonial on your LinkedIn profile</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Error/Success Messages */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-700">{success}</span>
                  </div>
                </motion.div>
              )}

              {/* LinkedIn Connection Status */}
              {!isLinkedInConnected && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                      <div>
                        <h3 className="font-medium text-amber-800">LinkedIn Not Connected</h3>
                        <p className="text-sm text-amber-700">Connect your LinkedIn account to share testimonials</p>
                      </div>
                    </div>
                    <button
                      onClick={handleLinkedInConnect}
                      disabled={isConnecting}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {isConnecting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Linkedin className="w-4 h-4" />
                      )}
                      <span>{isConnecting ? 'Connecting...' : 'Connect LinkedIn'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Testimonial Preview */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    {getPostTypeIcon()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">Testimonial Preview</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {testimonial.content?.substring(0, 100)}...
                    </p>
                    {testimonial.author_name && (
                      <p className="text-xs text-gray-500 mt-2">
                        — {testimonial.author_name}
                        {testimonial.author_company && `, ${testimonial.author_company}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Content Editor */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Post Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your LinkedIn post content..."
                  rows={6}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
                <div className="mt-1 text-xs text-gray-500">
                  {content.length} characters
                </div>
              </div>

              {/* Post Options */}
              <div className="mb-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Post Type
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['text', 'image', 'video'] as PostType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => setPostType(type)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          postType === type
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-center">
                          {type === 'text' && <FileText className="w-4 h-4 mx-auto mb-1" />}
                          {type === 'image' && <Image className="w-4 h-4 mx-auto mb-1" />}
                          {type === 'video' && <Video className="w-4 h-4 mx-auto mb-1" />}
                          <span className="text-xs font-medium capitalize">{type}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Visibility
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['public', 'connections', 'private'] as VisibilityType[]).map((vis) => (
                      <button
                        key={vis}
                        onClick={() => setVisibility(vis)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          visibility === vis
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-center">
                          {getVisibilityIcon()}
                          <span className="text-xs font-medium capitalize block mt-1">{vis}</span>
                          <div className="text-xs text-gray-500 mt-1">
                            {getVisibilityText()}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Include Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Include in Post
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={includeMedia}
                        onChange={(e) => setIncludeMedia(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Include media (if available)</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={includeRating}
                        onChange={(e) => setIncludeRating(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Include rating</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={includeAuthor}
                        onChange={(e) => setIncludeAuthor(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Include author information</span>
                    </label>
                  </div>
                </div>

                {/* Hashtags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hashtags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {hashtags.map((hashtag) => (
                      <span
                        key={hashtag}
                        className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        #{hashtag}
                        <button
                          onClick={() => removeHashtag(hashtag)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={customHashtag}
                      onChange={(e) => setCustomHashtag(e.target.value)}
                      placeholder="Add hashtag..."
                      className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addHashtag(customHashtag);
                        }
                      }}
                    />
                    <button
                      onClick={() => addHashtag(customHashtag)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleSaveDraft}
                disabled={isSaving || isLoading}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Save Draft</span>
              </button>

              <div className="flex items-center space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePublish}
                  disabled={!isLinkedInConnected || isLoading || isSaving}
                  className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Publish to LinkedIn</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LinkedInShareModal;
