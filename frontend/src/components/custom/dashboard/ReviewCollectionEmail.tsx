
import ReviewInvitationFooter from '@/components/custom/dashboard/ReviewInvitationFooter';
import { StarIcon } from 'lucide-react';

interface ReviewCollectionEmailProps {
  customerName?: string;
  companyName?: string;
  reviewPlatform?: string;
  logoUrl?: string;
}

const ReviewCollectionEmail: React.FC<ReviewCollectionEmailProps> = ({
  customerName,
  companyName,
  reviewPlatform,
  logoUrl
}) => {
  // Default props if not provided
  const name = customerName || "Valued Customer";
  const company = companyName || "Our Company";
  const platform = reviewPlatform || "Cenphi.io";
  
  return (
    <div className="max-w-2xl mx-auto bg-gradient-to-b from-white to-gray-50 rounded-lg shadow-lg overflow-hidden">
      {/* Header with branding */}
      <div className="bg-indigo-900 px-8 py-6 flex justify-between items-center">
        <div className="flex items-center">
          {logoUrl ? (
            <img src={logoUrl} alt={`${company} logo`} className="h-10 w-auto mr-3" />
          ) : (
            <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center mr-3">
              <span className="text-indigo-900 font-bold text-xl">{company.charAt(0)}</span>
            </div>
          )}
          <h1 className="text-white font-bold text-xl">{company}</h1>
        </div>
        <div className="bg-yellow-400 px-3 py-1 rounded-full">
          <span className="text-indigo-900 font-semibold text-sm">Feedback Request</span>
        </div>
      </div>
      
      {/* Main content */}
      <div className="p-8">
        <div className="space-y-8">
          {/* Personalized greeting */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Hello, {name}</h2>
            <p className="text-lg text-gray-600">Thanks for choosing <span className="font-semibold text-indigo-700">{company}</span>.</p>
          </div>
          
          {/* Introduction */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <p className="text-gray-700 leading-relaxed">
              Your feedback is incredibly valuable to us. By sharing your experience, you'll help us enhance our services and assist others in making informed decisions.
            </p>
          </div>
          
          {/* Rating section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
                <span className="text-indigo-600 font-bold">?</span>
              </span>
              How was your experience with us?
            </h3>
            
            {/* Rating options */}
            <div className="space-y-4">
              {[
                { stars: 5, color: "text-emerald-500", label: "Excellent" },
                { stars: 4, color: "text-green-500", label: "Good" },
                { stars: 3, color: "text-yellow-500", label: "Average" },
                { stars: 2, color: "text-orange-500", label: "Poor" },
                { stars: 1, color: "text-red-500", label: "Terrible" }
              ].map((rating, index) => (
                <label key={index} className="flex items-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                  <input type="radio" name="rating" className="mr-3 h-5 w-5 accent-indigo-600" />
                  <div className="flex items-center">
                    <div className="flex mr-3">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon 
                          key={i} 
                          className={`w-6 h-6 ${i < rating.stars ? rating.color : "text-gray-300"}`} 
                          fill={i < rating.stars ? "currentColor" : "none"} 
                        />
                      ))}
                    </div>
                    <span className={`font-medium ${rating.color}`}>{rating.label}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
          
          {/* Information about review usage */}
          <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-100">
            <p className="text-indigo-800">
              All reviews will be published on <span className="font-semibold">{platform}</span> to help future customers make informed decisions. Your honest feedback, whether positive or constructive, is greatly appreciated.
            </p>
          </div>
          
          {/* Call to action */}
          <div className="text-center">
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-colors">
              Submit Your Review
            </button>
          </div>
          
          {/* Sign-off */}
          <div className="pt-4">
            <p className="text-gray-700">Thank you for your time,</p>
            <p className="text-indigo-700 font-semibold">The {company} Team</p>
          </div>
          
          {/* Notice */}
          <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-500 italic">
            This is a one-time request. You won't receive further reminders about this experience.
          </div>
        </div>
      </div>
      
      {/* Divider */}
      <div className="border-t border-gray-200 mx-8"></div>
      
      {/* Footer */}
      <div className="px-8 pb-8 pt-6">
        <ReviewInvitationFooter companyName={company} reviewPlatform={platform} />
      </div>
    </div>
  );
};

export default ReviewCollectionEmail; 