import React, { useState } from "react";
import { Send, AlertCircle, CheckCircle, Target, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

// Questions to display alongside recording
const TESTIMONIAL_QUESTIONS = [
  "What specific problem did our solution solve for you?",
  "How has our solution impacted your business or workflow?",
  "What would you tell someone considering our solution?",
];

interface RecordingState {
  status:
    | "idle"
    | "recording"
    | "stopped"
    | "uploading"
    | "completed"
    | "error";
  duration: number;
  error?: string;
}

interface TestimonialFormData {
  name: string;
  email: string;
  company: string;
  textContent: string;
  rating: number;
  workspaceId?: string;
  token?: string;
}

interface TextTestimonialProps {
  formData: TestimonialFormData;
  setFormData: (data: TestimonialFormData) => void;
  onSubmitSuccess: () => void;
}

const TextTestimonial: React.FC<TextTestimonialProps> = ({
  formData,
  setFormData,
  onSubmitSuccess,
}) => {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    status: "idle",
    duration: 0,
  });

  const submitTestimonial = async () => {
    setRecordingState((prev) => ({ ...prev, status: "uploading" }));

    try {
      // Use workspace-scoped endpoint if workspace context is available
      const endpoint = formData.workspaceId
        ? `${import.meta.env.VITE_API_URL}/collection/workspaces/${formData.workspaceId}/testimonials/form`
        : `${import.meta.env.VITE_API_URL}/api/public/testimonials`;

      const requestBody = formData.workspaceId
        ? {
            // Workspace-scoped format
            author_name: formData.name,
            author_email: formData.email,
            author_company: formData.company,
            content: formData.textContent,
            rating: formData.rating,
            type: "text",
            ...(formData.token && { tracking_token: formData.token }),
          }
        : {
            // Legacy format
            type: "text",
            author_name: formData.name,
            author_email: formData.email,
            company: formData.company,
            content: formData.textContent,
            rating: formData.rating,
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to submit text testimonial"
        );
      }

      setRecordingState((prev) => ({ ...prev, status: "completed" }));
      setTimeout(() => onSubmitSuccess(), 1000);
    } catch (error: any) {
      console.error("Error submitting testimonial:", error);
      setRecordingState({
        status: "error",
        duration: recordingState.duration,
        error:
          error.message || "Failed to submit testimonial. Please try again.",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Guidance sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-5 sticky top-4">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="h-4 w-4 text-green-600" />
              Writing Guide
            </h3>

            <div className="space-y-3 mb-4">
              {TESTIMONIAL_QUESTIONS.map((question, index) => (
                <div
                  key={index}
                  className="p-3 bg-white rounded-lg border border-gray-200"
                >
                  <div className="flex gap-2">
                    <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {question}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Tips</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Be specific about results
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Include numbers when possible
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Share honest experience
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-5">
              Share Your Experience
            </h2>

            {recordingState.error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{recordingState.error}</span>
              </div>
            )}

            {recordingState.status === "completed" && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">
                  Your testimonial has been submitted successfully!
                </span>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors"
                  placeholder="Your full name *"
                  required
                  disabled={recordingState.status === "uploading" || recordingState.status === "completed"}
                />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors"
                  placeholder="Email address *"
                  required
                  disabled={recordingState.status === "uploading" || recordingState.status === "completed"}
                />
              </div>

              <input
                type="text"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="Company name (optional)"
                disabled={recordingState.status === "uploading" || recordingState.status === "completed"}
              />

              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-medium text-gray-700">
                  Rating:
                </span>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setFormData({ ...formData, rating })}
                    className={`transition-colors ${rating <= formData.rating ? "text-yellow-400" : "text-gray-300"} disabled:opacity-50`}
                    disabled={recordingState.status === "uploading" || recordingState.status === "completed"}
                  >
                    <Star className="h-5 w-5 fill-current" />
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your testimonial
                </label>
                <textarea
                  value={formData.textContent}
                  onChange={(e) =>
                    setFormData({ ...formData, textContent: e.target.value })
                  }
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-none transition-colors"
                  placeholder="Share your experience with our solution..."
                  required
                  disabled={recordingState.status === "uploading" || recordingState.status === "completed"}
                />
              </div>

              <Button
                onClick={submitTestimonial}
                disabled={
                  !formData.name ||
                  !formData.email ||
                  !formData.textContent ||
                  recordingState.status === "uploading" ||
                  recordingState.status === "completed"
                }
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-base font-medium rounded-lg disabled:opacity-50"
              >
                {recordingState.status === "uploading" ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Submitting...
                  </>
                ) : recordingState.status === "completed" ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submitted Successfully
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Testimonial
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextTestimonial;