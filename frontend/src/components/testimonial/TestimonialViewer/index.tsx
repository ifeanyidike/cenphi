// components/TestimonialViewer/index.tsx

import React from "react";
import { observer } from "mobx-react-lite";
import { workspaceHub } from "../../../repo/workspace_hub";
import AudioTestimonial from "./AudioTestimonial";
import TextTestimonial from "./TextTestimonial";
import ImageTestimonial from "../image";
import VideoTestimonialView from "./VideoTestimonialView";

const TestimonialViewer: React.FC = observer(() => {
  const { uiManager, testimonialManager } = workspaceHub;
  const { activeTestimonialType } = uiManager;
  const { testimonial } = testimonialManager;

  // Render the appropriate viewer based on the testimonial type
  const renderTestimonialContent = () => {
    if (!testimonial)
      return (
        <div className="flex justify-center items-center h-64 bg-slate-50 rounded-lg">
          No testimonial selected
        </div>
      );

    switch (activeTestimonialType) {
      case "video":
        // return <VideoTestimonial testimonial={testimonial} />;
        return <VideoTestimonialView testimonial={testimonial} />;
      case "audio":
        return <AudioTestimonial testimonial={testimonial} />;
      case "text":
        return <TextTestimonial testimonial={testimonial} />;
      case "image":
        return <ImageTestimonial testimonial={testimonial} />;
      default:
        return <div>Unsupported testimonial type</div>;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-6">
        <div className="mb-6">{renderTestimonialContent()}</div>

        {testimonial && (
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center mb-3">
              {testimonial.customer_profile?.avatar_url && (
                <img
                  src={testimonial.customer_profile?.avatar_url}
                  alt={testimonial.customer_profile?.name}
                  className="w-12 h-12 rounded-full mr-4 border-2 border-blue-400"
                />
              )}
              <div>
                <h3 className="font-semibold text-slate-700">
                  {testimonial.customer_profile?.name}
                </h3>
                {testimonial.customer_profile?.title &&
                  testimonial.customer_profile?.company && (
                    <p className="text-sm text-slate-500">
                      {testimonial.customer_profile?.title},{" "}
                      {testimonial.customer_profile?.company}
                    </p>
                  )}
              </div>
              <div className="ml-auto flex items-center">
                {testimonial.custom_fields?.verified && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full mr-2">
                    Verified
                  </span>
                )}
                {testimonial.rating && (
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${i < testimonial.rating! ? "text-yellow-400" : "text-slate-300"}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs text-slate-500">
                Source:{" "}
                {testimonial.custom_fields?.source?.toLocaleString() || ""}
              </span>
              <span className="text-xs text-slate-500">
                Views: {testimonial.view_count.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500">
                Shares: {testimonial.share_count.toLocaleString()}
              </span>
              {/* <span className="text-xs text-slate-500">
                Likes: {testimonial.likes.toLocaleString()}
              </span> */}
            </div>

            {testimonial.tags && testimonial.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {testimonial.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-slate-200 text-slate-700 text-xs px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default TestimonialViewer;
