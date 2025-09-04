import React, { useState } from 'react';
import { Linkedin } from 'lucide-react';
import LinkedInShareModal from './LinkedInShareModal';

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

interface LinkedInShareButtonProps {
  testimonial: Testimonial;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
  showText?: boolean;
  onSuccess?: () => void;
}

const LinkedInShareButton: React.FC<LinkedInShareButtonProps> = ({
  testimonial,
  variant = 'default',
  size = 'md',
  className = '',
  showIcon = true,
  showText = true,
  onSuccess
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
  };

  const getButtonClasses = () => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };

    const variantClasses = {
      default: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
      ghost: 'text-blue-600 hover:bg-blue-50 focus:ring-blue-500'
    };

    return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={getButtonClasses()}
        title="Share to LinkedIn"
      >
        {showIcon && <Linkedin className={`${showText ? 'mr-2' : ''} w-4 h-4`} />}
        {showText && 'Share to LinkedIn'}
      </button>

      <LinkedInShareModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
        testimonial={testimonial}
      />
    </>
  );
};

export default LinkedInShareButton;

