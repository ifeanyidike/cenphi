import ViewPendingDetail from '@/components/custom/dashboard/ViewPendingDetail'
import testimonialData  from '@/data/dataset' // Import your dataset

export const ViewPendingReview = () => {
  // Use a sample testimonial from your dataset
  const sampleTestimonial = testimonialData[0] // Get the first testimonial from your dataset
  
  return (
    <div>
        <ViewPendingDetail 
            testimonial={sampleTestimonial}
            onBack={() => console.log('Back clicked')} 
            onApprove={() => console.log('Approved')} 
            onReject={() => console.log('Rejected')} 
        />
    </div>
  )
}