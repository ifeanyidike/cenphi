import { useState, useEffect } from 'react'
import { PendingReviews } from '@/components/custom/dashboard/pending/PendingReviews'
import { Testimonial } from "@/types/testimonial";
import testimonials from "@/data/dataset";

const Pending = () => {
  const [pendingTestimonials, setPendingTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Filter testimonials with pending status
    const loadPendingTestimonials = () => {
      const pendingReviews = (testimonials as Testimonial[])
        .filter((testimonial) => testimonial.status === 'pending')
        .map((testimonial): Testimonial => ({
          ...testimonial,
          customer_profile: {
            ...testimonial.customer_profile,
            id: testimonial.customer_profile?.id || 'default_id',
            workspace_id: testimonial.workspace_id || 'default_workspace_id',
            created_at: testimonial.created_at || new Date(),
            updated_at: testimonial.updated_at || new Date(),
          },
        }));
      setPendingTestimonials(pendingReviews);
      setIsLoading(false);
    };

    loadPendingTestimonials();
  }, []);

  // Action handler for approve/reject
  const handleReviewAction = (id: string, action: 'approve' | 'reject' | 'feature' | 'archive') => {
    try {
      // Update the status of the testimonial
      const updatedTestimonials = pendingTestimonials.filter(t => {
        if (t.id === id) {
          // Update the status based on the action
          switch(action) {
            case 'approve':
              t.status = 'approved';
              break;
            case 'reject':
              t.status = 'rejected';
              break;
            default:
              break;
          }
        }
        return t.status === 'pending'; // Keep only pending reviews
      });

      setPendingTestimonials(updatedTestimonials);
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
    <PendingReviews 
      testimonials={pendingTestimonials}
      onAction={handleReviewAction}
    />
  )
}

export default Pending