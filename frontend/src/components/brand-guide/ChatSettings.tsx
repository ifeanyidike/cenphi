// import { FC, useState, useEffect } from "react";
// import { observer } from "mobx-react-lite";
// import { brandGuideStore } from "@/stores/brandGuideStore";
// import { motion, AnimatePresence } from "framer-motion";

// // UI Components
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
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
//   HoverCard,
//   HoverCardContent,
//   HoverCardTrigger,
// } from "@/components/ui/hover-card";
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
// import { Slider } from "@/components/ui/slider";

// // Icons
// import {
//   MessageCircle,
//   Info,
//   Smartphone,
//   Wand2,
//   SendHorizonal,
//   PenSquare,
//   Clock,
//   CheckCircle2,
//   BellRing,
//   User,
//   Settings,
//   UserCheck,
//   ThumbsUp,
//   CircleCheck,
//   Sparkles,
//   Play,
//   CheckCheck,
//   MessageSquare,
//   CheckCircle,
//   PlusCircle,
//   Eye,
//   Palette,
//   Globe,
//   RotateCw,
//   Layers,
//   RefreshCw,
//   Mail,
//   CalendarCheck,
//   CalendarClock,
//   BotMessageSquare,
//   MessagesSquare,
//   LayoutTemplate,
//   Send,
//   Forward,
//   BellOff,
//   MousePointerClick,
//   MoreHorizontal,
//   HeartHandshake,
//   Copy,
//   Check,
//   LucideMessageSquare,
//   LucideMessageCircle,
// } from "lucide-react";

// import { getInitials } from "@/utils/utils";

// const ChatSettings: FC = () => {
//   const store = brandGuideStore;
//   const { brandData } = store;

//   const [previewActive, setPreviewActive] = useState<boolean>(false);
//   const [previewMessage, setPreviewMessage] = useState<
//     "request" | "thankyou" | "followup"
//   >("request");
//   const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">(
//     "desktop"
//   );
//   const [currentTemplateExample, setCurrentTemplateExample] = useState<
//     string | null
//   >(null);
//   const [showFullTemplateList, setShowFullTemplateList] =
//     useState<boolean>(false);
//   const [isTyping, setIsTyping] = useState<boolean>(false);
//   const [activeTab, setActiveTab] = useState<string>("request");
//   const [messageTiming, setMessageTiming] = useState<string>("after-purchase");
//   const [copied, setCopied] = useState<string | null>(null);

//   // Initialize chat settings if they don't exist
//   useEffect(() => {
//     if (!brandData.voice?.channels?.chat) {
//       store.updateBrandData(["voice", "channels", "chat"], {
//         requestTemplate:
//           "Hi {{name}}, we appreciate your recent experience with {{brand}}. Would you be willing to share your thoughts in a brief testimonial?",
//         thankYouTemplate:
//           "Thank you for your testimonial, {{name}}! We truly value your feedback and support of {{brand}}.",
//         followupTemplate:
//           "Hi {{name}}, just a friendly reminder that we'd love to hear your thoughts about your experience with {{brand}}. It would mean a lot to us!",
//         settings: {
//           timing: "after-purchase",
//           autoFollowUp: true,
//           followUpDelay: 3,
//           welcomeMessage: true,
//           displayAvatar: true,
//         },
//       });
//     }
//   }, [brandData.voice?.channels?.chat, store]);

//   const getTemplateValue = (type: string): string => {
//     if (
//       brandData.voice?.channels?.chat &&
//       brandData.voice.channels.chat[`${type}Template`]
//     ) {
//       return brandData.voice.channels.chat[`${type}Template`];
//     }
//     return "";
//   };

//   const updateTemplate = (type: string, value: string) => {
//     store.updateBrandData(
//       ["voice", "channels", "chat", `${type}Template`],
//       value
//     );
//   };

//   const updateChatSetting = (path: string[], value: any) => {
//     store.updateBrandData(
//       ["voice", "channels", "chat", "settings", ...path],
//       value
//     );
//   };

//   const formatPreviewText = (template: string): string => {
//     return template
//       .replace(/{{name}}/g, "Alex Thompson")
//       .replace(/{{brand}}/g, brandData.name || "Your Brand")
//       .replace(/{{product}}/g, "Premium Plan")
//       .replace(
//         /{{testimonial}}/g,
//         "Your product has been amazing! It's improved our workflow by 40%."
//       );
//   };

//   const copyToClipboard = (text: string, type: string) => {
//     navigator.clipboard.writeText(text);
//     setCopied(type);
//     setTimeout(() => setCopied(null), 2000);
//   };

//   // Template examples
//   const templateExamples = {
//     request: [
//       {
//         title: "Friendly & Personalized",
//         text: "Hi {{name}}! 👋 I hope you're enjoying {{product}}. Would you mind taking a moment to share your thoughts? Your feedback helps us improve and guides others too!",
//       },
//       {
//         title: "Short & Direct",
//         text: "Hi {{name}}, would you share a quick testimonial about your experience with {{brand}}? It would mean a lot to us.",
//       },
//       {
//         title: "Professional",
//         text: "Hello {{name}}, we value your opinion on {{brand}}'s services. Would you be willing to provide a brief testimonial about your experience? Thank you for your consideration.",
//       },
//     ],
//     thankyou: [
//       {
//         title: "Warm & Appreciative",
//         text: "Thank you so much, {{name}}! 🙏 Your testimonial means the world to us. We're thrilled that you've had a positive experience with {{brand}} and truly appreciate you taking the time to share!",
//       },
//       {
//         title: "Simple & Genuine",
//         text: "Thanks for your testimonial, {{name}}! We really appreciate your support and feedback.",
//       },
//       {
//         title: "Professional Gratitude",
//         text: "Thank you, {{name}}, for sharing your experience with {{brand}}. We value your feedback and are committed to continuing to provide the quality service you've highlighted.",
//       },
//     ],
//     followup: [
//       {
//         title: "Gentle Reminder",
//         text: "Hi {{name}}, just following up on our request for your feedback about {{brand}}. We'd love to hear your thoughts when you have a moment!",
//       },
//       {
//         title: "Value Proposition",
//         text: "Hello {{name}}, we noticed you haven't shared your testimonial yet. Your insights would be incredibly valuable to us and help future customers make informed decisions. Would you have a moment now?",
//       },
//       {
//         title: "Final Opportunity",
//         text: "Hi {{name}}, this is our last reminder about sharing your experience with {{brand}}. If you have a moment, we'd truly value your feedback. If not, no problem at all!",
//       },
//     ],
//   };

//   // Animation for typing simulation
//   useEffect(() => {
//     if (previewActive) {
//       setIsTyping(true);
//       setTimeout(() => setIsTyping(false), 1000);
//     }
//   }, [previewMessage, previewActive]);

//   return (
//     <div className="space-y-6">
//       {/* Chat Settings Card */}
//       <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-950 overflow-hidden">
//         <CardHeader className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 pb-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-2">
//               <div className="h-8 w-8 rounded-full bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
//                 <Settings className="h-4 w-4 text-violet-600 dark:text-violet-400" />
//               </div>
//               <div>
//                 <CardTitle className="text-base">Chat Behavior</CardTitle>
//                 <CardDescription className="text-xs mt-0.5">
//                   Configure how testimonial requests behave in chat
//                 </CardDescription>
//               </div>
//             </div>
//             <TooltipProvider>
//               <Tooltip>
//                 <TooltipTrigger asChild>
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     className="h-8 gap-1"
//                     onClick={() => setPreviewActive(!previewActive)}
//                   >
//                     <Play
//                       className={`h-3.5 w-3.5 ${previewActive ? "text-green-500" : ""}`}
//                     />
//                     <span
//                       className={`text-xs ${previewActive ? "text-green-600" : ""}`}
//                     >
//                       {previewActive ? "Preview Active" : "Live Preview"}
//                     </span>
//                   </Button>
//                 </TooltipTrigger>
//                 <TooltipContent side="bottom">
//                   <p className="text-xs">Toggle the live preview simulation</p>
//                 </TooltipContent>
//               </Tooltip>
//             </TooltipProvider>
//           </div>
//         </CardHeader>

