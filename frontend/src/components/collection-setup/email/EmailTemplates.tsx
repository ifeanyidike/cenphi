// import React, { useState } from "react";
// import { motion } from "framer-motion";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import {
//   Eye,
//   Edit,
//   Copy,
//   Check,
//   Mail,
//   Clock,
//   Gift,
//   MessageSquare,
//   Sparkles,
//   Smartphone,
//   Laptop,
//   Plus,
//   AlertCircle,
//   RefreshCw,
//   CheckCircle,
//   Save,
// } from "lucide-react";
// import { cn } from "@/lib/utils";
// import {
//   CollectionSettings,
//   TestimonialFormat,
//   EmailTemplate,
// } from "@/types/setup";

// // Import template previews
// import SimpleTemplate from "../email/templates/SimpleTemplate";
// import FollowUpTemplate from "../email/templates/FollowUpTemplate";
// import IncentiveTemplate from "../email/templates/IncentiveTemplate";
// import MediaRichTemplate from "../email/templates/MediaRichTemplate";

// interface EmailTemplatesProps {
//   templates: EmailTemplate[];
//   activeTemplateId: string;
//   onSelectTemplate: (templateId: string) => void;
//   primaryColor: string;
//   senderName: string;
//   senderEmail: string;
//   formats: TestimonialFormat[];
//   showToast: (toast: {
//     title: string;
//     description: string;
//     variant?: "default" | "destructive";
//   }) => void;
//   replyToEmail: string;
//   senderType: "personal" | "company";
//   companyLogo?: string;
//   signatureTemplate: CollectionSettings["email"]["signatureTemplate"];
//   signatureText?: string;
// }

// // Animation variants
// const itemVariants = {
//   hidden: { opacity: 0, y: 20 },
//   visible: {
//     opacity: 1,
//     y: 0,
//     transition: {
//       duration: 0.5,
//       ease: [0.22, 1, 0.36, 1],
//     },
//   },
// };

// const EmailTemplates: React.FC<EmailTemplatesProps> = ({
//   templates,
//   activeTemplateId,
//   onSelectTemplate,
//   primaryColor,
//   senderName,
//   // senderEmail,
//   formats,
//   showToast,
//   companyLogo,
//   replyToEmail,
//   signatureTemplate,
//   signatureText,
//   senderType,
// }) => {
//   const [showPreviewDialog, setShowPreviewDialog] = useState(false);
//   const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(
//     null
//   );
//   const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">(
//     "desktop"
//   );
//   const [editMode, setEditMode] = useState(false);
//   const [copied, setCopied] = useState(false);

//   // Get the active template
//   const activeTemplate =
//     templates.find((t) => t.id === activeTemplateId) || templates[0];

//   // Handle template preview
//   const handlePreview = (templateId: string) => {
//     setPreviewTemplateId(templateId);
//     setShowPreviewDialog(true);
//   };

//   // Handle template selection
//   const handleSelectTemplate = (templateId: string) => {
//     onSelectTemplate(templateId);
//     showToast({
//       title: "Template Selected",
//       description: "Email template has been updated successfully.",
//       variant: "default",
//     });
//   };

//   // Handle edit mode toggle
//   const handleEditToggle = () => {
//     setEditMode(!editMode);
//   };

//   // Handle copy HTML
//   const handleCopyHtml = () => {
//     // In a real implementation, this would copy the template HTML
//     setCopied(true);

//     showToast({
//       title: "HTML Copied",
//       description: "Email template HTML has been copied to clipboard.",
//       variant: "default",
//     });

//     setTimeout(() => {
//       setCopied(false);
//     }, 2000);
//   };

//   // Render template preview based on type
//   const renderTemplatePreview = (
//     template: EmailTemplate,
//     previewMode: boolean = false
//   ) => {
//     const templateType = template.name.toLowerCase();

//     if (templateType.includes("simple") || templateType.includes("basic")) {
//       return (
//         <SimpleTemplate
//           senderName={senderName}
//           primaryColor={primaryColor}
//           formats={formats}
//           previewMode={previewMode}
//           replyToEmail={replyToEmail}
//           signatureTemplate={signatureTemplate}
//           companyLogo={companyLogo}
//           signatureText={signatureText}
//           senderType={senderType}
//         />
//       );
//     } else if (
//       templateType.includes("incentive") ||
//       templateType.includes("reward")
//     ) {
//       return (
//         <IncentiveTemplate
//           companyName="Your Company"
//           primaryColor={primaryColor}
//           incentiveType="discount"
//           incentiveValue="10% off your next purchase"
//           recipientName="John Doe"
//           isPreview={previewMode}
//         />
//       );
//     } else if (
//       templateType.includes("follow") ||
//       templateType.includes("reminder")
//     ) {
//       return (
//         <FollowUpTemplate
//           senderName={senderName}
//           primaryColor={primaryColor}
//           formats={formats}
//           previewMode={previewMode}
//           replyToEmail={replyToEmail}
//           signatureTemplate={signatureTemplate}
//           companyLogo={companyLogo}
//           signatureText={signatureText}
//           senderType={senderType}
//         />
//       );
//     } else if (
//       templateType.includes("rich") ||
//       templateType.includes("media")
//     ) {
//       return (
//         <MediaRichTemplate
//           template={template}
//           formats={formats}
//           primaryColor={template.design?.buttonColor || "#4F46E5"}
//           companyName={"Yout company"}
//           previewMode={true}
//           onToggleFormat={() => {}}
//           onUpdateTemplate={() => {}}
//         />
//       );
//     }

//     // Default fallback
//     return (
//       <div className="p-4 bg-gray-100 rounded-lg">
//         <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
//           <div className="bg-blue-600 text-white p-4">
//             <h2 className="font-bold">{template.name}</h2>
//           </div>
//           <div className="bg-white p-4">
//             <p>Template preview</p>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Get template icon based on name
//   const getTemplateIcon = (template: EmailTemplate) => {
//     const templateType = template.name.toLowerCase();

//     if (templateType.includes("follow") || templateType.includes("reminder")) {
//       return <Clock className="h-4 w-4" />;
//     } else if (
//       templateType.includes("incentive") ||
//       templateType.includes("reward")
//     ) {
//       return <Gift className="h-4 w-4" />;
//     } else if (
//       templateType.includes("rich") ||
//       templateType.includes("media")
//     ) {
//       return <Sparkles className="h-4 w-4" />;
//     } else {
//       return <Mail className="h-4 w-4" />;
//     }
//   };

//   return (
//     <motion.div
//       variants={itemVariants}
//       initial="hidden"
//       animate="visible"
//       className="space-y-6"
//     >
//       {/* Template Selection Grid */}
//       <Card>
//         <CardHeader className="pb-3">
//           <div className="flex items-center justify-between">
//             <div>
//               <CardTitle>Email Templates</CardTitle>
//               <CardDescription>
//                 Choose a template for your testimonial request emails
//               </CardDescription>
//             </div>
//             <Button
//               variant="outline"
//               size="sm"
//               className="flex items-center gap-1"
//               onClick={() => {
//                 // In a real implementation, this would open a template creation dialog
//                 showToast({
//                   title: "Coming Soon",
//                   description:
//                     "Custom template creation will be available soon.",
//                   variant: "default",
//                 });
//               }}
//             >
//               <Plus className="h-4 w-4" />
//               <span>New Template</span>
//             </Button>
//           </div>
//         </CardHeader>
//         <CardContent>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//             {templates.map((template) => (
//               <div
//                 key={template.id}
//                 className={cn(
//                   "border rounded-lg overflow-hidden transition-all",
//                   template.id === activeTemplateId
//                     ? "ring-2 ring-blue-500 shadow-sm"
//                     : "hover:border-gray-300 hover:shadow-sm"
//                 )}
//               >
//                 <div className="aspect-video bg-gray-100 overflow-hidden relative">
//                   <div className="absolute inset-0 flex items-center justify-center">
//                     {/* This would be a thumbnail image in a real implementation */}
//                     <div className="w-full h-full p-2 flex items-center justify-center">
//                       <div className="transform scale-50 origin-center w-full h-full overflow-hidden">
//                         {renderTemplatePreview(template)}
//                       </div>
//                     </div>
//                   </div>

//                   {/* Overlay actions */}
//                   <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
//                     <div className="flex gap-2">
//                       <Button
//                         size="sm"
//                         variant="secondary"
//                         className="bg-white text-gray-800 hover:bg-gray-100"
//                         onClick={() => handlePreview(template.id)}
//                       >
//                         <Eye className="h-4 w-4 mr-1" />
//                         Preview
//                       </Button>

//                       {template.id !== activeTemplateId && (
//                         <Button
//                           size="sm"
//                           onClick={() => handleSelectTemplate(template.id)}
//                         >
//                           <Check className="h-4 w-4 mr-1" />
//                           Select
//                         </Button>
//                       )}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="p-4">
//                   <div className="flex items-center justify-between mb-2">
//                     <h3 className="font-medium flex items-center gap-1.5">
//                       {getTemplateIcon(template)}
//                       <span>{template.name}</span>
//                     </h3>
//                     {template.id === activeTemplateId && (
//                       <Badge className="bg-blue-100 text-blue-800 border-blue-200">
//                         Active
//                       </Badge>
//                     )}
//                   </div>

//                   <p className="text-sm text-gray-500 mb-3 line-clamp-2">
//                     {template.content ||
//                       `A ${template.name.toLowerCase()} email template for collecting testimonials.`}
//                   </p>

//                   <div className="flex items-center justify-between text-xs text-gray-500">
//                     <span>
//                       Last edited:{" "}
//                       {new Date(
//                         template.metadata?.modified || Date.now()
//                       ).toLocaleDateString()}
//                     </span>
//                     <span className="flex items-center gap-1">
//                       <MessageSquare className="h-3 w-3" />
//                       {formats.length} format{formats.length !== 1 ? "s" : ""}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </CardContent>
//       </Card>

//       {/* Active Template Preview & Settings */}
//       <Card>
//         <CardHeader className="pb-3">
//           <div className="flex items-center justify-between">
//             <div>
//               <CardTitle className="flex items-center gap-2">
//                 {getTemplateIcon(activeTemplate)}
//                 <span>{activeTemplate.name}</span>
//                 <Badge
//                   variant="outline"
//                   className="ml-2 bg-blue-50 text-blue-700 border-blue-100"
//                 >
//                   Active
//                 </Badge>
//               </CardTitle>
//               <CardDescription>
//                 {activeTemplate.description ||
//                   `A ${activeTemplate.name.toLowerCase()} email template for collecting testimonials.`}
//               </CardDescription>
//             </div>

//             <div className="flex items-center gap-2">
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={handleCopyHtml}
//                 className="flex items-center gap-1.5"
//               >
//                 {copied ? (
//                   <Check className="h-4 w-4" />
//                 ) : (
//                   <Copy className="h-4 w-4" />
//                 )}
//                 <span>{copied ? "Copied" : "Copy HTML"}</span>
//               </Button>

//               <Button
//                 variant="outline"
//                 size="sm"
//                 className="flex items-center gap-1.5"
//                 onClick={handleEditToggle}
//               >
//                 <Edit className="h-4 w-4" />
//                 <span>{editMode ? "Preview" : "Customize"}</span>
//               </Button>

//               <Button
//                 size="sm"
//                 className="flex items-center gap-1.5"
//                 onClick={() => handlePreview(activeTemplate.id)}
//               >
//                 <Eye className="h-4 w-4" />
//                 <span>Preview</span>
//               </Button>
//             </div>
//           </div>
//         </CardHeader>

//         <CardContent>
//           <div className="border rounded-lg overflow-hidden">
//             {editMode ? (
//               <div className="p-6 bg-gray-50">
//                 <div className="space-y-6">
//                   <div className="flex justify-end mb-4">
//                     <div className="flex items-center gap-2">
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => setEditMode(false)}
//                       >
//                         <Eye className="h-4 w-4 mr-1.5" />
//                         Preview
//                       </Button>

//                       <Button size="sm">
//                         <Save className="h-4 w-4 mr-1.5" />
//                         Save Changes
//                       </Button>
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div className="space-y-4">
//                       <h3 className="font-medium">Template Settings</h3>
//                       <p className="text-sm text-gray-500">
//                         Customize your email template settings here. Changes
//                         will be reflected in the preview.
//                       </p>

//                       <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
//                         <div className="flex items-start gap-2">
//                           <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
//                           <div>
//                             <p className="text-sm font-medium text-amber-800">
//                               Template Editor Coming Soon
//                             </p>
//                             <p className="text-xs text-amber-700 mt-1">
//                               The visual template editor is currently in
//                               development. You can still use the predefined
//                               templates.
//                             </p>
//                           </div>
//                         </div>
//                       </div>
//                     </div>

