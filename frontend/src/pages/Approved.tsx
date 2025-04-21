import { useState, useEffect } from 'react'
import { ApprovedTestimonials } from '@/components/custom/dashboard/approved/ApprovedTestimonials'
import { Testimonial } from "@/types/testimonial";
import testimonials from "@/data/dataset";

const Approved = () => {
  const [approvedTestimonials, setApprovedTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Filter testimonials with pending status
    const loadApprovedTestimonials = () => {
      const approvedReviews = testimonials
        .filter(testimonial => testimonial.status === 'approved')
        .map(testimonial => ({
          ...testimonial,
          customer_profile: {
            ...testimonial.customer_profile,
            workspace_id: testimonial.workspace_id || 'default_workspace_id',
            created_at: testimonial.created_at || new Date(),
            updated_at: testimonial.updated_at || new Date(),
          },
        }));
      setApprovedTestimonials(approvedReviews);
      setIsLoading(false);
    };

    loadApprovedTestimonials();
  }, []);

  // Action handler for approve/reject
  const handleReviewAction = (id: string, action: 'approve' | 'reject' | 'feature' | 'archive') => {
    try {
      // Update the status of the testimonial
      const updatedTestimonials = approvedTestimonials.filter(t => {
        if (t.id === id) {
          // Update the status based on the action
          switch(action) {
            case 'feature':
              t.status = 'featured';
              break;
            case 'archive':
              t.status = 'archived';
              break;
            default:
              break;
          }
        }
        return t.status === 'approved';
      });

      setApprovedTestimonials(updatedTestimonials);
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
    <ApprovedTestimonials 
      testimonials={approvedTestimonials}
      onAction={handleReviewAction}
    />
  )
}

export default Approved