//         <CardContent className="pt-5 pb-5">
//           <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
//             {/* Settings Column */}
//             <div className="md:col-span-2 space-y-5">
//               {/* Timing Settings */}
//               <div className="space-y-3">
//                 <Label className="text-sm font-medium flex items-center gap-1.5">
//                   <span>Request Timing</span>
//                   <TooltipProvider>
//                     <Tooltip>
//                       <TooltipTrigger asChild>
//                         <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
//                       </TooltipTrigger>
//                       <TooltipContent className="w-56">
//                         <p className="text-xs">
//                           When to automatically send testimonial requests in
//                           chat
//                         </p>
//                       </TooltipContent>
//                     </Tooltip>
//                   </TooltipProvider>
//                 </Label>

//                 <div className="grid grid-cols-1 gap-2">
//                   <div
//                     className={`rounded-md border p-3 flex items-center gap-3 cursor-pointer transition-colors ${
//                       messageTiming === "after-purchase"
//                         ? "border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20"
//                         : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
//                     }`}
//                     onClick={() => {
//                       setMessageTiming("after-purchase");
//                       updateChatSetting(["timing"], "after-purchase");
//                     }}
//                   >
//                     <div
//                       className={`h-4 w-4 rounded-full border flex items-center justify-center ${
//                         messageTiming === "after-purchase"
//                           ? "border-violet-500 bg-violet-100 dark:bg-violet-900"
//                           : "border-gray-300 dark:border-gray-700"
//                       }`}
//                     >
//                       {messageTiming === "after-purchase" && (
//                         <div className="h-2 w-2 rounded-full bg-violet-500"></div>
//                       )}
//                     </div>
//                     <div className="flex-1">
//                       <div className="text-sm font-medium">After Purchase</div>
//                       <div className="text-xs text-gray-500">
//                         Ask within 24h of completed purchase
//                       </div>
//                     </div>
//                     <CalendarCheck
//                       className={`h-4 w-4 ${
//                         messageTiming === "after-purchase"
//                           ? "text-violet-500"
//                           : "text-gray-400"
//                       }`}
//                     />
//                   </div>

//                   <div
//                     className={`rounded-md border p-3 flex items-center gap-3 cursor-pointer transition-colors ${
//                       messageTiming === "after-support"
//                         ? "border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20"
//                         : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
//                     }`}
//                     onClick={() => {
//                       setMessageTiming("after-support");
//                       updateChatSetting(["timing"], "after-support");
//                     }}
//                   >
//                     <div
//                       className={`h-4 w-4 rounded-full border flex items-center justify-center ${
//                         messageTiming === "after-support"
//                           ? "border-violet-500 bg-violet-100 dark:bg-violet-900"
//                           : "border-gray-300 dark:border-gray-700"
//                       }`}
//                     >
//                       {messageTiming === "after-support" && (
//                         <div className="h-2 w-2 rounded-full bg-violet-500"></div>
//                       )}
//                     </div>
//                     <div className="flex-1">
//                       <div className="text-sm font-medium">After Support</div>
//                       <div className="text-xs text-gray-500">
//                         Ask after support case is resolved
//                       </div>
//                     </div>
//                     <HeartHandshake
//                       className={`h-4 w-4 ${
//                         messageTiming === "after-support"
//                           ? "text-violet-500"
//                           : "text-gray-400"
//                       }`}
//                     />
//                   </div>

//                   <div
//                     className={`rounded-md border p-3 flex items-center gap-3 cursor-pointer transition-colors ${
//                       messageTiming === "manual"
//                         ? "border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20"
//                         : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
//                     }`}
//                     onClick={() => {
//                       setMessageTiming("manual");
//                       updateChatSetting(["timing"], "manual");
//                     }}
//                   >
//                     <div
//                       className={`h-4 w-4 rounded-full border flex items-center justify-center ${
//                         messageTiming === "manual"
//                           ? "border-violet-500 bg-violet-100 dark:bg-violet-900"
//                           : "border-gray-300 dark:border-gray-700"
//                       }`}
//                     >
//                       {messageTiming === "manual" && (
//                         <div className="h-2 w-2 rounded-full bg-violet-500"></div>
//                       )}
//                     </div>
//                     <div className="flex-1">
//                       <div className="text-sm font-medium">Manual Only</div>
//                       <div className="text-xs text-gray-500">
//                         Only send when manually triggered
//                       </div>
//                     </div>
//                     <MousePointerClick
//                       className={`h-4 w-4 ${
//                         messageTiming === "manual"
//                           ? "text-violet-500"
//                           : "text-gray-400"
//                       }`}
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* Follow-up Settings */}
//               <div className="space-y-3">
//                 <Label className="text-sm font-medium flex items-center gap-1.5">
//                   <span>Follow-up Settings</span>
//                   <TooltipProvider>
//                     <Tooltip>
//                       <TooltipTrigger asChild>
//                         <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
//                       </TooltipTrigger>
//                       <TooltipContent className="w-56">
//                         <p className="text-xs">
//                           Configure automatic follow-up reminders
//                         </p>
//                       </TooltipContent>
//                     </Tooltip>
//                   </TooltipProvider>
//                 </Label>

//                 <div className="space-y-4">
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center gap-2">
//                       <Switch
//                         id="auto-followup"
//                         checked={
//                           brandData.voice?.channels?.chat?.settings
//                             ?.autoFollowUp
//                         }
//                         onCheckedChange={(checked) =>
//                           updateChatSetting(["autoFollowUp"], checked)
//                         }
//                       />
//                       <Label
//                         htmlFor="auto-followup"
//                         className="text-sm cursor-pointer"
//                       >
//                         Automatic Follow-up
//                       </Label>
//                     </div>
//                     <div className="flex items-center gap-1 text-xs text-gray-500">
//                       <BellRing className="h-3.5 w-3.5" />
//                       <span>Reminder</span>
//                     </div>
//                   </div>

//                   {brandData.voice?.channels?.chat?.settings?.autoFollowUp && (
//                     <div className="pl-7 border-l-2 border-violet-200 dark:border-violet-800 space-y-3">
//                       <div className="space-y-1">
//                         <Label
//                           htmlFor="followup-delay"
//                           className="text-xs font-medium"
//                         >
//                           Follow-up Delay (days)
//                         </Label>
//                         <div className="flex items-center gap-3">
//                           <Slider
//                             id="followup-delay"
//                             value={[
//                               brandData.voice?.channels?.chat?.settings
//                                 ?.followUpDelay || 3,
//                             ]}
//                             min={1}
//                             max={14}
//                             step={1}
//                             className="flex-1"
//                             onValueChange={(value) =>
//                               updateChatSetting(["followUpDelay"], value[0])
//                             }
//                           />
//                           <div className="w-10 text-center text-sm font-medium">
//                             {brandData.voice?.channels?.chat?.settings
//                               ?.followUpDelay || 3}
//                           </div>
//                         </div>
//                       </div>

//                       <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 p-2">
//                         <div className="flex items-start gap-1.5 text-xs text-amber-800 dark:text-amber-300">
//                           <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
//                           <div>
//                             Users who don't respond to the initial request will
//                             receive a follow-up
//                             {" " +
//                               (brandData.voice?.channels?.chat?.settings
//                                 ?.followUpDelay || 3) +
//                               " "}
//                             days later.
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Display Settings */}
//               <div className="space-y-3">
//                 <Label className="text-sm font-medium flex items-center gap-1.5">
//                   <span>Appearance</span>
//                   <TooltipProvider>
//                     <Tooltip>
//                       <TooltipTrigger asChild>
//                         <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
//                       </TooltipTrigger>
//                       <TooltipContent className="w-56">
//                         <p className="text-xs">
//                           Configure how the chat testimonial request appears
//                         </p>
//                       </TooltipContent>
//                     </Tooltip>
//                   </TooltipProvider>
//                 </Label>

