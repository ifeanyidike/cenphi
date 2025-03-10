import React from 'react';

/**
 * A premium footer component for review invitation emails using Tailwind CSS
 * @param {Object} props Component props
 * @param {string} props.customerName - Name of the customer receiving the invitation
 * @param {string} props.companyName - Name of the company sending the invitation
 * @param {string} props.reviewPlatform - Review platform being used (e.g., "Trustpilot")
 * @returns {JSX.Element} - Rendered component
 */
interface ReviewInvitationFooterProps {
  companyName?: string;
  reviewPlatform?: string;
}

const ReviewInvitationFooter: React.FC<ReviewInvitationFooterProps> = ({
  companyName,
  reviewPlatform
}) => {
  // Use default values if props are not provided
  const company = companyName || "Company";
  const platform = reviewPlatform || "Trustpilot";

  return (
    <div className="p-5 mt-8 text-gray-600 text-xs font-sans leading-normal">
      <div className="max-w-2xl mx-auto text-center">
        <p className="mb-4">
          This review invitation email was sent to you by {company}, using the {platform} platform. 
          {company} is the data controller of your personal data used to send this email, and {platform} is the data processor.
        </p>
        
        <p className="mb-5">
          Not sure why you're receiving this email, or have questions about your personal data? Please contact {company} directly using the details in their Privacy Policy.
        </p>
        
        <div className="inline-block px-4 py-2 bg-gray-100 rounded text-gray-700 underline cursor-pointer">
          Unsubscribe
        </div>
      </div>
    </div>
  );
};

export default ReviewInvitationFooter;