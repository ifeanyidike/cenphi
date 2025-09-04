import React from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Edit2, 
  Star, 
  UserCircle, 
  Quote,
  Globe,
  ArrowLeft 
} from "lucide-react";
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Testimonial } from '@/types/testimonial';


interface TestimonialDetailPageProps {
  testimonial: Testimonial;
  onBack: () => void;
  onApprove: () => void;
  onReject: () => void;
}

export const ViewPendingDetail: React.FC<TestimonialDetailPageProps> = ({
  testimonial,
  onBack,
  onApprove,
  onReject
}) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star 
        key={index} 
        className={`w-5 h-5 ${index < (rating ?? 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        className="mb-6 -ml-4 text-gray-600 hover:text-gray-900"
        onClick={onBack}
      >
        <ArrowLeft className="mr-2 w-5 h-5" /> Back to Reviews
      </Button>

      <Card className="w-full max-w-3xl mx-auto shadow-lg">
        <CardHeader className="bg-gray-50 border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div 
                  className="w-16 h-16 rounded-full bg-gray-400 flex items-center justify-center text-white font-semibold text-lg ring-2 ring-white overflow-hidden"
                >
                  {testimonial.customer_profile?.avatar_url ? (
                    <img 
                      src={testimonial.customer_profile.avatar_url} 
                      alt={testimonial.customer_profile.name ?? 'Customer Profile'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img 
                      src={`https://ui-avatars.com/api/?name=${testimonial.customer_profile?.name ?? 'Customer'}&background=random`} 
                      alt={testimonial.customer_profile?.name ?? 'Customer Profile'} 
                      className="w-full h-full object-cover rounded-full"
                    />
                  )}
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {testimonial.customer_profile?.name ?? 'Anonymous Customer'}
                </h2>
                <div className="text-sm text-gray-600 flex items-center space-x-2">
                  <UserCircle className="w-4 h-4" />
                  <span>
                    {testimonial.customer_profile?.title ?? 'No Title'}
                    {testimonial.customer_profile?.company && ` • ${testimonial.customer_profile.company}`}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="text-green-600 hover:bg-green-50"
                onClick={onApprove}
              >
                <CheckCircle className="w-5 h-5" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="text-red-600 hover:bg-red-50"
                onClick={onReject}
              >
                <XCircle className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              {renderStars(testimonial.rating ?? 0)}
            </div>
            <span className="text-sm text-gray-500">
              {testimonial.rating ?? 0}/5 Rating
            </span>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 relative">
            <Quote className="absolute top-2 left-2 text-gray-300 w-6 h-6" />
            <p className="text-gray-800 italic pl-8 pr-4 py-2">
              "{testimonial.content}"
            </p>
            <Quote className="absolute bottom-2 right-2 text-gray-300 w-6 h-6 rotate-180" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center">
                <Globe className="w-4 h-4 mr-2 text-gray-500" /> Source
              </h3>
              <p className="text-gray-900">{testimonial.format}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center">
                <Edit2 className="w-4 h-4 mr-2 text-gray-500" /> Submission Date
              </h3>
              <p className="text-gray-900">
                {new Date(testimonial.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewPendingDetail;