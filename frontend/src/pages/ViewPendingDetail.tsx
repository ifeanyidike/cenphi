
import ViewPendingDetail from '@/components/custom/dashboard/ViewPendingDetail'

export const ViewPendingReview = () => {
  return (
    <div>
        <ViewPendingDetail 
            testimonial={{ id: '1', content: "Sample testimonial" }} 
            onBack={() => console.log('Back clicked')} 
            onApprove={() => console.log('Approved')} 
            onReject={() => console.log('Rejected')} 
        />
    </div>
  )
}
