import React, { useState } from 'react';
import LinkedInShareButton from '@/components/testimonial/LinkedInShareButton';
import LinkedInShareModal from '@/components/testimonial/LinkedInShareModal';

const LinkedInShareTest: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sample testimonial data
  const sampleTestimonial = {
    id: 'test-123',
    author_name: 'John Doe',
    author_company: 'Tech Solutions Inc.',
    author_title: 'CEO',
    content: 'This platform has completely transformed how we handle customer feedback. The AI-powered insights have helped us improve our products significantly. Highly recommended!',
    media_url: 'https://example.com/testimonial-video.mp4',
    type: 'video',
    format: 'video',
    rating: 5,
    tags: ['AI', 'customer-feedback', 'product-improvement']
  };

  const handleSuccess = () => {
    console.log('Testimonial shared successfully!');
    alert('Testimonial shared to LinkedIn successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            LinkedIn Testimonial Sharing Test
          </h1>
          <p className="text-lg text-gray-600">
            Test the LinkedIn testimonial sharing functionality
          </p>
        </div>

        {/* Testimonial Preview */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Sample Testimonial</h2>
          <div className="border-l-4 border-blue-500 pl-4">
            <p className="text-gray-700 mb-4">{sampleTestimonial.content}</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{sampleTestimonial.author_name}</p>
                <p className="text-sm text-gray-600">
                  {sampleTestimonial.author_title} at {sampleTestimonial.author_company}
                </p>
              </div>
              <div className="flex items-center">
                <div className="flex text-yellow-400">
                  {[...Array(sampleTestimonial.rating)].map((_, i) => (
                    <span key={i}>⭐</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Share Options</h2>
          
          <div className="space-y-4">
            {/* Default LinkedIn Share Button */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Default Button</h3>
              <LinkedInShareButton
                testimonial={sampleTestimonial}
                onSuccess={handleSuccess}
              />
            </div>

            {/* Outline LinkedIn Share Button */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Outline Button</h3>
              <LinkedInShareButton
                testimonial={sampleTestimonial}
                variant="outline"
                onSuccess={handleSuccess}
              />
            </div>

            {/* Ghost LinkedIn Share Button */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Ghost Button (Icon Only)</h3>
              <LinkedInShareButton
                testimonial={sampleTestimonial}
                variant="ghost"
                showText={false}
                onSuccess={handleSuccess}
              />
            </div>

            {/* Large LinkedIn Share Button */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Large Button</h3>
              <LinkedInShareButton
                testimonial={sampleTestimonial}
                size="lg"
                onSuccess={handleSuccess}
              />
            </div>
          </div>
        </div>

        {/* Direct Modal Test */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Direct Modal Test</h2>
          <p className="text-gray-600 mb-4">
            Test opening the LinkedIn share modal directly
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Open LinkedIn Share Modal
          </button>
        </div>

        {/* Direct Modal */}
        <LinkedInShareModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
          testimonial={sampleTestimonial}
        />
      </div>
    </div>
  );
};

export default LinkedInShareTest;
