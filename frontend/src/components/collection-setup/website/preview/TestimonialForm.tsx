import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  MessageSquare,
  Camera,
  Mic,
  Video,
  Star,
  ChevronLeft,
  X,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
import {
  WidgetCustomization,
  IncentiveConfig,
  TestimonialFormField,
  TestimonialSubmission,
  FormatOption,
  BrandData,
} from "@/types/setup";
import EnhancedVideoRecorder from "@/components/collection/VideoRecorder";
import EnhancedAudioRecorder from "@/components/collection/AudioRecorder";
import ImageUploader from "@/components/collection/ImageUploader";
import RatingSelector from "@/components/collection/RatingSelector";
import SuccessMessage from "../SuccessMessage";
import { observer } from "mobx-react-lite";

interface TestimonialFormProps {
  customization: WidgetCustomization | undefined;
  brandData: BrandData;
  formats: FormatOption[];
  incentives: IncentiveConfig | undefined;
  formFields?: TestimonialFormField[];
  questions?: string[];
  onSubmit: (submission: TestimonialSubmission) => Promise<void>;
  onClose?: () => void;
  className?: string;
}

// Default form fields
const defaultFormFields: TestimonialFormField[] = [
  { id: "name", label: "Full Name", type: "text", required: true },
  { id: "email", label: "Email Address", type: "email", required: true },
  { id: "company", label: "Company", type: "text", required: false },
  { id: "jobTitle", label: "Job Title", type: "text", required: false },
];

// Animation variants
const formVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2,
      ease: "easeIn",
    },
  },
};

// Form steps
type FormStep = "format" | "content" | "details" | "review" | "success";

// Format icons
const formatIcons = {
  text: MessageSquare,
  image: Camera,
  audio: Mic,
  video: Video,
};

