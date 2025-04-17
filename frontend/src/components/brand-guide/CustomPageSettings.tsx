// import { FC, useState, useEffect } from "react";
// import { observer } from "mobx-react-lite";
// import { brandGuideStore } from "@/stores/brandGuideStore";
// import { motion, AnimatePresence } from "framer-motion";

// // UI Components
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { Badge } from "@/components/ui/badge";
// import { Switch } from "@/components/ui/switch";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@/components/ui/tooltip";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Accordion,
//   AccordionContent,
//   AccordionItem,
//   AccordionTrigger,
// } from "@/components/ui/accordion";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";

// // Icons
// import {
//   FileText,
//   Copy,
//   Check,
//   RefreshCw,
//   Sparkles,
//   Smartphone,
//   Globe,
//   EyeIcon,
//   ChevronRight,
//   FileSymlink,
//   Rocket,
//   ThumbsUp,
//   X,
//   AlertCircle,
//   MessageSquare,
//   Info,
//   Users,
//   CheckCheck,
//   Award,
//   Wand2,
//   PenTool,
//   CornerDownRight,
//   Layout,
//   Palette,
//   AlignLeft,
//   LayoutTemplate,
//   LayoutDashboard,
//   Maximize,
//   Minimize,
//   Mail,
//   MessageSquarePlus,
//   ChevronDown,
//   Clipboard,
//   ClipboardCheck,
//   CircleCheck,
//   UserPlus,
//   FilePlus2,
//   BadgeCheck,
//   PlusCircle,
//   MousePointerClick,
//   MoveRight,
//   Heart,
//   Lightbulb,
//   Clock,
//   ArrowRightCircle,
//   CircleCheckBig,
//   Settings2,
//   SendHorizonal,
//   Tablet,
// } from "lucide-react";

// // Types
// type PageType = "landing" | "form" | "success" | "error" | "testimonial";
// type ViewMode = "desktop" | "mobile" | "tablet";
// type ColorTheme = "light" | "dark" | "custom";

// // Interface for page specific voice elements
// interface PageVoiceElements {
//   title: string;
//   description: string;
//   cta: string;
//   successMessage: string;
//   errorMessage: string;
//   formLabels: {
//     name: string;
//     email: string;
//     message: string;
//     submit: string;
//   };
// }

// const CustomPagesSettings: FC = () => {
//   const store = brandGuideStore;
//   const { brandData } = store;

//   // State variables
//   const [activeTab, setActiveTab] = useState<PageType>("landing");
//   const [viewMode, setViewMode] = useState<ViewMode>("desktop");
//   const [colorTheme, setColorTheme] = useState<ColorTheme>("light");
//   const [isExpanded, setIsExpanded] = useState<boolean>(false);
//   const [showTipsPopover, setShowTipsPopover] = useState<boolean>(false);
//   const [copied, setCopied] = useState<string | null>(null);
//   const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
//   const [showAiSuggestions, setShowAiSuggestions] = useState<boolean>(false);
//   const [isFullscreenPreview, setIsFullscreenPreview] = useState<boolean>(false);
//   const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);

//   // Initialize custom pages settings if they don't exist
//   useEffect(() => {
//     if (!brandData.voice?.channels?.custom) {
//       store.updateBrandData(["voice", "channels", "custom"], {
//         pages: {
//           landing: {
//             title: "Welcome to {{brand}}",
//             description: "We're excited to have you join our community of satisfied customers. Discover why thousands trust {{brand}} for their needs.",
//             cta: "Get Started Now",
//             successMessage: "Thank you for choosing {{brand}}!",
//             errorMessage: "Oops! Something went wrong. Please try again or contact support.",
//             formLabels: {
//               name: "Your Name",
//               email: "Email Address",
//               message: "How can we help you?",
//               submit: "Submit",
//             },
//           },
//           form: {
//             title: "Share Your Experience with {{brand}}",
//             description: "We value your feedback. Please take a moment to share your thoughts about your recent experience with {{brand}}.",
//             cta: "Submit Your Feedback",
//             successMessage: "Thank you for your valuable feedback!",
//             errorMessage: "There was an error submitting your feedback. Please try again.",
//             formLabels: {
//               name: "Your Name",
//               email: "Email Address",
//               message: "Your Feedback",
//               submit: "Send Feedback",
//             },
//           },
//           success: {
//             title: "Thank You!",
//             description: "Your submission has been received. We appreciate your time and value your input.",
//             cta: "Back to Home",
//             successMessage: "Your feedback is already making a difference!",
//             errorMessage: "",
//             formLabels: {
//               name: "",
//               email: "",
//               message: "",
//               submit: "",
//             },
//           },
//           error: {
//             title: "Something Went Wrong",
//             description: "We apologize for the inconvenience. Please try again or contact our support team for assistance.",
//             cta: "Try Again",
//             successMessage: "",
//             errorMessage: "Error details: Unable to process your request at this time.",
//             formLabels: {
//               name: "",
//               email: "",
//               message: "",
//               submit: "",
//             },
//           },
//           testimonial: {
//             title: "Our Customer Stories",
//             description: "Hear from our valued customers about their experiences with {{brand}}. Their stories inspire us to continue delivering excellence.",
//             cta: "Share Your Story",
//             successMessage: "Thank you for sharing your story!",
//             errorMessage: "There was an error submitting your testimonial. Please try again.",
//             formLabels: {
//               name: "Your Name",
//               email: "Email Address",
//               message: "Your Testimonial",
//               submit: "Share Testimonial",
//             },
//           },
//         },
//         toneStyles: {
//           formal: false,
//           conversational: true,
//           enthusiastic: true,
//           supportive: false,
//           minimalist: false,
//         },
//         useEmoji: true,
//       });
//     }
//   }, [brandData.voice?.channels?.custom, store]);

//   // AI template suggestions for each page type
//   const getAiSuggestions = (pageType: PageType): Record<string, string[]> => {
//     const suggestions: Record<PageType, Record<string, string[]>> = {
//       landing: {
//         title: [
//           "Welcome to the {{brand}} Experience",
//           "Discover What {{brand}} Can Do For You",
//           "Transform Your Journey with {{brand}}",
//         ],
//         description: [
//           "Join thousands of satisfied customers who have made {{brand}} their preferred choice. We're committed to excellence and innovation.",
//           "{{brand}} offers cutting-edge solutions designed with your needs in mind. Experience the difference today.",
//           "At {{brand}}, we believe in creating exceptional experiences that exceed expectations. Let us show you how.",
//         ],
//         cta: [
//           "Start Your Journey",
//           "Get Started Today",
//           "Begin Your Experience",
//         ],
//       },
//       form: {
//         title: [
//           "Tell Us About Your {{brand}} Experience",
//           "Your Feedback Matters to {{brand}}",
//           "Help Us Improve {{brand}} With Your Insights",
//         ],
//         description: [
//           "Your opinion helps us grow. Share your thoughts about {{brand}} and help us deliver even better service.",
//           "We're constantly improving, and your feedback is essential. Tell us about your experience with {{brand}}.",
//           "Every voice matters at {{brand}}. Share your perspective and help shape our future offerings.",
//         ],
//         cta: [
//           "Submit Your Thoughts",
//           "Share Your Feedback",
//           "Send Your Insights",
//         ],
//       },
//       success: {
//         title: [
//           "Success! Thank You for Your Submission",
//           "Thank You for Connecting With {{brand}}",
//           "We Appreciate Your Input!",
//         ],
//         description: [
//           "Your submission has been successfully received. The {{brand}} team values your contribution and will review it promptly.",
//           "Thank you for taking the time to share with {{brand}}. Your input is invaluable to our continuous improvement.",
//           "Your feedback is now with the {{brand}} team. We're committed to using your insights to enhance our services.",
//         ],
//         cta: [
//           "Return to Home",
//           "Continue Exploring",
//           "Discover More",
//         ],
//       },
//       error: {
//         title: [
//           "We Encountered an Issue",
//           "Something Went Wrong",
//           "Error Processing Your Request",
//         ],
//         description: [
//           "We apologize for the inconvenience. The {{brand}} team has been notified and is working to resolve this issue promptly.",
//           "There was a problem processing your request. Please try again or contact {{brand}} support for assistance.",
//           "We're experiencing technical difficulties. The {{brand}} team is on it, and we appreciate your patience.",
//         ],
//         cta: [
//           "Try Again",
//           "Return and Retry",
//           "Back to Previous Page",
//         ],
//       },
//       testimonial: {
//         title: [
//           "{{brand}} Customer Stories",
//           "Voices of {{brand}} Customers",
//           "Real Experiences with {{brand}}",
//         ],
//         description: [
//           "Discover how {{brand}} has made a difference for our customers. Their authentic stories showcase our commitment to excellence.",
//           "Real stories from real people. See how {{brand}} has helped customers achieve their goals and solve their challenges.",
//           "Our customers' success is our success. Browse these testimonials to see the real-world impact of {{brand}}.",
//         ],
//         cta: [
//           "Add Your Story",
//           "Share Your Experience",
//           "Become a Featured Customer",
//         ],
//       },
//     };

//     return suggestions[pageType];
//   };

//   // Get current page settings
//   const getCurrentPageSettings = (): PageVoiceElements => {
//     return brandData.voice?.channels?.custom?.pages[activeTab] || {
//       title: "",
//       description: "",
//       cta: "",
//       successMessage: "",
//       errorMessage: "",
//       formLabels: {
//         name: "",
//         email: "",
//         message: "",
//         submit: "",
//       },
//     };
//   };

//   // Update a specific field for the current page
//   const updatePageField = (field: string, value: string) => {
//     if (field.includes('.')) {
//       const [parent, child] = field.split('.');
//       store.updateBrandData(
//         ["voice", "channels", "custom", "pages", activeTab, parent, child],
//         value
//       );
//     } else {
//       store.updateBrandData(
//         ["voice", "channels", "custom", "pages", activeTab, field],
//         value
//       );
//     }
//   };

//   // Copy to clipboard
//   const copyToClipboard = (text: string, field: string) => {
//     navigator.clipboard.writeText(text);
//     setCopied(field);
//     setTimeout(() => setCopied(null), 2000);
//   };

//   // Format preview text with brand name
//   const formatPreviewText = (text: string): string => {
//     return text.replace(/{{brand}}/g, brandData.name || "Your Brand");
//   };

//   // Generate AI suggestions
//   const generateAiSuggestions = () => {
//     setIsGeneratingAi(true);

//     // Simulate AI processing delay
//     setTimeout(() => {
//       setIsGeneratingAi(false);
//       setShowAiSuggestions(true);
//     }, 1200);
//   };

//   // Apply tone style toggle
//   const toggleToneStyle = (style: string, value: boolean) => {
//     store.updateBrandData(
//       ["voice", "channels", "custom", "toneStyles", style],
//       value
//     );
//   };

//   // Toggle emoji usage
//   const toggleEmojiUsage = (value: boolean) => {
//     store.updateBrandData(
//       ["voice", "channels", "custom", "useEmoji"],
//       value
//     );
//   };

//   // Apply AI suggestion to field
//   const applyAiSuggestion = (field: string, value: string) => {
//     updatePageField(field, value);
//     setShowAiSuggestions(false);
//     setSelectedTemplate(null);
//   };

//   // Get title for page type
//   const getPageTypeTitle = (type: PageType): string => {
//     switch (type) {
//       case "landing": return "Landing Page";
//       case "form": return "Form Page";
//       case "success": return "Success Page";
//       case "error": return "Error Page";
//       case "testimonial": return "Testimonial Page";
//       default: return "Page";
//     }
//   };

//   // Get icon for page type
//   const getPageTypeIcon = (type: PageType): JSX.Element => {
//     switch (type) {
//       case "landing": return <LayoutDashboard className="h-4 w-4" />;
//       case "form": return <FilePlus2 className="h-4 w-4" />;
//       case "success": return <BadgeCheck className="h-4 w-4" />;
//       case "error": return <AlertCircle className="h-4 w-4" />;
//       case "testimonial": return <MessageSquare className="h-4 w-4" />;
//       default: return <FileText className="h-4 w-4" />;
//     }
//   };

//   return (
//     <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/10 dark:to-gray-800 rounded-xl">
//       <CardHeader className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm pb-4">
//         <div className="flex items-center gap-3">
//           <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
//             <LayoutTemplate className="h-5 w-5" />
//           </div>
//           <div>
//             <CardTitle className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-700 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400">
//               Custom Pages Voice & Tone
//             </CardTitle>
//             <CardDescription className="text-sm mt-0.5">
//               Define your brand voice for landing pages, forms, and other custom content
//             </CardDescription>
//           </div>
//         </div>
//       </CardHeader>

//       <CardContent className="p-0">
//         <div className="grid grid-cols-12 min-h-[600px]">
//           {/* Left sidebar with page types */}
//           <div className="col-span-2 border-r border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
//             <div className="p-4 border-b border-gray-200 dark:border-gray-800">
//               <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
//                 <Layout className="h-3.5 w-3.5" />
//                 <span>Page Types</span>
//               </h3>
//             </div>
//             <div className="flex flex-col py-2">
//               {(["landing", "form", "success", "error", "testimonial"] as PageType[]).map((pageType) => (
//                 <button
//                   key={pageType}
//                   className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
//                     activeTab === pageType
//                       ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-r-2 border-indigo-500 font-medium"
//                       : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50"
//                   }`}
//                   onClick={() => setActiveTab(pageType)}
//                 >
//                   {getPageTypeIcon(pageType)}
//                   <span>{getPageTypeTitle(pageType)}</span>
//                 </button>
//               ))}
//             </div>

//             <div className="p-4 border-t border-gray-200 dark:border-gray-800 mt-4">
//               <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
//                 <PenTool className="h-3.5 w-3.5" />
//                 <span>Tone Settings</span>
//               </h3>

//               <div className="space-y-3">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-1.5">
//                     <AlignLeft className="h-3.5 w-3.5 text-gray-500" />
//                     <span className="text-xs">Formal</span>
//                   </div>
//                   <Switch
//                     checked={brandData.voice?.channels?.custom?.toneStyles?.formal || false}
//                     onCheckedChange={(checked) => toggleToneStyle("formal", checked)}
//                     className="scale-75"
//                   />
//                 </div>

//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-1.5">
//                     <MessageSquare className="h-3.5 w-3.5 text-gray-500" />
//                     <span className="text-xs">Conversational</span>
//                   </div>
//                   <Switch
//                     checked={brandData.voice?.channels?.custom?.toneStyles?.conversational || false}
//                     onCheckedChange={(checked) => toggleToneStyle("conversational", checked)}
//                     className="scale-75"
//                   />
//                 </div>

//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-1.5">
//                     <Rocket className="h-3.5 w-3.5 text-gray-500" />
//                     <span className="text-xs">Enthusiastic</span>
//                   </div>
//                   <Switch
//                     checked={brandData.voice?.channels?.custom?.toneStyles?.enthusiastic || false}
//                     onCheckedChange={(checked) => toggleToneStyle("enthusiastic", checked)}
//                     className="scale-75"
//                   />
//                 </div>

//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-1.5">
//                     <Heart className="h-3.5 w-3.5 text-gray-500" />
//                     <span className="text-xs">Supportive</span>
//                   </div>
//                   <Switch
//                     checked={brandData.voice?.channels?.custom?.toneStyles?.supportive || false}
//                     onCheckedChange={(checked) => toggleToneStyle("supportive", checked)}
//                     className="scale-75"
//                   />
//                 </div>

//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-1.5">
//                     <Minimize className="h-3.5 w-3.5 text-gray-500" />
//                     <span className="text-xs">Minimalist</span>
//                   </div>
//                   <Switch
//                     checked={brandData.voice?.channels?.custom?.toneStyles?.minimalist || false}
//                     onCheckedChange={(checked) => toggleToneStyle("minimalist", checked)}
//                     className="scale-75"
//                   />
//                 </div>

//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-1.5">
//                     <MessageSquarePlus className="h-3.5 w-3.5 text-gray-500" />
//                     <span className="text-xs">Use Emoji</span>
//                   </div>
//                   <Switch
//                     checked={brandData.voice?.channels?.custom?.useEmoji || false}
//                     onCheckedChange={(checked) => toggleEmojiUsage(checked)}
//                     className="scale-75"
//                   />
//                 </div>
//               </div>
//             </div>

//             <div className="p-4 pt-2">
//               <Button
//                 variant="outline"
//                 size="sm"
//                 className="w-full text-xs h-8 gap-1 mt-4 bg-white dark:bg-gray-800 border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-400"
//                 onClick={generateAiSuggestions}
//               >
//                 {isGeneratingAi ? (
//                   <>
//                     <motion.div
//                       animate={{ rotate: 360 }}
//                       transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
//                     >
//                       <RefreshCw className="h-3 w-3" />
//                     </motion.div>
//                     <span>Generating...</span>
//                   </>
//                 ) : (
//                   <>
//                     <Sparkles className="h-3 w-3 text-amber-500" />
//                     <span>AI Suggestions</span>
//                   </>
//                 )}
//               </Button>
//             </div>
//           </div>

//           {/* Main content area */}
//           <div className="col-span-10">
//             <div className="h-full flex flex-col">
//               {/* Page type header */}
//               <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between">
//                 <div className="flex items-center gap-2">
//                   <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
//                     activeTab === "landing" ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400" :
//                     activeTab === "form" ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400" :
//                     activeTab === "success" ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400" :
//                     activeTab === "error" ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400" :
//                     "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400"
//                   }`}>
//                     {getPageTypeIcon(activeTab)}
//                   </div>
//                   <div>
//                     <h2 className="text-sm font-medium">{getPageTypeTitle(activeTab)} Voice Settings</h2>
//                     <p className="text-xs text-gray-500 dark:text-gray-400">Customize text and messaging for {activeTab} pages</p>
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-2">
//                   {/* Toggle view mode */}
//                   <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
//                     <button
//                       className={`p-1 rounded ${viewMode === 'desktop' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'}`}
//                       onClick={() => setViewMode('desktop')}
//                     >
//                       <Globe className="h-4 w-4" />
//                     </button>
//                     <button
//                       className={`p-1 rounded ${viewMode === 'tablet' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'}`}
//                       onClick={() => setViewMode('tablet')}
//                     >
//                       <Tablet className="h-4 w-4" />
//                     </button>
//                     <button
//                       className={`p-1 rounded ${viewMode === 'mobile' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'}`}
//                       onClick={() => setViewMode('mobile')}
//                     >
//                       <Smartphone className="h-4 w-4" />
//                     </button>
//                   </div>

//                   {/* Toggle color theme */}
//                   <Select
//                     value={colorTheme}
//                     onValueChange={(value) => setColorTheme(value as ColorTheme)}
//                   >
//                     <SelectTrigger className="h-8 w-[130px] text-xs">
//                       <SelectValue placeholder="Color Theme" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="light">Light Theme</SelectItem>
//                       <SelectItem value="dark">Dark Theme</SelectItem>
//                       <SelectItem value="custom">Brand Colors</SelectItem>
//                     </SelectContent>
//                   </Select>

//                   {/* Toggle expand/collapse */}
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     className="h-8 w-8 p-0"
//                     onClick={() => setIsExpanded(!isExpanded)}
//                   >
//                     {isExpanded ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
//                   </Button>

//                   {/* Help tooltip */}
//                   <TooltipProvider>
//                     <Tooltip>
//                       <TooltipTrigger asChild>
//                         <Button variant="outline" size="sm" className="h-8 w-8 p-0">
//                           <Info className="h-4 w-4" />
//                         </Button>
//                       </TooltipTrigger>
//                       <TooltipContent side="bottom" align="end" className="w-80">
//                         <div className="space-y-2">
//                           <h3 className="font-medium">Page Voice Elements</h3>
//                           <p className="text-xs">Each page type has specific voice elements that should be consistent with your brand tone while being appropriate for that page's purpose.</p>
//                           <p className="text-xs">Use template variables like {"{{"}brand{{"}}"}} to personalize content.</p>
//                         </div>
//                       </TooltipContent>
//                     </Tooltip>
//                   </TooltipProvider>
//                 </div>
//               </div>

//               {/* Main content grid */}
//               <div className="flex-grow grid grid-cols-2 gap-0">
//                 {/* Left panel - Form fields */}
//                 <div className={`border-r border-gray-200 dark:border-gray-800 overflow-auto ${isExpanded ? 'hidden' : 'block'}`}>
//                   <div className="p-6 space-y-6">
//                     {/* Page title */}
//                     <div className="space-y-2">
//                       <div className="flex items-center justify-between">
//                         <Label className="text-sm font-medium flex items-center gap-1.5">
//                           <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
//                           <span>Page Title</span>
//                         </Label>
//                         <div className="flex items-center gap-2">
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             className="h-7 w-7 p-0"
//                             onClick={() => copyToClipboard(getCurrentPageSettings().title, "title")}
//                           >
//                             {copied === "title" ? <ClipboardCheck className="h-3.5 w-3.5 text-green-600" /> : <Clipboard className="h-3.5 w-3.5" />}
//                           </Button>
//                           <Popover>
//                             <PopoverTrigger asChild>
//                               <Button
//                                 variant="ghost"
//                                 size="sm"
//                                 className="h-7 w-7 p-0"
//                               >
//                                 <Wand2 className="h-3.5 w-3.5 text-amber-500" />
//                               </Button>
//                             </PopoverTrigger>
//                             <PopoverContent side="right" align="start" className="w-80 p-0">
//                               <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 p-2 border-b">
//                                 <h3 className="text-xs font-medium flex items-center gap-1.5">
//                                   <Sparkles className="h-3.5 w-3.5 text-amber-500" />
//                                   <span>AI Title Suggestions</span>
//                                 </h3>
//                               </div>
//                               <div className="py-1 max-h-64 overflow-auto">
//                                 {getAiSuggestions(activeTab).title.map((suggestion, index) => (
//                                   <div
//                                     key={index}
//                                     className={`px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer ${
//                                       selectedTemplate === index ? "bg-gray-100 dark:bg-gray-800" : ""
//                                     }`}
//                                     onClick={() => applyAiSuggestion("title", suggestion)}
//                                     onMouseEnter={() => setSelectedTemplate(index)}
//                                     onMouseLeave={() => setSelectedTemplate(null)}
//                                   >
//                                     <div className="flex items-center justify-between">
//                                       <div className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
//                                         <Star className="h-3 w-3" />
//                                         <span>Option {index + 1}</span>
//                                       </div>
//                                       <Button
//                                         variant="ghost"
//                                         size="sm"
//                                         className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
//                                         onClick={(e) => {
//                                           e.stopPropagation();
//                                           applyAiSuggestion("title", suggestion);
//                                         }}
//                                       >
//                                         <Check className="h-3 w-3 text-green-600" />
//                                       </Button>
//                                     </div>
//                                     <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">
//                                       {formatPreviewText(suggestion)}
//                                     </p>
//                                   </div>
//                                 ))}
//                               </div>
//                             </PopoverContent>
//                           </Popover>
//                         </div>
//                       </div>

//                       <Input
//                         value={getCurrentPageSettings().title}
//                         onChange={(e) => updatePageField("title", e.target.value)}
//                         className="w-full border-2 rounded-lg focus:border-indigo-400 focus:ring-indigo-400"
//                       />

//                       <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-1">
//                         <Info className="h-3.5 w-3.5" />
//                         <span>This appears as the main heading on {activeTab} pages</span>
//                       </div>
//                     </div>

//                     {/* Page description */}
//                     <div className="space-y-2">
//                       <div className="flex items-center justify-between">
//                         <Label className="text-sm font-medium flex items-center gap-1.5">
//                           <AlignLeft className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
//                           <span>Page Description</span>
//                         </Label>
//                         <div className="flex items-center gap-2">
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             className="h-7 w-7 p-0"
//                             onClick={() => copyToClipboard(getCurrentPageSettings().description, "description")}
//                           >
//                             {copied === "description" ? <ClipboardCheck className="h-3.5 w-3.5 text-green-600" /> : <Clipboard className="h-3.5 w-3.5" />}
//                           </Button>
//                           <Popover>
//                             <PopoverTrigger asChild>
//                               <Button
//                                 variant="ghost"
//                                 size="sm"
//                                 className="h-7 w-7 p-0"
//                               >
//                                 <Wand2 className="h-3.5 w-3.5 text-amber-500" />
//                               </Button>
//                             </PopoverTrigger>
//                             <PopoverContent side="right" align="start" className="w-80 p-0">
//                               <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 p-2 border-b">
//                                 <h3 className="text-xs font-medium flex items-center gap-1.5">
//                                   <Sparkles className="h-3.5 w-3.5 text-amber-500" />
//                                   <span>AI Description Suggestions</span>
//                                 </h3>
//                               </div>
//                               <div className="py-1 max-h-64 overflow-auto">
//                                 {getAiSuggestions(activeTab).description.map((suggestion, index) => (
//                                   <div
//                                     key={index}
//                                     className={`px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer ${
//                                       selectedTemplate === index ? "bg-gray-100 dark:bg-gray-800" : ""
//                                     }`}
//                                     onClick={() => applyAiSuggestion("description", suggestion)}
//                                     onMouseEnter={() => setSelectedTemplate(index)}
//                                     onMouseLeave={() => setSelectedTemplate(null)}
//                                   >
//                                     <div className="flex items-center justify-between">
//                                       <div className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
//                                         <Star className="h-3 w-3" />
//                                         <span>Option {index + 1}</span>
//                                       </div>
//                                       <Button
//                                         variant="ghost"
//                                         size="sm"
//                                         className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
//                                         onClick={(e) => {
//                                           e.stopPropagation();
//                                           applyAiSuggestion("description", suggestion);
//                                         }}
//                                       >
//                                         <Check className="h-3 w-3 text-green-600" />
//                                       </Button>
//                                     </div>
//                                     <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">
//                                       {formatPreviewText(suggestion)}
//                                     </p>
//                                   </div>
//                                 ))}
//                               </div>
//                             </PopoverContent>
//                           </Popover>
//                         </div>
//                       </div>

//                       <Textarea
//                         value={getCurrentPageSettings().description}
//                         onChange={(e) => updatePageField("description", e.target.value)}
//                         className="w-full min-h-[100px] border-2 rounded-lg focus:border-indigo-400 focus:ring-indigo-400"
//                       />

//                       <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-1">
//                         <Info className="h-3.5 w-3.5" />
//                         <span>Provides context and details below the main heading</span>
//                       </div>
//                     </div>

//                     {/* CTA Button Text */}
//                     <div className="space-y-2">
//                       <div className="flex items-center justify-between">
//                         <Label className="text-sm font-medium flex items-center gap-1.5">
//                           <MousePointerClick className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
//                           <span>Call-to-Action Text</span>
//                         </Label>
//                         <div className="flex items-center gap-2">
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             className="h-7 w-7 p-0"
//                             onClick={() => copyToClipboard(getCurrentPageSettings().cta, "cta")}
//                           >
//                             {copied === "cta" ? <ClipboardCheck className="h-3.5 w-3.5 text-green-600" /> : <Clipboard className="h-3.5 w-3.5" />}
//                           </Button>
//                           <Popover>
//                             <PopoverTrigger asChild>
//                               <Button
//                                 variant="ghost"
//                                 size="sm"
//                                 className="h-7 w-7 p-0"
//                               >
//                                 <Wand2 className="h-3.5 w-3.5 text-amber-500" />
//                               </Button>
//                             </PopoverTrigger>
//                             <PopoverContent side="right" align="start" className="w-80 p-0">
//                               <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 p-2 border-b">
//                                 <h3 className="text-xs font-medium flex items-center gap-1.5">
//                                   <Sparkles className="h-3.5 w-3.5 text-amber-500" />
//                                   <span>AI CTA Suggestions</span>
//                                 </h3>
//                               </div>
//                               <div className="py-1 max-h-64 overflow-auto">
//                                 {getAiSuggestions(activeTab).cta.map((suggestion, index) => (
//                                   <div
//                                     key={index}
//                                     className={`px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer ${
//                                       selectedTemplate === index ? "bg-gray-100 dark:bg-gray-800" : ""
//                                     }`}
//                                     onClick={() => applyAiSuggestion("cta", suggestion)}
//                                     onMouseEnter={() => setSelectedTemplate(index)}
//                                     onMouseLeave={() => setSelectedTemplate(null)}
//                                   >
//                                     <div className="flex items-center justify-between">
//                                       <div className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
//                                         <Star className="h-3 w-3" />
//                                         <span>Option {index + 1}</span>
//                                       </div>
//                                       <Button
//                                         variant="ghost"
//                                         size="sm"
//                                         className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
//                                         onClick={(e) => {
//                                           e.stopPropagation();
//                                           applyAiSuggestion("cta", suggestion);
//                                         }}
//                                       >
//                                         <Check className="h-3 w-3 text-green-600" />
//                                       </Button>
//                                     </div>
//                                     <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">
//                                       {formatPreviewText(suggestion)}
//                                     </p>
//                                   </div>
//                                 ))}
//                               </div>
//                             </PopoverContent>
//                           </Popover>
//                         </div>
//                       </div>

//                       <Input
//                         value={getCurrentPageSettings().cta}
//                         onChange={(e) => updatePageField("cta", e.target.value)}
//                         className="w-full border-2 rounded-lg focus:border-indigo-400 focus:ring-indigo-400"
//                       />

//                       <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-1">
//                         <Info className="h-3.5 w-3.5" />
//                         <span>Text for primary action button on the page</span>
//                       </div>
//                     </div>

//                     {/* Success and Error Messages - Accordion */}
//                     <Accordion type="single" collapsible className="w-full border rounded-lg">
//                       <AccordionItem value="additional-messages" className="border-b-0">
//                         <AccordionTrigger className="hover:no-underline p-4">
//                           <div className="flex items-center gap-2">
//                             <MessageSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
//                             <span className="text-sm font-medium">Additional Messages</span>
//                           </div>
//                         </AccordionTrigger>
//                         <AccordionContent className="px-4 pb-4 pt-0">
//                           <div className="space-y-4">
//                             {/* Success Message */}
//                             <div className="space-y-2">
//                               <Label className="text-sm font-medium flex items-center gap-1.5">
//                                 <CheckCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
//                                 <span>Success Message</span>
//                               </Label>
//                               <Input
//                                 value={getCurrentPageSettings().successMessage}
//                                 onChange={(e) => updatePageField("successMessage", e.target.value)}
//                                 className="w-full border-2 rounded-lg focus:border-green-400 focus:ring-green-400"
//                               />
//                               <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-1">
//                                 <Info className="h-3.5 w-3.5" />
//                                 <span>Displayed after successful form submissions</span>
//                               </div>
//                             </div>

//                             {/* Error Message */}
//                             <div className="space-y-2">
//                               <Label className="text-sm font-medium flex items-center gap-1.5">
//                                 <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
//                                 <span>Error Message</span>
//                               </Label>
//                               <Input
//                                 value={getCurrentPageSettings().errorMessage}
//                                 onChange={(e) => updatePageField("errorMessage", e.target.value)}
//                                 className="w-full border-2 rounded-lg focus:border-red-400 focus:ring-red-400"
//                               />
//                               <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-1">
//                                 <Info className="h-3.5 w-3.5" />
//                                 <span>Shown when an error occurs during form submission</span>
//                               </div>
//                             </div>
//                           </div>
//                         </AccordionContent>
//                       </AccordionItem>
//                     </Accordion>

//                     {/* Form Labels - Accordion */}
//                     <Accordion type="single" collapsible className="w-full border rounded-lg">
//                       <AccordionItem value="form-labels" className="border-b-0">
//                         <AccordionTrigger className="hover:no-underline p-4">
//                           <div className="flex items-center gap-2">
//                             <Settings2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
//                             <span className="text-sm font-medium">Form Field Labels</span>
//                           </div>
//                         </AccordionTrigger>
//                         <AccordionContent className="px-4 pb-4 pt-0">
//                           <div className="space-y-4">
//                             {/* Name Label */}
//                             <div className="space-y-2">
//                               <Label className="text-sm font-medium flex items-center gap-1.5">
//                                 <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
//                                 <span>Name Field Label</span>
//                               </Label>
//                               <Input
//                                 value={getCurrentPageSettings().formLabels.name}
//                                 onChange={(e) => updatePageField("formLabels.name", e.target.value)}
//                                 className="w-full border-2 rounded-lg focus:border-indigo-400 focus:ring-indigo-400"
//                               />
//                             </div>

//                             {/* Email Label */}
//                             <div className="space-y-2">
//                               <Label className="text-sm font-medium flex items-center gap-1.5">
//                                 <Mail className="h-4 w-4 text-gray-600 dark:text-gray-400" />
//                                 <span>Email Field Label</span>
//                               </Label>
//                               <Input
//                                 value={getCurrentPageSettings().formLabels.email}
//                                 onChange={(e) => updatePageField("formLabels.email", e.target.value)}
//                                 className="w-full border-2 rounded-lg focus:border-indigo-400 focus:ring-indigo-400"
//                               />
//                             </div>

//                             {/* Message Label */}
//                             <div className="space-y-2">
//                               <Label className="text-sm font-medium flex items-center gap-1.5">
//                                 <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
//                                 <span>Message Field Label</span>
//                               </Label>
//                               <Input
//                                 value={getCurrentPageSettings().formLabels.message}
//                                 onChange={(e) => updatePageField("formLabels.message", e.target.value)}
//                                 className="w-full border-2 rounded-lg focus:border-indigo-400 focus:ring-indigo-400"
//                               />
//                             </div>

//                             {/* Submit Button Label */}
//                             <div className="space-y-2">
//                               <Label className="text-sm font-medium flex items-center gap-1.5">
//                                 <SendHorizonal className="h-4 w-4 text-gray-600 dark:text-gray-400" />
//                                 <span>Submit Button Label</span>
//                               </Label>
//                               <Input
//                                 value={getCurrentPageSettings().formLabels.submit}
//                                 onChange={(e) => updatePageField("formLabels.submit", e.target.value)}
//                                 className="w-full border-2 rounded-lg focus:border-indigo-400 focus:ring-indigo-400"
//                               />
//                             </div>
//                           </div>
//                         </AccordionContent>
//                       </AccordionItem>
//                     </Accordion>
//                   </div>
//                 </div>

//                 {/* Right panel - Live preview */}
//                 <div className={isExpanded ? "col-span-2" : "col-span-1"}>
//                   <div className="h-full bg-gray-100 dark:bg-gray-850 flex flex-col">
//                     <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
//                       <div className="flex items-center gap-2">
//                         <EyeIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
//                         <span className="text-sm font-medium">Live Preview</span>
//                       </div>

//                       <Button
//                         variant="outline"
//                         size="sm"
//                         className="h-8 w-8 p-0"
//                         onClick={() => setIsFullscreenPreview(!isFullscreenPreview)}
//                       >
//                         {isFullscreenPreview ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
//                       </Button>
//                     </div>

//                     <div className="flex-grow overflow-auto p-6">
//                       <div
//                         className={`mx-auto transition-all transform border border-gray-200 dark:border-gray-800 shadow-lg rounded-lg overflow-hidden ${
//                           viewMode === 'mobile'
//                             ? 'max-w-[375px]'
//                             : viewMode === 'tablet'
//                               ? 'max-w-[768px]'
//                               : 'max-w-[1024px]'
//                         } ${
//                           isFullscreenPreview ? 'scale-100' : 'scale-90'
//                         }`}
//                         style={{
//                           backgroundColor:
//                             colorTheme === 'light'
//                               ? '#ffffff'
//                               : colorTheme === 'dark'
//                                 ? '#1f2937'
//                                 : brandData.colors.background,
//                           color:
//                             colorTheme === 'light'
//                               ? '#111827'
//                               : colorTheme === 'dark'
//                                 ? '#f9fafb'
//                                 : brandData.colors.foreground
//                         }}
//                       >
//                         {/* Preview content based on page type */}
//                         <AnimatePresence mode="wait">
//                           <motion.div
//                             key={activeTab}
//                             initial={{ opacity: 0, y: 10 }}
//                             animate={{ opacity: 1, y: 0 }}
//                             exit={{ opacity: 0, y: -10 }}
//                             transition={{ duration: 0.2 }}
//                             className="p-6"
//                           >
//                             {/* Landing Page Preview */}
//                             {activeTab === "landing" && (
//                               <div className="space-y-6">
//                                 <header className="space-y-4 text-center">
//                                   <h1 className="text-3xl font-bold" style={{
//                                     color: colorTheme === 'custom' ? brandData.colors.primary : 'inherit'
//                                   }}>
//                                     {formatPreviewText(getCurrentPageSettings().title)}
//                                   </h1>
//                                   <p className="text-lg max-w-2xl mx-auto">
//                                     {formatPreviewText(getCurrentPageSettings().description)}
//                                   </p>

//                                   <div className="pt-4">
//                                     <button className="px-6 py-3 rounded-lg text-white transition-colors" style={{
//                                       backgroundColor: colorTheme === 'custom' ? brandData.colors.primary : colorTheme === 'light' ? '#4F46E5' : '#6366F1'
//                                     }}>
//                                       {getCurrentPageSettings().cta}
//                                     </button>
//                                   </div>
//                                 </header>

//                                 <div className="grid grid-cols-3 gap-4 pt-4">
//                                   {[1, 2, 3].map((i) => (
//                                     <div key={i} className="p-4 rounded-lg border border-gray-200 dark:border-gray-800">
//                                       <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 mb-4"></div>
//                                       <h3 className="text-lg font-semibold mb-2">Feature {i}</h3>
//                                       <p className="text-sm text-gray-600 dark:text-gray-400">
//                                         This is a sample feature description for your landing page preview.
//                                       </p>
//                                     </div>
//                                   ))}
//                                 </div>
//                               </div>
//                             )}

//                             {/* Form Page Preview */}
//                             {activeTab === "form" && (
//                               <div className="max-w-md mx-auto space-y-6">
//                                 <header className="space-y-4">
//                                   <h1 className="text-2xl font-bold" style={{
//                                     color: colorTheme === 'custom' ? brandData.colors.primary : 'inherit'
//                                   }}>
//                                     {formatPreviewText(getCurrentPageSettings().title)}
//                                   </h1>
//                                   <p className="text-base">
//                                     {formatPreviewText(getCurrentPageSettings().description)}
//                                   </p>
//                                 </header>

//                                 <div className="space-y-4 pt-2">
//                                   <div className="space-y-2">
//                                     <label className="block text-sm font-medium">
//                                       {getCurrentPageSettings().formLabels.name}
//                                     </label>
//                                     <input
//                                       type="text"
//                                       className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg"
//                                       placeholder="John Doe"
//                                     />
//                                   </div>

//                                   <div className="space-y-2">
//                                     <label className="block text-sm font-medium">
//                                       {getCurrentPageSettings().formLabels.email}
//                                     </label>
//                                     <input
//                                       type="email"
//                                       className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg"
//                                       placeholder="john@example.com"
//                                     />
//                                   </div>

//                                   <div className="space-y-2">
//                                     <label className="block text-sm font-medium">
//                                       {getCurrentPageSettings().formLabels.message}
//                                     </label>
//                                     <textarea
//                                       className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg h-24"
//                                       placeholder="Your message here..."
//                                     ></textarea>
//                                   </div>

//                                   <div className="pt-2">
//                                     <button className="w-full px-4 py-2 rounded-lg text-white transition-colors" style={{
//                                       backgroundColor: colorTheme === 'custom' ? brandData.colors.primary : colorTheme === 'light' ? '#4F46E5' : '#6366F1'
//                                     }}>
//                                       {getCurrentPageSettings().formLabels.submit}
//                                     </button>
//                                   </div>
//                                 </div>
//                               </div>
//                             )}

//                             {/* Success Page Preview */}
//                             {activeTab === "success" && (
//                               <div className="max-w-md mx-auto text-center space-y-6">
//                                 <div className="flex justify-center mb-6">
//                                   <div className="h-16 w-16 rounded-full flex items-center justify-center" style={{
//                                     backgroundColor: colorTheme === 'custom' ? `${brandData.colors.primary}20` : colorTheme === 'light' ? '#4F46E520' : '#6366F120'
//                                   }}>
//                                     <CircleCheckBig className="h-8 w-8" style={{
//                                       color: colorTheme === 'custom' ? brandData.colors.primary : colorTheme === 'light' ? '#4F46E5' : '#6366F1'
//                                     }} />
//                                   </div>
//                                 </div>

//                                 <h1 className="text-2xl font-bold" style={{
//                                   color: colorTheme === 'custom' ? brandData.colors.primary : 'inherit'
//                                 }}>
//                                   {formatPreviewText(getCurrentPageSettings().title)}
//                                 </h1>

//                                 <p className="text-base">
//                                   {formatPreviewText(getCurrentPageSettings().description)}
//                                 </p>

//                                 <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 rounded-lg p-4 text-green-800 dark:text-green-300 text-sm">
//                                   {formatPreviewText(getCurrentPageSettings().successMessage)}
//                                 </div>

//                                 <div className="pt-4">
//                                   <button className="px-6 py-2 rounded-lg text-white transition-colors" style={{
//                                     backgroundColor: colorTheme === 'custom' ? brandData.colors.primary : colorTheme === 'light' ? '#4F46E5' : '#6366F1'
//                                   }}>
//                                     {getCurrentPageSettings().cta}
//                                   </button>
//                                 </div>
//                               </div>
//                             )}

//                             {/* Error Page Preview */}
//                             {activeTab === "error" && (
//                               <div className="max-w-md mx-auto text-center space-y-6">
//                                 <div className="flex justify-center mb-6">
//                                   <div className="h-16 w-16 rounded-full flex items-center justify-center" style={{
//                                     backgroundColor: colorTheme === 'light' ? '#EF444420' : '#F8717120'
//                                   }}>
//                                     <AlertCircle className="h-8 w-8" style={{
//                                       color: colorTheme === 'light' ? '#EF4444' : '#F87171'
//                                     }} />
//                                   </div>
//                                 </div>

//                                 <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">
//                                   {formatPreviewText(getCurrentPageSettings().title)}
//                                 </h1>

//                                 <p className="text-base">
//                                   {formatPreviewText(getCurrentPageSettings().description)}
//                                 </p>

//                                 <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-lg p-4 text-red-800 dark:text-red-300 text-sm">
//                                   {formatPreviewText(getCurrentPageSettings().errorMessage)}
//                                 </div>

//                                 <div className="pt-4">
//                                   <button className="px-6 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 transition-colors">
//                                     {getCurrentPageSettings().cta}
//                                   </button>
//                                 </div>
//                               </div>
//                             )}

//                             {/* Testimonial Page Preview */}
//                             {activeTab === "testimonial" && (
//                               <div className="space-y-6">
//                                 <header className="text-center space-y-4 max-w-2xl mx-auto">
//                                   <h1 className="text-2xl font-bold" style={{
//                                     color: colorTheme === 'custom' ? brandData.colors.primary : 'inherit'
//                                   }}>
//                                     {formatPreviewText(getCurrentPageSettings().title)}
//                                   </h1>
//                                   <p className="text-base">
//                                     {formatPreviewText(getCurrentPageSettings().description)}
//                                   </p>
//                                 </header>

//                                 <div className="grid grid-cols-2 gap-6 pt-4">
//                                   {[1, 2].map((i) => (
//                                     <div key={i} className="p-5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
//                                       <div className="flex items-center mb-4">
//                                         <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 mr-3"></div>
//                                         <div>
//                                           <h3 className="font-medium">Customer Name</h3>
//                                           <p className="text-sm text-gray-500 dark:text-gray-400">Company Name</p>
//                                         </div>
//                                         <div className="ml-auto flex text-amber-400">
//                                           {[1, 2, 3, 4, 5].map((star) => (
//                                             <Star key={star} className="h-4 w-4 fill-current" />
//                                           ))}
//                                         </div>
//                                       </div>
//                                       <p className="text-sm">
//                                         "This is a sample testimonial that shows how customer reviews will appear on your testimonial page. The design matches your brand voice settings."
//                                       </p>
//                                     </div>
//                                   ))}
//                                 </div>

//                                 <div className="pt-4 text-center">
//                                   <button className="px-6 py-2 rounded-lg text-white transition-colors" style={{
//                                     backgroundColor: colorTheme === 'custom' ? brandData.colors.primary : colorTheme === 'light' ? '#4F46E5' : '#6366F1'
//                                   }}>
//                                     {getCurrentPageSettings().cta}
//                                   </button>
//                                 </div>
//                               </div>
//                             )}
//                           </motion.div>
//                         </AnimatePresence>
//                       </div>
//                     </div>

//                     <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
//                       <div className="text-xs text-center text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
//                         <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
//                         <span>
//                           Voice elements should remain consistent with your brand while being appropriate for this page type
//                         </span>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   );
// };

// export default observer(CustomPagesSettings);

import { FC, useState, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { brandGuideStore } from "@/stores/brandGuideStore";
import { motion, AnimatePresence } from "framer-motion";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

// Icons
import {
  FileEdit,
  Globe,
  Layout,
  Type,
  Copy,
  Check,
  Sparkles,
  Smartphone,
  Eye,
  EyeIcon,
  FileText,
  Info,
  CheckSquare,
  ArrowRight,
  Wand2,
  LucideIcon,
  Link,
  Send,
  Star,
  MessageSquare,
  HeartHandshake,
  Bookmark,
  ExternalLink,
  AlertCircle,
  Users,
  UserCheck,
  X,
} from "lucide-react";
import { DesktopIcon } from "@radix-ui/react-icons";
import { CustomPageTemplateType } from "@/types/setup";

// Component-specific types

type TemplateOption = {
  id: string;
  text: string;
};

type TabInfo = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
};

const CustomSettings: FC = () => {
  const store = brandGuideStore;
  const { brandData } = store;
  const [activeTab, setActiveTab] = useState<string>("page-title");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">(
    "desktop"
  );
  const [copied, setCopied] = useState<string | null>(null);
  const [showTemplatePanel, setShowTemplatePanel] = useState<boolean>(false);
  const [templateBeingEdited, setTemplateBeingEdited] =
    useState<CustomPageTemplateType | null>(null);

  // For animations and UI state
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isAnimate, setIsAnimate] = useState<boolean>(true);
  const [showSuccessScreen, setShowSuccessScreen] = useState<boolean>(false);

  // References for scrolling animations
  const templatePanelRef = useRef<HTMLDivElement>(null);

  // Default template options for each template type
  const templateOptions: Record<CustomPageTemplateType, TemplateOption[]> = {
    pageTitleTemplate: [
      { id: "standard", text: "Share your experience with {{brand}}" },
      { id: "conversational", text: "Tell us what you think about {{brand}}" },
      { id: "direct", text: "{{brand}} - Customer Testimonials" },
      { id: "grateful", text: "Your feedback matters to {{brand}}" },
    ],
    headlineTemplate: [
      { id: "standard", text: "We value your feedback!" },
      { id: "personal", text: "We'd love to hear from you" },
      { id: "impact", text: "Help others discover {{brand}}" },
      { id: "growth", text: "Your insights help us improve" },
    ],
    formIntroTemplate: [
      {
        id: "standard",
        text: "Please share your thoughts about your experience with {{brand}}. Your feedback helps us improve and assists others in making informed decisions.",
      },
      {
        id: "brief",
        text: "Tell us about your experience with {{brand}}. What did you like most?",
      },
      {
        id: "detailed",
        text: "We appreciate you taking the time to share your experience with {{brand}}. Please tell us what you liked, what could be improved, and any other thoughts you have.",
      },
      {
        id: "guided",
        text: "How has {{brand}} helped you? What specific benefits have you experienced? Please share your honest thoughts to help others.",
      },
    ],
    ctaButtonTemplate: [
      { id: "standard", text: "Submit your testimonial" },
      { id: "action", text: "Share your story" },
      { id: "impact", text: "Help others discover us" },
      { id: "simple", text: "Submit feedback" },
    ],
    successTitleTemplate: [
      { id: "standard", text: "Thank you for your feedback!" },
      { id: "personal", text: "We appreciate your insights" },
      { id: "grateful", text: "Your testimonial means a lot to us" },
      { id: "impact", text: "You're helping {{brand}} grow" },
    ],
    successMessageTemplate: [
      {
        id: "standard",
        text: "We truly appreciate you taking the time to share your experience with {{brand}}. Your feedback helps us improve and provide better service to all our customers.",
      },
      {
        id: "brief",
        text: "Thank you for sharing your experience with {{brand}}. Your feedback is invaluable to us and our community.",
      },
      {
        id: "social",
        text: "Thank you for your testimonial! Would you consider sharing your experience on social media? Tag us @{{brand}} so we can show our appreciation.",
      },
      {
        id: "next-steps",
        text: "Thanks for your feedback! Your testimonial will be reviewed and may be featured on our website. We'll keep you updated on our latest products and services.",
      },
    ],
  };

  // Tab configuration with their visual styling
  const tabs: TabInfo[] = [
    {
      id: "page-title",
      label: "Page Elements",
      description: "Main page title and headline",
      icon: Type,
      color: "amber",
    },
    {
      id: "form-content",
      label: "Form Content",
      description: "Form introduction and CTA button",
      icon: FileText,
      color: "emerald",
    },
    {
      id: "success-page",
      label: "Success Screen",
      description: "Thank you page after submission",
      icon: CheckSquare,
      color: "blue",
    },
    {
      id: "domain",
      label: "Custom Domain",
      description: "Customize your page URL",
      icon: Globe,
      color: "purple",
    },
  ];

  // Initialize custom page settings if they don't exist
  useEffect(() => {
    if (!brandData.voice?.channels?.custom) {
      store.updateBrandData(["voice", "channels", "custom"], {
        pageTitleTemplate: "Share your experience with {{brand}}",
        headlineTemplate: "We value your feedback!",
        formIntroTemplate:
          "Please share your thoughts about your experience with {{brand}}. Your feedback helps us improve and assists others in making informed decisions.",
        ctaButtonTemplate: "Submit your testimonial",
        successTitleTemplate: "Thank you for your feedback!",
        successMessageTemplate:
          "We truly appreciate you taking the time to share your experience with {{brand}}. Your feedback helps us improve and provide better service to all our customers.",
        customDomain: "",
        customSlug: "testimonials",
      });
    }
  }, [brandData.voice?.channels?.custom, store]);

  // Get template value
  const getTemplateValue = (templateType: CustomPageTemplateType): string => {
    if (brandData.voice?.channels?.custom?.[templateType]) {
      return brandData.voice.channels.custom[templateType];
    }
    return "";
  };

  // Update template
  const updateTemplate = (
    templateType: CustomPageTemplateType,
    value: string
  ) => {
    store.updateBrandData(["voice", "channels", "custom", templateType], value);
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  // Format preview text by replacing template variables
  const formatPreviewText = (text: string): string => {
    return text
      .replace(/{{brand}}/g, brandData.name || "Your Brand")
      .replace(/{{product}}/g, "Premium Plan");
  };

  // Show the template panel with options for a particular template type
  const showTemplates = (templateType: CustomPageTemplateType) => {
    setTemplateBeingEdited(templateType);
    setShowTemplatePanel(true);

    // Scroll to template panel if it exists
    setTimeout(() => {
      if (templatePanelRef.current) {
        templatePanelRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  // Apply a template from the options
  const applyTemplate = (template: string) => {
    if (templateBeingEdited) {
      updateTemplate(templateBeingEdited, template);
      setShowTemplatePanel(false);
    }
  };

  // Trigger the success screen demo
  const triggerSuccessScreenDemo = () => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setShowSuccessScreen(true);
    }, 1200);

    // Reset after some time
    setTimeout(() => {
      setShowSuccessScreen(false);
    }, 8000);
  };

  // Demo function for the CTA button in preview
  const handlePreviewButtonClick = () => {
    if (activeTab === "success-page") {
      triggerSuccessScreenDemo();
    }
  };

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-indigo-50 via-sky-50 to-fuchsia-50 dark:from-gray-900 dark:via-indigo-900/20 dark:to-fuchsia-900/10 rounded-xl">
      <CardHeader className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 flex items-center justify-center text-white shadow-md">
            <FileEdit className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 dark:from-indigo-400 dark:via-purple-400 dark:to-fuchsia-400">
              Custom Collection Pages
            </CardTitle>
            <CardDescription className="text-sm mt-0.5">
              Personalize your testimonial collection page voice and messaging
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Left sidebar - Tab navigation */}
          <div className="p-4 md:w-64 md:border-r md:min-h-[600px]">
            <div className="space-y-1.5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-start text-left p-3 gap-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? `bg-${tab.color}-50 dark:bg-${tab.color}-900/20 border-l-4 border-${tab.color}-500`
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 border-l-4 border-transparent"
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-lg flex-shrink-0 flex items-center justify-center ${
                      activeTab === tab.id
                        ? `bg-${tab.color}-100 dark:bg-${tab.color}-900/40 text-${tab.color}-600 dark:text-${tab.color}-400`
                        : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{tab.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {tab.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* UI Controls for Preview */}
            <div className="mt-8 pt-6 border-t">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Preview Options</h4>
                <div className="flex items-center gap-1">
                  <button
                    className={`p-1.5 rounded-lg ${previewDevice === "desktop" ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400" : "text-gray-500"}`}
                    onClick={() => setPreviewDevice("desktop")}
                  >
                    <DesktopIcon className="h-4 w-4" />
                  </button>
                  <button
                    className={`p-1.5 rounded-lg ${previewDevice === "mobile" ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400" : "text-gray-500"}`}
                    onClick={() => setPreviewDevice("mobile")}
                  >
                    <Smartphone className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">Animations</div>
                <Switch
                  checked={isAnimate}
                  onCheckedChange={setIsAnimate}
                  className="data-[state=checked]:bg-indigo-600"
                />
              </div>

              {activeTab === "success-page" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={triggerSuccessScreenDemo}
                  className="w-full mt-2 text-xs h-8 gap-1.5"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Preview Success Screen</span>
                </Button>
              )}
            </div>

            {/* Help Box */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30 text-xs">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-blue-800 dark:text-blue-300 font-medium">
                    Template Tips
                  </p>
                  <p className="mt-1 text-blue-600 dark:text-blue-400">
                    Use{" "}
                    <code className="bg-blue-100 dark:bg-blue-800/50 px-1 rounded">
                      {"{{brand}}"}
                    </code>{" "}
                    to dynamically insert your brand name in any template.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1 p-0">
            {/* Page Title Tab */}
            {activeTab === "page-title" && (
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <Type className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        <span>Page Title</span>
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        The title that appears in the browser tab and search
                        results
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => showTemplates("pageTitleTemplate")}
                      >
                        <Wand2 className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                        <span>Templates</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() =>
                          copyToClipboard(
                            getTemplateValue("pageTitleTemplate"),
                            "pageTitle"
                          )
                        }
                      >
                        {copied === "pageTitle" ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="relative">
                    <Input
                      value={getTemplateValue("pageTitleTemplate")}
                      onChange={(e) =>
                        updateTemplate("pageTitleTemplate", e.target.value)
                      }
                      className="pr-24 border-2 focus:border-amber-400 focus:ring-amber-400"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Badge
                        variant="outline"
                        className="text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50"
                      >
                        Page Title
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mt-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <Layout className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        <span>Page Headline</span>
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        The main heading displayed at the top of your collection
                        page
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => showTemplates("headlineTemplate")}
                      >
                        <Wand2 className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                        <span>Templates</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() =>
                          copyToClipboard(
                            getTemplateValue("headlineTemplate"),
                            "headline"
                          )
                        }
                      >
                        {copied === "headline" ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="relative">
                    <Input
                      value={getTemplateValue("headlineTemplate")}
                      onChange={(e) =>
                        updateTemplate("headlineTemplate", e.target.value)
                      }
                      className="pr-24 border-2 focus:border-amber-400 focus:ring-amber-400"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Badge
                        variant="outline"
                        className="text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50"
                      >
                        Headline
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="border-t mt-6 pt-6">
                  <div className="text-sm font-medium mb-3 flex items-center gap-2">
                    <EyeIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span>Preview</span>
                  </div>

                  <div
                    className={`mx-auto border-2 border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-md ${previewDevice === "mobile" ? "max-w-[320px]" : "max-w-full"}`}
                  >
                    <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center">
                      <div className="flex-1 truncate">
                        <div className="flex items-center gap-2">
                          <Globe className="h-3.5 w-3.5 text-gray-500" />
                          <div className="text-xs truncate">
                            {formatPreviewText(
                              getTemplateValue("pageTitleTemplate")
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 p-6">
                      <div className="space-y-4">
                        <div className="flex flex-col items-center text-center mb-8">
                          {brandData.logo?.main ? (
                            <img
                              src={brandData.logo.main}
                              alt={brandData.name || "Brand Logo"}
                              className="h-12 mb-4"
                            />
                          ) : (
                            <div
                              className="h-12 w-12 rounded-full flex items-center justify-center text-white mb-4"
                              style={{
                                background: `linear-gradient(135deg, ${brandData.colors?.primary || "#3b82f6"}, ${brandData.colors?.secondary || "#6366f1"})`,
                              }}
                            >
                              <span className="text-lg font-bold">
                                {brandData.name
                                  ? brandData.name.charAt(0)
                                  : "B"}
                              </span>
                            </div>
                          )}

                          <h1
                            className="text-2xl font-bold mb-2"
                            style={{
                              color: brandData.colors?.primary || "#3b82f6",
                            }}
                          >
                            {formatPreviewText(
                              getTemplateValue("headlineTemplate")
                            )}
                          </h1>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Form Content Tab */}
            {activeTab === "form-content" && (
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        <span>Form Introduction</span>
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Text that introduces the testimonial form and sets
                        expectations
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => showTemplates("formIntroTemplate")}
                      >
                        <Wand2 className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                        <span>Templates</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() =>
                          copyToClipboard(
                            getTemplateValue("formIntroTemplate"),
                            "formIntro"
                          )
                        }
                      >
                        {copied === "formIntro" ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="relative">
                    <Textarea
                      value={getTemplateValue("formIntroTemplate")}
                      onChange={(e) =>
                        updateTemplate("formIntroTemplate", e.target.value)
                      }
                      className="min-h-[100px] border-2 focus:border-emerald-400 focus:ring-emerald-400"
                    />
                    <div className="absolute right-3 top-3">
                      <Badge
                        variant="outline"
                        className="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50"
                      >
                        Introduction
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mt-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <Send className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        <span>Submit Button Text</span>
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        The call-to-action text on the form submission button
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => showTemplates("ctaButtonTemplate")}
                      >
                        <Wand2 className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                        <span>Templates</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() =>
                          copyToClipboard(
                            getTemplateValue("ctaButtonTemplate"),
                            "ctaButton"
                          )
                        }
                      >
                        {copied === "ctaButton" ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="relative">
                    <Input
                      value={getTemplateValue("ctaButtonTemplate")}
                      onChange={(e) =>
                        updateTemplate("ctaButtonTemplate", e.target.value)
                      }
                      className="pr-24 border-2 focus:border-emerald-400 focus:ring-emerald-400"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Badge
                        variant="outline"
                        className="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50"
                      >
                        Button
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="border-t mt-6 pt-6">
                  <div className="text-sm font-medium mb-3 flex items-center gap-2">
                    <EyeIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Preview</span>
                  </div>

                  <div
                    className={`mx-auto border-2 border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-md ${previewDevice === "mobile" ? "max-w-[320px]" : "max-w-full"}`}
                  >
                    <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center">
                      <div className="flex-1 truncate">
                        <div className="flex items-center gap-2">
                          <Globe className="h-3.5 w-3.5 text-gray-500" />
                          <div className="text-xs truncate">
                            {formatPreviewText(
                              getTemplateValue("pageTitleTemplate")
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 p-6">
                      <div className="space-y-4">
                        <div className="flex flex-col items-center text-center mb-6">
                          {brandData.logo?.main ? (
                            <img
                              src={brandData.logo.main}
                              alt={brandData.name || "Brand Logo"}
                              className="h-12 mb-4"
                            />
                          ) : (
                            <div
                              className="h-12 w-12 rounded-full flex items-center justify-center text-white mb-4"
                              style={{
                                background: `linear-gradient(135deg, ${brandData.colors?.primary || "#3b82f6"}, ${brandData.colors?.secondary || "#6366f1"})`,
                              }}
                            >
                              <span className="text-lg font-bold">
                                {brandData.name
                                  ? brandData.name.charAt(0)
                                  : "B"}
                              </span>
                            </div>
                          )}

                          <h1
                            className="text-2xl font-bold mb-2"
                            style={{
                              color: brandData.colors?.primary || "#3b82f6",
                            }}
                          >
                            {formatPreviewText(
                              getTemplateValue("headlineTemplate")
                            )}
                          </h1>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {formatPreviewText(
                              getTemplateValue("formIntroTemplate")
                            )}
                          </p>
                        </div>

                        <div className="space-y-4 mb-6">
                          <div className="space-y-1.5">
                            <Label className="text-sm">Your Name</Label>
                            <Input
                              disabled
                              placeholder="John Smith"
                              className="bg-gray-50 dark:bg-gray-800"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-sm">Your Testimonial</Label>
                            <Textarea
                              disabled
                              placeholder="Share your experience..."
                              className="bg-gray-50 dark:bg-gray-800"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-sm">Rating</Label>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className="h-6 w-6 text-gray-300 dark:text-gray-600"
                                  fill={
                                    star <= 4
                                      ? brandData.colors?.primary || "#3b82f6"
                                      : "none"
                                  }
                                  stroke={
                                    star <= 4
                                      ? brandData.colors?.primary || "#3b82f6"
                                      : "currentColor"
                                  }
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-center">
                          <Button
                            className="px-6 gap-2"
                            onClick={handlePreviewButtonClick}
                            style={{
                              backgroundColor:
                                brandData.colors?.primary || "#3b82f6",
                            }}
                          >
                            <Send className="h-4 w-4" />
                            {formatPreviewText(
                              getTemplateValue("ctaButtonTemplate")
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Success Page Tab */}
            {activeTab === "success-page" && (
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <CheckSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span>Success Page Title</span>
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        The heading shown after a successful testimonial
                        submission
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => showTemplates("successTitleTemplate")}
                      >
                        <Wand2 className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                        <span>Templates</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() =>
                          copyToClipboard(
                            getTemplateValue("successTitleTemplate"),
                            "successTitle"
                          )
                        }
                      >
                        {copied === "successTitle" ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="relative">
                    <Input
                      value={getTemplateValue("successTitleTemplate")}
                      onChange={(e) =>
                        updateTemplate("successTitleTemplate", e.target.value)
                      }
                      className="pr-24 border-2 focus:border-blue-400 focus:ring-blue-400"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Badge
                        variant="outline"
                        className="text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50"
                      >
                        Title
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mt-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span>Success Message</span>
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        The message shown after a successful testimonial
                        submission
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => showTemplates("successMessageTemplate")}
                      >
                        <Wand2 className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                        <span>Templates</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() =>
                          copyToClipboard(
                            getTemplateValue("successMessageTemplate"),
                            "successMessage"
                          )
                        }
                      >
                        {copied === "successMessage" ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="relative">
                    <Textarea
                      value={getTemplateValue("successMessageTemplate")}
                      onChange={(e) =>
                        updateTemplate("successMessageTemplate", e.target.value)
                      }
                      className="min-h-[100px] border-2 focus:border-blue-400 focus:ring-blue-400"
                    />
                    <div className="absolute right-3 top-3">
                      <Badge
                        variant="outline"
                        className="text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50"
                      >
                        Message
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="border-t mt-6 pt-6">
                  <div className="text-sm font-medium mb-3 flex items-center gap-2">
                    <EyeIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span>Preview</span>
                  </div>

                  <div
                    className={`mx-auto border-2 border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-md ${previewDevice === "mobile" ? "max-w-[320px]" : "max-w-full"}`}
                  >
                    <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center">
                      <div className="flex-1 truncate">
                        <div className="flex items-center gap-2">
                          <Globe className="h-3.5 w-3.5 text-gray-500" />
                          <div className="text-xs truncate">
                            {formatPreviewText(
                              getTemplateValue("pageTitleTemplate")
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 p-6">
                      {!showSuccessScreen ? (
                        <>
                          <div className="flex flex-col items-center text-center mb-6">
                            {brandData.logo?.main ? (
                              <img
                                src={brandData.logo.main}
                                alt={brandData.name || "Brand Logo"}
                                className="h-12 mb-4"
                              />
                            ) : (
                              <div
                                className="h-12 w-12 rounded-full flex items-center justify-center text-white mb-4"
                                style={{
                                  background: `linear-gradient(135deg, ${brandData.colors?.primary || "#3b82f6"}, ${brandData.colors?.secondary || "#6366f1"})`,
                                }}
                              >
                                <span className="text-lg font-bold">
                                  {brandData.name
                                    ? brandData.name.charAt(0)
                                    : "B"}
                                </span>
                              </div>
                            )}

                            <h1
                              className="text-2xl font-bold mb-2"
                              style={{
                                color: brandData.colors?.primary || "#3b82f6",
                              }}
                            >
                              {formatPreviewText(
                                getTemplateValue("headlineTemplate")
                              )}
                            </h1>
                          </div>

                          <div className="space-y-4 mb-6">
                            <div className="space-y-1.5">
                              <Label className="text-sm">Your Name</Label>
                              <Input
                                disabled
                                placeholder="John Smith"
                                className="bg-gray-50 dark:bg-gray-800"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-sm">
                                Your Testimonial
                              </Label>
                              <Textarea
                                disabled
                                placeholder="Share your experience..."
                                className="bg-gray-50 dark:bg-gray-800"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-sm">Rating</Label>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className="h-6 w-6 text-gray-300 dark:text-gray-600"
                                    fill={
                                      star <= 4
                                        ? brandData.colors?.primary || "#3b82f6"
                                        : "none"
                                    }
                                    stroke={
                                      star <= 4
                                        ? brandData.colors?.primary || "#3b82f6"
                                        : "currentColor"
                                    }
                                  />
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-center">
                            {isTyping ? (
                              <Button className="px-6" disabled>
                                <div className="flex space-x-1 items-center">
                                  <div className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:-0.3s]"></div>
                                  <div className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:-0.15s]"></div>
                                  <div className="w-2 h-2 rounded-full bg-white animate-bounce"></div>
                                </div>
                              </Button>
                            ) : (
                              <Button
                                className="px-6 gap-2"
                                onClick={handlePreviewButtonClick}
                                style={{
                                  backgroundColor:
                                    brandData.colors?.primary || "#3b82f6",
                                }}
                              >
                                <Send className="h-4 w-4" />
                                {formatPreviewText(
                                  getTemplateValue("ctaButtonTemplate")
                                )}
                              </Button>
                            )}
                          </div>
                        </>
                      ) : (
                        <AnimatePresence>
                          <motion.div
                            className="flex flex-col items-center justify-center py-8 text-center"
                            initial={
                              isAnimate
                                ? { opacity: 0, y: 20 }
                                : { opacity: 1, y: 0 }
                            }
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                          >
                            <motion.div
                              initial={isAnimate ? { scale: 0 } : { scale: 1 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 0.5, delay: 0.3 }}
                              className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6"
                            >
                              <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
                            </motion.div>

                            <motion.h2
                              className="text-2xl font-bold mb-4"
                              initial={
                                isAnimate ? { opacity: 0 } : { opacity: 1 }
                              }
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.5, delay: 0.6 }}
                              style={{
                                color: brandData.colors?.primary || "#3b82f6",
                              }}
                            >
                              {formatPreviewText(
                                getTemplateValue("successTitleTemplate")
                              )}
                            </motion.h2>

                            <motion.p
                              className="text-gray-600 dark:text-gray-300 max-w-md mx-auto"
                              initial={
                                isAnimate ? { opacity: 0 } : { opacity: 1 }
                              }
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.5, delay: 0.8 }}
                            >
                              {formatPreviewText(
                                getTemplateValue("successMessageTemplate")
                              )}
                            </motion.p>

                            <motion.div
                              className="mt-8"
                              initial={
                                isAnimate ? { opacity: 0 } : { opacity: 1 }
                              }
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.5, delay: 1 }}
                            >
                              <Button
                                variant="outline"
                                className="gap-2"
                                style={{
                                  borderColor:
                                    brandData.colors?.primary || "#3b82f6",
                                  color: brandData.colors?.primary || "#3b82f6",
                                }}
                              >
                                <ArrowRight className="h-4 w-4" />
                                <span>Return to Website</span>
                              </Button>
                            </motion.div>
                          </motion.div>
                        </AnimatePresence>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Domain Tab */}
            {activeTab === "domain" && (
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Globe className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <span>Custom Domain Settings</span>
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      Customize the URL where your testimonial collection page
                      will be hosted
                    </p>
                  </div>

                  <div className="space-y-5 pt-2">
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">
                        Standard Collection Page URL
                      </Label>
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 flex items-center">
                        <div className="flex items-center gap-1.5 text-purple-800 dark:text-purple-300">
                          <Link className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                          <span className="text-sm">
                            testimonials.example.com/
                          </span>
                          <Badge className="bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700">
                            {brandData.voice?.channels?.custom?.customSlug ||
                              "testimonials"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Info className="h-3.5 w-3.5" />
                        <span>
                          This is your default testimonial collection page URL
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <Label className="text-sm font-medium">
                        Custom URL Path
                      </Label>
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          testimonials.example.com/
                        </div>
                        <Input
                          value={
                            brandData.voice?.channels?.custom?.customSlug ||
                            "testimonials"
                          }
                          onChange={(e) =>
                            store.updateBrandData(
                              ["voice", "channels", "custom", "customSlug"],
                              e.target.value
                            )
                          }
                          className="max-w-[200px] border-2 focus:border-purple-400 focus:ring-purple-400"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>
                          Use only letters, numbers, and hyphens. No spaces.
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t">
                      <Label className="text-sm font-medium">
                        Custom Domain (Coming Soon)
                      </Label>
                      <div className="relative opacity-70">
                        <Input
                          value={
                            brandData.voice?.channels?.custom?.customDomain ||
                            ""
                          }
                          onChange={(e) =>
                            store.updateBrandData(
                              ["voice", "channels", "custom", "customDomain"],
                              e.target.value
                            )
                          }
                          placeholder="feedback.yourbrand.com"
                          className="border-2 pl-10 focus:border-purple-400 focus:ring-purple-400"
                          disabled
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                          <Globe className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Badge variant="outline" className="h-5 text-[10px]">
                            Coming Soon
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Info className="h-3.5 w-3.5" />
                        <span>
                          Add your own domain for a more branded experience
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border-2 border-purple-100 dark:border-purple-900/40 bg-purple-50 dark:bg-purple-900/20 p-4 mt-8">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0">
                      <ExternalLink className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-purple-800 dark:text-purple-300">
                        Custom Domain Benefits
                      </h4>
                      <p className="text-xs text-purple-700 dark:text-purple-400 mt-1.5">
                        Using a custom domain helps maintain brand consistency
                        and increases trust when collecting testimonials. Your
                        customers will see your brand throughout the entire
                        experience.
                      </p>
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-purple-200 dark:bg-purple-800 flex items-center justify-center">
                            <HeartHandshake className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                          </div>
                          <span className="text-xs text-purple-700 dark:text-purple-400">
                            Increased trust
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-purple-200 dark:bg-purple-800 flex items-center justify-center">
                            <Bookmark className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                          </div>
                          <span className="text-xs text-purple-700 dark:text-purple-400">
                            Brand recognition
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-purple-200 dark:bg-purple-800 flex items-center justify-center">
                            <Users className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                          </div>
                          <span className="text-xs text-purple-700 dark:text-purple-400">
                            Higher conversion
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-purple-200 dark:bg-purple-800 flex items-center justify-center">
                            <UserCheck className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                          </div>
                          <span className="text-xs text-purple-700 dark:text-purple-400">
                            Professional image
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t mt-6 pt-6">
                  <div className="text-sm font-medium mb-3 flex items-center gap-2">
                    <EyeIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span>Preview</span>
                  </div>

                  <div
                    className={`mx-auto border-2 border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-md ${previewDevice === "mobile" ? "max-w-[320px]" : "max-w-full"}`}
                  >
                    <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center">
                      <div className="flex-1 truncate">
                        <div className="flex items-center gap-2">
                          <Globe className="h-3.5 w-3.5 text-gray-500" />
                          <div className="text-xs text-purple-600 dark:text-purple-400 truncate">
                            testimonials.example.com/
                            {brandData.voice?.channels?.custom?.customSlug ||
                              "testimonials"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 p-6">
                      <div className="space-y-4">
                        <div className="flex flex-col items-center text-center mb-6">
                          {brandData.logo?.main ? (
                            <img
                              src={brandData.logo.main}
                              alt={brandData.name || "Brand Logo"}
                              className="h-12 mb-4"
                            />
                          ) : (
                            <div
                              className="h-12 w-12 rounded-full flex items-center justify-center text-white mb-4"
                              style={{
                                background: `linear-gradient(135deg, ${brandData.colors?.primary || "#3b82f6"}, ${brandData.colors?.secondary || "#6366f1"})`,
                              }}
                            >
                              <span className="text-lg font-bold">
                                {brandData.name
                                  ? brandData.name.charAt(0)
                                  : "B"}
                              </span>
                            </div>
                          )}

                          <h1
                            className="text-2xl font-bold mb-2"
                            style={{
                              color: brandData.colors?.primary || "#3b82f6",
                            }}
                          >
                            {formatPreviewText(
                              getTemplateValue("headlineTemplate")
                            )}
                          </h1>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Template suggestions panel at the bottom */}
        <AnimatePresence>
          {showTemplatePanel && templateBeingEdited && (
            <motion.div
              ref={templatePanelRef}
              className="border-t"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span>Template Suggestions</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {templateBeingEdited.replace("Template", "")}
                    </Badge>
                  </h3>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setShowTemplatePanel(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {templateOptions[templateBeingEdited]?.map((option) => (
                    <div
                      key={option.id}
                      className="border-2 border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-lg p-3 cursor-pointer transition-colors"
                      onClick={() => applyTemplate(option.text)}
                    >
                      <div className="text-sm font-medium mb-1 capitalize">
                        {option.id}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {option.text.length > 100
                          ? `${option.text.substring(0, 100)}...`
                          : option.text}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => setShowTemplatePanel(false)}
                  >
                    <X className="h-3.5 w-3.5 mr-1.5" />
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default observer(CustomSettings);