//                 <div className="space-y-3">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <Label htmlFor="welcome-message" className="text-sm">
//                         Welcome Message
//                       </Label>
//                       <div className="text-xs text-gray-500">
//                         Include a friendly greeting before request
//                       </div>
//                     </div>
//                     <Switch
//                       id="welcome-message"
//                       checked={
//                         brandData.voice?.channels?.chat?.settings
//                           ?.welcomeMessage
//                       }
//                       onCheckedChange={(checked) =>
//                         updateChatSetting(["welcomeMessage"], checked)
//                       }
//                     />
//                   </div>

//                   <div className="flex items-center justify-between">
//                     <div>
//                       <Label htmlFor="display-avatar" className="text-sm">
//                         Display Brand Avatar
//                       </Label>
//                       <div className="text-xs text-gray-500">
//                         Show logo/avatar with testimonial request
//                       </div>
//                     </div>
//                     <Switch
//                       id="display-avatar"
//                       checked={
//                         brandData.voice?.channels?.chat?.settings?.displayAvatar
//                       }
//                       onCheckedChange={(checked) =>
//                         updateChatSetting(["displayAvatar"], checked)
//                       }
//                     />
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Live Preview Column */}
//             <div className="md:col-span-3">
//               <div className="border rounded-md overflow-hidden h-full flex flex-col">
//                 <div className="bg-gray-50 dark:bg-gray-900 px-3 py-2 border-b flex items-center justify-between">
//                   <div className="flex items-center gap-2">
//                     <Eye className="h-4 w-4 text-gray-500" />
//                     <span className="text-sm font-medium">Chat Preview</span>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={() =>
//                         setPreviewDevice(
//                           previewDevice === "desktop" ? "mobile" : "desktop"
//                         )
//                       }
//                       className="h-7 w-7 p-0"
//                     >
//                       {previewDevice === "desktop" ? (
//                         <Globe className="h-3.5 w-3.5" />
//                       ) : (
//                         <Smartphone className="h-3.5 w-3.5" />
//                       )}
//                     </Button>
//                     <Popover>
//                       <PopoverTrigger asChild>
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           className="h-7 w-7 p-0"
//                         >
//                           <MoreHorizontal className="h-3.5 w-3.5" />
//                         </Button>
//                       </PopoverTrigger>
//                       <PopoverContent
//                         className="w-52 p-1.5"
//                         side="bottom"
//                         align="end"
//                       >
//                         <div className="grid gap-0.5">
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             className="h-8 justify-start pl-2 font-normal"
//                             onClick={() => setPreviewMessage("request")}
//                           >
//                             <MessageCircle className="h-3.5 w-3.5 mr-2" />
//                             <span className="text-xs">Show Request</span>
//                           </Button>
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             className="h-8 justify-start pl-2 font-normal"
//                             onClick={() => setPreviewMessage("thankyou")}
//                           >
//                             <ThumbsUp className="h-3.5 w-3.5 mr-2" />
//                             <span className="text-xs">Show Thank You</span>
//                           </Button>
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             className="h-8 justify-start pl-2 font-normal"
//                             onClick={() => setPreviewMessage("followup")}
//                           >
//                             <BellRing className="h-3.5 w-3.5 mr-2" />
//                             <span className="text-xs">Show Follow-up</span>
//                           </Button>
//                           <div className="h-px bg-gray-200 dark:bg-gray-800 my-1"></div>
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             className="h-8 justify-start pl-2 font-normal"
//                             onClick={() => setPreviewActive(!previewActive)}
//                           >
//                             <Play className="h-3.5 w-3.5 mr-2" />
//                             <span className="text-xs">
//                               {previewActive
//                                 ? "Stop Simulation"
//                                 : "Start Simulation"}
//                             </span>
//                           </Button>
//                         </div>
//                       </PopoverContent>
//                     </Popover>
//                   </div>
//                 </div>

//                 <div className="flex-grow p-0 relative">
//                   <div
//                     className={`w-full h-full ${
//                       previewDevice === "mobile" ? "max-w-[320px] mx-auto" : ""
//                     }`}
//                   >
//                     {/* Chat Header */}
//                     <div className="bg-white dark:bg-gray-900 border-b p-3 flex items-center gap-3">
//                       <div
//                         className="h-8 w-8 rounded-full flex items-center justify-center text-white"
//                         style={{
//                           backgroundColor:
//                             brandData.colors?.primary || "#4F46E5",
//                         }}
//                       >
//                         <span className="text-xs font-medium">
//                           {getInitials(brandData.name || "Your Brand")}
//                         </span>
//                       </div>
//                       <div>
//                         <div className="text-sm font-medium">
//                           {brandData.name || "Your Brand"} Support
//                         </div>
//                         <div className="text-xs text-green-500 flex items-center gap-1">
//                           <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
//                           <span>Online</span>
//                         </div>
//                       </div>
//                     </div>

//                     {/* Chat Messages */}
//                     <div className="p-3 bg-gray-100 dark:bg-gray-900 h-[calc(100%-56px)] overflow-y-auto space-y-3">
//                       {/* Welcome Message */}
//                       {brandData.voice?.channels?.chat?.settings
//                         ?.welcomeMessage && (
//                         <div className="flex justify-start">
//                           <div className="bg-white dark:bg-gray-800 rounded-xl rounded-tl-none p-3 max-w-[80%] text-sm shadow-sm border">
//                             {brandData.voice?.channels?.chat?.settings
//                               ?.displayAvatar && (
//                               <div
//                                 className="font-semibold text-xs mb-1"
//                                 style={{ color: brandData.colors?.primary }}
//                               >
//                                 {brandData.name || "Your Brand"}
//                               </div>
//                             )}
//                             <div>
//                               Hello Alex! 👋 Welcome to our chat support. How
//                               can we assist you today?
//                             </div>
//                           </div>
//                         </div>
//                       )}

//                       {/* User Message */}
//                       <div className="flex justify-end">
//                         <div className="bg-gray-200 dark:bg-gray-700 rounded-xl rounded-tr-none p-3 max-w-[80%] text-sm">
//                           I've been using your product for a month now and it's
//                           working great!
//                         </div>
//                       </div>

//                       {/* Support Reply */}
//                       <div className="flex justify-start">
//                         <div className="bg-white dark:bg-gray-800 rounded-xl rounded-tl-none p-3 max-w-[80%] text-sm shadow-sm border">
//                           {brandData.voice?.channels?.chat?.settings
//                             ?.displayAvatar && (
//                             <div
//                               className="font-semibold text-xs mb-1"
//                               style={{ color: brandData.colors?.primary }}
//                             >
//                               {brandData.name || "Your Brand"}
//                             </div>
//                           )}
//                           <div>
//                             That's fantastic to hear, Alex! We're glad it's
//                             working well for you. Is there anything specific
//                             you've found particularly helpful?
//                           </div>
//                         </div>
//                       </div>

//                       {/* User Response */}
//                       <div className="flex justify-end">
//                         <div className="bg-gray-200 dark:bg-gray-700 rounded-xl rounded-tr-none p-3 max-w-[80%] text-sm">
//                           {previewMessage !== "request" && (
//                             <>
//                               The dashboard analytics have been super helpful
//                               for tracking our team's progress!
//                             </>
//                           )}
//                         </div>
//                       </div>

//                       {/* Testimonial Request */}
//                       {previewMessage === "request" && (
//                         <AnimatePresence>
//                           {isTyping ? (
//                             <motion.div
//                               className="flex justify-start mt-1"
//                               initial={{ opacity: 0 }}
//                               animate={{ opacity: 1 }}
//                               exit={{ opacity: 0 }}
//                             >
//                               <div className="bg-white dark:bg-gray-800 rounded-xl rounded-tl-none py-2 px-4 shadow-sm border flex items-center">
//                                 <div className="flex space-x-1">
//                                   <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 animate-bounce [animation-delay:-0.3s]"></div>
//                                   <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 animate-bounce [animation-delay:-0.15s]"></div>
//                                   <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 animate-bounce"></div>
//                                 </div>
//                               </div>
//                             </motion.div>
//                           ) : (
//                             <motion.div
//                               className="flex justify-start"
//                               initial={{ opacity: 0, y: 10 }}
//                               animate={{ opacity: 1, y: 0 }}
//                               transition={{ duration: 0.2 }}
//                             >
//                               <div className="bg-white dark:bg-gray-800 rounded-xl rounded-tl-none p-3 max-w-[80%] text-sm shadow-sm border">
//                                 {brandData.voice?.channels?.chat?.settings
//                                   ?.displayAvatar && (
//                                   <div
//                                     className="font-semibold text-xs mb-1"
//                                     style={{ color: brandData.colors?.primary }}
//                                   >
//                                     {brandData.name || "Your Brand"}
//                                   </div>
//                                 )}
//                                 <div>
//                                   {formatPreviewText(
//                                     getTemplateValue("request")
//                                   )}
//                                 </div>
//                               </div>
//                             </motion.div>
//                           )}
//                         </AnimatePresence>
//                       )}

//                       {/* Thank You Message */}
//                       {previewMessage === "thankyou" && (
//                         <AnimatePresence>
//                           {isTyping ? (
//                             <motion.div
//                               className="flex justify-start mt-1"
//                               initial={{ opacity: 0 }}
//                               animate={{ opacity: 1 }}
//                               exit={{ opacity: 0 }}
//                             >
//                               <div className="bg-white dark:bg-gray-800 rounded-xl rounded-tl-none py-2 px-4 shadow-sm border flex items-center">
//                                 <div className="flex space-x-1">
//                                   <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 animate-bounce [animation-delay:-0.3s]"></div>
//                                   <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 animate-bounce [animation-delay:-0.15s]"></div>
//                                   <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 animate-bounce"></div>
//                                 </div>
//                               </div>
//                             </motion.div>
//                           ) : (
//                             <motion.div
//                               className="flex justify-start"
//                               initial={{ opacity: 0, y: 10 }}
//                               animate={{ opacity: 1, y: 0 }}
//                               transition={{ duration: 0.2 }}
//                             >
//                               <div className="bg-white dark:bg-gray-800 rounded-xl rounded-tl-none p-3 max-w-[80%] text-sm shadow-sm border">
//                                 {brandData.voice?.channels?.chat?.settings
//                                   ?.displayAvatar && (
//                                   <div
//                                     className="font-semibold text-xs mb-1"
//                                     style={{ color: brandData.colors?.primary }}
//                                   >
//                                     {brandData.name || "Your Brand"}
//                                   </div>
//                                 )}
//                                 <div>
//                                   {formatPreviewText(
//                                     getTemplateValue("thankYou")
//                                   )}
//                                 </div>
//                               </div>
//                             </motion.div>
//                           )}
//                         </AnimatePresence>
//                       )}

//                       {/* Follow-up Message */}
//                       {previewMessage === "followup" && (
//                         <AnimatePresence>
//                           {isTyping ? (
//                             <motion.div
//                               className="flex justify-start mt-1"
//                               initial={{ opacity: 0 }}
//                               animate={{ opacity: 1 }}
//                               exit={{ opacity: 0 }}
//                             >
//                               <div className="bg-white dark:bg-gray-800 rounded-xl rounded-tl-none py-2 px-4 shadow-sm border flex items-center">
//                                 <div className="flex space-x-1">
//                                   <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 animate-bounce [animation-delay:-0.3s]"></div>
//                                   <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 animate-bounce [animation-delay:-0.15s]"></div>
//                                   <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 animate-bounce"></div>
//                                 </div>
//                               </div>
//                             </motion.div>
//                           ) : (
//                             <motion.div
//                               className="flex justify-start"
//                               initial={{ opacity: 0, y: 10 }}
//                               animate={{ opacity: 1, y: 0 }}
//                               transition={{ duration: 0.2 }}
//                             >
//                               <div className="bg-white dark:bg-gray-800 rounded-xl rounded-tl-none p-3 max-w-[80%] text-sm shadow-sm border">
//                                 {brandData.voice?.channels?.chat?.settings
//                                   ?.displayAvatar && (
//                                   <div
//                                     className="font-semibold text-xs mb-1"
//                                     style={{ color: brandData.colors?.primary }}
//                                   >
//                                     {brandData.name || "Your Brand"}
//                                   </div>
//                                 )}
//                                 <div>
//                                   {formatPreviewText(
//                                     getTemplateValue("followup")
//                                   )}
//                                 </div>
//                               </div>
//                             </motion.div>
//                           )}
//                         </AnimatePresence>
//                       )}

//                       {/* CTA Buttons */}
//                       {(previewMessage === "request" ||
//                         previewMessage === "followup") &&
//                         !isTyping && (
//                           <motion.div
//                             className="flex justify-start space-x-2"
//                             initial={{ opacity: 0, y: 10 }}
//                             animate={{ opacity: 1, y: 0 }}
//                             transition={{ duration: 0.2, delay: 0.1 }}
//                           >
//                             <button
//                               className="px-3 py-1.5 rounded-md text-white text-sm"
//                               style={{
//                                 backgroundColor:
//                                   brandData.colors?.primary || "#4F46E5",
//                               }}
//                             >
//                               {brandData.voice?.ctas?.[0] || "Share now"}
//                             </button>
//                             <button className="px-3 py-1.5 rounded-md text-sm border">
//                               {previewMessage === "request"
//                                 ? "Maybe later"
//                                 : "Remind me later"}
//                             </button>
//                           </motion.div>
//                         )}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Chat Templates Card */}
//       <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-950 overflow-hidden">
//         <CardHeader className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 pb-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-2">
//               <div className="h-8 w-8 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center">
//                 <LucideMessageCircle className="h-4 w-4 text-teal-600 dark:text-teal-400" />
//               </div>
//               <div>
//                 <CardTitle className="text-base">Chat Messages</CardTitle>
//                 <CardDescription className="text-xs mt-0.5">
//                   Customize message templates for chat interactions
//                 </CardDescription>
//               </div>
//             </div>
//             <div className="flex items-center gap-2">
//               <Button variant="ghost" size="sm" className="h-8">
//                 <Wand2 className="h-4 w-4 mr-1.5 text-amber-500" />
//                 <span className="text-xs">AI Suggestions</span>
//               </Button>
//             </div>
//           </div>
//         </CardHeader>

//         <CardContent className="pt-5 pb-5">
//           <Tabs
//             defaultValue="request"
//             value={activeTab}
//             onValueChange={setActiveTab}
//             className="w-full"
//           >
//             <TabsList className="grid w-full grid-cols-3 mb-6">
//               <TabsTrigger
//                 value="request"
//                 className="flex items-center gap-1.5"
//               >
//                 <MessageCircle className="h-3.5 w-3.5" />
//                 <span>Request</span>
//               </TabsTrigger>
//               <TabsTrigger
//                 value="thankyou"
//                 className="flex items-center gap-1.5"
//               >
//                 <ThumbsUp className="h-3.5 w-3.5" />
//                 <span>Thank You</span>
//               </TabsTrigger>
//               <TabsTrigger
//                 value="followup"
//                 className="flex items-center gap-1.5"
//               >
//                 <BellRing className="h-3.5 w-3.5" />
//                 <span>Follow-up</span>
//               </TabsTrigger>
//             </TabsList>