const TestimonialForm: React.FC<TestimonialFormProps> = observer(
  ({
    customization,
    brandData,
    formats,
    incentives,
    formFields = defaultFormFields,
    questions = ["What has been your experience with our product/service?"],
    onSubmit,
    onClose,
    className,
  }) => {
    // State
    const [currentStep, setCurrentStep] = useState<FormStep>("format");
    const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
    const [rating, setRating] = useState<number>(5);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [textContent, setTextContent] = useState("");
    const [currentQuestion] = useState(0);
    const [mediaContent, setMediaContent] = useState<Blob | null>(null);
    const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
    const [consentGiven, setConsentGiven] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Filter enabled formats
    const enabledFormats = formats.filter((format) => format.enabled);

    // Automatically select format if only one is enabled
    useEffect(() => {
      if (enabledFormats.length === 1) {
        setSelectedFormat(enabledFormats[0].type);
      }
    }, [enabledFormats]);

    // Calculate progress percentage
    const calculateProgress = () => {
      const steps: FormStep[] = ["format", "content", "details", "review"];
      const currentIndex = steps.indexOf(currentStep);
      return ((currentIndex + 1) / steps.length) * 100;
    };

    // Update form data
    const updateFormData = (field: string, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Clear error when field is updated
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    };

    // Handle format selection
    const handleFormatSelect = (format: string) => {
      setSelectedFormat(format);
      setCurrentStep("content");
    };

    // Handle media submission
    const handleMediaSubmission = (blob: Blob) => {
      setMediaContent(blob);

      // Create object URL for preview
      const url = URL.createObjectURL(blob);
      setMediaPreviewUrl(url);

      // Move to next step
      setCurrentStep("details");
    };

    // Handle text submission
    const handleTextSubmit = () => {
      if (!textContent.trim()) {
        setErrors({ textContent: "Please share your experience" });
        return;
      }

      setCurrentStep("details");
    };

    // Validate form details
    const validateDetails = () => {
      const newErrors: Record<string, string> = {};

      formFields.forEach((field) => {
        if (field.required && !formData[field.id]) {
          newErrors[field.id] = `${field.label} is required`;
        }

        if (field.id === "email" && formData.email) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(formData.email)) {
            newErrors.email = "Please enter a valid email address";
          }
        }
      });

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    // Handle details submission
    const handleDetailsSubmit = () => {
      if (validateDetails()) {
        setCurrentStep("review");
      }
    };

    // Handle final submission
    const handleSubmit = async () => {
      if (!consentGiven) {
        setErrors({ consent: "Please consent to share your testimonial" });
        return;
      }

      setIsSubmitting(true);

      try {
        const submission: TestimonialSubmission = {
          id: crypto.randomUUID().toString(),
          type: selectedFormat as "text" | "video" | "audio" | "image",
          rating,
          ...formData,
          date: new Date().toISOString(),
        } as any;

        // Add content based on format
        if (selectedFormat === "text") {
          submission.content = textContent;
        } else if (mediaContent) {
          submission.mediaContent = mediaContent;
        }

        await onSubmit(submission);
        setCurrentStep("success");
      } catch (error) {
        console.error("Error submitting testimonial:", error);
        setErrors({
          submission:
            "There was an error submitting your testimonial. Please try again.",
        });
      } finally {
        setIsSubmitting(false);
      }
    };

    // Navigate to previous step
    const goToPreviousStep = () => {
      if (currentStep === "content") {
        setCurrentStep("format");
      } else if (currentStep === "details") {
        setCurrentStep("content");
      } else if (currentStep === "review") {
        setCurrentStep("details");
      }
    };

    // Clean up object URLs when component unmounts
    useEffect(() => {
      return () => {
        if (mediaPreviewUrl) {
          URL.revokeObjectURL(mediaPreviewUrl);
        }
      };
    }, [mediaPreviewUrl]);

    // Render header with logo and title
    const renderHeader = () => (
      <div className="flex items-center gap-3 mb-4">
        {brandData.logo?.main && (
          <div className="h-10 w-10 rounded-md overflow-hidden bg-white shadow-sm flex items-center justify-center">
            <img
              src={brandData.logo.main}
              alt={brandData.name}
              className="max-h-8 max-w-8 object-contain"
            />
          </div>
        )}
        <div>
          <h2
            className="text-xl font-semibold"
            style={{ color: brandData.colors.primary }}
          >
            {customization?.widgetTitle || "Share Your Experience"}
          </h2>
          {customization?.widgetDescription && (
            <p className="text-sm text-muted-foreground">
              {customization?.widgetDescription}
            </p>
          )}
        </div>
      </div>
    );

    // Render close button
    const renderCloseButton = () => (
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 rounded-full h-8 w-8"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </Button>
    );

    // Render format selection step
    const renderFormatSelection = () => (
      <div className="space-y-6">
        <div className="text-center mb-2">
          <p className="text-sm text-center">
            Choose how you'd like to share your experience
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {enabledFormats.map((format) => {
            const Icon = formatIcons[format.type];
            return (
              <Button
                key={format.type}
                variant="outline"
                className={cn(
                  "h-auto py-6 px-4 flex flex-col items-center gap-3 hover:border-primary/50 hover:bg-primary/5"
                )}
                onClick={() => handleFormatSelect(format.type)}
              >
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${brandData.colors?.primary}20` }}
                >
                  <Icon
                    className="h-6 w-6"
                    style={{ color: brandData.colors.primary }}
                  />
                </div>
                <div className="text-center">
                  <div className="font-medium mb-1 capitalize">
                    {format.type} Testimonial
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format.type === "text" && "Share your thoughts in writing"}
                    {format.type === "video" &&
                      "Record a short video testimonial"}
                    {format.type === "audio" && "Record your voice testimonial"}
                    {format.type === "image" && "Upload a photo with text"}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>

        {incentives?.enabled && (
          <div
            className="p-4 rounded-lg text-sm flex items-center gap-3 mt-6"
            style={{
              backgroundColor: `${brandData.colors?.primary}10`,
              borderColor: `${brandData.colors?.primary}30`,
              borderWidth: 1,
              borderStyle: "solid",
            }}
          >
            <Gift
              className="h-5 w-5 flex-shrink-0"
              style={{ color: brandData.colors?.primary }}
            />
            <div>
              <p
                className="font-medium"
                style={{ color: brandData.colors?.primary }}
              >
                Get {incentives.value} for sharing!
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Complete your{" "}
                {incentives.minimumQualification?.testimonialType?.includes(
                  "video"
                )
                  ? "video"
                  : "testimonial"}{" "}
                to receive your reward.
              </p>
            </div>
          </div>
        )}
      </div>
    );

    // Render content collection step
    const renderContentCollection = () => {
      if (!selectedFormat) return null;

      return (
        <div>
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1"
              onClick={goToPreviousStep}
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <div className="text-center flex-1">
              <h3 className="text-base font-medium">
                {selectedFormat === "text"
                  ? "Share Your Thoughts"
                  : selectedFormat === "video"
                    ? "Record Your Video"
                    : selectedFormat === "audio"
                      ? "Record Your Voice"
                      : "Upload Your Photo"}
              </h3>
            </div>
            <div className="w-16"></div> {/* Spacer for alignment */}
          </div>

          {selectedFormat === "text" && (
            <div className="space-y-4">
              <RatingSelector
                rating={rating}
                onChange={setRating}
                primaryColor={brandData.colors.primary}
              />

              <div className="space-y-2">
                <Label htmlFor="testimonial-text">
                  {questions[currentQuestion]}
                </Label>
                <Textarea
                  id="testimonial-text"
                  placeholder="Share your experience here..."
                  className="min-h-[150px] resize-y"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                />
                {errors.textContent && (
                  <p className="text-destructive text-xs">
                    {errors.textContent}
                  </p>
                )}

                <div className="flex justify-end mt-4">
                  <Button
                    className="px-6"
                    style={{
                      backgroundColor: brandData.colors.primary,
                      color: "white",
                    }}
                    onClick={handleTextSubmit}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          )}

          {selectedFormat === "video" && (
            <div className="space-y-4">
              <EnhancedVideoRecorder
                forceMobileView
                onRecordingComplete={handleMediaSubmission}
                maxDuration={90}
                currentQuestion={questions[currentQuestion]}
                primaryColor={brandData.colors.primary}
                companyName={brandData.name}
                companyLogo={brandData.logo.main || ""}
              />
            </div>
          )}

          {selectedFormat === "audio" && (
            <div className="space-y-4">
              <EnhancedAudioRecorder
                forceMobileView
                onRecordingComplete={handleMediaSubmission}
                maxDuration={120}
                currentQuestion={questions[currentQuestion]}
                primaryColor={brandData.colors.primary}
                companyName={brandData.name}
                companyLogo={brandData.logo.main || ""}
              />
            </div>
          )}

          {selectedFormat === "image" && (
            <div className="space-y-4">
              <ImageUploader
                onImageSelected={handleMediaSubmission}
                primaryColor={brandData.colors.primary}
              />

              <div className="space-y-2 mt-4">
                <Label htmlFor="image-caption">
                  Add a caption to your image
                </Label>
                <Textarea
                  id="image-caption"
                  placeholder="Describe your experience..."
                  className="min-h-[100px]"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                />

                <div className="flex justify-end mt-4">
                  {mediaContent && (
                    <Button
                      className="px-6"
                      style={{
                        backgroundColor: brandData.colors.primary,
                        color: "white",
                      }}
                      onClick={() => setCurrentStep("details")}
                    >
                      Continue
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    };

    // Render details collection step
    const renderDetailsCollection = () => (
      <div>
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1"
            onClick={goToPreviousStep}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div className="text-center flex-1">
            <h3 className="text-base font-medium">Your Information</h3>
          </div>
          <div className="w-16"></div> {/* Spacer for alignment */}
        </div>

        <div className="space-y-4">
          {formFields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id} className="flex items-center gap-1">
                {field.label}
                {field.required && <span className="text-red-500">*</span>}
              </Label>
              {field.type === "select" ? (
                <Select
                  value={formData[field.id] || ""}
                  onValueChange={(value) => updateFormData(field.id, value)}
                >
                  <SelectTrigger id={field.id}>
                    <SelectValue placeholder={`Select ${field.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={field.id}
                  type={field.type}
                  placeholder={
                    field.placeholder ||
                    `Enter your ${field.label.toLowerCase()}`
                  }
                  value={formData[field.id] || ""}
                  onChange={(e) => updateFormData(field.id, e.target.value)}
                />
              )}
              {errors[field.id] && (
                <p className="text-destructive text-xs">{errors[field.id]}</p>
              )}
            </div>
          ))}

          <div className="flex justify-end mt-6">
            <Button
              className="px-6"
              style={{
                backgroundColor: brandData.colors.primary,
                color: "white",
              }}
              onClick={handleDetailsSubmit}
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    );

    // Render review step
    const renderReview = () => (
      <div>
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1"
            onClick={goToPreviousStep}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div className="text-center flex-1">
            <h3 className="text-base font-medium">Review Your Testimonial</h3>
          </div>
          <div className="w-16"></div> {/* Spacer for alignment */}
        </div>

        <div className="space-y-6">
          {/* Testimonial preview */}
          <div className="border rounded-lg p-4 space-y-4 bg-slate-50">
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${brandData?.colors?.primary}20` }}
              >
                {selectedFormat === "text" ? (
                  <MessageSquare
                    className="h-5 w-5"
                    style={{ color: brandData?.colors?.primary }}
                  />
                ) : selectedFormat === "video" ? (
                  <Video
                    className="h-5 w-5"
                    style={{ color: brandData?.colors?.primary }}
                  />
                ) : selectedFormat === "audio" ? (
                  <Mic
                    className="h-5 w-5"
                    style={{ color: brandData?.colors?.primary }}
                  />
                ) : (
                  <Camera
                    className="h-5 w-5"
                    style={{ color: brandData?.colors?.primary }}
                  />
                )}
              </div>
              <div>
                <p className="font-medium">{formData.name}</p>
                {formData.jobTitle && formData.company && (
                  <p className="text-xs text-muted-foreground">
                    {formData.jobTitle}, {formData.company}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="h-4 w-4"
                  fill={i < rating ? brandData?.colors?.primary : "none"}
                  stroke={
                    i < rating ? brandData?.colors?.primary : "currentColor"
                  }
                />
              ))}
            </div>

            {/* Content preview */}
            {selectedFormat === "text" && (
              <p className="text-sm">{textContent}</p>
            )}

            {selectedFormat === "video" && mediaPreviewUrl && (
              <div className="mt-2">
                <video
                  src={mediaPreviewUrl}
                  controls
                  className="w-full h-auto rounded-md"
                />
              </div>
            )}

            {selectedFormat === "audio" && mediaPreviewUrl && (
              <div className="mt-2">
                <audio src={mediaPreviewUrl} controls className="w-full" />
              </div>
            )}

            {selectedFormat === "image" && mediaPreviewUrl && (
              <div className="mt-2 space-y-2">
                <img
                  src={mediaPreviewUrl}
                  alt="Your uploaded image"
                  className="max-h-48 rounded-md mx-auto"
                />
                {textContent && (
                  <p className="text-sm italic">"{textContent}"</p>
                )}
              </div>
            )}
          </div>

          {/* Consent checkbox */}
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="consent"
                checked={consentGiven}
                onCheckedChange={(checked) =>
                  setConsentGiven(checked as boolean)
                }
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="consent"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I consent to share my testimonial
                </Label>
                <p className="text-xs text-muted-foreground">
                  By checking this box, you allow {brandData.name} to use your
                  testimonial on their website and marketing materials.
                </p>
              </div>
            </div>
            {errors.consent && (
              <p className="text-destructive text-xs">{errors.consent}</p>
            )}
          </div>

          {errors.submission && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {errors.submission}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-2">
            <Button
              className="px-6"
              style={{
                backgroundColor: brandData?.colors?.primary,
                color: "white",
              }}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Testimonial"}
            </Button>
          </div>
        </div>
      </div>
    );

    // Render success step
    const renderSuccess = () => <SuccessMessage onClose={onClose} />;

    // Render current step content
    const renderStepContent = () => {
      switch (currentStep) {
        case "format":
          return renderFormatSelection();
        case "content":
          return renderContentCollection();
        case "details":
          return renderDetailsCollection();
        case "review":
          return renderReview();
        case "success":
          return renderSuccess();
        default:
          return null;
      }
    };

    return (
      <Card
        className={cn(
          "max-w-xl w-full mx-auto overflow-hidden relative",
          className
        )}
      >
        {currentStep !== "success" && renderCloseButton()}

        <CardContent className="p-6">
          {currentStep !== "success" && renderHeader()}

          {currentStep !== "format" && currentStep !== "success" && (
            <div className="mb-6">
              <Progress
                value={calculateProgress()}
                className="h-1"
                style={
                  {
                    "--progress-background": `${brandData?.colors.primary}40`,
                    "--progress-foreground": brandData?.colors.primary,
                  } as React.CSSProperties
                }
              />
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              variants={formVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    );
  }
);

export default TestimonialForm;
