// import React, { useEffect, useState } from "react";
// import { motion } from "framer-motion";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Label } from "@/components/ui/label";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Switch } from "@/components/ui/switch";
// import { Button } from "@/components/ui/button";
// import { Separator } from "@/components/ui/separator";
// import { Badge } from "@/components/ui/badge";
// import { Slider } from "@/components/ui/slider";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@/components/ui/tooltip";
// import {
//   FileText,
//   Video,
//   Image,
//   Mic,
//   Eye,
//   Settings,
//   Info,
//   AlertCircle,
//   CheckCircle,
//   Star,
//   Clock,
//   UploadCloud,
//   MessageSquare,
//   LucideIcon,
//   Link2,
//   Move,
//   Laptop,
//   Smartphone,
//   ShieldCheck,
//   Lock,
//   Edit,
//   Plus,
//   Trash,
// } from "lucide-react";
// import { cn } from "@/lib/utils";

// // Types
// import {
//   WidgetCustomization,
//   FormatOption,
//   TestimonialFormat,
// } from "@/types/setup";
// import { observer } from "mobx-react-lite";
// import { testimonialSettingsStore } from "@/stores/testimonialSettingsStore";
// import { runInAction } from "mobx";

// interface ContentTabProps {
//   onShowPreview: () => void;
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

// // Format information for different testimonial types
// const formatInfo: Record<
//   string,
//   {
//     icon: LucideIcon;
//     name: string;
//     description: string;
//     conversionRate: string;
//     processingTime: string;
//     fileSize: string;
//     color: string;
//     userExperience: number;
//     trustFactor: number;
//     contentValue: number;
//     deviceRequirements: string[];
//   }
// > = {
//   text: {
//     icon: FileText,
//     name: "Text Testimonials",
//     description: "Written feedback in customers' own words",
//     conversionRate: "High (7-9%)",
//     processingTime: "Instant",
//     fileSize: "< 1 KB",
//     color: "emerald",
//     userExperience: 90,
//     trustFactor: 75,
//     contentValue: 70,
//     deviceRequirements: ["All devices"],
//   },
//   video: {
//     icon: Video,
//     name: "Video Testimonials",
//     description: "Authentic video recordings from customers",
//     conversionRate: "Medium (2-4%)",
//     processingTime: "1-2 minutes",
//     fileSize: "10-50 MB",
//     color: "blue",
//     userExperience: 65,
//     trustFactor: 95,
//     contentValue: 100,
//     deviceRequirements: ["Camera", "Microphone"],
//   },
//   audio: {
//     icon: Mic,
//     name: "Audio Testimonials",
//     description: "Voice recordings sharing experiences",
//     conversionRate: "Medium-High (4-6%)",
//     processingTime: "30-60 seconds",
//     fileSize: "1-5 MB",
//     color: "purple",
//     userExperience: 80,
//     trustFactor: 85,
//     contentValue: 80,
//     deviceRequirements: ["Microphone"],
//   },
//   image: {
//     icon: Image,
//     name: "Image Testimonials",
//     description: "Product photos with feedback captions",
//     conversionRate: "Low-Medium (2-3%)",
//     processingTime: "5-10 seconds",
//     fileSize: "1-10 MB",
//     color: "amber",
//     userExperience: 75,
//     trustFactor: 80,
//     contentValue: 85,
//     deviceRequirements: ["Camera"],
//   },
// };

// // Rating scale component
// const RatingScale: React.FC<{
//   value: number;
//   label: string;
//   color: string;
// }> = observer(({ value, label, color }) => (
//   <div className="space-y-1">
//     <div className="flex items-center justify-between text-xs">
//       <span className="text-slate-500">{label}</span>
//       <span className={`text-${color}-600 font-medium`}>{value}%</span>
//     </div>
//     <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
//       <div
//         className={`h-full rounded-full bg-${color}-500`}
//         style={{ width: `${value}%` }}
//       />
//     </div>
//   </div>
// ));

// // Format card component
// const FormatCard: React.FC<{
//   format: FormatOption;
//   onToggle: () => void;
//   onClick: () => void;
//   isSelected: boolean;
// }> = observer(({ format, onToggle, onClick, isSelected }) => {
//   const info = formatInfo[format.type];
//   const Icon = info.icon;

//   return (
//     <div
//       className={cn(
//         "border rounded-lg transition-all overflow-hidden",
//         format.enabled
//           ? `border-${info.color}-200`
//           : "border-slate-200 opacity-75",
//         isSelected && format.enabled
//           ? `ring-2 ring-${info.color}-400 bg-${info.color}-50/50`
//           : format.enabled
//             ? `bg-${info.color}-50/20 hover:bg-${info.color}-50/40`
//             : "bg-slate-50 hover:bg-slate-100/50"
//       )}
//       onClick={onClick}
//     >
//       <div className="p-5">
//         <div className="flex items-start justify-between mb-3">
//           <div
//             className={cn(
//               "p-2 rounded-lg",
//               format.enabled
//                 ? `bg-${info.color}-100 text-${info.color}-600`
//                 : "bg-slate-100 text-slate-400"
//             )}
//           >
//             <Icon className="h-5 w-5" />
//           </div>

//           <Switch
//             checked={format.enabled}
//             className={
//               format.enabled ? `data-[state=checked]:bg-${info.color}-600` : ""
//             }
//             onClick={(e) => {
//               e.stopPropagation();
//               onToggle();
//             }}
//           />
//         </div>

//         <h3
//           className={cn(
//             "font-medium",
//             format.enabled ? "text-slate-900" : "text-slate-500"
//           )}
//         >
//           {info.name}
//         </h3>

//         <p
//           className={cn(
//             "text-xs mt-1 h-8",
//             format.enabled ? "text-slate-500" : "text-slate-400"
//           )}
//         >
//           {info.description}
//         </p>

//         <div className="flex justify-between items-center mt-3 text-xs">
//           <div className="flex items-center gap-1">
//             <Badge
//               variant="outline"
//               className={cn(
//                 "py-0 px-1.5 text-[10px]",
//                 format.enabled
//                   ? `bg-${info.color}-50 text-${info.color}-700 border-${info.color}-100`
//                   : "bg-slate-50 text-slate-600 border-slate-200"
//               )}
//             >
//               {info.conversionRate}
//             </Badge>
//           </div>
//           <div
//             className={cn(format.enabled ? "text-slate-500" : "text-slate-400")}
//           >
//             {info.fileSize}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// });

// // Format details component
// const FormatDetails: React.FC<{
//   format: FormatOption;
//   onUpdateFormat: (updates: Partial<FormatOption>) => void;
// }> = observer(({ format, onUpdateFormat }) => {
//   const info = formatInfo[format.type];
//   const Icon = info.icon;

//   // Handle format update
//   const handleUpdate = (field: string, value: any) => {
//     onUpdateFormat({
//       ...format,
//       [field]: value,
//       settings: {
//         ...(format.settings || {}),
//         [field]: value,
//       },
//     });
//   };

//   // Common format settings for all types
//   const CommonSettings = () => (
//     <div className="space-y-4">
//       <div className="space-y-2">
//         <Label htmlFor={`${format.type}-prompt`}>Collection Prompt</Label>
//         <Input
//           id={`${format.type}-prompt`}
//           placeholder={`Share your experience with our product...`}
//           value={(format.settings?.prompt as string) || ""}
//           onChange={(e) => handleUpdate("prompt", e.target.value)}
//         />
//         <p className="text-xs text-muted-foreground">
//           The text shown when requesting this type of testimonial
//         </p>
//       </div>

//       <div className="space-y-2">
//         <div className="flex items-center justify-between">
//           <Label htmlFor={`${format.type}-required`}>
//             Required Star Rating
//           </Label>
//           <span className="text-sm font-medium">
//             {format.settings?.minimumRating || "None"}
//           </span>
//         </div>
//         <div className="flex items-center justify-between gap-2">
//           <div className="grid grid-cols-5 gap-1 w-full">
//             {[0, 1, 2, 3, 4].map((i) => (
//               <Button
//                 key={i}
//                 type="button"
//                 variant={
//                   (format.settings?.minimumRating || 0) > i
//                     ? "default"
//                     : "outline"
//                 }
//                 className="h-9 px-0"
//                 onClick={() => handleUpdate("minimumRating", i + 1)}
//               >
//                 <Star
//                   className="h-4 w-4"
//                   fill={
//                     (format.settings?.minimumRating || 0) > i
//                       ? "currentColor"
//                       : "none"
//                   }
//                 />
//               </Button>
//             ))}
//           </div>
//           <Button
//             variant="ghost"
//             size="sm"
//             className="h-9 px-2.5 text-xs"
//             onClick={() => handleUpdate("minimumRating", 0)}
//           >
//             Clear
//           </Button>
//         </div>
//         <p className="text-xs text-muted-foreground">
//           Only show this format option to users who gave this rating or higher
//         </p>
//       </div>

//       <Separator className="my-2" />

//       <div className="space-y-4">
//         <div className="flex items-center justify-between">
//           <Label
//             htmlFor={`${format.type}-uploads`}
//             className="flex items-center gap-1.5"
//           >
//             <UploadCloud className="h-4 w-4 text-slate-500" />
//             <span>Allow File Uploads</span>
//           </Label>
//           <Switch
//             id={`${format.type}-uploads`}
//             checked={format.settings?.allowUploads || false}
//             onCheckedChange={(checked) => handleUpdate("allowUploads", checked)}
//           />
//         </div>
//         <p className="text-xs text-muted-foreground ml-6">
//           Let users upload existing files instead of creating new ones
//         </p>
//       </div>

//       <div className="space-y-2">
//         <div className="flex items-center justify-between">
//           <Label
//             htmlFor={`${format.type}-moderation`}
//             className="flex items-center gap-1.5"
//           >
//             <ShieldCheck className="h-4 w-4 text-slate-500" />
//             <span>Require Moderation</span>
//           </Label>
//           <Switch
//             id={`${format.type}-moderation`}
//             checked={format.settings?.requireModeration !== false}
//             onCheckedChange={(checked) =>
//               handleUpdate("requireModeration", checked)
//             }
//           />
//         </div>
//         <p className="text-xs text-muted-foreground ml-6">
//           Review and approve content before publishing
//         </p>
//       </div>
//     </div>
//   );

//   // Format specific settings
//   const FormatSpecificSettings = () => {
//     switch (format.type) {
//       case "video":
//         return (
//           <div className="space-y-4">
//             <div className="space-y-2">
//               <div className="flex items-center justify-between">
//                 <Label htmlFor="video-max-duration">Maximum Duration</Label>
//                 <span className="text-sm font-medium">
//                   {format.settings?.maxDuration || 60} seconds
//                 </span>
//               </div>
//               <Slider
//                 id="video-max-duration"
//                 min={30}
//                 max={300}
//                 step={30}
//                 value={[format.settings?.maxDuration || 60]}
//                 onValueChange={([value]) => handleUpdate("maxDuration", value)}
//               />
//               <div className="flex justify-between text-xs text-slate-500">
//                 <span>30 seconds</span>
//                 <span>5 minutes</span>
//               </div>
//             </div>

//             <div className="space-y-2">
//               <Label>Video Quality</Label>
//               <div className="grid grid-cols-3 gap-2">
//                 {["standard", "high", "hd"].map((quality) => (
//                   <Button
//                     key={quality}
//                     type="button"
//                     variant={
//                       (format.settings?.quality || "high") === quality
//                         ? "default"
//                         : "outline"
//                     }
//                     className="h-9"
//                     onClick={() => handleUpdate("quality", quality)}
//                   >
//                     <span className="capitalize">{quality}</span>
//                   </Button>
//                 ))}
//               </div>
//               <p className="text-xs text-muted-foreground">
//                 Higher quality provides better results but increases upload size
//               </p>
//             </div>

//             <div className="space-y-2">
//               <div className="flex items-center justify-between">
//                 <Label
//                   htmlFor="video-guidelines"
//                   className="flex items-center gap-1.5"
//                 >
//                   <Info className="h-4 w-4 text-slate-500" />
//                   <span>Show Recording Guidelines</span>
//                 </Label>
//                 <Switch
//                   id="video-guidelines"
//                   checked={format.settings?.showGuidelines !== false}
//                   onCheckedChange={(checked) =>
//                     handleUpdate("showGuidelines", checked)
//                   }
//                 />
//               </div>
//               <p className="text-xs text-muted-foreground ml-6">
//                 Display helpful tips and framing guides during recording
//               </p>
//             </div>

//             <div className="space-y-2">
//               <div className="flex items-center justify-between">
//                 <Label
//                   htmlFor="video-countdown"
//                   className="flex items-center gap-1.5"
//                 >
//                   <Clock className="h-4 w-4 text-slate-500" />
//                   <span>Recording Countdown</span>
//                 </Label>
//                 <Switch
//                   id="video-countdown"
//                   checked={format.settings?.countdown !== false}
//                   onCheckedChange={(checked) =>
//                     handleUpdate("countdown", checked)
//                   }
//                 />
//               </div>
//               <p className="text-xs text-muted-foreground ml-6">
//                 Show a 3-2-1 countdown before recording starts
//               </p>
//             </div>
//           </div>
//         );

//       case "audio":
//         return (
//           <div className="space-y-4">
//             <div className="space-y-2">
//               <div className="flex items-center justify-between">
//                 <Label htmlFor="audio-max-duration">Maximum Duration</Label>
//                 <span className="text-sm font-medium">
//                   {format.settings?.maxDuration || 120} seconds
//                 </span>
//               </div>
//               <Slider
//                 id="audio-max-duration"
//                 min={30}
//                 max={300}
//                 step={30}
//                 value={[format.settings?.maxDuration || 120]}
//                 onValueChange={([value]) => handleUpdate("maxDuration", value)}
//               />
//               <div className="flex justify-between text-xs text-slate-500">
//                 <span>30 seconds</span>
//                 <span>5 minutes</span>
//               </div>
//             </div>

//             <div className="space-y-2">
//               <Label>Audio Quality</Label>
//               <div className="grid grid-cols-3 gap-2">
//                 {["standard", "high", "studio"].map((quality) => (
//                   <Button
//                     key={quality}
//                     type="button"
//                     variant={
//                       (format.settings?.quality || "high") === quality
//                         ? "default"
//                         : "outline"
//                     }
//                     className="h-9"
//                     onClick={() => handleUpdate("quality", quality)}
//                   >
//                     <span className="capitalize">{quality}</span>
//                   </Button>
//                 ))}
//               </div>
//               <p className="text-xs text-muted-foreground">
//                 Higher quality provides clearer audio but increases upload size
//               </p>
//             </div>

//             <div className="space-y-2">
//               <div className="flex items-center justify-between">
//                 <Label htmlFor="audio-noise-reduction">
//                   <div className="flex items-center gap-1.5">
//                     <Mic className="h-4 w-4 text-slate-500" />
//                     <span>Noise Reduction</span>
//                   </div>
//                 </Label>
//                 <Switch
//                   id="audio-noise-reduction"
//                   checked={format.settings?.noiseReduction !== false}
//                   onCheckedChange={(checked) =>
//                     handleUpdate("noiseReduction", checked)
//                   }
//                 />
//               </div>
//               <p className="text-xs text-muted-foreground ml-6">
//                 Automatically reduce background noise in recordings
//               </p>
//             </div>

//             <div className="space-y-2">
//               <div className="flex items-center justify-between">
//                 <Label htmlFor="audio-echo-cancellation">
//                   <div className="flex items-center gap-1.5">
//                     <Mic className="h-4 w-4 text-slate-500" />
//                     <span>Echo Cancellation</span>
//                   </div>
//                 </Label>
//                 <Switch
//                   id="audio-echo-cancellation"
//                   checked={format.settings?.echoCancellation !== false}
//                   onCheckedChange={(checked) =>
//                     handleUpdate("echoCancellation", checked)
//                   }
//                 />
//               </div>
//               <p className="text-xs text-muted-foreground ml-6">
//                 Remove echo and reverb from audio recordings
//               </p>
//             </div>
//           </div>
//         );

//       case "text":
//         return (
//           <div className="space-y-4">
//             <div className="space-y-2">
//               <div className="flex items-center justify-between">
//                 <Label htmlFor="text-min-length">Minimum Length</Label>
//                 <span className="text-sm font-medium">
//                   {format.settings?.minLength || 50} characters
//                 </span>
//               </div>
//               <Slider
//                 id="text-min-length"
//                 min={0}
//                 max={500}
//                 step={50}
//                 value={[format.settings?.minLength || 50]}
//                 onValueChange={([value]) => handleUpdate("minLength", value)}
//               />
//               <div className="flex justify-between text-xs text-slate-500">
//                 <span>No minimum</span>
//                 <span>500 chars</span>
//               </div>
//               <p className="text-xs text-muted-foreground">
//                 Recommended minimum length for valuable testimonials is 50-100
//                 characters
//               </p>
//             </div>

//             <div className="space-y-2">
//               <div className="flex items-center justify-between">
//                 <Label htmlFor="text-sentiment-analysis">
//                   <div className="flex items-center gap-1.5">
//                     <MessageSquare className="h-4 w-4 text-slate-500" />
//                     <span>Sentiment Analysis</span>
//                   </div>
//                 </Label>
//                 <Switch
//                   id="text-sentiment-analysis"
//                   checked={format.settings?.sentimentAnalysis !== false}
//                   onCheckedChange={(checked) =>
//                     handleUpdate("sentimentAnalysis", checked)
//                   }
//                 />
//               </div>
//               <p className="text-xs text-muted-foreground ml-6">
//                 Automatically detect and categorize testimonials by sentiment
//               </p>
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="text-placeholder">Input Placeholder</Label>
//               <Input
//                 id="text-placeholder"
//                 placeholder="Share your thoughts about our product..."
//                 value={(format.settings?.placeholder as string) || ""}
//                 onChange={(e) => handleUpdate("placeholder", e.target.value)}
//               />
//               <p className="text-xs text-muted-foreground">
//                 Placeholder text shown in the testimonial input field
//               </p>
//             </div>

//             <div className="space-y-2">
//               <div className="flex items-center justify-between">
//                 <Label htmlFor="text-rich-formatting">
//                   <div className="flex items-center gap-1.5">
//                     <Edit className="h-4 w-4 text-slate-500" />
//                     <span>Rich Text Formatting</span>
//                   </div>
//                 </Label>
//                 <Switch
//                   id="text-rich-formatting"
//                   checked={format.settings?.richFormatting || false}
//                   onCheckedChange={(checked) =>
//                     handleUpdate("richFormatting", checked)
//                   }
//                 />
//               </div>
//               <p className="text-xs text-muted-foreground ml-6">
//                 Allow users to format text with bold, italic, etc.
//               </p>
//             </div>
//           </div>
//         );

//       case "image":
//         return (
//           <div className="space-y-4">
//             <div className="space-y-2">
//               <Label>Image Format</Label>
//               <div className="grid grid-cols-3 gap-2">
//                 {["jpg", "png", "all"].map((f) => (
//                   <Button
//                     key={f}
//                     type="button"
//                     variant={
//                       (format.settings?.format || "all") === f
//                         ? "default"
//                         : "outline"
//                     }
//                     className="h-9"
//                     onClick={() => handleUpdate("format", f)}
//                   >
//                     <span className="uppercase">
//                       {f === "all" ? "All Formats" : f}
//                     </span>
//                   </Button>
//                 ))}
//               </div>
//               <p className="text-xs text-muted-foreground">
//                 Supported image formats for uploads
//               </p>
//             </div>

//             <div className="space-y-2">
//               <div className="flex items-center justify-between">
//                 <Label htmlFor="image-max-size">Maximum File Size</Label>
//                 <span className="text-sm font-medium">
//                   {format.settings?.maxSize || 5} MB
//                 </span>
//               </div>
//               <Slider
//                 id="image-max-size"
//                 min={1}
//                 max={20}
//                 step={1}
//                 value={[format.settings?.maxSize || 5]}
//                 onValueChange={([value]) => handleUpdate("maxSize", value)}
//               />
//               <div className="flex justify-between text-xs text-slate-500">
//                 <span>1 MB</span>
//                 <span>20 MB</span>
//               </div>
//             </div>

//             <div className="space-y-2">
//               <div className="flex items-center justify-between">
//                 <Label htmlFor="image-caption-required">
//                   <div className="flex items-center gap-1.5">
//                     <MessageSquare className="h-4 w-4 text-slate-500" />
//                     <span>Require Caption</span>
//                   </div>
//                 </Label>
//                 <Switch
//                   id="image-caption-required"
//                   checked={format.settings?.captionRequired !== false}
//                   onCheckedChange={(checked) =>
//                     handleUpdate("captionRequired", checked)
//                   }
//                 />
//               </div>
//               <p className="text-xs text-muted-foreground ml-6">
//                 Require users to add a text caption with their image
//               </p>
//             </div>

//             <div className="space-y-2">
//               <div className="flex items-center justify-between">
//                 <Label htmlFor="image-multiple">
//                   <div className="flex items-center gap-1.5">
//                     <Image className="h-4 w-4 text-slate-500" />
//                     <span>Allow Multiple Images</span>
//                   </div>
//                 </Label>
//                 <Switch
//                   id="image-multiple"
//                   checked={format.settings?.allowMultiple || false}
//                   onCheckedChange={(checked) =>
//                     handleUpdate("allowMultiple", checked)
//                   }
//                 />
//               </div>
//               <p className="text-xs text-muted-foreground ml-6">
//                 Let users upload multiple images in a single testimonial
//               </p>
//             </div>
//           </div>
//         );

//       default:
//         return null;
//     }
//   };

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center gap-3">
//         <div
//           className={cn(
//             "p-2.5 rounded-lg",
//             `bg-${info.color}-100 text-${info.color}-600`
//           )}
//         >
//           <Icon className="h-6 w-6" />
//         </div>
//         <div>
//           <h3 className="text-lg font-medium">{info.name}</h3>
//           <p className="text-sm text-slate-500">{info.description}</p>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         <div>
//           <CommonSettings />
//         </div>
//         <div>
//           <FormatSpecificSettings />
//         </div>
//       </div>

//       <Separator />

//       <div className="pt-2 space-y-4">
//         <h4 className="text-sm font-medium">Format Performance Metrics</h4>
//         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//           <RatingScale
//             label="User Experience"
//             value={info.userExperience}
//             color={info.color}
//           />
//           <RatingScale
//             label="Trust Factor"
//             value={info.trustFactor}
//             color={info.color}
//           />
//           <RatingScale
//             label="Content Value"
//             value={info.contentValue}
//             color={info.color}
//           />
//         </div>

