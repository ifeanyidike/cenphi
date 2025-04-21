import { useState } from "react";
import { X, Volume2, Film, ImageIcon, MessageSquare, Badge, Star, ChevronRight } from "lucide-react";
import { Dialog } from "@headlessui/react";
import { Testimonial } from "@/types/testimonial";
import { AudioPlayer } from "@/components/custom/dashboard/AudioPlayer";
import { VideoPlayer } from "@/components/custom/dashboard/VideoPlayer";

export const ReviewDetailModal = ({ testimonial }: { testimonial: Testimonial }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-indigo-600 flex items-center font-medium text-sm hover:text-indigo-700 transition-all"
      >
        Details
        <ChevronRight className="h-5 w-5 ml-1" />
      </button>

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="fixed inset-0 z-50 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          
          <div className="relative bg-white rounded-2xl max-w-3xl w-full mx-4 p-8 shadow-2xl">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="space-y-6">
              {/* Media Display */}
              <div className="relative rounded-xl overflow-hidden bg-gray-100">
                {testimonial.format === 'video' && (
                  <div className="aspect-video">
                    <VideoPlayer testimonial={testimonial} />
                  </div>
                )}
                
                {testimonial.format === 'audio' && (
                  <div className="p-6">
                    <AudioPlayer testimonial={testimonial} />
                  </div>
                )}
                
                {testimonial.format === 'image' && (
             <img 
             src={(Array.isArray(testimonial.media_urls) ? testimonial.media_urls[0] : testimonial.media_urls) || ''} 
             alt={testimonial.content || "Testimonial image"} 
             className="w-full h-full object-contain max-h-[70vh]" 
           />
                )}
                
                {testimonial.format === 'text' && (
                  <div className="p-6 flex items-center justify-center text-gray-500">
                    <MessageSquare className="h-12 w-12" />
                  </div>
                )}
              </div>

              {/* Review Content */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-medium">
                    {testimonial.customer_profile?.name ? testimonial.customer_profile?.name.substring(0, 1).toUpperCase() : "?"}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{testimonial.customer_profile?.name}</h3>
                      <p className="text-sm text-gray-500">{testimonial.customer_profile?.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < (testimonial.rating ?? 0)
                            ? "text-yellow-400 fill-yellow-400" 
                            : "text-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-gray-700 leading-relaxed">{testimonial.content}</p>
                
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Badge
                    className={`px-2 py-1 rounded-full ${
                      testimonial.status === "approved" ? "bg-green-50 text-green-600" :
                      testimonial.status === "featured" ? "bg-blue-50 text-blue-600" :
                      testimonial.status === "archived" ? "bg-blue-50 text-brown-600" :
                      testimonial.status === "rejected" ? "bg-red-50 text-red-600" :
                      testimonial.status === "pending_review" ? "bg-yellow-50 text-yellow-600" :
                      "bg-purple-50 text-purple-600"
                    }`}
                  >
                    {testimonial.status}
                  </Badge>
                  <span className="mx-1">•</span>
                  <div className="flex items-center space-x-1">
                    {testimonial.format === 'video' && <Film className="h-4 w-4" />}
                    {testimonial.format === 'audio' && <Volume2 className="h-4 w-4" />}
                    {testimonial.format === 'image' && <ImageIcon className="h-4 w-4" />}
                    <span className="capitalize">{testimonial.format}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
};