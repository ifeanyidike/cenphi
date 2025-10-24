// components/TestimonialDetail/AuthorStats.tsx - Redesigned compact version
import {
  User,
  Building2,
  Mail,
  Star,
  Calendar,
  BarChart3,
  Shield,
  Award,
  TrendingUp,
  CheckCircle2,
  Globe,
  Edit3,
  Save,
  X,
  AlertCircle,
  Clock,
} from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Testimonial } from "@/types/testimonial";
import { collection_method_map } from "@/utils/platform-utils";
import ModalPortal from "@/utils/ModalPortal";

interface AuthorData {
  author_name?: string;
  author_title?: string;
  author_company?: string;
  author_email?: string;
}

interface AuthorStatsProps {
  testimonial: Testimonial;
  artifactCount: number;
  onSaveAuthorData: (authorData: AuthorData) => Promise<void>;
}

// Edit Author Modal Component
const EditAuthorModal = ({
  isOpen,
  onClose,
  testimonial,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  testimonial: Testimonial;
  onSave: (data: AuthorData) => Promise<void>;
}) => {
  const [authorData, setAuthorData] = useState<AuthorData>({
    author_name: testimonial.author_name || "",
    author_title: testimonial.author_title || "",
    author_company: testimonial.author_company || "",
    author_email: testimonial.author_email || "",
  });
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "error">(
    "idle"
  );
  const [errors, setErrors] = useState<Partial<AuthorData>>({});

  const validateForm = () => {
    const newErrors: Partial<AuthorData> = {};

    if (!authorData.author_name?.trim()) {
      newErrors.author_name = "Name is required";
    }

    if (
      authorData.author_email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorData.author_email)
    ) {
      newErrors.author_email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaveStatus("saving");

    try {
      await onSave(authorData);
      onClose();
    } catch (error) {
      console.error("Failed to save author data:", error);
      setSaveStatus("error");
    }
  };

  const updateField = (field: keyof AuthorData, value: string) => {
    setAuthorData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal isOpen={isOpen}>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <User className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Edit Author Details
                </h2>
                <p className="text-[10px] text-slate-500">
                  Update testimonial author information
                </p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Form Content */}
          <div className="p-5 space-y-4">
            {/* Name Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <User className="h-3 w-3" />
                Full Name *
              </label>
              <input
                type="text"
                value={authorData.author_name || ""}
                onChange={(e) => updateField("author_name", e.target.value)}
                placeholder="Enter the author's full name"
                className={`w-full px-3 py-2 text-xs border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all ${
                  errors.author_name
                    ? "border-red-300 focus:ring-red-300"
                    : "border-slate-200"
                }`}
              />
              {errors.author_name && (
                <p className="text-[10px] text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-2.5 w-2.5" />
                  {errors.author_name}
                </p>
              )}
            </div>

            {/* Title Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Award className="h-3 w-3" />
                Job Title
              </label>
              <input
                type="text"
                value={authorData.author_title || ""}
                onChange={(e) => updateField("author_title", e.target.value)}
                placeholder="e.g., Senior Software Engineer, CEO"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all"
              />
            </div>

            {/* Company Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Building2 className="h-3 w-3" />
                Company
              </label>
              <input
                type="text"
                value={authorData.author_company || ""}
                onChange={(e) => updateField("author_company", e.target.value)}
                placeholder="Company or organization name"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all"
              />
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Mail className="h-3 w-3" />
                Email Address
              </label>
              <input
                type="email"
                value={authorData.author_email || ""}
                onChange={(e) => updateField("author_email", e.target.value)}
                placeholder="author@company.com"
                className={`w-full px-3 py-2 text-xs border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all ${
                  errors.author_email
                    ? "border-red-300 focus:ring-red-300"
                    : "border-slate-200"
                }`}
              />
              {errors.author_email && (
                <p className="text-[10px] text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-2.5 w-2.5" />
                  {errors.author_email}
                </p>
              )}
            </div>

            {/* Error Message */}
            {saveStatus === "error" && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-3 w-3" />
                  <span className="text-xs font-medium">
                    Failed to save changes. Please try again.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <p className="text-[10px] text-slate-500">* Required fields</p>
            <div className="flex items-center gap-2">
              <Button
                onClick={onClose}
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs border-slate-200"
                disabled={saveStatus === "saving"}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                size="sm"
                className="h-8 px-3 text-xs bg-slate-900 hover:bg-slate-800"
                disabled={saveStatus === "saving"}
              >
                {saveStatus === "saving" ? (
                  <>
                    <Clock className="h-3 w-3 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-3 w-3 mr-1.5" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

// Main Component
const AuthorStats = ({
  testimonial,
  artifactCount,
  onSaveAuthorData,
}: AuthorStatsProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const isVideoTestimonial = testimonial.type === "video";

  const daysSinceCreation = Math.floor(
    (Date.now() - new Date(testimonial.created_at).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
      case "published":
        return {
          color: "text-emerald-700 bg-emerald-50 border-emerald-200",
          icon: CheckCircle2,
          label: "Published",
        };
      case "pending":
        return {
          color: "text-amber-700 bg-amber-50 border-amber-200",
          icon: Clock,
          label: "Pending",
        };
      case "draft":
        return {
          color: "text-slate-700 bg-slate-50 border-slate-200",
          icon: BarChart3,
          label: "Draft",
        };
      default:
        return {
          color: "text-slate-700 bg-slate-50 border-slate-200",
          icon: Shield,
          label: status,
        };
    }
  };

  const statusConfig = getStatusConfig(testimonial.status);
  const StatusIcon = statusConfig.icon;

  const handleSaveAuthor = async (authorData: AuthorData) => {
    await onSaveAuthorData(authorData);
  };

  return (
    <>
      {/* Author Card */}
      <Card className="border border-slate-200 bg-white overflow-hidden">
        <CardContent className="p-4 space-y-4">
          {/* Header with Edit */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center">
                <User className="h-3 w-3 text-slate-600" />
              </div>
              <h3 className="text-xs font-semibold text-slate-900">Author</h3>
            </div>
            <Button
              onClick={() => setIsEditModalOpen(true)}
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[10px] hover:bg-slate-100"
            >
              <Edit3 className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </div>

          {/* Author Info */}
          <div className="flex items-center gap-3">
            {testimonial.author_avatar_url ? (
              <img
                src={testimonial.author_avatar_url}
                alt={testimonial.author_name || "Author"}
                className="w-10 h-10 rounded-lg object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <User className="h-5 w-5 text-slate-400" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold text-slate-900 truncate">
                {testimonial.author_name || "Anonymous"}
              </h4>
              {testimonial.author_title && (
                <p className="text-[10px] text-slate-600 truncate">
                  {testimonial.author_title}
                </p>
              )}
              {testimonial.author_company && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Building2 className="h-2.5 w-2.5 text-slate-400" />
                  <span className="text-[10px] text-slate-500 truncate">
                    {testimonial.author_company}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Email */}
          {testimonial.author_email && (
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
              <Mail className="h-3 w-3 text-slate-400 flex-shrink-0" />
              <span className="text-[10px] text-slate-600 truncate">
                {testimonial.author_email}
              </span>
            </div>
          )}

          {/* Rating */}
          {testimonial.rating && (
            <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < testimonial.rating!
                          ? "text-amber-500 fill-amber-500"
                          : "text-slate-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-semibold text-slate-900">
                  {testimonial.rating}.0
                </span>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-slate-100" />

          {/* Stats Grid */}
          <div className="space-y-2">
            {/* Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusIcon className="h-3 w-3 text-slate-400" />
                <span className="text-[10px] text-slate-600">Status</span>
              </div>
              <Badge
                className={`text-[10px] px-2 py-0.5 ${statusConfig.color}`}
                variant="outline"
              >
                {statusConfig.label}
              </Badge>
            </div>

            {/* Type */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isVideoTestimonial ? (
                  <Award className="h-3 w-3 text-slate-400" />
                ) : (
                  <Globe className="h-3 w-3 text-slate-400" />
                )}
                <span className="text-[10px] text-slate-600">Type</span>
              </div>
              <span className="text-[10px] font-medium text-slate-900 uppercase">
                {testimonial.type}
              </span>
            </div>

            {/* Collection */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3 w-3 text-slate-400" />
                <span className="text-[10px] text-slate-600">Collection</span>
              </div>
              <span className="text-[10px] font-medium text-slate-900 capitalize">
                {collection_method_map(testimonial.collection_method)}
              </span>
            </div>

            {/* Artifacts */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3 text-slate-400" />
                <span className="text-[10px] text-slate-600">Artifacts</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-slate-900">
                  {artifactCount}
                </span>
                {artifactCount > 0 && (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                )}
              </div>
            </div>

            {/* Created */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 text-slate-400" />
                <span className="text-[10px] text-slate-600">Created</span>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-medium text-slate-900">
                  {new Date(testimonial.created_at).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          {testimonial.tags && testimonial.tags.length > 0 && (
            <>
              <div className="border-t border-slate-100" />
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Tags
                </p>
                <div className="flex flex-wrap gap-1">
                  {testimonial.tags.slice(0, 3).map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-700 border-0"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {testimonial.tags.length > 3 && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-500 border-0"
                    >
                      +{testimonial.tags.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <EditAuthorModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        testimonial={testimonial}
        onSave={handleSaveAuthor}
      />
    </>
  );
};

export default AuthorStats;