//         <div className="flex gap-2 flex-wrap mt-4">
//           {info.deviceRequirements.map((req) => (
//             <Badge
//               key={req}
//               variant="outline"
//               className={`bg-${info.color}-50 text-${info.color}-700 border-${info.color}-100`}
//             >
//               {req === "Camera" ? (
//                 <div className="flex items-center gap-1">
//                   <Video className="h-3 w-3" />
//                   <span>{req}</span>
//                 </div>
//               ) : req === "Microphone" ? (
//                 <div className="flex items-center gap-1">
//                   <Mic className="h-3 w-3" />
//                   <span>{req}</span>
//                 </div>
//               ) : req === "All devices" ? (
//                 <div className="flex items-center gap-1">
//                   <Laptop className="h-3 w-3" />
//                   <Smartphone className="h-3 w-3 ml-0.5" />
//                   <span className="ml-0.5">{req}</span>
//                 </div>
//               ) : (
//                 req
//               )}
//             </Badge>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// });

// // Form Fields section
// const FormFieldsSection: React.FC<{
//   customization: WidgetCustomization | undefined;
//   onUpdateCustomization: (updates: Partial<WidgetCustomization>) => void;
// }> = observer(({ customization, onUpdateCustomization }) => {
//   const handleFieldToggle = (field: string) => {
//     const fields = customization?.fields || ["name", "email"];

//     const requiredFields = customization?.requiredFields || ["name", "email"];

//     // Remove from fields and also from requiredFields if toggled off
//     const updatedFields = fields.includes(field)
//       ? fields.filter((f) => f !== field)
//       : [...fields, field];

//     if (updatedFields.length > 5) return;

//     const updatedRequiredFields = updatedFields.includes(field)
//       ? requiredFields
//       : requiredFields.filter((f) => f !== field);

//     onUpdateCustomization({
//       fields: updatedFields,
//       requiredFields: updatedRequiredFields,
//     });
//   };

//   const handleRequiredToggle = (field: string) => {
//     const fields = customization?.fields || ["name", "email"];
//     const requiredFields = customization?.requiredFields || ["name", "email"];

//     // Toggle requiredFields
//     const updatedRequiredFields = requiredFields.includes(field)
//       ? requiredFields.filter((f) => f !== field)
//       : [...requiredFields, field];

//     // Ensure that a required field is always present in fields
//     const updatedFields = updatedRequiredFields.includes(field)
//       ? [...new Set([...fields, field])] // Ensure unique values
//       : fields.filter((f) => f !== field);

//     onUpdateCustomization({
//       requiredFields: updatedRequiredFields,
//       fields: updatedFields,
//     });
//   };

//   // Default fields that are always present
//   const defaultFields = [
//     { id: "name", label: "Full Name", locked: true },
//     { id: "email", label: "Email Address", locked: true },
//   ];

//   // Optional fields that can be toggled
//   const optionalFields = [
//     { id: "company", label: "Company Name" },
//     { id: "jobTitle", label: "Job Title" },
//     { id: "location", label: "Location" },
//     { id: "purchaseDate", label: "Date of Purchase" },
//     { id: "productUsed", label: "Product/Service Used" },
//     { id: "socialMedia", label: "Social Media Handle" },
//     { id: "website", label: "Website" },
//     { id: "age", label: "Age Group" },
//     { id: "customerSince", label: "Customer Since" },
//     { id: "industry", label: "Industry" },
//   ];

//   return (
//     <div className="space-y-4">
//       <h3 className="text-base font-medium">Form Fields</h3>
//       <p className="text-sm text-slate-500">
//         Configure which fields to collect from users
//       </p>

//       {(customization?.fields?.length || 0) >= 5 && (
//         <div className="text-xs text-red-700 bg-red-50 border border-amber-100 rounded-lg py-2 px-3 mt-2">
//           <div className="flex items-start gap-1.5">
//             <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
//             <p>
//               You have reached the maximum number of selection. You can deselect
//               some selections to select.
//             </p>
//           </div>
//         </div>
//       )}

//       <div className="space-y-3">
//         {/* Always present fields */}
//         {defaultFields.map((field) => (
//           <div
//             key={field.id}
//             className={cn(
//               "flex items-center justify-between p-3 border rounded-md",
//               field.locked ? "bg-slate-50" : ""
//             )}
//           >
//             <div className="flex items-center gap-3">
//               <Switch
//                 id={`field-${field.id}`}
//                 checked={true}
//                 disabled={field.locked}
//                 className="data-[state=checked]:bg-blue-600"
//               />
//               <div>
//                 <Label
//                   htmlFor={`field-${field.id}`}
//                   className={cn(
//                     "text-sm font-medium",
//                     field.locked ? "cursor-not-allowed" : "cursor-pointer"
//                   )}
//                 >
//                   {field.label}
//                 </Label>

//                 {field.locked && (
//                   <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
//                     Required
//                   </span>
//                 )}
//               </div>
//             </div>

//             <div className="flex items-center gap-2">
//               <Switch
//                 checked={true}
//                 disabled={field.locked}
//                 className="data-[state=checked]:bg-blue-600"
//               />
//               <span className="text-xs text-slate-500">Required</span>
//             </div>
//           </div>
//         ))}

//         {/* Optional fields */}
//         {optionalFields.map((field) => {
//           const fields = customization?.fields || [];
//           const requiredFields = customization?.requiredFields || [];
//           const isIncluded = fields.includes(field.id);
//           const isRequired = requiredFields.includes(field.id);

//           return (
//             <div
//               key={field.id}
//               className="flex items-center justify-between p-3 border rounded-md hover:bg-slate-50/50 transition-colors"
//             >
//               <div className="flex items-center gap-3">
//                 <Switch
//                   id={`field-${field.id}`}
//                   checked={isIncluded}
//                   onCheckedChange={() => handleFieldToggle(field.id)}
//                   className="data-[state=checked]:bg-blue-600"
//                 />
//                 <Label
//                   htmlFor={`field-${field.id}`}
//                   className="text-sm font-medium cursor-pointer"
//                 >
//                   {field.label}
//                 </Label>
//               </div>

//               <div className="flex items-center gap-2">
//                 <Switch
//                   checked={isRequired}
//                   onCheckedChange={() => handleRequiredToggle(field.id)}
//                   disabled={!isIncluded}
//                   className="data-[state=checked]:bg-blue-600"
//                 />
//                 <span className="text-xs text-slate-500">Required</span>
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       <div className="pt-2">
//         <Button
//           variant="outline"
//           className="w-full text-sm"
//           onClick={() =>
//             onUpdateCustomization({
//               fields: ["name", "email"],
//               requiredFields: ["name", "email"],
//             })
//           }
//         >
//           Reset to Default Fields
//         </Button>
//       </div>
//     </div>
//   );
// });

// // Main component
// const ContentTab: React.FC<ContentTabProps> = observer(({ onShowPreview }) => {
//   const store = testimonialSettingsStore;
//   const { customization, formats } = store.settings.website;

//   function onUpdateCustomization(update: Partial<WidgetCustomization>) {
//     runInAction(() => {
//       store.updateSettings("website", "customization", {
//         ...update,
//       });
//     });
//   }
//   const [selectedFormat, setSelectedFormat] = useState<FormatOption | null>(
//     null
//   );

//   // Handle format toggle
//   const handleFormatToggle = (formatType: TestimonialFormat) => {
//     runInAction(() => store.toggleFormatEnabled("website", formatType));
//   };

//   // Handle format selection for details
//   const handleFormatSelect = (format: FormatOption) => {
//     setSelectedFormat(format);
//   };

//   // Handle format update
//   const handleFormatUpdate = (updatedFormat: Partial<FormatOption>) => {
//     if (!selectedFormat) return;
//     runInAction(() => store.updateFormat("website", updatedFormat));
//   };

//   // Toggle format details dialog
//   const [showFormatDetails, setShowFormatDetails] = useState(false);

//   return (
//     <motion.div
//       variants={itemVariants}
//       initial="hidden"
//       animate="visible"
//       className="space-y-6"
//     >
//       <div className="flex items-center justify-between">
//         <div>
//           <h2 className="text-xl font-semibold tracking-tight">
//             Content Settings
//           </h2>
//           <p className="text-sm text-muted-foreground">
//             Configure the types of testimonial content you want to collect
//           </p>
//         </div>
//       </div>

//       <Card>
//         <CardHeader>
//           <CardTitle>Testimonial Formats</CardTitle>
//           <CardDescription>
//             Choose which types of content users can submit
//           </CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-6">
//           {/* Format Selection Grid */}
//           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
//             {formats.map((format) => (
//               <FormatCard
//                 key={format.type}
//                 format={format}
//                 onToggle={() => handleFormatToggle(format.type)}
//                 onClick={() => {
//                   if (format.enabled) {
//                     handleFormatSelect(format);
//                     setShowFormatDetails(true);
//                   }
//                 }}
//                 isSelected={selectedFormat?.type === format.type}
//               />
//             ))}
//           </div>

//           <Separator />

//           {/* Format Order */}
//           <div className="space-y-3">
//             <div className="flex items-center justify-between">
//               <h3 className="text-base font-medium flex items-center gap-2">
//                 <Move className="h-4 w-4 text-slate-500" />
//                 <span>Format Order & Display</span>
//               </h3>

//               <TooltipProvider>
//                 <Tooltip>
//                   <TooltipTrigger asChild>
//                     <div className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full border border-amber-100 flex items-center gap-1">
//                       <Info className="h-3.5 w-3.5" />
//                       <span>Sort by conversion rate</span>
//                     </div>
//                   </TooltipTrigger>
//                   <TooltipContent side="left">
//                     <p className="text-xs max-w-xs">
//                       Place formats with higher conversion rates first to
//                       maximize testimonial collection. Text testimonials
//                       typically have the highest conversion, followed by audio,
//                       video, and images.
//                     </p>
//                   </TooltipContent>
//                 </Tooltip>
//               </TooltipProvider>
//             </div>
//             <ReorderableFormats
//               initialFormats={formats}
//               formatInfo={formatInfo}
//               onReorder={(formats) => store.setFormats("website", formats)}
//             />

//             {formats.filter((format) => format.enabled).length === 0 && (
//               <div className="p-6 text-center border border-dashed rounded-lg">
//                 <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
//                 <h3 className="text-lg font-medium text-slate-700 mb-1">
//                   No Formats Enabled
//                 </h3>
//                 <p className="text-sm text-slate-500 mb-4">
//                   Please enable at least one content format to collect
//                   testimonials
//                 </p>
//               </div>
//             )}

//             <div className="pt-2">
//               <Button
//                 variant="outline"
//                 className="w-full flex items-center justify-center gap-2"
//                 onClick={onShowPreview}
//               >
//                 <Eye className="h-4 w-4" />
//                 <span>Preview Format Selection</span>
//               </Button>
//             </div>
//           </div>

//           <Separator />

//           {/* Collection Questions */}
//           <div className="space-y-3">
//             <h3 className="text-base font-medium flex items-center gap-2">
//               <MessageSquare className="h-4 w-4 text-slate-500" />
//               <span>Collection Questions</span>
//             </h3>

//             <p className="text-sm text-slate-500">
//               Define the questions users will be asked to respond to in their
//               testimonial
//             </p>

//             <div className="space-y-2">
//               {(customization?.questions || []).map((question, index) => (
//                 <div
//                   key={index}
//                   className="flex items-center gap-3 p-3 border rounded-lg bg-white"
//                 >
//                   <Badge className="bg-blue-100 text-blue-700 border-blue-200">
//                     {index + 1}
//                   </Badge>
//                   <Input
//                     value={question}
//                     onChange={(e) => {
//                       const updatedQuestions = [
//                         ...(customization?.questions || []),
//                       ];
//                       updatedQuestions[index] = e.target.value;
//                       onUpdateCustomization({ questions: updatedQuestions });
//                     }}
//                     placeholder="Enter your question here..."
//                     className="flex-1"
//                   />
//                   <Button
//                     variant="ghost"
//                     size="icon"
//                     className="text-slate-400 hover:text-red-600"
//                     onClick={() => {
//                       const updatedQuestions = [
//                         ...(customization?.questions || []),
//                       ];
//                       updatedQuestions.splice(index, 1);
//                       onUpdateCustomization({ questions: updatedQuestions });
//                     }}
//                   >
//                     <Trash className="h-4 w-4" />
//                   </Button>
//                 </div>
//               ))}

//               <Button
//                 variant="outline"
//                 className="w-full mt-2 flex items-center justify-center gap-2"
//                 onClick={() => {
//                   const updatedQuestions = [
//                     ...(customization?.questions || []),
//                     "",
//                   ];
//                   onUpdateCustomization({ questions: updatedQuestions });
//                 }}
//               >
//                 <Plus className="h-4 w-4" />
//                 <span>Add Question</span>
//               </Button>

//               <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg py-2 px-3 mt-2">
//                 <div className="flex items-start gap-1.5">
//                   <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
//                   <p>
//                     We recommend 1-3 focused questions for the best user
//                     experience and completion rates. Questions should be
//                     open-ended and specific.
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </CardContent>
//         <CardFooter className="border-t pt-6">
//           <div className="w-full">
//             <FormFieldsSection
//               customization={customization}
//               onUpdateCustomization={onUpdateCustomization}
//             />
//           </div>
//         </CardFooter>
//       </Card>

//       {/* Privacy and Legal Settings */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Privacy & Legal Settings</CardTitle>
//           <CardDescription>
//             Configure privacy and legal requirements for testimonial collection
//           </CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-6">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//             <div className="space-y-4">
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-2">
//                   <Lock className="h-4 w-4 text-slate-500" />
//                   <Label
//                     htmlFor="consent-checkbox"
//                     className="text-base font-medium cursor-pointer"
//                   >
//                     Require Consent Checkbox
//                   </Label>
//                 </div>
//                 <Switch
//                   id="consent-checkbox"
//                   checked={customization?.requireConsent}
//                   onCheckedChange={(checked) =>
//                     onUpdateCustomization({ requireConsent: checked })
//                   }
//                 />
//               </div>
//               <p className="text-sm text-slate-500 ml-6">
//                 Require users to explicitly consent to sharing their testimonial
//               </p>

//               {customization?.requireConsent !== false && (
//                 <div className="ml-6 space-y-2">
//                   <Label htmlFor="consent-text">Consent Text</Label>
//                   <Textarea
//                     id="consent-text"
//                     value={
//                       customization?.consentText ||
//                       "I agree to share my testimonial publicly and allow [Company] to use it in marketing materials."
//                     }
//                     onChange={(e) =>
//                       onUpdateCustomization({ consentText: e.target.value })
//                     }
//                     placeholder="I agree to share my testimonial publicly..."
//                     rows={3}
//                   />
//                   <p className="text-xs text-slate-500">
//                     Text displayed with the consent checkbox
//                   </p>
//                 </div>
//               )}

//               <div className="flex items-center justify-between mt-2">
//                 <div className="flex items-center gap-2">
//                   <Link2 className="h-4 w-4 text-slate-500" />
//                   <Label
//                     htmlFor="terms-link"
//                     className="text-base font-medium cursor-pointer"
//                   >
//                     Include Privacy Policy Link
//                   </Label>
//                 </div>
//                 <Switch
//                   id="terms-link"
//                   checked={!!customization?.privacyPolicyUrl}
//                   onCheckedChange={(checked) =>
//                     onUpdateCustomization({
//                       privacyPolicyUrl: checked
//                         ? customization?.privacyPolicyUrl || "https://"
//                         : "",
//                     })
//                   }
//                 />
//               </div>

//               {!!customization?.privacyPolicyUrl && (
//                 <div className="ml-6 space-y-2">
//                   <Label htmlFor="privacy-url">Privacy Policy URL</Label>
//                   <Input
//                     id="privacy-url"
//                     value={customization?.privacyPolicyUrl || ""}
//                     onChange={(e) =>
//                       onUpdateCustomization({
//                         privacyPolicyUrl: e.target.value,
//                       })
//                     }
//                     placeholder="https://example.com/privacy"
//                   />
//                   <p className="text-xs text-slate-500">
//                     Link to your privacy policy displayed in the widget
//                   </p>
//                 </div>
//               )}
//             </div>

//             <div className="space-y-4">
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-2">
//                   <ShieldCheck className="h-4 w-4 text-slate-500" />
//                   <Label
//                     htmlFor="data-protection"
//                     className="text-base font-medium cursor-pointer"
//                   >
//                     Data Protection Notice
//                   </Label>
//                 </div>
//                 <Switch
//                   id="data-protection"
//                   checked={customization?.showDataProtection !== false}
//                   onCheckedChange={(checked) =>
//                     onUpdateCustomization({ showDataProtection: checked })
//                   }
//                 />
//               </div>
//               <p className="text-sm text-slate-500 ml-6">
//                 Show a data protection notice explaining how testimonials will
//                 be used
//               </p>

//               {customization?.showDataProtection !== false && (
//                 <div className="ml-6 space-y-2">
//                   <Label htmlFor="data-protection-text">
//                     Data Protection Text
//                   </Label>
//                   <Textarea
//                     id="data-protection-text"
//                     value={
//                       customization?.dataProtectionText ||
//                       "Your testimonial may be displayed on our website, social media, and marketing materials. We will only display your name and job title publicly. Your email address will never be shared."
//                     }
//                     onChange={(e) =>
//                       onUpdateCustomization({
//                         dataProtectionText: e.target.value,
//                       })
//                     }
//                     placeholder="Explain how testimonials will be used..."
//                     rows={3}
//                   />
//                   <p className="text-xs text-slate-500">
//                     Transparent explanation of how testimonial data will be used
//                   </p>
//                 </div>
//               )}

//               <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg mt-2">
//                 <div className="flex items-start gap-3">
//                   <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
//                   <div>
//                     <h4 className="text-sm font-medium text-blue-800 mb-1">
//                       Legal Best Practices
//                     </h4>
//                     <p className="text-xs text-blue-700">
//                       To comply with data protection regulations like GDPR and
//                       CCPA, always include:
//                     </p>
//                     <ul className="mt-2 space-y-1 text-xs text-blue-700">
//                       <li className="flex items-start gap-1.5">
//                         <CheckCircle className="h-3.5 w-3.5 text-blue-600 mt-0.5" />
//                         <span>
//                           Clear consent for collecting & using testimonials
//                         </span>
//                       </li>
//                       <li className="flex items-start gap-1.5">
//                         <CheckCircle className="h-3.5 w-3.5 text-blue-600 mt-0.5" />
//                         <span>Easy access to your privacy policy</span>
//                       </li>
//                       <li className="flex items-start gap-1.5">
//                         <CheckCircle className="h-3.5 w-3.5 text-blue-600 mt-0.5" />
//                         <span>
//                           Explicit permission to use content in marketing
//                         </span>
//                       </li>
//                     </ul>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </CardContent>
//         <CardFooter className="border-t pt-6 flex justify-between">
//           <Button variant="outline" className="flex items-center gap-2">
//             <Settings className="h-4 w-4" />
//             <span>Advanced Settings</span>
//           </Button>
//           <Button onClick={onShowPreview} className="flex items-center gap-2">
//             <Eye className="h-4 w-4" />
//             <span>Preview Content Collection</span>
//           </Button>
//         </CardFooter>
//       </Card>

//       {/* Format Details Dialog */}
//       <Dialog
//         open={showFormatDetails && !!selectedFormat}
//         onOpenChange={setShowFormatDetails}
//       >
//         <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle className="flex items-center gap-2">
//               <Settings className="h-5 w-5" />
//               <span>Format Settings</span>
//             </DialogTitle>
//             <DialogDescription>
//               Configure settings for {selectedFormat?.type} testimonials
//             </DialogDescription>
//           </DialogHeader>

//           {selectedFormat && (
//             <div className="py-4">
//               <FormatDetails
//                 format={selectedFormat}
//                 onUpdateFormat={handleFormatUpdate}
//               />
//             </div>
//           )}

//           <DialogFooter>
//             <Button
//               variant="outline"
//               onClick={() => setShowFormatDetails(false)}
//             >
//               Close
//             </Button>
//             <Button
//               onClick={() => {
//                 setShowFormatDetails(false);
//                 onShowPreview();
//               }}
//             >
//               Preview Format
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </motion.div>
//   );
// });

// export default ContentTab;

// // Define types for our data structures

// interface FormatInfo {
//   [key: string]: {
//     icon: LucideIcon;
//     name: string;
//     color: string;
//     conversionRate: string;
//   };
// }

// interface ReorderableFormatsProps {
//   initialFormats: FormatOption[];
//   formatInfo: FormatInfo;
//   onReorder?: (formats: FormatOption[]) => void;
// }

// const ReorderableFormats: React.FC<ReorderableFormatsProps> = observer(
//   ({ initialFormats, formatInfo, onReorder }) => {
//     const [formats, setFormats] = useState<FormatOption[]>(initialFormats);

//     useEffect(() => {
//       setFormats(initialFormats);
//     }, [initialFormats]);

//     // Handle drag start
//     const handleDragStart = (
//       e: React.DragEvent<HTMLDivElement>,
//       index: number
//     ): void => {
//       e.dataTransfer.setData("text/plain", index.toString());
//       e.currentTarget.classList.add("opacity-50");
//     };

//     // Handle drag over
//     const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
//       e.preventDefault();
//     };

//     // Handle drop
//     const handleDrop = (
//       e: React.DragEvent<HTMLDivElement>,
//       dropIndex: number
//     ): void => {
//       e.preventDefault();
//       const dragIndex = parseInt(e.dataTransfer.getData("text/plain"));

//       if (dragIndex === dropIndex) return;

//       // Create a new array to avoid mutating state directly
//       const newFormats = [...formats];
//       const draggedItem = newFormats[dragIndex];

//       // Remove the dragged item
//       newFormats.splice(dragIndex, 1);
//       // Insert it at the new position
//       newFormats.splice(dropIndex, 0, draggedItem);

//       // Update order properties
//       newFormats.forEach((format, index) => {
//         format.order = index + 1;
//       });

//       setFormats(newFormats);

//       // Call the onReorder callback if provided
//       if (onReorder) {
//         onReorder(newFormats);
//       }
//     };

//     // Handle drag end
//     const handleDragEnd = (e: React.DragEvent<HTMLDivElement>): void => {
//       e.currentTarget.classList.remove("opacity-50");
//     };

//     const enabledFormats = formats
//       .filter((format) => format.enabled)
//       .sort((a, b) => (a.order || 99) - (b.order || 99));

//     return (
//       <div className="space-y-2">
//         {enabledFormats.map((format, index) => {
//           const info = formatInfo[format.type];
//           const Icon = info.icon;

//           return (
//             <div
//               key={format.type}
//               className="flex items-center gap-2 p-3 bg-white border rounded-lg cursor-move hover:border-gray-300 transition-colors"
//               draggable
//               onDragStart={(e) => handleDragStart(e, index)}
//               onDragOver={handleDragOver}
//               onDrop={(e) => handleDrop(e, index)}
//               onDragEnd={handleDragEnd}
//             >
//               <div
//                 className={`p-1.5 rounded-md bg-${info.color}-100 text-${info.color}-600`}
//               >
//                 <Icon className="h-4 w-4" />
//               </div>
//               <span className="font-medium">{info.name}</span>
//               <Badge
//                 variant="outline"
//                 className={`ml-auto bg-${info.color}-50 text-${info.color}-700 border-${info.color}-100`}
//               >
//                 {info.conversionRate}
//               </Badge>
//             </div>
//           );
//         })}
//       </div>
//     );
//   }
// );

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Video,
  Image,
  Mic,
  Eye,
  Settings,
  MessageSquare,
  Lock,
  Plus,
  Trash,
  UploadCloud,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
import {
  WidgetCustomization,
  FormatOption,
  TestimonialFormat,
} from "@/types/setup";
import { observer } from "mobx-react-lite";
import { testimonialSettingsStore } from "@/stores/testimonialSettingsStore";
import { runInAction } from "mobx";

interface ContentTabProps {
  onShowPreview: () => void;
}

// Animation variants
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// Format information for different testimonial types
const formatInfo: Record<
  string,
  {
    icon: React.ElementType;
    name: string;
    description: string;
    color: string;
  }
> = {
  text: {
    icon: FileText,
    name: "Text Testimonials",
    description: "Written feedback in customers' own words",
    color: "emerald",
  },
  video: {
    icon: Video,
    name: "Video Testimonials",
    description: "Authentic video recordings from customers",
    color: "blue",
  },
  audio: {
    icon: Mic,
    name: "Audio Testimonials",
    description: "Voice recordings sharing experiences",
    color: "purple",
  },
  image: {
    icon: Image,
    name: "Image Testimonials",
    description: "Product photos with feedback captions",
    color: "amber",
  },
};

// Format card component
const FormatCard: React.FC<{
  format: FormatOption;
  onToggle: () => void;
  onClick: () => void;
  isSelected: boolean;
}> = observer(({ format, onToggle, onClick, isSelected }) => {
  const info = formatInfo[format.type];
  const Icon = info.icon;

  return (
    <div
      className={cn(
        "border rounded-lg transition-all overflow-hidden",
        format.enabled
          ? `border-${info.color}-200`
          : "border-slate-200 opacity-75",
        isSelected && format.enabled
          ? `ring-2 ring-${info.color}-400 bg-${info.color}-50/50`
          : format.enabled
            ? `bg-${info.color}-50/20 hover:bg-${info.color}-50/40`
            : "bg-slate-50 hover:bg-slate-100/50"
      )}
      onClick={onClick}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div
            className={cn(
              "p-2 rounded-lg",
              format.enabled
                ? `bg-${info.color}-100 text-${info.color}-600`
                : "bg-slate-100 text-slate-400"
            )}
          >
            <Icon className="h-5 w-5" />
          </div>

          <Switch
            checked={format.enabled}
            className={
              format.enabled ? `data-[state=checked]:bg-${info.color}-600` : ""
            }
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          />
        </div>

        <h3
          className={cn(
            "font-medium",
            format.enabled ? "text-slate-900" : "text-slate-500"
          )}
        >
          {info.name}
        </h3>

        <p
          className={cn(
            "text-xs mt-1 h-8",
            format.enabled ? "text-slate-500" : "text-slate-400"
          )}
        >
          {info.description}
        </p>
      </div>
    </div>
  );
});

