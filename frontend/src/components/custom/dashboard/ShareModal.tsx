
import { useState, useEffect } from 'react';
import { X, Facebook, Twitter, Linkedin, Mail, Link as LinkIcon, CheckCircle, Instagram, Copy } from 'lucide-react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Review } from "@/types/types";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface ShareModalProps {
  review: Review;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal = ({ review, isOpen, onClose }: ShareModalProps) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'social' | 'link'>('social');
  const [animateIn, setAnimateIn] = useState(false);
  
  // Base URL for the review
  const baseUrl = 'https://cenphi.io/reviews';
  const reviewUrl = `${baseUrl}/${review.id}`;
  
  // Share URLs
  const shareUrls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(reviewUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(reviewUrl)}&text=${encodeURIComponent(`Check out this ${review.rating}-star review from ${review.name}!`)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(reviewUrl)}`,
    instagram: `https://instagram.com`, // Instagram doesn't have a direct sharing API, would need custom handling
    email: `mailto:?subject=${encodeURIComponent(`${review.rating}-Star Review from ${review.name}`)}&body=${encodeURIComponent(`Check out this review: ${reviewUrl}`)}`
  };
  
  // Animation effect on mount
  useEffect(() => {
    if (isOpen) {
      setAnimateIn(true);
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
    onClose();
  };

  const platforms = [
    { name: 'Facebook', icon: Facebook, color: 'bg-blue-600', hoverColor: 'hover:bg-blue-700', textColor: 'text-blue-600' },
    { name: 'Twitter', icon: Twitter, color: 'bg-sky-500', hoverColor: 'hover:bg-sky-600', textColor: 'text-sky-500' },
    { name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700', hoverColor: 'hover:bg-blue-800', textColor: 'text-blue-700' },
    { name: 'Instagram', icon: Instagram, color: 'bg-pink-600', hoverColor: 'hover:bg-pink-700', textColor: 'text-pink-600' },
    { name: 'Email', icon: Mail, color: 'bg-red-500', hoverColor: 'hover:bg-red-600', textColor: 'text-red-500' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 overflow-hidden max-w-lg bg-white border-0 shadow-2xl rounded-2xl">
        {/* Glass effect background with subtle gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 backdrop-blur-sm opacity-90 z-0" />
        
        {/* Decorative elements */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-40 -left-20 w-80 h-80 bg-gradient-to-tr from-purple-400/10 to-pink-400/10 rounded-full blur-2xl" />
        <div className="absolute top-1/3 right-1/4 w-12 h-12 bg-blue-300/20 rounded-full blur-xl" />
        <div className="absolute bottom-1/4 left-1/4 w-16 h-16 bg-indigo-300/20 rounded-full blur-xl" />
        
        {/* Content container */}
        <div className="relative z-10">
          {/* Header with decorative wave */}
          <div className="relative">
            <div className="h-16 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
              <svg className="absolute bottom-0 w-full h-8 text-white" viewBox="0 0 1200 120" preserveAspectRatio="none">
                <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="currentColor"></path>
              </svg>
            </div>
            
            {/* Close button */}
            <button 
              onClick={onClose}
              className="absolute right-4 top-1 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5 text-white" />
            </button>
            
            {/* Review info card - overlaying the wave */}
            <AnimatePresence>
              {animateIn && (
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="absolute left-1/2 transform -translate-x-1/2 top-1 flex items-center bg-white/10 backdrop-blur-md rounded-full pl-2 pr-4 py-1.5 shadow-lg border border-white/30"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white font-semibold mr-2 shadow-sm">
                    {review.initials}
                  </div>
                  <div className="text-white">
                    <span className="font-medium">{review.name}'s</span>
                    <div className="flex items-center">
                      <div className="flex">
                        {Array.from({ length: 5 }, (_, i) => (
                          <svg key={i} className={`h-3 w-3 ${i < review.rating ? "text-yellow-300 fill-yellow-300" : "text-gray-300"}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                          </svg>
                        ))}
                      </div>
                      <span className="ml-1 text-xs font-medium text-white/90">Review</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Tabs */}
          <div className="flex justify-center -mt-1 mb-4">
            <div className="bg-gray-100/80 backdrop-blur-sm rounded-full p-1 inline-flex shadow-inner border border-white">
              <button
                onClick={() => setActiveTab('social')}
                className={`px-6 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeTab === 'social' 
                    ? 'bg-white text-indigo-700 shadow-sm' 
                    : 'text-gray-600 hover:text-indigo-600'
                }`}
              >
                Social Media
              </button>
              <button
                onClick={() => setActiveTab('link')}
                className={`px-6 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeTab === 'link' 
                    ? 'bg-white text-indigo-700 shadow-sm' 
                    : 'text-gray-600 hover:text-indigo-600'
                }`}
              >
                Copy Link
              </button>
            </div>
          </div>
          
          {/* Content based on active tab */}
          <div className="px-8 pb-8">
            {activeTab === 'social' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-5 gap-3"
              >
                {platforms.map((platform, index) => (
                  <motion.div
                    key={platform.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Button 
                      variant="outline"
                      className="group w-full h-28 flex flex-col items-center justify-center border-gray-200 hover:border-transparent transition-all duration-300 hover:scale-105 hover:shadow-lg"
                      onClick={() => handleShare(platform.name.toLowerCase())}
                    >
                      <div className={`p-3 rounded-full ${platform.textColor} bg-white group-hover:text-blue group-hover:${platform.color} transition-all duration-300 border border-gray-100 shadow-md group-hover:shadow-lg`}>
                        <platform.icon className="h-6 w-6" />
                      </div>
                      <span className="mt-3 text-sm font-medium text-gray-700 group-hover:text-gray-900">{platform.name}</span>
                    </Button>
                  </motion.div>
                ))}
              </motion.div>
            )}
            
            {activeTab === 'link' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h3 className="text-lg font-medium text-gray-800">Share direct link</h3>
                  <p className="text-gray-500 text-sm mt-1">Copy this link to share the review directly</p>
                </div>
                
                <div className="relative">
                  <div className="flex items-center overflow-hidden p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex-1 text-gray-600 text-sm font-mono truncate pl-2 select-all">
                      {reviewUrl}
                    </div>
                  </div>
                  <AnimatePresence>
                    {copied ? (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute inset-0 flex items-center justify-center bg-green-50 rounded-xl border border-green-200"
                      >
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="h-5 w-5 mr-2" />
                          <span className="font-medium">Link copied to clipboard!</span>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center shadow-md hover:shadow-lg transition-all"
                        onClick={handleCopyLink}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        <span className="font-medium">Copy</span>
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
                
                <div className="text-center pt-4">
                  <p className="text-gray-400 text-xs">This link will be active indefinitely</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};