//                     <div>
//                       <div className="border rounded-lg p-4 bg-white">
//                         <h3 className="font-medium mb-2">Preview</h3>
//                         <div className="border rounded bg-gray-50 h-64 flex items-center justify-center">
//                           <div className="text-center text-gray-500">
//                             <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
//                             <p>Loading preview...</p>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             ) : (
//               <div className="max-h-[500px] overflow-auto">
//                 <div className="transform scale-90 origin-top">
//                   {renderTemplatePreview(activeTemplate)}
//                 </div>
//               </div>
//             )}
//           </div>
//         </CardContent>

//         <CardFooter className="border-t pt-6 flex justify-between">
//           <Button
//             variant="outline"
//             className="flex items-center gap-1.5"
//             onClick={() => {
//               // In a real implementation, this would reset the template
//               showToast({
//                 title: "Template Reset",
//                 description: "Template has been reset to default settings.",
//                 variant: "default",
//               });
//             }}
//           >
//             <RefreshCw className="h-4 w-4" />
//             <span>Reset to Default</span>
//           </Button>

//           <Button
//             className="flex items-center gap-1.5"
//             onClick={() => {
//               // In a real implementation, this would save template changes
//               showToast({
//                 title: "Template Saved",
//                 description:
//                   "Your template changes have been saved successfully.",
//                 variant: "default",
//               });
//             }}
//           >
//             <CheckCircle className="h-4 w-4" />
//             <span>Save Template</span>
//           </Button>
//         </CardFooter>
//       </Card>

//       {/* Preview Dialog */}
//       <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
//         <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
//           <DialogHeader className="px-6 py-4 border-b">
//             <div className="flex items-center justify-between">
//               <DialogTitle>Email Template Preview</DialogTitle>
//               <div className="flex items-center gap-2">
//                 <Button
//                   variant={previewDevice === "mobile" ? "default" : "outline"}
//                   size="sm"
//                   onClick={() => setPreviewDevice("mobile")}
//                   className="h-8"
//                 >
//                   <Smartphone className="h-4 w-4 mr-1.5" />
//                   <span>Mobile</span>
//                 </Button>
//                 <Button
//                   variant={previewDevice === "desktop" ? "default" : "outline"}
//                   size="sm"
//                   onClick={() => setPreviewDevice("desktop")}
//                   className="h-8"
//                 >
//                   <Laptop className="h-4 w-4 mr-1.5" />
//                   <span>Desktop</span>
//                 </Button>
//               </div>
//             </div>
//             <DialogDescription>
//               Preview how your email will appear to recipients
//             </DialogDescription>
//           </DialogHeader>

//           <div className="flex-1 overflow-auto bg-gray-100 p-6">
//             <div
//               className={cn(
//                 "mx-auto bg-white transition-all duration-300",
//                 previewDevice === "desktop" ? "max-w-2xl" : "max-w-sm"
//               )}
//             >
//               {previewTemplateId && (
//                 <div className="border rounded-lg shadow-sm overflow-hidden">
//                   {renderTemplatePreview(
//                     templates.find((t) => t.id === previewTemplateId) ||
//                       templates[0],
//                     true
//                   )}
//                 </div>
//               )}
//             </div>
//           </div>

//           <DialogFooter className="px-6 py-4 border-t">
//             <Button
//               variant="outline"
//               onClick={() => setShowPreviewDialog(false)}
//             >
//               Close Preview
//             </Button>
//             {previewTemplateId !== activeTemplateId && (
//               <Button
//                 onClick={() => {
//                   handleSelectTemplate(previewTemplateId || "");
//                   setShowPreviewDialog(false);
//                 }}
//               >
//                 <Check className="h-4 w-4 mr-1.5" />
//                 Select This Template
//               </Button>
//             )}
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </motion.div>
//   );
// };

// export default EmailTemplates;

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Eye,
  Check,
  Mail,
  Clock,
  Gift,
  Sparkles,
  Laptop,
  Smartphone,
  ArrowRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Import template previews
import SimpleTemplate from "../email/templates/SimpleTemplate";
import FollowUpTemplate from "../email/templates/FollowUpTemplate";
import IncentiveTemplate from "../email/templates/IncentiveTemplate";
import MediaRichTemplate from "../email/templates/MediaRichTemplate";
import {
  CollectionSettings,
  EmailTemplate,
  TestimonialFormat,
} from "@/types/setup";