// Format details component
const FormatDetails: React.FC<{
  format: FormatOption;
  onUpdateFormat: (updates: Partial<FormatOption>) => void;
}> = observer(({ format, onUpdateFormat }) => {
  const info = formatInfo[format.type];
  const Icon = info.icon;

  // Handle format update
  const handleUpdate = (field: string, value: any) => {
    onUpdateFormat({
      ...format,
      [field]: value,
      settings: {
        ...(format.settings || {}),
        [field]: value,
      },
    });
  };

  // Common format settings for all types
  const CommonSettings = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${format.type}-prompt`}>Collection Prompt</Label>
        <Input
          id={`${format.type}-prompt`}
          placeholder={`Share your experience with our product...`}
          value={(format.settings?.prompt as string) || ""}
          onChange={(e) => handleUpdate("prompt", e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          The text shown when requesting this type of testimonial
        </p>
      </div>

      {format.type !== "video" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor={`${format.type}-moderation`}
              className="flex items-center gap-1.5"
            >
              <ShieldCheck className="h-4 w-4 text-slate-500" />
              <span>Require Moderation</span>
            </Label>
            <Switch
              id={`${format.type}-moderation`}
              checked={format.settings?.requireModeration !== false}
              onCheckedChange={(checked) =>
                handleUpdate("requireModeration", checked)
              }
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Review and approve content before publishing
          </p>
        </div>
      )}
    </div>
  );

  // Format specific settings
  const FormatSpecificSettings = () => {
    switch (format.type) {
      case "video":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="video-max-duration">Maximum Duration</Label>
                <span className="text-sm font-medium">
                  {format.settings?.maxDuration || 60} seconds
                </span>
              </div>
              <Slider
                id="video-max-duration"
                min={30}
                max={300}
                step={30}
                value={[format.settings?.maxDuration || 60]}
                onValueChange={([value]) => handleUpdate("maxDuration", value)}
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>30 seconds</span>
                <span>5 minutes</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor={`video-uploads`}
                  className="flex items-center gap-1.5"
                >
                  <UploadCloud className="h-4 w-4 text-slate-500" />
                  <span>Allow File Uploads</span>
                </Label>
                <Switch
                  id={`video-uploads`}
                  checked={format.settings?.allowUploads || false}
                  onCheckedChange={(checked) =>
                    handleUpdate("allowUploads", checked)
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Let users upload existing videos instead of recording new ones
              </p>
            </div>
          </div>
        );

      case "audio":
        return null; // No specific settings for audio

      case "text":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="text-min-length">Minimum Length</Label>
                <span className="text-sm font-medium">
                  {format.settings?.minLength || 50} characters
                </span>
              </div>
              <Slider
                id="text-min-length"
                min={0}
                max={500}
                step={50}
                value={[format.settings?.minLength || 50]}
                onValueChange={([value]) => handleUpdate("minLength", value)}
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>No minimum</span>
                <span>500 chars</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Recommended minimum length for valuable testimonials is 50-100
                characters
              </p>
            </div>
          </div>
        );

      case "image":
        return null; // No specific settings for image

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "p-2.5 rounded-lg",
            `bg-${info.color}-100 text-${info.color}-600`
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg font-medium">{info.name}</h3>
          <p className="text-sm text-slate-500">{info.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <CommonSettings />
        </div>
        <div>
          <FormatSpecificSettings />
        </div>
      </div>
    </div>
  );
});

// Form Fields section
const FormFieldsSection: React.FC<{
  customization: WidgetCustomization | undefined;
  onUpdateCustomization: (updates: Partial<WidgetCustomization>) => void;
}> = observer(({ customization, onUpdateCustomization }) => {
  const handleFieldToggle = (field: string) => {
    const fields = customization?.fields || ["name", "email"];
    const requiredFields = customization?.requiredFields || ["name", "email"];

    // Remove from fields and also from requiredFields if toggled off
    const updatedFields = fields.includes(field)
      ? fields.filter((f) => f !== field)
      : [...fields, field];

    const updatedRequiredFields = updatedFields.includes(field)
      ? requiredFields
      : requiredFields.filter((f) => f !== field);

    onUpdateCustomization({
      fields: updatedFields,
      requiredFields: updatedRequiredFields,
    });
  };

  const handleRequiredToggle = (field: string) => {
    const fields = customization?.fields || ["name", "email"];
    const requiredFields = customization?.requiredFields || ["name", "email"];

    // Toggle requiredFields
    const updatedRequiredFields = requiredFields.includes(field)
      ? requiredFields.filter((f) => f !== field)
      : [...requiredFields, field];

    onUpdateCustomization({
      requiredFields: updatedRequiredFields,
      fields: fields.includes(field) ? fields : [...fields, field],
    });
  };

  // Default fields that are always present
  const defaultFields = [
    { id: "name", label: "Full Name", locked: true },
    { id: "email", label: "Email Address", locked: true },
  ];

  // Optional fields that can be toggled
  const optionalFields = [
    { id: "company", label: "Company Name" },
    { id: "jobTitle", label: "Job Title" },
    { id: "website", label: "Website" },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-base font-medium">Form Fields</h3>
      <p className="text-sm text-slate-500">
        Configure which fields to collect from users
      </p>

      <div className="space-y-3">
        {/* Always present fields */}
        {defaultFields.map((field) => (
          <div
            key={field.id}
            className={cn(
              "flex items-center justify-between p-3 border rounded-md",
              field.locked ? "bg-slate-50" : ""
            )}
          >
            <div className="flex items-center gap-3">
              <Switch
                id={`field-${field.id}`}
                checked={true}
                disabled={field.locked}
                className="data-[state=checked]:bg-blue-600"
              />
              <div>
                <Label
                  htmlFor={`field-${field.id}`}
                  className={cn(
                    "text-sm font-medium",
                    field.locked ? "cursor-not-allowed" : "cursor-pointer"
                  )}
                >
                  {field.label}
                </Label>

                {field.locked && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                    Required
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={true}
                disabled={field.locked}
                className="data-[state=checked]:bg-blue-600"
              />
              <span className="text-xs text-slate-500">Required</span>
            </div>
          </div>
        ))}

        {/* Optional fields */}
        {optionalFields.map((field) => {
          const fields = customization?.fields || [];
          const requiredFields = customization?.requiredFields || [];
          const isIncluded = fields.includes(field.id);
          const isRequired = requiredFields.includes(field.id);

          return (
            <div
              key={field.id}
              className="flex items-center justify-between p-3 border rounded-md hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Switch
                  id={`field-${field.id}`}
                  checked={isIncluded}
                  onCheckedChange={() => handleFieldToggle(field.id)}
                  className="data-[state=checked]:bg-blue-600"
                />
                <Label
                  htmlFor={`field-${field.id}`}
                  className="text-sm font-medium cursor-pointer"
                >
                  {field.label}
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={isRequired}
                  onCheckedChange={() => handleRequiredToggle(field.id)}
                  disabled={!isIncluded}
                  className="data-[state=checked]:bg-blue-600"
                />
                <span className="text-xs text-slate-500">Required</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// Main component
const ContentTab: React.FC<ContentTabProps> = observer(({ onShowPreview }) => {
  const store = testimonialSettingsStore;
  const { customization, formats } = store.settings.website;

  function onUpdateCustomization(update: Partial<WidgetCustomization>) {
    runInAction(() => {
      store.updateSettings("website", "customization", {
        ...update,
      });
    });
  }
  const [selectedFormat, setSelectedFormat] = useState<FormatOption | null>(
    null
  );

  // Handle format toggle
  const handleFormatToggle = (formatType: TestimonialFormat) => {
    runInAction(() => store.toggleFormatEnabled("website", formatType));
  };

  // Handle format selection for details
  const handleFormatSelect = (format: FormatOption) => {
    setSelectedFormat(format);
  };

  // Handle format update
  const handleFormatUpdate = (updatedFormat: Partial<FormatOption>) => {
    if (!selectedFormat) return;
    runInAction(() => store.updateFormat("website", updatedFormat));
  };

  // Toggle format details dialog
  const [showFormatDetails, setShowFormatDetails] = useState(false);

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Content Settings
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure the types of testimonial content you want to collect
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Testimonial Formats</CardTitle>
          <CardDescription>
            Choose which types of content users can submit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Format Selection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {formats.map((format) => (
              <FormatCard
                key={format.type}
                format={format}
                onToggle={() => handleFormatToggle(format.type)}
                onClick={() => {
                  if (format.enabled) {
                    handleFormatSelect(format);
                    setShowFormatDetails(true);
                  }
                }}
                isSelected={selectedFormat?.type === format.type}
              />
            ))}
          </div>

          <div className="pt-2">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={onShowPreview}
            >
              <Eye className="h-4 w-4" />
              <span>Preview Format Selection</span>
            </Button>
          </div>

          <Separator />

          {/* Collection Questions */}
          <div className="space-y-3">
            <h3 className="text-base font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-slate-500" />
              <span>Collection Questions</span>
            </h3>

            <p className="text-sm text-slate-500">
              Define the questions users will be asked to respond to
            </p>

            <div className="space-y-2">
              {(customization?.questions || []).map((question, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border rounded-lg bg-white"
                >
                  <div className="bg-blue-100 text-blue-700 w-6 h-6 flex items-center justify-center rounded-full text-sm font-medium">
                    {index + 1}
                  </div>
                  <Input
                    value={question}
                    onChange={(e) => {
                      const updatedQuestions = [
                        ...(customization?.questions || []),
                      ];
                      updatedQuestions[index] = e.target.value;
                      onUpdateCustomization({ questions: updatedQuestions });
                    }}
                    placeholder="Enter your question here..."
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-red-600"
                    onClick={() => {
                      const updatedQuestions = [
                        ...(customization?.questions || []),
                      ];
                      updatedQuestions.splice(index, 1);
                      onUpdateCustomization({ questions: updatedQuestions });
                    }}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                variant="outline"
                className="w-full mt-2 flex items-center justify-center gap-2"
                onClick={() => {
                  const updatedQuestions = [
                    ...(customization?.questions || []),
                    "",
                  ];
                  onUpdateCustomization({ questions: updatedQuestions });
                }}
              >
                <Plus className="h-4 w-4" />
                <span>Add Question</span>
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6">
          <div className="w-full">
            <FormFieldsSection
              customization={customization}
              onUpdateCustomization={onUpdateCustomization}
            />
          </div>
        </CardFooter>
      </Card>

      {/* Simplified Privacy and Legal Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy Settings</CardTitle>
          <CardDescription>
            Configure privacy requirements for testimonial collection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-slate-500" />
                <Label
                  htmlFor="consent-checkbox"
                  className="text-base font-medium cursor-pointer"
                >
                  Require Consent Checkbox
                </Label>
              </div>
              <Switch
                id="consent-checkbox"
                checked={customization?.requireConsent}
                onCheckedChange={(checked) =>
                  onUpdateCustomization({ requireConsent: checked })
                }
              />
            </div>
            <p className="text-sm text-slate-500">
              Require users to explicitly consent to sharing their testimonial
            </p>

            {customization?.requireConsent !== false && (
              <div className="space-y-2">
                <Label htmlFor="consent-text">Consent Text</Label>
                <Textarea
                  id="consent-text"
                  value={
                    customization?.consentText ||
                    "I agree to share my testimonial publicly and allow [Company] to use it in marketing materials."
                  }
                  onChange={(e) =>
                    onUpdateCustomization({ consentText: e.target.value })
                  }
                  placeholder="I agree to share my testimonial publicly..."
                  rows={3}
                />
                <p className="text-xs text-slate-500">
                  Text displayed with the consent checkbox
                </p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6 flex justify-end">
          <Button onClick={onShowPreview} className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span>Preview</span>
          </Button>
        </CardFooter>
      </Card>

      {/* Format Details Dialog */}
      <Dialog
        open={showFormatDetails && !!selectedFormat}
        onOpenChange={setShowFormatDetails}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <span>Format Settings</span>
            </DialogTitle>
            <DialogDescription>
              Configure settings for {selectedFormat?.type} testimonials
            </DialogDescription>
          </DialogHeader>

          {selectedFormat && (
            <div className="py-4">
              <FormatDetails
                format={selectedFormat}
                onUpdateFormat={handleFormatUpdate}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFormatDetails(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setShowFormatDetails(false);
                onShowPreview();
              }}
            >
              Preview Format
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
});

export default ContentTab;