//             {/* Request Template */}
//             <TabsContent value="request" className="space-y-4">
//               <div className="grid grid-cols-12 gap-6">
//                 <div className="col-span-12 md:col-span-8 space-y-4">
//                   <div className="flex justify-between items-center">
//                     <Label className="text-sm font-medium flex items-center gap-1.5">
//                       <span>Request Template</span>
//                       <TooltipProvider>
//                         <Tooltip>
//                           <TooltipTrigger asChild>
//                             <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
//                           </TooltipTrigger>
//                           <TooltipContent className="w-56">
//                             <p className="text-xs">
//                               The message sent to request a testimonial via chat
//                             </p>
//                           </TooltipContent>
//                         </Tooltip>
//                       </TooltipProvider>
//                     </Label>
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       className="h-7 text-xs"
//                       onClick={() =>
//                         copyToClipboard(getTemplateValue("request"), "request")
//                       }
//                     >
//                       {copied === "request" ? (
//                         <>
//                           <Check className="h-3.5 w-3.5 mr-1 text-green-500" />
//                           <span className="text-green-600">Copied</span>
//                         </>
//                       ) : (
//                         <>
//                           <Copy className="h-3.5 w-3.5 mr-1" />
//                           <span>Copy</span>
//                         </>
//                       )}
//                     </Button>
//                   </div>

//                   <Textarea
//                     value={getTemplateValue("request")}
//                     onChange={(e) => updateTemplate("request", e.target.value)}
//                     className="min-h-[150px] font-mono text-sm bg-white dark:bg-gray-950"
//                     placeholder="Hi {{name}}, we appreciate your recent experience with {{brand}}. Would you be willing to share your thoughts in a brief testimonial?"
//                   />

//                   <div className="rounded-md bg-gray-50 dark:bg-gray-900 p-3 text-xs">
//                     <p className="font-medium mb-2 flex items-center">
//                       <Wand2 className="h-3.5 w-3.5 mr-1.5 text-teal-500" />
//                       <span>Template Variables:</span>
//                     </p>
//                     <div className="grid grid-cols-3 gap-y-1.5 text-gray-500">
//                       <div>
//                         <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[10px]">
//                           {`{{name}}`}
//                         </code>
//                         <span className="ml-1 text-[10px]">Customer name</span>
//                       </div>
//                       <div>
//                         <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[10px]">
//                           {`{{brand}}`}
//                         </code>
//                         <span className="ml-1 text-[10px]">Brand name</span>
//                       </div>
//                       <div>
//                         <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[10px]">
//                           {`{{product}}`}
//                         </code>
//                         <span className="ml-1 text-[10px]">Product name</span>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="col-span-12 md:col-span-4">
//                   <div className="border rounded-md overflow-hidden h-full">
//                     <div className="bg-gray-50 dark:bg-gray-900 p-2 border-b flex items-center justify-between">
//                       <div className="text-xs font-medium">Template Ideas</div>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() =>
//                           setShowFullTemplateList(!showFullTemplateList)
//                         }
//                         className="h-6 px-2 text-xs"
//                       >
//                         {showFullTemplateList ? "Collapse" : "View All"}
//                       </Button>
//                     </div>

//                     <div className="p-3 space-y-3 max-h-80 overflow-y-auto">
//                       {templateExamples.request
//                         .slice(0, showFullTemplateList ? undefined : 3)
//                         .map((example, index) => (
//                           <div
//                             key={index}
//                             className="border rounded-md overflow-hidden hover:border-teal-300 dark:hover:border-teal-700 transition-colors cursor-pointer group"
//                             onClick={() =>
//                               updateTemplate("request", example.text)
//                             }
//                             onMouseEnter={() =>
//                               setCurrentTemplateExample(example.text)
//                             }
//                             onMouseLeave={() => setCurrentTemplateExample(null)}
//                           >
//                             <div className="bg-gray-50 dark:bg-gray-900 px-3 py-1.5 border-b flex items-center justify-between">
//                               <div className="text-xs font-medium">
//                                 {example.title}
//                               </div>
//                               <div className="opacity-0 group-hover:opacity-100 transition-opacity">
//                                 <Button
//                                   variant="ghost"
//                                   size="sm"
//                                   className="h-6 w-6 p-0"
//                                   onClick={(e) => {
//                                     e.stopPropagation();
//                                     updateTemplate("request", example.text);
//                                   }}
//                                 >
//                                   <CheckCircle className="h-3.5 w-3.5 text-teal-500" />
//                                 </Button>
//                               </div>
//                             </div>
//                             <div className="p-2 text-xs text-gray-600 dark:text-gray-300">
//                               {example.text}
//                             </div>
//                           </div>
//                         ))}

//                       {!showFullTemplateList &&
//                         templateExamples.request.length > 3 && (
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             className="w-full text-xs"
//                             onClick={() => setShowFullTemplateList(true)}
//                           >
//                             <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
//                             <span>Show More Examples</span>
//                           </Button>
//                         )}

//                       {showFullTemplateList && (
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           className="w-full text-xs"
//                           onClick={() => setShowFullTemplateList(false)}
//                         >
//                           <Forward className="h-3.5 w-3.5 mr-1.5" />
//                           <span>Show Less</span>
//                         </Button>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </TabsContent>

//             {/* Thank You Template */}
//             <TabsContent value="thankyou" className="space-y-4">
//               <div className="grid grid-cols-12 gap-6">
//                 <div className="col-span-12 md:col-span-8 space-y-4">
//                   <div className="flex justify-between items-center">
//                     <Label className="text-sm font-medium flex items-center gap-1.5">
//                       <span>Thank You Template</span>
//                       <TooltipProvider>
//                         <Tooltip>
//                           <TooltipTrigger asChild>
//                             <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
//                           </TooltipTrigger>
//                           <TooltipContent className="w-56">
//                             <p className="text-xs">
//                               The message sent after receiving a testimonial
//                             </p>
//                           </TooltipContent>
//                         </Tooltip>
//                       </TooltipProvider>
//                     </Label>
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       className="h-7 text-xs"
//                       onClick={() =>
//                         copyToClipboard(
//                           getTemplateValue("thankYou"),
//                           "thankyou"
//                         )
//                       }
//                     >
//                       {copied === "thankyou" ? (
//                         <>
//                           <Check className="h-3.5 w-3.5 mr-1 text-green-500" />
//                           <span className="text-green-600">Copied</span>
//                         </>
//                       ) : (
//                         <>
//                           <Copy className="h-3.5 w-3.5 mr-1" />
//                           <span>Copy</span>
//                         </>
//                       )}
//                     </Button>
//                   </div>

//                   <Textarea
//                     value={getTemplateValue("thankYou")}
//                     onChange={(e) => updateTemplate("thankYou", e.target.value)}
//                     className="min-h-[150px] font-mono text-sm bg-white dark:bg-gray-950"
//                     placeholder="Thank you for your testimonial, {{name}}! We truly value your feedback and support of {{brand}}."
//                   />

