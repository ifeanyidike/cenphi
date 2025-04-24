import { useState, useEffect } from 'react'
import { RejectedTestimonials } from '@/components/custom/dashboard/rejected/RejectedTestimonials'
import { Testimonial } from "@/types/testimonial";
import testimonials from "@/data/dataset";

// Define the action type matching the child component's expectation
type ActionType = 'approve' | 'reject' | 'feature' | 'archive' | 'delete' | 'pending' | 'view_more' | 'return_to_pending';

const Rejected = () => {
  const [rejectedTestimonials, setRejectedTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Filter testimonials with rejected status
    const loadRejectedTestimonials = () => {
      const rejectedReviews = testimonials
        .filter(testimonial => testimonial.status === 'rejected')
        .map(testimonial => {
          // Ensure we have all required fields from the dataset structure
          return {
            ...testimonial,
            // Ensure workspace_id exists
            workspace_id: testimonial.workspace_id || 'default_workspace_id',
            // Make sure customer_profile has all required fields
            customer_profile: {
              ...testimonial.customer_profile,
              workspace_id: testimonial.customer_profile?.workspace_id || testimonial.workspace_id || 'default_workspace_id',
              id: testimonial.customer_profile?.id || 'default_id',
              created_at: testimonial.customer_profile?.created_at || testimonial.created_at || new Date(),
              updated_at: testimonial.customer_profile?.updated_at || testimonial.updated_at || new Date(),
            },
            // Ensure analyses array exists, even if empty
            analyses: testimonial.analyses || [],
            // Ensure created_at and updated_at exist
            created_at: testimonial.created_at || new Date(),
            updated_at: testimonial.updated_at || new Date(),
            // Ensure other required fields from the dataset
            verification_status: testimonial.verification_status || 'pending',
            testimonial_type: testimonial.testimonial_type || 'customer',
            format: testimonial.format || 'text',
            language: testimonial.language || 'en',
            collection_method: testimonial.collection_method || 'custom',
          };
        });
      
      setRejectedTestimonials(rejectedReviews);
      setIsLoading(false);
    };
    
    loadRejectedTestimonials();
  }, []);
  
  // Action handler with updated type signature
  const handleReviewAction = (id: string, action: ActionType) => {
    try {
      // Process the testimonials without modifying state directly
      setRejectedTestimonials(prevTestimonials => {
        // Find the testimonial to update
        const testimonialIndex = prevTestimonials.findIndex(t => t.id === id);
        
        if (testimonialIndex === -1) {
          return prevTestimonials; // No matching testimonial found
        }
        
        // Create deep copies to avoid state mutation issues
        const updatedAll = [...prevTestimonials];
        const testimonialToUpdate = { 
          ...updatedAll[testimonialIndex],
          updated_at: new Date() // Update the timestamp
        };
        
        // Update the status based on the action
        switch(action) {
          case 'pending':
          case 'return_to_pending':
            testimonialToUpdate.status = 'pending';
            break;
          case 'delete':
            testimonialToUpdate.status = 'deleted';
            break;
          case 'approve':
            testimonialToUpdate.status = 'approved';
            testimonialToUpdate.published = true;
            testimonialToUpdate.published_at = new Date();
            break;
          case 'archive':
            testimonialToUpdate.status = 'archived';
            break;
          case 'view_more':
            // Handle view more action if needed
            return prevTestimonials; // No status change for view_more
          default:
            return prevTestimonials; // No changes for unhandled actions
        }
        
        // Update the testimonial in the copied array
        updatedAll[testimonialIndex] = testimonialToUpdate;
        
        // Return only testimonials that are still rejected
        return updatedAll.filter(t => t.status === 'rejected');
      });
    } catch (err) {
      // Handle any errors
      console.error('Failed to perform action', err);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-4 border-gray-200 rounded-full animate-spin mx-auto mb-4 border-t-blue-500"></div>
          <p className="text-gray-600">Loading rejected testimonials...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      {rejectedTestimonials.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-600">No rejected testimonials found.</p>
        </div>
      ) : (
        <RejectedTestimonials 
          testimonials={rejectedTestimonials} 
          onAction={handleReviewAction} 
        />
      )}
    </div>
  )
}

export default Rejected