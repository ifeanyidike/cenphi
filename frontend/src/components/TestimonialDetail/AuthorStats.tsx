// // components/TestimonialDetail/AuthorStats.tsx
// import {
//   User,
//   Building2,
//   Mail,
//   Star,
//   Calendar,
//   Clock,
//   BarChart3,
//   Shield,
//   Award,
//   TrendingUp,
//   CheckCircle2,
//   Globe,
// } from "lucide-react";
// import { Card, CardContent, CardHeader } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Testimonial } from "@/types/testimonial";

// interface PremiumAuthorStatsProps {
//   testimonial: Testimonial;
//   artifactCount: number;
// }

// const AuthorStats = ({
//   testimonial,
//   artifactCount,
// }: PremiumAuthorStatsProps) => {
//   const isVideoTestimonial = testimonial.type === "video";

//   // Calculate days since creation
//   const daysSinceCreation = Math.floor(
//     (Date.now() - new Date(testimonial.created_at).getTime()) /
//       (1000 * 60 * 60 * 24)
//   );

//   // Get status color and icon
//   const getStatusConfig = (status: string) => {
//     switch (status.toLowerCase()) {
//       case "approved":
//       case "published":
//         return {
//           color: "text-emerald-700 bg-emerald-50 border-emerald-200",
//           icon: CheckCircle2,
//           label: "Published",
//         };
//       case "pending":
//         return {
//           color: "text-amber-700 bg-amber-50 border-amber-200",
//           icon: Clock,
//           label: "Pending Review",
//         };
//       case "draft":
//         return {
//           color: "text-slate-700 bg-slate-50 border-slate-200",
//           icon: BarChart3,
//           label: "Draft",
//         };
//       default:
//         return {
//           color: "text-slate-700 bg-slate-50 border-slate-200",
//           icon: Shield,
//           label: status,
//         };
//     }
//   };

//   const statusConfig = getStatusConfig(testimonial.status);
//   const StatusIcon = statusConfig.icon;

//   return (
//     <div className="space-y-6">
//       {/* Author Details Card */}
//       <Card className="border-0 shadow-lg shadow-slate-100 bg-gradient-to-br from-white to-slate-50/30">
//         <CardHeader className="pb-6">
//           <div className="flex items-center gap-4">
//             <div className="relative">
//               {testimonial.author_avatar_url ? (
//                 <div className="relative">
//                   <img
//                     src={testimonial.author_avatar_url}
//                     alt={testimonial.author_name || "Author"}
//                     className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white shadow-md"
//                   />
//                   <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-3 border-white flex items-center justify-center">
//                     <CheckCircle2 className="h-3 w-3 text-white" />
//                   </div>
//                 </div>
//               ) : (
//                 <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center ring-4 ring-white shadow-md">
//                   <User className="h-8 w-8 text-slate-400" />
//                 </div>
//               )}
//             </div>

//             <div className="flex-1 min-w-0">
//               <h3 className="text-xl font-semibold text-slate-900 truncate">
//                 {testimonial.author_name || "Anonymous"}
//               </h3>
//               {testimonial.author_title && (
//                 <p className="text-sm font-medium text-slate-600 mt-0.5">
//                   {testimonial.author_title}
//                 </p>
//               )}
//               {testimonial.author_company && (
//                 <div className="flex items-center gap-2 mt-2">
//                   <Building2 className="h-3.5 w-3.5 text-slate-400" />
//                   <span className="text-sm text-slate-600 font-medium">
//                     {testimonial.author_company}
//                   </span>
//                 </div>
//               )}
//             </div>
//           </div>
//         </CardHeader>

//         <CardContent className="pt-0 space-y-4">
//           {/* Contact Information */}
//           {testimonial.author_email && (
//             <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-slate-100">
//               <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
//                 <Mail className="h-4 w-4 text-slate-600" />
//               </div>
//               <span className="text-sm text-slate-700 font-medium">
//                 {testimonial.author_email}
//               </span>
//             </div>
//           )}