//                   <div className="rounded-md bg-gray-50 dark:bg-gray-900 p-3 text-xs">
//                     <p className="font-medium mb-2 flex items-center">
//                       <Wand2 className="h-3.5 w-3.5 mr-1.5 text-teal-500" />
//                       <span>Template Variables:</span>
//                     </p>
//                     <div className="grid grid-cols-3 gap-y-1.5 text-gray-500">
//                       <div>
//                         <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[10px]">
//                           {`{{name}}`}
//                         </code>
//                         <span className="ml-1 text-[10px]">Customer name</span>
//                       </div>
//                       <div>
//                         <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[10px]">
//                           {`{{brand}}`}
//                         </code>
//                         <span className="ml-1 text-[10px]">Brand name</span>
//                       </div>
//                       <div>
//                         <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[10px]">
//                           {`{{testimonial}}`}
//                         </code>
//                         <span className="ml-1 text-[10px]">
//                           Testimonial text
//                         </span>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="col-span-12 md:col-span-4">
//                   <div className="border rounded-md overflow-hidden h-full">
//                     <div className="bg-gray-50 dark:bg-gray-900 p-2 border-b flex items-center justify-between">
//                       <div className="text-xs font-medium">Template Ideas</div>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() =>
//                           setShowFullTemplateList(!showFullTemplateList)
//                         }
//                         className="h-6 px-2 text-xs"
//                       >
//                         {showFullTemplateList ? "Collapse" : "View All"}
//                       </Button>
//                     </div>

//                     <div className="p-3 space-y-3 max-h-80 overflow-y-auto">
//                       {templateExamples.thankyou
//                         .slice(0, showFullTemplateList ? undefined : 3)
//                         .map((example, index) => (
//                           <div
//                             key={index}
//                             className="border rounded-md overflow-hidden hover:border-teal-300 dark:hover:border-teal-700 transition-colors cursor-pointer group"
//                             onClick={() =>
//                               updateTemplate("thankYou", example.text)
//                             }
//                           >
//                             <div className="bg-gray-50 dark:bg-gray-900 px-3 py-1.5 border-b flex items-center justify-between">
//                               <div className="text-xs font-medium">
//                                 {example.title}
//                               </div>
//                               <div className="opacity-0 group-hover:opacity-100 transition-opacity">
//                                 <Button
//                                   variant="ghost"
//                                   size="sm"
//                                   className="h-6 w-6 p-0"
//                                   onClick={(e) => {
//                                     e.stopPropagation();
//                                     updateTemplate("thankYou", example.text);
//                                   }}
//                                 >
//                                   <CheckCircle className="h-3.5 w-3.5 text-teal-500" />
//                                 </Button>
//                               </div>
//                             </div>
//                             <div className="p-2 text-xs text-gray-600 dark:text-gray-300">
//                               {example.text}
//                             </div>
//                           </div>
//                         ))}

//                       {!showFullTemplateList &&
//                         templateExamples.thankyou.length > 3 && (
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             className="w-full text-xs"
//                             onClick={() => setShowFullTemplateList(true)}
//                           >
//                             <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
//                             <span>Show More Examples</span>
//                           </Button>
//                         )}

//                       {showFullTemplateList && (
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           className="w-full text-xs"
//                           onClick={() => setShowFullTemplateList(false)}
//                         >
//                           <Forward className="h-3.5 w-3.5 mr-1.5" />
//                           <span>Show Less</span>
//                         </Button>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </TabsContent>

//             {/* Follow-up Template */}
//             <TabsContent value="followup" className="space-y-4">
//               <div className="grid grid-cols-12 gap-6">
//                 <div className="col-span-12 md:col-span-8 space-y-4">
//                   <div className="flex justify-between items-center">
//                     <Label className="text-sm font-medium flex items-center gap-1.5">
//                       <span>Follow-up Template</span>
//                       <TooltipProvider>
//                         <Tooltip>
//                           <TooltipTrigger asChild>
//                             <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
//                           </TooltipTrigger>
//                           <TooltipContent className="w-56">
//                             <p className="text-xs">
//                               The follow-up message sent if no response is
//                               received
//                             </p>
//                           </TooltipContent>
//                         </Tooltip>
//                       </TooltipProvider>
//                     </Label>
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       className="h-7 text-xs"
//                       onClick={() =>
//                         copyToClipboard(
//                           getTemplateValue("followup"),
//                           "followup"
//                         )
//                       }
//                     >
//                       {copied === "followup" ? (
//                         <>
//                           <Check className="h-3.5 w-3.5 mr-1 text-green-500" />
//                           <span className="text-green-600">Copied</span>
//                         </>
//                       ) : (
//                         <>
//                           <Copy className="h-3.5 w-3.5 mr-1" />
//                           <span>Copy</span>
//                         </>
//                       )}
//                     </Button>
//                   </div>

//                   <Textarea
//                     value={getTemplateValue("followup")}
//                     onChange={(e) => updateTemplate("followup", e.target.value)}
//                     className="min-h-[150px] font-mono text-sm bg-white dark:bg-gray-950"
//                     placeholder="Hi {{name}}, just a friendly reminder that we'd love to hear your thoughts about your experience with {{brand}}. It would mean a lot to us!"
//                   />

//                   <div className="rounded-md bg-gray-50 dark:bg-gray-900 p-3 text-xs">
//                     <p className="font-medium mb-2 flex items-center">
//                       <Wand2 className="h-3.5 w-3.5 mr-1.5 text-teal-500" />
//                       <span>Template Variables:</span>
//                     </p>
//                     <div className="grid grid-cols-3 gap-y-1.5 text-gray-500">
//                       <div>
//                         <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[10px]">
//                           {`{{name}}`}
//                         </code>
//                         <span className="ml-1 text-[10px]">Customer name</span>
//                       </div>
//                       <div>
//                         <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[10px]">
//                           {`{{brand}}`}
//                         </code>
//                         <span className="ml-1 text-[10px]">Brand name</span>
//                       </div>
//                       <div>
//                         <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[10px]">
//                           {`{{product}}`}
//                         </code>
//                         <span className="ml-1 text-[10px]">Product name</span>
//                       </div>
//                     </div>
//                   </div>

//                   <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 p-3">
//                     <div className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
//                       <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
//                       <div>
//                         <p className="font-medium mb-1">
//                           Follow-up Best Practices
//                         </p>
//                         <ul className="list-disc pl-4 space-y-1">
//                           <li>Keep follow-ups brief and friendly</li>
//                           <li>Send no more than one follow-up message</li>
//                           <li>Include clear, easy action steps</li>
//                           <li>Remember to show appreciation for their time</li>
//                         </ul>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="col-span-12 md:col-span-4">
//                   <div className="border rounded-md overflow-hidden h-full">
//                     <div className="bg-gray-50 dark:bg-gray-900 p-2 border-b flex items-center justify-between">
//                       <div className="text-xs font-medium">Template Ideas</div>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() =>
//                           setShowFullTemplateList(!showFullTemplateList)
//                         }
//                         className="h-6 px-2 text-xs"
//                       >
//                         {showFullTemplateList ? "Collapse" : "View All"}
//                       </Button>
//                     </div>

//                     <div className="p-3 space-y-3 max-h-80 overflow-y-auto">
//                       {templateExamples.followup
//                         .slice(0, showFullTemplateList ? undefined : 3)
//                         .map((example, index) => (
//                           <div
//                             key={index}
//                             className="border rounded-md overflow-hidden hover:border-teal-300 dark:hover:border-teal-700 transition-colors cursor-pointer group"
//                             onClick={() =>
//                               updateTemplate("followup", example.text)
//                             }
//                           >
//                             <div className="bg-gray-50 dark:bg-gray-900 px-3 py-1.5 border-b flex items-center justify-between">
//                               <div className="text-xs font-medium">
//                                 {example.title}
//                               </div>
//                               <div className="opacity-0 group-hover:opacity-100 transition-opacity">
//                                 <Button
//                                   variant="ghost"
//                                   size="sm"
//                                   className="h-6 w-6 p-0"
//                                   onClick={(e) => {
//                                     e.stopPropagation();
//                                     updateTemplate("followup", example.text);
//                                   }}
//                                 >
//                                   <CheckCircle className="h-3.5 w-3.5 text-teal-500" />
//                                 </Button>
//                               </div>
//                             </div>
//                             <div className="p-2 text-xs text-gray-600 dark:text-gray-300">
//                               {example.text}
//                             </div>
//                           </div>
//                         ))}

//                       {!showFullTemplateList &&
//                         templateExamples.followup.length > 3 && (
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             className="w-full text-xs"
//                             onClick={() => setShowFullTemplateList(true)}
//                           >
//                             <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
//                             <span>Show More Examples</span>
//                           </Button>
//                         )}

//                       {showFullTemplateList && (
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           className="w-full text-xs"
//                           onClick={() => setShowFullTemplateList(false)}
//                         >
//                           <Forward className="h-3.5 w-3.5 mr-1.5" />
//                           <span>Show Less</span>
//                         </Button>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </TabsContent>
//           </Tabs>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default observer(ChatSettings);

import { FC, useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { brandGuideStore } from "@/stores/brandGuideStore";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Icons
import {
  MessageCircle,
  Info,
  Copy,
  Check,
  RefreshCw,
  MessageSquare,
  ThumbsUp,
  Star,
  Sparkles,
  FileText,
  ChevronRight,
  Smartphone,
} from "lucide-react";

import { getInitials } from "@/utils/utils";

const ChatSettings: FC = () => {
  const store = brandGuideStore;
  const { brandData } = store;

  const [activeTab, setActiveTab] = useState<string>("request");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">(
    "desktop"
  );
  const [copied, setCopied] = useState<string | null>(null);

  // Initialize chat settings if they don't exist
  useEffect(() => {
    if (!brandData.voice?.channels?.chat) {
      store.updateBrandData(["voice", "channels", "chat"], {
        requestTemplate:
          "Hi {{name}}, we appreciate your recent experience with {{brand}}. Would you be willing to share your thoughts in a brief testimonial?",
        followupTemplate:
          "Hi {{name}}, just a friendly reminder that we'd love to hear your thoughts about your experience with {{brand}}. It would mean a lot to us!",
      });
    }
  }, [brandData.voice?.channels?.chat, store]);

  const getTemplateValue = (type: string): string => {
    if (
      brandData.voice?.channels?.chat &&
      brandData.voice.channels.chat[
        `${type}Template` as "requestTemplate" | "followupTemplate"
      ]
    ) {
      return brandData.voice.channels.chat[
        `${type}Template` as "requestTemplate" | "followupTemplate"
      ];
    }
    return "";
  };

  const updateTemplate = (type: string, value: string) => {
    store.updateBrandData(
      ["voice", "channels", "chat", `${type}Template`],
      value
    );
  };

  const formatPreviewText = (template: string): string => {
    return template
      .replace(/{{name}}/g, "Alex")
      .replace(/{{brand}}/g, brandData.name || "Your Brand")
      .replace(/{{product}}/g, "Premium Plan");
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  // Template examples
  const templateExamples = {
    request: [
      "Hi {{name}}! 👋 I hope you're enjoying {{product}}. Would you mind taking a moment to share your thoughts?",
      "Hi {{name}}, would you share a quick testimonial about your experience with {{brand}}?",
      "Hello {{name}}, we value your opinion on {{brand}}'s services. Would you be willing to provide a brief testimonial?",
    ],
    followup: [
      "Hi {{name}}, just following up on our request for your feedback about {{brand}}. We'd love to hear your thoughts!",
      "Hello {{name}}, we noticed you haven't shared your testimonial yet. Your insights would be incredibly valuable to us.",
      "Hi {{name}}, this is a friendly reminder about sharing your experience with {{brand}}. If you have a moment, we'd truly value your feedback.",
    ],
  };

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <CardHeader className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-indigo-700 dark:from-purple-400 dark:to-indigo-400">
              Chat Templates
            </CardTitle>
            <CardDescription className="text-sm mt-0.5">
              Customize your chat testimonial request messages
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <Tabs
          defaultValue="request"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <div className="flex items-center justify-between mb-4">
            <TabsList className="grid w-full max-w-md grid-cols-2 p-1 h-11">
              <TabsTrigger
                value="request"
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Request Template</span>
              </TabsTrigger>
              <TabsTrigger
                value="followup"
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
              >
                <ThumbsUp className="h-4 w-4" />
                <span>Follow-up Template</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPreviewDevice(
                          previewDevice === "desktop" ? "mobile" : "desktop"
                        )
                      }
                      className="h-9 w-9 p-0 rounded-xl border-2 border-gray-200 shadow-sm dark:border-gray-700"
                    >
                      {previewDevice === "desktop" ? (
                        <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      ) : (
                        <Smartphone className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">Toggle preview device</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Request Template */}
          <TabsContent value="request" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-sm font-medium flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                    <span>Chat Testimonial Request</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="w-56">
                          <p className="text-xs">
                            The message sent in chat to request a testimonial
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs gap-1.5 rounded-lg text-purple-700 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                      onClick={() =>
                        copyToClipboard(getTemplateValue("request"), "request")
                      }
                    >
                      {copied === "request" ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-green-600" />
                          <span className="text-green-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs gap-1.5 rounded-lg text-purple-700 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                      onClick={() =>
                        updateTemplate(
                          "request",
                          "Hi {{name}}, we appreciate your recent experience with {{brand}}. Would you be willing to share your thoughts in a brief testimonial?"
                        )
                      }
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Reset</span>
                    </Button>
                  </div>
                </div>

                <div className="relative">
                  <Textarea
                    value={getTemplateValue("request")}
                    onChange={(e) => updateTemplate("request", e.target.value)}
                    className="min-h-[180px] font-mono text-sm resize-none rounded-xl border-2 border-gray-200 shadow-sm p-4 focus:border-purple-400 focus:ring-purple-400 dark:border-gray-700 dark:focus:border-purple-500 dark:focus:ring-purple-500"
                    placeholder="Hi {{name}}, we appreciate your recent experience with {{brand}}. Would you be willing to share your thoughts in a brief testimonial?"
                  />
                  <div className="absolute right-3 bottom-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700"
                      onClick={() => {
                        const aiSuggestion =
                          templateExamples.request[
                            Math.floor(
                              Math.random() * templateExamples.request.length
                            )
                          ];
                        updateTemplate("request", aiSuggestion);
                      }}
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      <span className="text-xs">AI Suggestion</span>
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl overflow-hidden border-2 border-purple-100 dark:border-purple-900/30 shadow-sm">
                  <div className="bg-gradient-to-r from-purple-100/80 to-indigo-100/80 dark:from-purple-900/30 dark:to-indigo-900/30 backdrop-blur-sm p-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-700 dark:text-purple-400" />
                    <span className="text-sm font-medium text-purple-800 dark:text-purple-300">
                      Template Examples
                    </span>
                  </div>

                  <div className="p-3 grid grid-cols-1 gap-2 bg-white dark:bg-gray-900">
                    {templateExamples.request.map((example, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg border-2 border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700 cursor-pointer transition-colors group"
                        onClick={() => updateTemplate("request", example)}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                            <Star className="h-3 w-3 text-amber-500" />
                            Example {index + 1}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateTemplate("request", example);
                            }}
                          >
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          </Button>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {example}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div
                  className={`rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm dark:border-gray-700 h-full ${
                    previewDevice === "mobile" ? "max-w-[320px] mx-auto" : ""
                  }`}
                >
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center bg-white/20 text-white backdrop-blur-sm">
                        <span className="text-sm font-medium">
                          {getInitials(brandData.name || "Your Brand")}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">
                          {brandData.name || "Your Brand"} Chat
                        </div>
                        <div className="text-xs text-white/80 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-400"></span>
                          <span>Online</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-900 min-h-[300px] flex flex-col">
                    <div className="flex-grow space-y-4">
                      {/* User message */}
                      <div className="flex justify-end">
                        <div className="bg-purple-100 dark:bg-purple-900/40 rounded-2xl rounded-tr-none p-3 max-w-[80%] text-sm shadow-sm text-purple-900 dark:text-purple-100">
                          I've been using your product for a few weeks now. It's
                          been great!
                        </div>
                      </div>

                      {/* Brand response - initial */}
                      <div className="flex justify-start">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-none p-3 max-w-[80%] text-sm shadow-sm border-2 border-gray-100 dark:border-gray-700">
                          <div className="font-medium text-xs mb-1 text-purple-700 dark:text-purple-400">
                            {brandData.name || "Your Brand"}
                          </div>
                          <div>
                            That's fantastic to hear! We're so glad you're
                            enjoying it.
                          </div>
                        </div>
                      </div>

                      {/* Brand response - testimonial request */}
                      <div className="flex justify-start">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-none p-3 max-w-[80%] text-sm shadow-sm border-2 border-gray-100 dark:border-gray-700">
                          <div className="font-medium text-xs mb-1 text-purple-700 dark:text-purple-400">
                            {brandData.name || "Your Brand"}
                          </div>
                          <div>
                            {formatPreviewText(getTemplateValue("request"))}
                          </div>
                        </div>
                      </div>

                      {/* Quick reply buttons */}
                      <div className="flex gap-2">
                        <button className="px-4 py-2 rounded-full text-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-sm hover:from-purple-700 hover:to-indigo-700 transition-colors">
                          Sure, I'd be happy to
                        </button>
                        <button className="px-4 py-2 rounded-full text-sm bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          Maybe later
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="relative">
                        <Input
                          placeholder="Type your message..."
                          className="pr-10 rounded-full border-2 border-gray-200 focus:border-purple-400 focus:ring-purple-400 dark:border-gray-700"
                        />
                        <Button
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600"
                        >
                          <ChevronRight className="h-4 w-4 text-white" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Follow-up Template */}
          <TabsContent value="followup" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-sm font-medium flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                    <span>Follow-up Message</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="w-56">
                          <p className="text-xs">
                            The follow-up message sent if no response is
                            received
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs gap-1.5 rounded-lg text-purple-700 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                      onClick={() =>
                        copyToClipboard(
                          getTemplateValue("followup"),
                          "followup"
                        )
                      }
                    >
                      {copied === "followup" ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-green-600" />
                          <span className="text-green-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs gap-1.5 rounded-lg text-purple-700 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                      onClick={() =>
                        updateTemplate(
                          "followup",
                          "Hi {{name}}, just a friendly reminder that we'd love to hear your thoughts about your experience with {{brand}}. It would mean a lot to us!"
                        )
                      }
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Reset</span>
                    </Button>
                  </div>
                </div>

                <div className="relative">
                  <Textarea
                    value={getTemplateValue("followup")}
                    onChange={(e) => updateTemplate("followup", e.target.value)}
                    className="min-h-[180px] font-mono text-sm resize-none rounded-xl border-2 border-gray-200 shadow-sm p-4 focus:border-purple-400 focus:ring-purple-400 dark:border-gray-700 dark:focus:border-purple-500 dark:focus:ring-purple-500"
                    placeholder="Hi {{name}}, just a friendly reminder that we'd love to hear your thoughts about your experience with {{brand}}. It would mean a lot to us!"
                  />
                  <div className="absolute right-3 bottom-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700"
                      onClick={() => {
                        const aiSuggestion =
                          templateExamples.followup[
                            Math.floor(
                              Math.random() * templateExamples.followup.length
                            )
                          ];
                        updateTemplate("followup", aiSuggestion);
                      }}
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      <span className="text-xs">AI Suggestion</span>
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl overflow-hidden border-2 border-purple-100 dark:border-purple-900/30 shadow-sm">
                  <div className="bg-gradient-to-r from-purple-100/80 to-indigo-100/80 dark:from-purple-900/30 dark:to-indigo-900/30 backdrop-blur-sm p-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-700 dark:text-purple-400" />
                    <span className="text-sm font-medium text-purple-800 dark:text-purple-300">
                      Template Examples
                    </span>
                  </div>

                  <div className="p-3 grid grid-cols-1 gap-2 bg-white dark:bg-gray-900">
                    {templateExamples.followup.map((example, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg border-2 border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700 cursor-pointer transition-colors group"
                        onClick={() => updateTemplate("followup", example)}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                            <Star className="h-3 w-3 text-amber-500" />
                            Example {index + 1}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateTemplate("followup", example);
                            }}
                          >
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          </Button>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {example}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div
                  className={`rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm dark:border-gray-700 h-full ${
                    previewDevice === "mobile" ? "max-w-[320px] mx-auto" : ""
                  }`}
                >
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center bg-white/20 text-white backdrop-blur-sm">
                        <span className="text-sm font-medium">
                          {getInitials(brandData.name || "Your Brand")}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">
                          {brandData.name || "Your Brand"} Chat
                        </div>
                        <div className="text-xs text-white/80 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-400"></span>
                          <span>Online</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-900 min-h-[300px] flex flex-col">
                    <div className="flex-grow space-y-4">
                      {/* Previous conversation summary */}
                      <div className="text-center">
                        <Badge
                          variant="outline"
                          className="text-xs bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 py-1 px-2 rounded-full"
                        >
                          2 days ago
                        </Badge>
                      </div>

                      {/* Brand response - initial */}
                      <div className="flex justify-start">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-none p-3 max-w-[80%] text-sm shadow-sm border-2 border-gray-100 dark:border-gray-700">
                          <div className="font-medium text-xs mb-1 text-purple-700 dark:text-purple-400">
                            {brandData.name || "Your Brand"}
                          </div>
                          <div>
                            Hi Alex! Would you be willing to share your thoughts
                            about your experience with{" "}
                            {brandData.name || "our product"}?
                          </div>
                        </div>
                      </div>

                      {/* Today label */}
                      <div className="text-center">
                        <Badge
                          variant="outline"
                          className="text-xs bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 py-1 px-2 rounded-full"
                        >
                          Today
                        </Badge>
                      </div>

                      {/* Brand response - follow-up */}
                      <div className="flex justify-start">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-none p-3 max-w-[80%] text-sm shadow-sm border-2 border-gray-100 dark:border-gray-700">
                          <div className="font-medium text-xs mb-1 text-purple-700 dark:text-purple-400">
                            {brandData.name || "Your Brand"}
                          </div>
                          <div>
                            {formatPreviewText(getTemplateValue("followup"))}
                          </div>
                        </div>
                      </div>

                      {/* Quick reply buttons */}
                      <div className="flex gap-2">
                        <button className="px-4 py-2 rounded-full text-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-sm hover:from-purple-700 hover:to-indigo-700 transition-colors">
                          I'll do it now
                        </button>
                        <button className="px-4 py-2 rounded-full text-sm bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          Not now
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="relative">
                        <Input
                          placeholder="Type your message..."
                          className="pr-10 rounded-full border-2 border-gray-200 focus:border-purple-400 focus:ring-purple-400 dark:border-gray-700"
                        />
                        <Button
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600"
                        >
                          <ChevronRight className="h-4 w-4 text-white" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 rounded-xl border-2 border-gray-200 dark:border-gray-800 p-3 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Available Template Variables
              </div>
              <div className="mt-2 grid grid-cols-3 gap-y-2 gap-x-4">
                <div className="flex items-center gap-1.5">
                  <code className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/40 rounded border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300">
                    {"{{name}}"}
                  </code>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Customer name
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <code className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/40 rounded border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300">
                    {"{{brand}}"}
                  </code>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Your brand name
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <code className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/40 rounded border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300">
                    {"{{product}}"}
                  </code>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Product name
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default observer(ChatSettings);