interface EmailTemplatesProps {
  templates: EmailTemplate[];
  activeTemplateId: string;
  onSelectTemplate: (templateId: string) => void;
  primaryColor: string;
  senderName: string;
  formats: TestimonialFormat[];
  showToast: (toast: {
    title: string;
    description: string;
    variant?: "default" | "destructive";
  }) => void;
  replyToEmail: string;
  senderType: "personal" | "company";
  companyLogo?: string;
  signatureTemplate: CollectionSettings["email"]["signatureTemplate"];
  signatureText?: string;
}

const EmailTemplates: React.FC<EmailTemplatesProps> = ({
  templates,
  activeTemplateId,
  onSelectTemplate,
  primaryColor,
  senderName,
  formats,
  showToast,
  companyLogo,
  replyToEmail,
  signatureTemplate,
  signatureText,
  senderType,
}) => {
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(
    null
  );
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">(
    "desktop"
  );
  const [hoveredTemplateId, setHoveredTemplateId] = useState<string | null>(
    null
  );

  // Get the active template
  const activeTemplate =
    templates.find((t) => t.id === activeTemplateId) || templates[0];

  // Handle template preview
  const handlePreview = (templateId: string) => {
    setPreviewTemplateId(templateId);
    setShowPreviewDialog(true);
  };

  // Handle template selection
  const handleSelectTemplate = (templateId: string) => {
    onSelectTemplate(templateId);
    showToast({
      title: "✨ Template Selected",
      description: "Your testimonial requests will now use this template.",
    });
  };

  // Get template icon based on type
  const getTemplateIcon = (template: EmailTemplate) => {
    switch (template.id) {
      case "follow-up":
        return <Clock className="h-4 w-4" />;
      case "incentive":
        return <Gift className="h-4 w-4" />;
      case "media-rich":
        return <Sparkles className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  // Render template preview based on type
  const renderTemplatePreview = (
    template: EmailTemplate,
    previewMode: boolean = false
  ) => {
    switch (template.id) {
      case "template-2":
        return (
          <FollowUpTemplate
            senderName={senderName}
            primaryColor={primaryColor}
            formats={formats}
            previewMode={previewMode}
            replyToEmail={replyToEmail}
            signatureTemplate={signatureTemplate}
            companyLogo={companyLogo}
            signatureText={signatureText}
            senderType={senderType}
          />
        );
      case "template-3":
        return (
          <MediaRichTemplate
            template={template}
            formats={formats}
            primaryColor={template.design?.buttonColor || primaryColor}
            companyName={senderName}
            previewMode={previewMode}
            onToggleFormat={() => {}}
            onUpdateTemplate={() => {}}
          />
        );
      case "template-4":
        return (
          <IncentiveTemplate
            companyName={senderName}
            primaryColor={primaryColor}
            incentiveType="discount"
            incentiveValue="10% off your next purchase"
            recipientName="Customer"
            isPreview={previewMode}
          />
        );
      default:
        return (
          <SimpleTemplate
            senderName={senderName}
            primaryColor={primaryColor}
            formats={formats}
            previewMode={previewMode}
            replyToEmail={replyToEmail}
            signatureTemplate={signatureTemplate}
            companyLogo={companyLogo}
            signatureText={signatureText}
            senderType={senderType}
          />
        );
    }
  };

  // Get template description
  const getTemplateDescription = (template: EmailTemplate): string => {
    switch (template.id) {
      case "simple":
        return (
          template.description ||
          "A clean, straightforward template to request testimonials from your customers."
        );
      case "follow-up":
        return (
          template.description ||
          "A gentle reminder for customers who haven't responded to your initial request."
        );
      case "incentive":
        return (
          template.description ||
          "Offer an incentive to encourage more testimonial submissions from your customers."
        );
      case "media-rich":
        return (
          template.description ||
          "A visually engaging template with support for images and rich media content."
        );
      default:
        return (
          template.description ||
          "Email template for collecting customer testimonials."
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero section */}
      <div className="relative overflow-hidden rounded-xl mb-10">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary opacity-90 z-0"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-50 z-0"></div>
        <div className="relative z-10 py-10 px-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-1">
                Email Template Gallery
              </h2>
              <p className="text-white/80 max-w-2xl text-lg">
                Choose how your testimonial requests will look when sent to
                customers
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-white/90">
            <div className="flex items-start gap-2">
              <div className="rounded-full bg-white/20 p-1.5 mt-0.5">
                <Check className="h-4 w-4" />
              </div>
              <div className="text-sm">Professional templates that convert</div>
            </div>
            <div className="flex items-start gap-2">
              <div className="rounded-full bg-white/20 p-1.5 mt-0.5">
                <Check className="h-4 w-4" />
              </div>
              <div className="text-sm">Customized with your brand colors</div>
            </div>
            <div className="flex items-start gap-2">
              <div className="rounded-full bg-white/20 p-1.5 mt-0.5">
                <Check className="h-4 w-4" />
              </div>
              <div className="text-sm">Optimized for high response rates</div>
            </div>
          </div>
        </div>
      </div>

      {/* Template Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {templates.map((template) => (
          <Card
            key={template.id}
            className={cn(
              "border overflow-hidden transition-all duration-200",
              template.id === activeTemplateId
                ? "ring-2 ring-primary shadow-md"
                : "hover:shadow-md",
              hoveredTemplateId === template.id && "scale-[1.02] shadow-md",
              "group"
            )}
            onMouseEnter={() => setHoveredTemplateId(template.id)}
            onMouseLeave={() => setHoveredTemplateId(null)}
          >
            <div className="aspect-video relative overflow-hidden bg-gray-50 flex items-center justify-center border-b">
              <div className="transform scale-[0.4] w-full origin-center">
                {renderTemplatePreview(template)}
              </div>

              {/* Hover overlay */}
              <div
                className={cn(
                  "absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 transition-opacity duration-200",
                  hoveredTemplateId === template.id && "opacity-100"
                )}
              >
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white/90 hover:bg-white text-gray-800"
                    onClick={() => handlePreview(template.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>

                  {template.id !== activeTemplateId && (
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90"
                      onClick={() => handleSelectTemplate(template.id)}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Select
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-1.5">
                  {getTemplateIcon(template)}
                  <span>{template.name}</span>
                </CardTitle>
                {template.id === activeTemplateId && (
                  <Badge className="bg-primary/10 text-primary border-primary/30">
                    Active
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-4 pt-1 pb-4">
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                {getTemplateDescription(template)}
              </p>

              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">
                  {new Date(
                    template.metadata?.modified || Date.now()
                  ).toLocaleDateString()}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs p-0 h-6 hover:bg-transparent hover:text-primary"
                  onClick={() => handlePreview(template.id)}
                >
                  <span>View details</span>
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Template Preview */}
      <div className="mt-12 mb-6">
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <span>Active Template</span>
          <Badge className="ml-1 bg-primary/10 text-primary border-primary/20">
            Selected
          </Badge>
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-lg bg-white overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-primary/90 text-white p-6">
              <div className="flex items-center gap-3 mb-3">
                {getTemplateIcon(activeTemplate)}
                <h3 className="font-bold text-lg">{activeTemplate.name}</h3>
              </div>
              <p className="text-white/90 text-sm">
                {getTemplateDescription(activeTemplate)}
              </p>
            </div>

            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2 text-gray-500">
                    TEMPLATE DETAILS
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">Type</div>
                      <div className="font-medium flex items-center gap-1.5">
                        {getTemplateIcon(activeTemplate)}
                        <span>{activeTemplate.id}</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">Modified</div>
                      <div className="font-medium">
                        {new Date(
                          activeTemplate.metadata?.modified || Date.now()
                        ).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <h4 className="text-sm font-medium mb-3 text-gray-500">
                    PERFORMANCE METRICS
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Open Rate</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: "78%" }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">78%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Click Rate</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: "42%" }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">42%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Conversion</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: "31%" }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">31%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>

            <div className="px-6 pb-6">
              <Button
                className="w-full bg-primary hover:bg-primary/90"
                onClick={() => handlePreview(activeTemplate.id)}
              >
                <Eye className="h-4 w-4 mr-1.5" />
                <span>Preview Template</span>
              </Button>
            </div>
          </Card>

          <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex items-start gap-3">
            <div className="bg-amber-100 rounded-full p-2 mt-1">
              <Zap className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-medium text-amber-800 mb-1">Pro Tip</h3>
              <p className="text-sm text-amber-700">
                A well-designed email template can increase your testimonial
                response rate by up to 40%. Personalize your requests to
                reference the specific product or service the customer used.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <Card className="border shadow-md bg-white h-full">
            <CardHeader className="border-b bg-gray-50 py-4">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 bg-primary/10 rounded-full flex items-center justify-center">
                  <Mail className="h-3 w-3 text-primary" />
                </div>
                <div className="text-sm font-medium">Email Preview</div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="max-h-[620px] overflow-auto">
                <div
                  className="bg-gray-50 p-6"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                >
                  <div className="mx-auto max-w-xl bg-white border shadow-sm rounded-lg overflow-hidden">
                    {renderTemplatePreview(activeTemplate)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Email Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90%] overflow-auto p-0  bg-[#f0f4f8]">
          <div className="flex flex-col h-full">
            {/* Email Client Header */}
            <div className="bg-[#1a2e44] text-white px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Mail className="h-4 w-4" />
                </div>
                <span className="font-medium">Testimonial Email Preview</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={previewDevice === "mobile" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setPreviewDevice("mobile")}
                  className="h-8 !text-white hover:!bg-white/10 bg-inherit"
                >
                  <Smartphone className="h-4 w-4 mr-1" />
                  <span>Mobile</span>
                </Button>
                <Button
                  variant={previewDevice === "desktop" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setPreviewDevice("desktop")}
                  className="h-8 !text-white hover:!bg-white/10 bg-inherit"
                >
                  <Laptop className="h-4 w-4 mr-1" />
                  <span>Desktop</span>
                </Button>
              </div>
            </div>

            {/* Email Client Toolbar */}
            <div className="bg-white border-b px-6 py-2 flex items-center gap-4">
              <div className="flex-1">
                {previewTemplateId && (
                  <div className="flex items-center gap-1.5">
                    {getTemplateIcon(
                      templates.find((t) => t.id === previewTemplateId) ||
                        templates[0]
                    )}
                    <span className="font-medium">
                      {templates.find((t) => t.id === previewTemplateId)
                        ?.name || "Template"}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <span>
                  Sent today at{" "}
                  {new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>

            {/* Email Headers */}
            <div className="bg-white px-6 py-3 border-b">
              <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 text-sm">
                <div className="text-gray-500">From:</div>
                <div className="font-medium">
                  {senderName} &lt;{replyToEmail}&gt;
                </div>

                <div className="text-gray-500">To:</div>
                <div>Your Customer &lt;customer@example.com&gt;</div>

                <div className="text-gray-500">Subject:</div>
                <div className="font-medium">
                  {previewTemplateId &&
                    (templates.find((t) => t.id === previewTemplateId)?.id ===
                    "follow-up"
                      ? "Following up: We'd love your feedback"
                      : "We'd love to hear about your experience")}
                </div>
              </div>
            </div>

            {/* Email Body */}
            <div className="flex-1 overflow-auto p-6 pb-12 ">
              {previewDevice === "mobile" ? (
                <div className="mx-auto relative" style={{ maxWidth: "360px" }}>
                  {/* Smartphone Frame */}
                  <div className="rounded-[36px] border-8 border-gray-800 shadow-xl bg-gray-800 overflow-hidden">
                    {/* Notch */}
                    <div className="h-6 w-32 mx-auto rounded-b-xl bg-gray-800 mb-1 relative z-10"></div>

                    {/* Screen */}
                    <div className="bg-white h-[660px] overflow-y-auto rounded-b-[28px]">
                      {previewTemplateId && (
                        <div className="overflow-hidden">
                          {renderTemplatePreview(
                            templates.find((t) => t.id === previewTemplateId) ||
                              templates[0],
                            true
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="mx-auto bg-white rounded-xl shadow-md transition-all duration-300 border max-w-[640px]"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, rgba(240, 240, 245, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(240, 240, 245, 0.1) 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                >
                  <div className="overflow-hidden p-3">
                    {previewTemplateId && (
                      <div className="overflow-hidden">
                        {renderTemplatePreview(
                          templates.find((t) => t.id === previewTemplateId) ||
                            templates[0],
                          true
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dialog Footer */}
            <div className="bg-white px-6 py-4 border-t flex justify-between">
              <div>
                {previewTemplateId &&
                  previewTemplateId !== activeTemplateId && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                      <p>This template is not currently active</p>
                    </div>
                  )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPreviewDialog(false)}
                >
                  Close Preview
                </Button>
                {previewTemplateId !== activeTemplateId && (
                  <Button
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => {
                      handleSelectTemplate(previewTemplateId || "");
                      setShowPreviewDialog(false);
                    }}
                  >
                    <Check className="h-4 w-4 mr-1.5" />
                    Use This Template
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailTemplates;