//           {/* Rating Display */}
//           {testimonial.rating && (
//             <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <div className="flex items-center gap-1 mb-1">
//                     {[...Array(5)].map((_, i) => (
//                       <Star
//                         key={i}
//                         className={`h-4 w-4 ${
//                           i < testimonial.rating!
//                             ? "text-amber-500 fill-amber-500"
//                             : "text-slate-300"
//                         }`}
//                       />
//                     ))}
//                   </div>
//                   <p className="text-xs text-slate-600 font-medium">
//                     Customer Rating
//                   </p>
//                 </div>
//                 <div className="text-right">
//                   <div className="text-2xl font-bold text-slate-900">
//                     {testimonial.rating}.0
//                   </div>
//                   <p className="text-xs text-slate-500">out of 5</p>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Tags */}
//           {testimonial.tags && testimonial.tags.length > 0 && (
//             <div>
//               <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
//                 Tags
//               </p>
//               <div className="flex flex-wrap gap-1.5">
//                 {testimonial.tags.slice(0, 4).map((tag, index) => (
//                   <Badge
//                     key={index}
//                     variant="secondary"
//                     className="text-xs px-2 py-1 bg-slate-100 text-slate-700 border-0 font-medium"
//                   >
//                     {tag}
//                   </Badge>
//                 ))}
//                 {testimonial.tags.length > 4 && (
//                   <Badge
//                     variant="secondary"
//                     className="text-xs px-2 py-1 bg-slate-100 text-slate-500 border-0"
//                   >
//                     +{testimonial.tags.length - 4}
//                   </Badge>
//                 )}
//               </div>
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {/* Quick Stats Card */}
//       <Card className="border-0 shadow-lg shadow-slate-100 bg-gradient-to-br from-white to-slate-50/30">
//         <CardHeader className="pb-4">
//           <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
//             <BarChart3 className="h-5 w-5 text-slate-600" />
//             Overview
//           </h3>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           {/* Status */}
//           <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-slate-100">
//             <div className="flex items-center gap-3">
//               <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
//                 <StatusIcon className="h-4 w-4 text-slate-600" />
//               </div>
//               <span className="text-sm font-medium text-slate-700">Status</span>
//             </div>
//             <Badge
//               className={`border font-medium text-xs px-3 py-1 ${statusConfig.color}`}
//               variant="outline"
//             >
//               {statusConfig.label}
//             </Badge>
//           </div>

//           {/* Type */}
//           <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-slate-100">
//             <div className="flex items-center gap-3">
//               <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
//                 {isVideoTestimonial ? (
//                   <Award className="h-4 w-4 text-slate-600" />
//                 ) : (
//                   <Globe className="h-4 w-4 text-slate-600" />
//                 )}
//               </div>
//               <span className="text-sm font-medium text-slate-700">Type</span>
//             </div>
//             <Badge
//               variant="outline"
//               className={`border font-medium text-xs px-3 py-1 ${
//                 isVideoTestimonial
//                   ? "text-indigo-700 bg-indigo-50 border-indigo-200"
//                   : "text-slate-700 bg-slate-50 border-slate-200"
//               }`}
//             >
//               {testimonial.type?.toUpperCase()}
//             </Badge>
//           </div>

//           {/* Collection Method */}
//           <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-slate-100">
//             <div className="flex items-center gap-3">
//               <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
//                 <TrendingUp className="h-4 w-4 text-slate-600" />
//               </div>
//               <span className="text-sm font-medium text-slate-700">
//                 Collection
//               </span>
//             </div>
//             <span className="text-sm font-semibold text-slate-900 capitalize">
//               {testimonial.collection_method}
//             </span>
//           </div>

//           {/* Artifacts Count */}
//           <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-slate-100">
//             <div className="flex items-center gap-3">
//               <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
//                 <Shield className="h-4 w-4 text-slate-600" />
//               </div>
//               <span className="text-sm font-medium text-slate-700">
//                 Artifacts
//               </span>
//             </div>
//             <div className="flex items-center gap-2">
//               <span className="text-sm font-semibold text-slate-900">
//                 {artifactCount}
//               </span>
//               {artifactCount > 0 && (
//                 <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
//               )}
//             </div>
//           </div>

