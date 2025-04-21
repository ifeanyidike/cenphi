import { useState, useEffect } from 'react'
import { RejectedTestimonials } from '@/components/custom/dashboard/rejected/RejectedTestimonials'
import { Testimonial } from "@/types/testimonial";
import testimonials from "@/data/dataset";

const Rejected = () => {
  const [rejectedTestimonials, setRejectedTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Filter testimonials with rejected status
    const loadRejectedTestimonials = () => {
      const rejectedReviews = testimonials
        .filter(testimonial => testimonial.status === 'rejected')
        .map(testimonial => ({
          ...testimonial,
          customer_profile: {
            ...testimonial.customer_profile,
            workspace_id: testimonial.workspace_id || 'default_workspace_id',
            created_at: testimonial.created_at || new Date(),
            updated_at: testimonial.updated_at || new Date(),
          },
        }));
      setRejectedTestimonials(rejectedReviews);
      setIsLoading(false);
    };

    loadRejectedTestimonials();
  }, []);

  // Action handler for approve/reject
  const handleReviewAction = (id: string, action: 'approve' | 'reject' | 'feature' | 'archive' | 'pending' | 'delete') => {
    try {
      // Update the status of the testimonial
      const updatedTestimonials = rejectedTestimonials.filter(t => {
        if (t.id === id) {
          // Update the status based on the action
          switch(action) {
            case 'pending':
              t.status = 'pending_review';
              break;
            case 'delete':
              t.status = 'deleted';
              break;
            default:
              break;
          }
        }
        return t.status === 'rejected'; // Keep only rejected reviews
      });

      setRejectedTestimonials(updatedTestimonials);
    } catch (err) {
      // Handle any errors
      console.error('Failed to perform action', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <RejectedTestimonials 
      testimonials={rejectedTestimonials}
      onAction={handleReviewAction}
    />
  )
}

export default Rejected