import * as React from 'react';
import { useState } from 'react';
import { StarIcon, PenIcon, InfoIcon, CalendarIcon } from 'lucide-react';

interface CenphiReviewFormProps {
  companyName: string;
  companyUrl: string;
  logoUrl?: string;
  experienceDate?: string;
}

const ReviewComponent: React.FC<CenphiReviewFormProps> = ({
  companyName = "Cenphi",
  companyUrl = "cenphi.io",
  logoUrl="",
  experienceDate=""
}) => {
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [reviewTitle, setReviewTitle] = useState('');

  const getStarColor = (index: number) => {
    if (hoveredRating !== null) {
      return index <= hoveredRating ? 'text-emerald-500' : 'text-gray-200';
    }
    return index <= (rating || 0) ? 'text-emerald-500' : 'text-gray-200';
  };

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden">
      {/* Cenphi Header */}
      <div className="bg-black p-4 flex items-center">
        <div className="flex items-center">
          <StarIcon className="w-6 h-6 text-emerald-500 mr-2" fill="currentColor" />
          <span className="text-white font-bold text-lg">Cenphi</span>
        </div>
      </div>
      
      {/* Company Info */}
      <div className="bg-white border-b border-gray-200 p-6 flex items-center justify-center">
        {logoUrl ? (
          <img src={logoUrl} alt={companyName} className="h-14 w-auto mr-3" />
        ) : (
          <div className="h-14 w-14 bg-gray-100 rounded flex items-center justify-center mr-3">
            <span className="font-bold text-xl text-gray-700">{companyName.charAt(0)}</span>
          </div>
        )}
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800">{companyName}</h2>
          <p className="text-gray-500">{companyUrl}</p>
        </div>
      </div>
      
      {/* Review Form */}
      <div className="p-8 bg-gray-50">
        <div className="space-y-8">
          {/* Rating Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg text-gray-800 mb-4">Rate your recent experience</h3>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(null)}
                  className={`w-12 h-12 flex items-center justify-center rounded transition-all ${
                    (hoveredRating !== null ? star <= hoveredRating : star <= (rating || 0))
                      ? 'bg-emerald-50'
                      : 'bg-gray-50'
                  }`}
                >
                  <StarIcon 
                    className={`w-8 h-8 ${getStarColor(star)}`} 
                    fill={(hoveredRating !== null ? star <= hoveredRating : star <= (rating || 0)) ? 'currentColor' : 'none'}
                  />
                </button>
              ))}
            </div>
          </div>
          
          {/* Review Text Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg text-gray-800 mb-4">Tell us more about your experience</h3>
            <a href="#" className="text-blue-500 hover:underline text-sm inline-flex items-center mb-4">
              <InfoIcon className="w-4 h-4 mr-1" /> Read our Guidelines for Reviewers
            </a>
            <div className="mb-6">
              <textarea
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-32 transition-all"
                placeholder="What made your experience great? What is this company doing well? Remember to be honest, helpful, and constructive!"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              />
              <div className="mt-2 text-right">
                <a href="#" className="text-blue-500 hover:underline text-sm inline-flex items-center">
                  <PenIcon className="w-4 h-4 mr-1" /> How to write a useful review
                </a>
              </div>
            </div>
          </div>
          
          {/* Review Title Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg text-gray-800 mb-4">Give your review a title</h3>
            <div className="relative">
              <input
                type="text"
                className="w-full p-4 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                placeholder="What's important for people to know?"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <PenIcon className="w-5 h-5" />
              </div>
            </div>
          </div>
          
          {/* Date of Experience */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h3 className="font-semibold text-lg text-gray-800 mr-2">Date of experience</h3>
                <InfoIcon className="w-4 h-4 text-gray-400" />
              </div>
              <button className="text-blue-500 hover:underline text-sm inline-flex items-center">
                <PenIcon className="w-4 h-4 mr-1" /> Edit
              </button>
            </div>
            <div className="mt-2 flex items-center text-gray-600">
              <CalendarIcon className="w-5 h-5 mr-2 text-gray-400" />
              <span>{experienceDate}</span>
            </div>
          </div>
          
          {/* Terms and Submit */}
          <div className="space-y-6">
            <p className="text-sm text-gray-600">
              By submitting this review, you confirm it's{' '}
              <a href="#" className="text-blue-500 hover:underline">based on a genuine experience</a>{' '}
              and you haven't received an incentive to write it.
            </p>
            
            <button
              type="button"
              className={`w-full py-4 rounded-full font-semibold text-white ${
                rating !== null && reviewText.trim() !== '' && reviewTitle.trim() !== ''
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-blue-300 cursor-not-allowed'
              } transition-colors`}
              disabled={!(rating !== null && reviewText.trim() !== '' && reviewTitle.trim() !== '')}
            >
              Submit review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewComponent;