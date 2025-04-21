
import { useState, useEffect, useRef } from 'react';
import { X, Facebook, Twitter, Linkedin, Mail, CheckCircle, Instagram, Copy, Share2, Sparkles, QrCode, LinkIcon } from 'lucide-react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Testimonial } from "@/types/testimonial";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ShareModalProps {
  testimonial: Testimonial;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal = ({ testimonial, isOpen, onClose }: ShareModalProps) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'social' | 'link' | 'qrcode'>('social');
  const [animateIn, setAnimateIn] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState(false);
  const linkInputRef = useRef<HTMLDivElement>(null);
  
  // Base URL for the review
  const baseUrl = 'https://cenphi.io/reviews';
  const reviewUrl = `${baseUrl}/${testimonial.id}`;
      
    // Share URLs
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(reviewUrl)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(reviewUrl)}&text=${encodeURIComponent(`Check out this ${testimonial.rating}-star review from ${testimonial.customer_profile?.name}!`)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(reviewUrl)}`,
      instagram: `https://instagram.com`, // Instagram doesn't have a direct sharing API
      email: `mailto:?subject=${encodeURIComponent(`${testimonial.rating}-Star Review from ${testimonial.customer_profile?.name}`)}&body=${encodeURIComponent(`Check out this review: ${reviewUrl}`)}`
    };
  
  
  // Animation effect on mount
  useEffect(() => {
    if (isOpen) {
      setAnimateIn(true);
      // Reset states when modal opens
      setCopied(false);
      setShareSuccess(false);
    }
  }, [isOpen]);
  
  // Handle copy link to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(reviewUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };
  
  // Handle share button click
  const handleShare = (platform: string) => {
    // Animate the share button
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2000);

    const url = shareUrls[platform as keyof typeof shareUrls];
    if (platform === 'email') {
      window.location.href = url;
    } else if (platform === 'instagram') {
      // Custom handling for Instagram
      handleCopyLink();
      window.open('https://instagram.com', '_blank');
    } else {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  // Native share API if available
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${testimonial.rating}-Star Review from ${testimonial.customer_profile?.name}`,
          text: `Check out this ${testimonial.rating}-star review!`,
          url: reviewUrl,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      } catch (error) {
        console.log('Error sharing', error);
      }
    } else {
      // Fallback - copy to clipboard
      handleCopyLink();
    }
  };

  const platforms = [
    { name: 'Facebook', icon: Facebook, color: 'bg-blue-600', hoverColor: 'hover:bg-blue-700', textColor: 'text-blue-600', 
      description: 'Share this review on your Facebook timeline or in groups' },
    { name: 'Twitter', icon: Twitter, color: 'bg-sky-500', hoverColor: 'hover:bg-sky-600', textColor: 'text-sky-500',
      description: 'Tweet this review to your followers' },
    { name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700', hoverColor: 'hover:bg-blue-800', textColor: 'text-blue-700',
      description: 'Share with your professional network' },
    { name: 'Instagram', icon: Instagram, color: 'bg-pink-600', hoverColor: 'hover:bg-pink-700', textColor: 'text-pink-600',
      description: 'Copy link to share in your Instagram story' },
    { name: 'Email', icon: Mail, color: 'bg-red-500', hoverColor: 'hover:bg-red-600', textColor: 'text-red-500',
      description: 'Email this review to colleagues or friends' },
  ];

  // Generate SVG QR code - simplified version for demonstration
  const generateQRCode = () => {
    return (
      <svg className="w-32 h-32" viewBox="0 0 37 37">
        <rect x="0" y="0" width="30" height="30" fill="#ffffff" />
        <g transform="scale(1)">
          {/* This is a simplified QR code pattern for demonstration purposes */}
          {[
            [4,4,12,4,12,12,4,12],
            [5,5,11,5,11,11,5,11],
            [6,6,8,6,8,8,6,8],
            [25,4,33,4,33,12,25,12],
            [26,5,32,5,32,11,26,11],
            [27,6,29,6,29,8,27,8],
            [4,25,12,25,12,33,4,33],
            [5,26,11,26,11,32,5,32],
            [6,27,8,27,8,29,6,29],
            [16,16,20,16,20,20,16,20],
            [14,4,14,6,16,6,16,8,14,8,14,10,16,10,16,12,18,12,18,10,20,10,20,8,22,8,22,6,20,6,20,4,18,4,18,4],
            [24,14,22,14,22,16,20,16,20,18,18,18,18,20,18,22,20,22,22,22,22,24,24,24],
            [14,24,14,26,16,26,16,28,18,28,18,26,20,26,20,24,22,24],
            [4,14,6,14,6,16,6,18,8,18,8,20,6,20,6,22,4,22],
            [28,24,28,26,30,26,30,28,32,28,32,26,32,24,30,24],
            [26,14,26,16,28,16,28,18,30,18,30,20,32,20,32,22,30,22,30,24,28,24,28,22,26,22,26,20,24,20,24,18,22,18],
          ].map((coords, i) => (
            <polygon key={i} fill="#000000" points={coords.join(',')} />
          ))}
        </g>
      </svg>
    );
  };
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 overflow-hidden max-w-lg bg-white border-0 shadow-2xl rounded-2xl">
        {/* Enhanced premium glass effect background with more vivid gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-indigo-50/40 to-purple-50/30 backdrop-blur-md opacity-95 z-0" />
        
        {/* Enhanced decorative elements with more vibrant colors */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-2xl" />
        <div className="absolute -bottom-40 -left-20 w-96 h-96 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-2xl" />
        <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-blue-300/30 rounded-full blur-xl" />
        <div className="absolute bottom-1/4 left-1/4 w-20 h-20 bg-indigo-300/30 rounded-full blur-xl" />
        <div className="absolute top-1/4 left-1/5 w-8 h-8 bg-pink-300/40 rounded-full blur-md" />
        
        {/* Enhanced animated particles with more particles and better contrast */}
        <div className="absolute inset-0 overflow-hidden opacity-40 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: `${Math.random() * 8 + 3}px`,
                height: `${Math.random() * 8 + 3}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `float ${Math.random() * 10 + 15}s linear infinite`,
                opacity: Math.random() * 0.8 + 0.4,
              }}
            />
          ))}
        </div>
        
        {/* Content container */}
        <div className="relative z-10">
          {/* Enhanced premium header with more vibrant gradient */}
          <div className="relative">
          <div className="h-20 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
              {/* Enhanced wave with more pronounced curve */}
              <svg className="absolute bottom-0 w-full h-5 text-white" viewBox="0 0 1200 120" preserveAspectRatio="none">
              </svg>
            </div>
            
            {/* Enhanced close button */}
            <button 
              onClick={onClose}
              className="absolute right-4 top-4 p-1.5 rounded-full bg-white/30 hover:bg-white/40 transition-colors backdrop-blur-sm border border-white/30 shadow-lg"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5 text-white" />
            </button>
            
            {/* ENHANCED PREMIUM TESTIMONIAL CARD - made larger and more visible */}
            <AnimatePresence>
              {animateIn && (
                <motion.div 
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1, type: "spring", stiffness: 150 }}
                  className="absolute left-1/4 transform -translate-x-1/2 -bottom-16 flex items-center bg-white/95 backdrop-blur-xl rounded-xl px-1 py-2 shadow-xl border border-white/50 w-/5"
                >
                  {/* Premium badge in corner */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.3 }}
                    className="absolute -top-3 -right-3 bg-gradient-to-r from-amber-400 to-yellow-500 px-3 py-1 rounded-full text-white text-xs font-bold shadow-lg border border-white/50"
                  >
                    {testimonial.created_at?.toLocaleDateString()}
                  </motion.div>
                  
                  {/* Enhanced user avatar */}
                  <div className="relative mr-2">
                    <div className="h-11 w-11 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white text-xl font-semibold shadow-lg border-2 border-white">
                      {testimonial.customer_profile?.name ? testimonial.customer_profile?.name.substring(0, 1).toUpperCase() : "?"}
                    </div>
                    <motion.div 
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.7, duration: 0.3 }}
                      className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-yellow-400 border-2 border-white flex items-center justify-center shadow-md"
                    >
                      <Sparkles className="h-3 w-3 text-white" />
                    </motion.div>
                  </div>
                  
                  {/* Enhanced testimonial content */}
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="font-bold text-sm text-gray-800">{testimonial.customer_profile?.name}</h3>
                      <span className="ml-2 text-xs py-0.5 px-2 bg-indigo-100 text-indigo-700 rounded-full font-medium">Verified</span>
                    </div>
                    
                    {/* Enhanced star rating */}
                    <div className="flex items-center mt-1">
                      <div className="flex">
                        {Array.from({ length: 5 }, (_, i) => (
                          <motion.svg 
                            key={i} 
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.4 + (i * 0.1) }}
                            className={`h-5 w-5 ${i < (testimonial.rating ?? 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-300 fill-gray-300"}`} 
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                          </motion.svg>
                        ))}
                      </div>
                      <span className="ml-2 text-gray-600 font-medium text-sm">{testimonial.rating}/5 Rating</span>
                    </div>
                    
                    {/* Condensed testimonial preview if available */}
                    {testimonial.content && (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-gray-500 text-xs mt-1 italic line-clamp-1"
                      >
                        {testimonial.content.substring(0, 50)}...
                      </motion.p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Enhanced premium tabs with better spacing */}
          <div className="flex justify-center pt-16 pb-6 px-6">
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as 'social' | 'link' | 'qrcode')}
              className="w-full"
            >
              <TabsList className="w-full bg-gray-100/80 backdrop-blur-sm rounded-full p-1 inline-flex shadow-inner border border-white/90 h-14">
                <TabsTrigger 
                  value="social" 
                  className="flex-1 rounded-full text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-md text-gray-600 data-[state=inactive]:hover:text-indigo-600 h-12"
                >
                  <motion.div 
                    whileHover={{ y: -2 }}
                    className="flex items-center justify-center gap-2"
                  >
                    <Share2 className="h-5 w-5" />
                    <span className="font-semibold">Social Share</span>
                  </motion.div>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="link" 
                  className="flex-1 rounded-full text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-md text-gray-600 data-[state=inactive]:hover:text-indigo-600 h-12"
                >
                  <motion.div 
                    whileHover={{ y: -2 }}
                    className="flex items-center justify-center gap-2"
                  >
                    <LinkIcon className="h-5 w-5" />
                    <span className="font-semibold">Copy Link</span>
                  </motion.div>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="qrcode" 
                  className="flex-1 rounded-full text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-md text-gray-600 data-[state=inactive]:hover:text-indigo-600 h-12"
                >
                  <motion.div 
                    whileHover={{ y: -2 }}
                    className="flex items-center justify-center gap-2"
                  >
                    <QrCode className="h-5 w-5" />
                    <span className="font-semibold">QR Code</span>
                  </motion.div>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="social" className="px-4 mt-6">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-4">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 bg-clip-text text-transparent">Share this Premium Review</h3>
                    <p className="text-gray-600 text-sm mt-2">Let others know about this excellent feedback</p>
                  </div>
                  
                  {/* Native share API option with enhanced styling */}
                  {typeof navigator.share === 'function' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="w-full flex justify-center mb-6"
                    >
                      <Button
                        onClick={handleNativeShare}
                        className="relative overflow-hidden border-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-8 py-6 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all group"
                      >
                        <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-all" />
                        <motion.div 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="relative flex items-center gap-3"
                        >
                          <Share2 className="h-6 w-6" />
                          <span className="text-base">Share Now</span>
                          <span className="ml-1 text-xs py-1 px-2 bg-white/20 rounded-md font-medium">Quick</span>
                        </motion.div>
                        
                        {/* Success animation overlay */}
                        <AnimatePresence>
                          {shareSuccess && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 1.2 }}
                              className="absolute inset-0 flex items-center justify-center bg-green-600 rounded-xl"
                            >
                              <div className="flex flex-col items-center text-white">
                                <CheckCircle className="h-8 w-8 mb-1" />
                                <span className="font-bold">Successfully shared!</span>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Button>
                    </motion.div>
                  )}
                  
                  {/* Enhanced social share buttons with better spacing and animations */}
                  <div className="grid grid-cols-5 gap-4">
                    {platforms.map((platform, index) => (
                      <TooltipProvider key={platform.name}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: 0.2 + (index * 0.05) }}
                            >
                              <Button 
                                variant="outline"
                                className="group w-full h-30 flex flex-col items-center justify-center border-gray-100/80 hover:border-transparent transition-all duration-300 hover:scale-105 hover:shadow-lg bg-white/70 backdrop-blur-sm hover:bg-white"
                                onClick={() => handleShare(platform.name.toLowerCase())}
                                onMouseEnter={() => setShowTooltip(platform.name)}
                                onMouseLeave={() => setShowTooltip(null)}
                              >
                                <motion.div 
                                  whileHover={{ y: -5 }}
                                  className={`p-3 rounded-full ${platform.textColor} bg-white group-hover:${platform.color} transition-all duration-300 border border-gray-100 shadow-md group-hover:shadow-lg`}
                                >
                                  <platform.icon className="h-5 w-5" />
                                </motion.div>
                                <span className="mt-4 text-xs font-semibold text-gray-800 group-hover:text-gray-900">{platform.name}</span>
                                
                                {/* Enhanced pulse animation */}
                                <div className={`absolute inset-0 rounded-md ${platform.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                              </Button>
                            </motion.div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="bg-gray-900/90 backdrop-blur-sm text-white p-2 px-3 text-xs border-0">
                            {platform.description}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </motion.div>
              </TabsContent>
              
              <TabsContent value="link" className="px-6 mt-6">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 bg-clip-text text-transparent">Get Direct Link</h3>
                    <p className="text-gray-600 text-sm mt-2">Copy this unique link to share anywhere</p>
                  </div>
                  
                  {/* Enhanced link field with better visualization */}
                  <div className="relative">
                    <div 
                      ref={linkInputRef}
                      className="flex items-center overflow-hidden p-5 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 rounded-xl border border-indigo-100/50 shadow-md"
                    >
                      <div className="flex-1 text-gray-700 text-sm font-mono truncate pl-3 select-all">
                        {reviewUrl}
                      </div>
                    </div>
                    
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.div
                          key="copied"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-green-50 to-emerald-50/90 backdrop-blur-sm rounded-xl border border-green-200"
                        >
                          <motion.div 
                            initial={{ scale: 0.8 }}
                            animate={{ scale: [0.8, 1.1, 1] }}
                            transition={{ duration: 0.4, times: [0, 0.6, 1] }}
                            className="flex items-center text-green-600"
                          >
                            <CheckCircle className="h-6 w-6 mr-2" />
                            <span className="font-medium text-lg">Link copied to clipboard!</span>
                          </motion.div>
                        </motion.div>
                      ) : (
                        <motion.button
                          key="copy"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-lg flex items-center shadow-md hover:shadow-lg transition-all"
                          onClick={handleCopyLink}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          <span className="font-medium">Copy</span>
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {/* Enhanced link engagement info */}
                  <div className="bg-indigo-50/60 backdrop-blur-sm rounded-xl p-3 mt-3 border border-indigo-100/50 shadow-sm">
                    <h4 className="text-sm font-semibold text-indigo-800 mb-1 flex items-center">
                      <Sparkles className="h-4 w-4 mr-2 text-indigo-500" />
                      Premium Link Benefits
                    </h4>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-white/80 rounded-lg p-3 shadow-sm border border-indigo-50">
                        <div className="text-xl font-semibold text-indigo-600">100%</div>
                        <div className="text-xs text-gray-600 font-medium">Privacy Protected</div>
                      </div>
                      <div className="bg-white/80 rounded-lg p-3 shadow-sm border border-indigo-50">
                        <div className="text-xl font-semibold text-indigo-600">∞</div>
                        <div className="text-xs text-gray-600 font-medium">Never Expires</div>
                      </div>
                      <div className="bg-white/80 rounded-lg p-3 shadow-sm border border-indigo-50">
                        <div className="text-xl font-semibold text-indigo-600">4KB</div>
                        <div className="text-xs text-gray-600 font-medium">Optimized Size</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </TabsContent>
              
              <TabsContent value="qrcode" className="px-6 mt-6">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 bg-clip-text text-transparent">QR Code Access</h3>
                    <p className="text-gray-600 text-sm mt-2">Scan with camera or share image directly</p>
                  </div>
                  
                  {/* Enhanced QR code display */}
                  <div className="flex justify-center py-1">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="bg-white p-3 rounded-xl shadow-lg border border-gray-200 relative overflow-hidden"
                    >
                      <div className="absolute w-40 h-40 -right-20 -top-20 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full" />
                      <div className="absolute w-40 h-40 -left-20 -bottom-20 bg-gradient-to-tr from-purple-500/10 to-pink-500/10 rounded-full" />
                      
                      {/* Premium badge for QR code */}
                      <div className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-600 to-pink-600 px-2 py-1 rounded-lg text-white text-xs font-semibold shadow-md transform rotate-3">
                        PREMIUM
                      </div>
                      
                      {/* QR Code */}
                      <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                      >
                        {generateQRCode()}
                      </motion.div>
                      
                      {/* Enhanced overlay logo */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center border-2 border-white">
                            <span className="text-white text-lg font-bold">C</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                  
                  {/* Enhanced QR code actions */}
                  <div className="flex justify-center space-x-4">
                    <Button
                      variant="outline"
                      className="border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50 transition-all px-4 py-2 font-medium"
                      onClick={() => {
                        // Simulating a copy action
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {copied ? "Copied!" : "Copy QR Code"}
                    </Button>
                    
                    <Button
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg transition-all px-4 py-2 font-medium"
                      onClick={() => {
                        // Simulate download action
                        setShareSuccess(true);
                        setTimeout(() => setShareSuccess(false), 2000);
                      }}
                    >
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center"
                      >
                        {shareSuccess ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            <span>Downloaded!</span>
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span>Download</span>
                          </>
                        )}
                      </motion.div>
                    </Button>
                  </div>
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Add footer with premium badge */}
          <div className="flex justify-center pb-6">
            <div className="flex items-center text-xs text-gray-500">
              <div className="flex items-center mr-2">
                <Sparkles className="h-3 w-3 mr-1 text-indigo-500" />
                <span className="font-medium">Premium Sharing</span>
              </div>
              <span>•</span>
              <span className="ml-2">Powered by Cenphi</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};