//           {/* Created Date */}
//           <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-slate-100">
//             <div className="flex items-center gap-3">
//               <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
//                 <Calendar className="h-4 w-4 text-slate-600" />
//               </div>
//               <span className="text-sm font-medium text-slate-700">
//                 Created
//               </span>
//             </div>
//             <div className="text-right">
//               <div className="text-sm font-semibold text-slate-900">
//                 {new Date(testimonial.created_at).toLocaleDateString("en-US", {
//                   month: "short",
//                   day: "numeric",
//                   year: "numeric",
//                 })}
//               </div>
//               <div className="text-xs text-slate-500">
//                 {daysSinceCreation === 0
//                   ? "Today"
//                   : daysSinceCreation === 1
//                     ? "Yesterday"
//                     : `${daysSinceCreation} days ago`}
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default AuthorStats;

// components/TestimonialDetail/PremiumAuthorStatsWithModal.tsx
import {
  User,
  Building2,
  Mail,
  Star,
  Calendar,
  Clock,
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
} from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface PremiumAuthorStatsProps {
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
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal isOpen={isOpen}>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="relative px-8 py-6 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shadow-sm">
                  <User className="h-6 w-6 text-slate-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Edit Author Details
                  </h2>
                  <p className="text-sm text-slate-600">
                    Update the testimonial author information
                  </p>
                </div>
              </div>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="hover:bg-slate-200"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-8 space-y-6">
            {/* Name Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name *
              </label>
              <input
                type="text"
                value={authorData.author_name || ""}
                onChange={(e) => updateField("author_name", e.target.value)}
                placeholder="Enter the author's full name"
                className={`w-full px-4 py-3 border rounded-2xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all ${
                  errors.author_name
                    ? "border-red-300 focus:ring-red-400"
                    : "border-slate-200"
                }`}
              />
              {errors.author_name && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.author_name}
                </p>
              )}
            </div>

            {/* Title Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Award className="h-4 w-4" />
                Job Title
              </label>
              <input
                type="text"
                value={authorData.author_title || ""}
                onChange={(e) => updateField("author_title", e.target.value)}
                placeholder="e.g., Senior Software Engineer, CEO, Marketing Director"
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all"
              />
            </div>

            {/* Company Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Company
              </label>
              <input
                type="text"
                value={authorData.author_company || ""}
                onChange={(e) => updateField("author_company", e.target.value)}
                placeholder="Company or organization name"
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all"
              />
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </label>
              <input
                type="email"
                value={authorData.author_email || ""}
                onChange={(e) => updateField("author_email", e.target.value)}
                placeholder="author@company.com"
                className={`w-full px-4 py-3 border rounded-2xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all ${
                  errors.author_email
                    ? "border-red-300 focus:ring-red-400"
                    : "border-slate-200"
                }`}
              />
              {errors.author_email && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.author_email}
                </p>
              )}
            </div>

            {/* Error Message */}
            {saveStatus === "error" && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Failed to save changes. Please try again.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">* Required fields</p>
              <div className="flex items-center gap-3">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="border-slate-200 hover:bg-slate-50"
                  disabled={saveStatus === "saving"}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-6"
                  disabled={saveStatus === "saving"}
                >
                  {saveStatus === "saving" ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

// Main Component
const PremiumAuthorStatsWithModal = ({
  testimonial,
  artifactCount,
  onSaveAuthorData,
}: PremiumAuthorStatsProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const isVideoTestimonial = testimonial.type === "video";

  // Calculate days since creation
  const daysSinceCreation = Math.floor(
    (Date.now() - new Date(testimonial.created_at).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  // Get status color and icon
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
          label: "Pending Review",
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
    <div className="space-y-6">
      {/* Author Details Card */}
      <Card className="border-0 shadow-lg shadow-slate-100 bg-gradient-to-br from-white to-slate-50/30">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-900">
              Author Details
            </CardTitle>
            <Button
              onClick={() => setIsEditModalOpen(true)}
              variant="outline"
              size="sm"
              className="border-slate-200 hover:bg-slate-50"
            >
              <Edit3 className="h-3 w-3 mr-2" />
              Edit
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              {testimonial.author_avatar_url ? (
                <div className="relative">
                  <img
                    src={testimonial.author_avatar_url}
                    alt={testimonial.author_name || "Author"}
                    className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white shadow-md"
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-3 border-white flex items-center justify-center">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center ring-4 ring-white shadow-md">
                  <User className="h-8 w-8 text-slate-400" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold text-slate-900 truncate">
                {testimonial.author_name || "Anonymous"}
              </h3>
              {testimonial.author_title && (
                <p className="text-sm font-medium text-slate-600 mt-0.5">
                  {testimonial.author_title}
                </p>
              )}
              {testimonial.author_company && (
                <div className="flex items-center gap-2 mt-2">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-sm text-slate-600 font-medium">
                    {testimonial.author_company}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-4">
          {/* Contact Information */}
          {testimonial.author_email && (
            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                <Mail className="h-4 w-4 text-slate-600" />
              </div>
              <span className="text-sm text-slate-700 font-medium">
                {testimonial.author_email}
              </span>
            </div>
          )}

          {/* Rating Display */}
          {testimonial.rating && (
            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < testimonial.rating!
                            ? "text-amber-500 fill-amber-500"
                            : "text-slate-300"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    Customer Rating
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900">
                    {testimonial.rating}.0
                  </div>
                  <p className="text-xs text-slate-500">out of 5</p>
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          {testimonial.tags && testimonial.tags.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {testimonial.tags.slice(0, 4).map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-xs px-2 py-1 bg-slate-100 text-slate-700 border-0 font-medium"
                  >
                    {tag}
                  </Badge>
                ))}
                {testimonial.tags.length > 4 && (
                  <Badge
                    variant="secondary"
                    className="text-xs px-2 py-1 bg-slate-100 text-slate-500 border-0"
                  >
                    +{testimonial.tags.length - 4}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats Card */}
      <Card className="border-0 shadow-lg shadow-slate-100 bg-gradient-to-br from-white to-slate-50/30">
        <CardHeader className="pb-4">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-slate-600" />
            Overview
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                <StatusIcon className="h-4 w-4 text-slate-600" />
              </div>
              <span className="text-sm font-medium text-slate-700">Status</span>
            </div>
            <Badge
              className={`border font-medium text-xs px-3 py-1 ${statusConfig.color}`}
              variant="outline"
            >
              {statusConfig.label}
            </Badge>
          </div>

          {/* Type */}
          <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                {isVideoTestimonial ? (
                  <Award className="h-4 w-4 text-slate-600" />
                ) : (
                  <Globe className="h-4 w-4 text-slate-600" />
                )}
              </div>
              <span className="text-sm font-medium text-slate-700">Type</span>
            </div>
            <Badge
              variant="outline"
              className={`border font-medium text-xs px-3 py-1 ${
                isVideoTestimonial
                  ? "text-indigo-700 bg-indigo-50 border-indigo-200"
                  : "text-slate-700 bg-slate-50 border-slate-200"
              }`}
            >
              {testimonial.type?.toUpperCase()}
            </Badge>
          </div>

          {/* Collection Method */}
          <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-slate-600" />
              </div>
              <span className="text-sm font-medium text-slate-700">
                Collection
              </span>
            </div>
            <span className="text-sm font-semibold text-slate-900 capitalize">
              {collection_method_map(testimonial.collection_method)}
            </span>
          </div>

          {/* Artifacts Count */}
          <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                <Shield className="h-4 w-4 text-slate-600" />
              </div>
              <span className="text-sm font-medium text-slate-700">
                Artifacts
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">
                {artifactCount}
              </span>
              {artifactCount > 0 && (
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              )}
            </div>
          </div>

          {/* Created Date */}
          <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-slate-600" />
              </div>
              <span className="text-sm font-medium text-slate-700">
                Created
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-slate-900">
                {new Date(testimonial.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
              <div className="text-xs text-slate-500">
                {daysSinceCreation === 0
                  ? "Today"
                  : daysSinceCreation === 1
                    ? "Yesterday"
                    : `${daysSinceCreation} days ago`}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <EditAuthorModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        testimonial={testimonial}
        onSave={handleSaveAuthor}
      />
    </div>
  );
};

export default PremiumAuthorStatsWithModal;
