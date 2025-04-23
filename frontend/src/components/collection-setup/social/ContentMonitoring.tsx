// // src/components/collection-setup/social/ContentMonitoring.tsx
// import React, { useState } from "react";
// import { motion } from "framer-motion";
// import {
//   AlertTriangle,
//   BarChart3,
//   Bell,
//   Clock,
//   Filter,
//   InfoIcon,
//   MessageSquare,
//   Plus,
//   RefreshCw,
//   Save,
//   Settings,
//   Shield,
//   ThumbsDown,
//   ThumbsUp,
//   Activity,
//   PieChart,
//   ArrowUpDown,
//   Eye,
//   EyeOff,
//   Bot,
//   Sparkles,
//   Hash,
//   LanguagesIcon,
//   Timer,
//   UsersRound,
//   X,
//   Star,
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Switch } from "@/components/ui/switch";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Label } from "@/components/ui/label";
// import { Badge } from "@/components/ui/badge";
// import { Progress } from "@/components/ui/progress";
// import { Slider } from "@/components/ui/slider";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@/components/ui/tooltip";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Separator } from "@/components/ui/separator";
// import { cn } from "@/lib/utils";
// import { CollectionSettings } from "@/types/setup";

// interface ContentMonitoringProps {
//   monitoring?: CollectionSettings["social"]["monitoring"];
//   filtering?: CollectionSettings["social"]["filtering"];
//   onSettingsChange: (field: string, value: any) => void;
//   onFilteringChange: (field: string, value: any) => void;
//   showToast: (toast: {
//     title: string;
//     description: string;
//     variant?: "default" | "destructive";
//   }) => void;
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

// const ContentMonitoring: React.FC<ContentMonitoringProps> = ({
//   monitoring = {
//     frequency: "daily",
//     keywords: [],
//     competitors: [],
//     alertThreshold: "high_priority",
//   },
//   filtering = {
//     negativeSentiment: true,
//     competitorMentions: true,
//     inappropriate: true,
//     spamDetection: true,
//     minimumFollowers: 0,
//     accountAge: 0,
//     languageFilter: [],
//     wordBlacklist: [],
//   },
//   onSettingsChange,
//   onFilteringChange,
//   showToast,
// }) => {
//   const [newKeyword, setNewKeyword] = useState("");
//   const [newCompetitor, setNewCompetitor] = useState("");
//   const [newBlacklistWord, setNewBlacklistWord] = useState("");
//   const [monitoringEnabled, setMonitoringEnabled] = useState(true);
//   const [aiFilteringEnabled, setAiFilteringEnabled] = useState(true);
//   const [activeTab, setActiveTab] = useState<"monitoring" | "filtering">(
//     "monitoring"
//   );

//   const handleKeywordAdd = () => {
//     if (!newKeyword) return;

//     const updatedKeywords = [...(monitoring.keywords || []), newKeyword];
//     onSettingsChange("keywords", updatedKeywords);
//     setNewKeyword("");

//     showToast({
//       title: "Keyword added",
//       description: `"${newKeyword}" has been added to your monitoring keywords.`,
//       variant: "default",
//     });
//   };

//   const handleKeywordRemove = (keyword: string) => {
//     const updatedKeywords = (monitoring.keywords || []).filter(
//       (k) => k !== keyword
//     );
//     onSettingsChange("keywords", updatedKeywords);
//   };

//   const handleCompetitorAdd = () => {
//     if (!newCompetitor) return;

//     const updatedCompetitors = [
//       ...(monitoring.competitors || []),
//       newCompetitor,
//     ];
//     onSettingsChange("competitors", updatedCompetitors);
//     setNewCompetitor("");

//     showToast({
//       title: "Competitor added",
//       description: `"${newCompetitor}" has been added to your competitor monitoring.`,
//       variant: "default",
//     });
//   };

//   const handleCompetitorRemove = (competitor: string) => {
//     const updatedCompetitors = (monitoring.competitors || []).filter(
//       (c) => c !== competitor
//     );
//     onSettingsChange("competitors", updatedCompetitors);
//   };

//   const handleBlacklistAdd = () => {
//     if (!newBlacklistWord) return;

//     const updatedBlacklist = [
//       ...(filtering.wordBlacklist || []),
//       newBlacklistWord,
//     ];
//     onFilteringChange("wordBlacklist", updatedBlacklist);
//     setNewBlacklistWord("");

//     showToast({
//       title: "Blocked term added",
//       description: `"${newBlacklistWord}" has been added to your blocked terms.`,
//       variant: "default",
//     });
//   };

//   const handleBlacklistRemove = (word: string) => {
//     const updatedBlacklist = (filtering.wordBlacklist || []).filter(
//       (w) => w !== word
//     );
//     onFilteringChange("wordBlacklist", updatedBlacklist);
//   };

//   return (
//     <div className="space-y-6">
//       {/* Header with overview */}
//       <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
//         <div>
//           <h2 className="text-xl font-semibold tracking-tight mb-1">
//             Content Monitoring & Filtering
//           </h2>
//           <p className="text-sm text-muted-foreground">
//             Control what testimonials get collected and receive alerts for
//             important mentions
//           </p>
//         </div>
//         <div className="flex gap-3 flex-wrap justify-end">
//           <Tabs
//             value={activeTab}
//             onValueChange={(value) => setActiveTab(value as any)}
//             className="w-auto"
//           >
//             <TabsList className="h-8 p-0.5">
//               <TabsTrigger
//                 value="monitoring"
//                 className="text-xs h-7 px-3 rounded"
//               >
//                 <Shield className="h-3.5 w-3.5 mr-1.5" />
//                 <span>Monitoring</span>
//               </TabsTrigger>
//               <TabsTrigger
//                 value="filtering"
//                 className="text-xs h-7 px-3 rounded"
//               >
//                 <Filter className="h-3.5 w-3.5 mr-1.5" />
//                 <span>Filtering</span>
//               </TabsTrigger>
//             </TabsList>
//           </Tabs>
//         </div>
//       </div>

//       <TabsContent
//         value="monitoring"
//         className="mt-0 space-y-6"
//         // active={activeTab === "monitoring"}
//       >
//         {/* Monitoring Settings Card */}
//         <motion.div
//           variants={itemVariants}
//           initial="hidden"
//           animate="visible"
//           className="grid grid-cols-1 gap-4 lg:grid-cols-3"
//         >
//           <Card className="col-span-1 lg:col-span-2">
//             <CardHeader className="pb-3">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <CardTitle className="text-base flex items-center gap-2">
//                     <Activity className="h-4 w-4 text-blue-600" />
//                     <span>Monitoring Settings</span>
//                   </CardTitle>
//                   <CardDescription>
//                     Configure what content to monitor across social platforms
//                   </CardDescription>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <Label htmlFor="monitoring-enabled" className="text-sm">
//                     Enabled
//                   </Label>
//                   <Switch
//                     id="monitoring-enabled"
//                     checked={monitoringEnabled}
//                     onCheckedChange={setMonitoringEnabled}
//                   />
//                 </div>
//               </div>
//             </CardHeader>
//             <CardContent className="pb-3 space-y-6">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="space-y-4">
//                   <div className="space-y-2">
//                     <Label htmlFor="monitoring-frequency">
//                       Monitoring Frequency
//                     </Label>
//                     <Select
//                       value={monitoring.frequency}
//                       onValueChange={(value) =>
//                         onSettingsChange("frequency", value)
//                       }
//                       disabled={!monitoringEnabled}
//                     >
//                       <SelectTrigger id="monitoring-frequency">
//                         <SelectValue placeholder="Select frequency" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="realtime">
//                           Real-time (webhook)
//                         </SelectItem>
//                         <SelectItem value="hourly">Hourly</SelectItem>
//                         <SelectItem value="daily">Daily</SelectItem>
//                         <SelectItem value="weekly">Weekly</SelectItem>
//                       </SelectContent>
//                     </Select>
//                     <p className="text-xs text-muted-foreground">
//                       How often to check for new mentions and content
//                     </p>
//                   </div>

//                   <div className="space-y-2">
//                     <Label htmlFor="alert-threshold">Alert Threshold</Label>
//                     <Select
//                       value={monitoring.alertThreshold}
//                       onValueChange={(value) =>
//                         onSettingsChange("alertThreshold", value)
//                       }
//                       disabled={!monitoringEnabled}
//                     >
//                       <SelectTrigger id="alert-threshold">
//                         <SelectValue placeholder="Select threshold" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="all">All Mentions</SelectItem>
//                         <SelectItem value="high_priority">
//                           High Priority Only
//                         </SelectItem>
//                         <SelectItem value="critical">Critical Only</SelectItem>
//                       </SelectContent>
//                     </Select>
//                     <p className="text-xs text-muted-foreground">
//                       What level of mention importance triggers notifications
//                     </p>
//                   </div>

//                   <div className="space-y-2">
//                     <Label htmlFor="report-schedule">Report Schedule</Label>
//                     <Select
//                       value={monitoring.reportSchedule || "weekly"}
//                       onValueChange={(value) =>
//                         onSettingsChange("reportSchedule", value)
//                       }
//                       disabled={!monitoringEnabled}
//                     >
//                       <SelectTrigger id="report-schedule">
//                         <SelectValue placeholder="Select schedule" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="daily">Daily</SelectItem>
//                         <SelectItem value="weekly">Weekly</SelectItem>
//                         <SelectItem value="monthly">Monthly</SelectItem>
//                         <SelectItem value="none">No Reports</SelectItem>
//                       </SelectContent>
//                     </Select>
//                     <p className="text-xs text-muted-foreground">
//                       How often to receive summary reports of collected
//                       testimonials
//                     </p>
//                   </div>
//                 </div>

//                 <div className="space-y-4">
//                   <div className="space-y-2">
//                     <div className="flex items-center justify-between">
//                       <Label
//                         htmlFor="keyword-input"
//                         className="flex items-center"
//                       >
//                         <Hash className="h-4 w-4 text-slate-500 mr-2" />
//                         <span>Monitoring Keywords</span>
//                       </Label>
//                       <Badge
//                         variant="outline"
//                         className="bg-blue-50 text-blue-700 border-blue-100"
//                       >
//                         {monitoring.keywords?.length || 0} Keywords
//                       </Badge>
//                     </div>

//                     <div className="flex gap-2">
//                       <Input
//                         id="keyword-input"
//                         placeholder="Add keyword to monitor"
//                         value={newKeyword}
//                         onChange={(e) => setNewKeyword(e.target.value)}
//                         onKeyDown={(e) => {
//                           if (e.key === "Enter") {
//                             e.preventDefault();
//                             handleKeywordAdd();
//                           }
//                         }}
//                         disabled={!monitoringEnabled}
//                       />
//                       <Button
//                         variant="outline"
//                         onClick={handleKeywordAdd}
//                         disabled={!newKeyword || !monitoringEnabled}
//                       >
//                         <Plus className="h-4 w-4" />
//                       </Button>
//                     </div>

//                     <div className="flex flex-wrap gap-2 mt-2">
//                       {(monitoring.keywords || []).map((keyword) => (
//                         <Badge
//                           key={keyword}
//                           variant="outline"
//                           className="bg-slate-100 hover:bg-slate-200 transition-colors py-1 gap-1 pl-2 pr-1"
//                         >
//                           {keyword}
//                           <Button
//                             variant="ghost"
//                             className="h-5 w-5 p-0 hover:bg-slate-300 rounded-full"
//                             onClick={() => handleKeywordRemove(keyword)}
//                           >
//                             <span className="sr-only">Remove</span>
//                             <X className="h-3 w-3" />
//                           </Button>
//                         </Badge>
//                       ))}
//                       {(monitoring.keywords || []).length === 0 && (
//                         <span className="text-xs text-muted-foreground italic">
//                           No keywords added yet
//                         </span>
//                       )}
//                     </div>
//                   </div>

//                   <div className="space-y-2">
//                     <div className="flex items-center justify-between">
//                       <Label
//                         htmlFor="competitor-input"
//                         className="flex items-center"
//                       >
//                         <UsersRound className="h-4 w-4 text-slate-500 mr-2" />
//                         <span>Competitor Accounts</span>
//                       </Label>
//                       <Badge
//                         variant="outline"
//                         className="bg-blue-50 text-blue-700 border-blue-100"
//                       >
//                         {monitoring.competitors?.length || 0} Competitors
//                       </Badge>
//                     </div>

//                     <div className="flex gap-2">
//                       <Input
//                         id="competitor-input"
//                         placeholder="Add competitor account"
//                         value={newCompetitor}
//                         onChange={(e) => setNewCompetitor(e.target.value)}
//                         onKeyDown={(e) => {
//                           if (e.key === "Enter") {
//                             e.preventDefault();
//                             handleCompetitorAdd();
//                           }
//                         }}
//                         disabled={!monitoringEnabled}
//                       />
//                       <Button
//                         variant="outline"
//                         onClick={handleCompetitorAdd}
//                         disabled={!newCompetitor || !monitoringEnabled}
//                       >
//                         <Plus className="h-4 w-4" />
//                       </Button>
//                     </div>

//                     <div className="flex flex-wrap gap-2 mt-2">
//                       {(monitoring.competitors || []).map((competitor) => (
//                         <Badge
//                           key={competitor}
//                           variant="outline"
//                           className="bg-slate-100 hover:bg-slate-200 transition-colors py-1 gap-1 pl-2 pr-1"
//                         >
//                           @{competitor}
//                           <Button
//                             variant="ghost"
//                             className="h-5 w-5 p-0 hover:bg-slate-300 rounded-full"
//                             onClick={() => handleCompetitorRemove(competitor)}
//                           >
//                             <span className="sr-only">Remove</span>
//                             <X className="h-3 w-3" />
//                           </Button>
//                         </Badge>
//                       ))}
//                       {(monitoring.competitors || []).length === 0 && (
//                         <span className="text-xs text-muted-foreground italic">
//                           No competitors added yet
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               <div
//                 className={cn(
//                   "bg-blue-50 border border-blue-100 rounded-lg p-4 transition-opacity",
//                   !monitoringEnabled && "opacity-50"
//                 )}
//               >
//                 <div className="flex items-start gap-3">
//                   <InfoIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
//                   <div>
//                     <h4 className="text-sm font-medium text-blue-800 mb-1">
//                       Monitoring Best Practices
//                     </h4>
//                     <ul className="text-xs text-blue-700 space-y-1">
//                       <li>
//                         •{" "}
//                         <span className="font-medium">
//                           Balance frequency and API limits
//                         </span>{" "}
//                         - More frequent monitoring uses more API calls
//                       </li>
//                       <li>
//                         •{" "}
//                         <span className="font-medium">
//                           Be specific with keywords
//                         </span>{" "}
//                         - Use unique terms to avoid irrelevant mentions
//                       </li>
//                       <li>
//                         •{" "}
//                         <span className="font-medium">
//                           Monitor competitors strategically
//                         </span>{" "}
//                         - Focus on direct competitors for best results
//                       </li>
//                     </ul>
//                   </div>
//                 </div>
//               </div>
//             </CardContent>
//             <CardFooter className="border-t pt-4">
//               <Button
//                 variant="outline"
//                 onClick={() => {
//                   // Reset to default monitoring settings
//                   onSettingsChange("frequency", "daily");
//                   onSettingsChange("keywords", []);
//                   onSettingsChange("competitors", []);
//                   onSettingsChange("alertThreshold", "high_priority");

//                   showToast({
//                     title: "Monitoring reset",
//                     description:
//                       "Monitoring settings have been reset to default values.",
//                     variant: "default",
//                   });
//                 }}
//                 className="mr-auto"
//                 disabled={!monitoringEnabled}
//               >
//                 <RefreshCw className="h-4 w-4 mr-2" />
//                 Reset to Default
//               </Button>
//               <Button
//                 onClick={() => {
//                   showToast({
//                     title: "Settings saved",
//                     description:
//                       "Monitoring settings have been saved successfully.",
//                     variant: "default",
//                   });
//                 }}
//                 disabled={!monitoringEnabled}
//                 className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
//               >
//                 <Save className="h-4 w-4 mr-2" />
//                 Save Monitoring Settings
//               </Button>
//             </CardFooter>
//           </Card>

//           <Card className="lg:row-span-2">
//             <CardHeader className="pb-3">
//               <CardTitle className="text-base flex items-center gap-2">
//                 <Bell className="h-4 w-4 text-blue-600" />
//                 <span>Alert Settings</span>
//               </CardTitle>
//               <CardDescription>
//                 Configure how you receive alerts
//               </CardDescription>
//             </CardHeader>
//             <CardContent className="pb-3 space-y-5">
//               <div className="space-y-2">
//                 <div className="flex items-center justify-between">
//                   <Label
//                     htmlFor="email-alerts"
//                     className="text-sm cursor-pointer"
//                   >
//                     Email Alerts
//                   </Label>
//                   <Switch
//                     id="email-alerts"
//                     defaultChecked={true}
//                     disabled={!monitoringEnabled}
//                   />
//                 </div>
//                 <Input
//                   placeholder="email@example.com"
//                   defaultValue="user@example.com"
//                   disabled={!monitoringEnabled}
//                 />
//               </div>

//               <div className="space-y-2">
//                 <div className="flex items-center justify-between">
//                   <Label
//                     htmlFor="slack-alerts"
//                     className="text-sm cursor-pointer"
//                   >
//                     Slack Notifications
//                   </Label>
//                   <Switch
//                     id="slack-alerts"
//                     defaultChecked={false}
//                     disabled={!monitoringEnabled}
//                   />
//                 </div>
//                 <Input placeholder="#channel-name" disabled={true} />
//               </div>

//               <div className="space-y-2">
//                 <div className="flex items-center justify-between">
//                   <Label
//                     htmlFor="webhook-alerts"
//                     className="text-sm cursor-pointer"
//                   >
//                     Webhook Notifications
//                   </Label>
//                   <Switch
//                     id="webhook-alerts"
//                     defaultChecked={false}
//                     disabled={!monitoringEnabled}
//                   />
//                 </div>
//                 <Input
//                   placeholder="https://example.com/webhook"
//                   disabled={true}
//                 />
//               </div>

//               <Separator />

//               <div className="space-y-3">
//                 <h4 className="text-sm font-medium">Alert For:</h4>
//                 <div className="space-y-2">
//                   <div className="flex items-center justify-between">
//                     <Label
//                       htmlFor="new-testimonial-alert"
//                       className="text-sm cursor-pointer flex items-center gap-1.5"
//                     >
//                       <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
//                       <span>New Testimonials</span>
//                     </Label>
//                     <Switch
//                       id="new-testimonial-alert"
//                       defaultChecked={true}
//                       disabled={!monitoringEnabled}
//                     />
//                   </div>

//                   <div className="flex items-center justify-between">
//                     <Label
//                       htmlFor="negative-alert"
//                       className="text-sm cursor-pointer flex items-center gap-1.5"
//                     >
//                       <ThumbsDown className="h-3.5 w-3.5 text-slate-500" />
//                       <span>Negative Sentiment</span>
//                     </Label>
//                     <Switch
//                       id="negative-alert"
//                       defaultChecked={true}
//                       disabled={!monitoringEnabled}
//                     />
//                   </div>

//                   <div className="flex items-center justify-between">
//                     <Label
//                       htmlFor="keywords-alert"
//                       className="text-sm cursor-pointer flex items-center gap-1.5"
//                     >
//                       <Hash className="h-3.5 w-3.5 text-slate-500" />
//                       <span>Specific Keywords</span>
//                     </Label>
//                     <Switch
//                       id="keywords-alert"
//                       defaultChecked={true}
//                       disabled={!monitoringEnabled}
//                     />
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-slate-50 border rounded-lg p-3">
//                 <h4 className="text-sm font-medium mb-2">Alert Frequencies</h4>
//                 <div className="space-y-3">
//                   <div className="space-y-1">
//                     <div className="flex items-center justify-between text-sm">
//                       <span>Critical</span>
//                       <span className="text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded">
//                         Immediate
//                       </span>
//                     </div>
//                   </div>

//                   <div className="space-y-1">
//                     <div className="flex items-center justify-between text-sm">
//                       <span>High Priority</span>
//                       <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
//                         Hourly
//                       </span>
//                     </div>
//                   </div>

//                   <div className="space-y-1">
//                     <div className="flex items-center justify-between text-sm">
//                       <span>Normal</span>
//                       <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
//                         Daily Digest
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </CardContent>
//             <CardFooter className="border-t pt-4 flex justify-center">
//               <Button
//                 variant="outline"
//                 className="w-full"
//                 onClick={() => {
//                   // Test notification functionality
//                   showToast({
//                     title: "Test alert sent",
//                     description:
//                       "A test alert has been sent to your configured channels.",
//                     variant: "default",
//                   });
//                 }}
//                 disabled={!monitoringEnabled}
//               >
//                 <Bell className="h-4 w-4 mr-2" />
//                 Send Test Alert
//               </Button>
//             </CardFooter>
//           </Card>
//         </motion.div>
//       </TabsContent>

//       <TabsContent
//         value="filtering"
//         className="mt-0 space-y-6"
//         // active={activeTab === "filtering"}
//       >
//         {/* Filtering Settings Card */}
//         <motion.div
//           variants={itemVariants}
//           initial="hidden"
//           animate="visible"
//           className="grid grid-cols-1 gap-4 lg:grid-cols-3"
//         >
//           <Card className="col-span-1 lg:col-span-2">
//             <CardHeader className="pb-3">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <CardTitle className="text-base flex items-center gap-2">
//                     <Filter className="h-4 w-4 text-indigo-600" />
//                     <span>Content Filtering</span>
//                   </CardTitle>
//                   <CardDescription>
//                     Define rules to filter out unwanted content
//                   </CardDescription>
//                 </div>
//                 <TooltipProvider>
//                   <Tooltip>
//                     <TooltipTrigger asChild>
//                       <div className="flex items-center gap-1.5 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
//                         <Bot className="h-3.5 w-3.5" />
//                         <span>AI-Powered</span>
//                       </div>
//                     </TooltipTrigger>
//                     <TooltipContent>
//                       <p className="text-xs max-w-xs">
//                         Content filtering uses AI to detect sentiment, context,
//                         and appropriateness to ensure only quality testimonials
//                         are collected.
//                       </p>
//                     </TooltipContent>
//                   </Tooltip>
//                 </TooltipProvider>
//               </div>
//             </CardHeader>
//             <CardContent className="pb-3 space-y-6">
//               <div className="flex items-center gap-3">
//                 <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
//                   <Sparkles className="h-5 w-5 text-purple-600" />
//                 </div>
//                 <div className="flex-1">
//                   <div className="flex items-center justify-between">
//                     <h3 className="text-base font-medium">
//                       AI Content Filtering
//                     </h3>
//                     <Switch
//                       id="ai-filtering"
//                       checked={aiFilteringEnabled}
//                       onCheckedChange={setAiFilteringEnabled}
//                     />
//                   </div>
//                   <p className="text-sm text-slate-500">
//                     Automatically filter content to ensure quality testimonials
//                   </p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="space-y-4">
//                   <h4 className="text-sm font-medium">Content Filters</h4>

//                   <div className="space-y-1.5">
//                     <div className="flex items-center justify-between">
//                       <Label
//                         htmlFor="negative-sentiment"
//                         className="flex items-center gap-1.5 cursor-pointer"
//                       >
//                         <ThumbsDown className="h-3.5 w-3.5 text-slate-500" />
//                         <span>Filter Negative Sentiment</span>
//                       </Label>
//                       <Switch
//                         id="negative-sentiment"
//                         checked={filtering.negativeSentiment}
//                         onCheckedChange={(checked) =>
//                           onFilteringChange("negativeSentiment", checked)
//                         }
//                         disabled={!aiFilteringEnabled}
//                       />
//                     </div>
//                     <p className="text-xs text-slate-500 ml-5">
//                       Skip testimonials with negative sentiment
//                     </p>
//                   </div>

//                   <div className="space-y-1.5">
//                     <div className="flex items-center justify-between">
//                       <Label
//                         htmlFor="competitor-mentions"
//                         className="flex items-center gap-1.5 cursor-pointer"
//                       >
//                         <UsersRound className="h-3.5 w-3.5 text-slate-500" />
//                         <span>Filter Competitor Mentions</span>
//                       </Label>
//                       <Switch
//                         id="competitor-mentions"
//                         checked={filtering.competitorMentions}
//                         onCheckedChange={(checked) =>
//                           onFilteringChange("competitorMentions", checked)
//                         }
//                         disabled={!aiFilteringEnabled}
//                       />
//                     </div>
//                     <p className="text-xs text-slate-500 ml-5">
//                       Skip testimonials that mention competitors
//                     </p>
//                   </div>

//                   <div className="space-y-1.5">
//                     <div className="flex items-center justify-between">
//                       <Label
//                         htmlFor="inappropriate-content"
//                         className="flex items-center gap-1.5 cursor-pointer"
//                       >
//                         <AlertTriangle className="h-3.5 w-3.5 text-slate-500" />
//                         <span>Filter Inappropriate Content</span>
//                       </Label>
//                       <Switch
//                         id="inappropriate-content"
//                         checked={filtering.inappropriate}
//                         onCheckedChange={(checked) =>
//                           onFilteringChange("inappropriate", checked)
//                         }
//                         disabled={!aiFilteringEnabled}
//                       />
//                     </div>
//                     <p className="text-xs text-slate-500 ml-5">
//                       Skip testimonials with inappropriate language or content
//                     </p>
//                   </div>

//                   <div className="space-y-1.5">
//                     <div className="flex items-center justify-between">
//                       <Label
//                         htmlFor="spam-detection"
//                         className="flex items-center gap-1.5 cursor-pointer"
//                       >
//                         <Shield className="h-3.5 w-3.5 text-slate-500" />
//                         <span>Spam Detection</span>
//                       </Label>
//                       <Switch
//                         id="spam-detection"
//                         checked={filtering.spamDetection}
//                         onCheckedChange={(checked) =>
//                           onFilteringChange("spamDetection", checked)
//                         }
//                         disabled={!aiFilteringEnabled}
//                       />
//                     </div>
//                     <p className="text-xs text-slate-500 ml-5">
//                       Skip testimonials that appear to be spam
//                     </p>
//                   </div>
//                 </div>

//                 <div className="space-y-4">
//                   <h4 className="text-sm font-medium">Account Filters</h4>

//                   <div className="space-y-1.5">
//                     <Label
//                       htmlFor="min-followers"
//                       className="flex items-center gap-1.5"
//                     >
//                       <UsersRound className="h-3.5 w-3.5 text-slate-500" />
//                       <span>
//                         Minimum Followers ({filtering.minimumFollowers || 0})
//                       </span>
//                     </Label>
//                     <Slider
//                       id="min-followers"
//                       value={[filtering.minimumFollowers || 0]}
//                       min={0}
//                       max={1000}
//                       step={100}
//                       onValueChange={(value) =>
//                         onFilteringChange("minimumFollowers", value[0])
//                       }
//                       disabled={!aiFilteringEnabled}
//                       className="py-1.5"
//                     />
//                     <div className="flex justify-between text-xs text-slate-500">
//                       <span>Any</span>
//                       <span>1000+</span>
//                     </div>
//                     <p className="text-xs text-slate-500">
//                       Skip testimonials from accounts with fewer followers
//                     </p>
//                   </div>

//                   <div className="space-y-1.5">
//                     <Label
//                       htmlFor="account-age"
//                       className="flex items-center gap-1.5"
//                     >
//                       <Timer className="h-3.5 w-3.5 text-slate-500" />
//                       <span>
//                         Minimum Account Age ({filtering.accountAge || 0} days)
//                       </span>
//                     </Label>
//                     <Slider
//                       id="account-age"
//                       value={[filtering.accountAge || 0]}
//                       min={0}
//                       max={90}
//                       step={15}
//                       onValueChange={(value) =>
//                         onFilteringChange("accountAge", value[0])
//                       }
//                       disabled={!aiFilteringEnabled}
//                       className="py-1.5"
//                     />
//                     <div className="flex justify-between text-xs text-slate-500">
//                       <span>Any</span>
//                       <span>90+ days</span>
//                     </div>
//                     <p className="text-xs text-slate-500">
//                       Skip testimonials from new accounts
//                     </p>
//                   </div>

//                   <div className="space-y-2">
//                     <Label
//                       htmlFor="language-filter"
//                       className="flex items-center gap-1.5"
//                     >
//                       <LanguagesIcon className="h-3.5 w-3.5 text-slate-500" />
//                       <span>Language Filter</span>
//                     </Label>
//                     <Select
//                       value={(filtering.languageFilter || []).join(",")}
//                       onValueChange={(value) => {
//                         const languages = value ? value.split(",") : [];
//                         onFilteringChange("languageFilter", languages);
//                       }}
//                       disabled={!aiFilteringEnabled}
//                     >
//                       <SelectTrigger id="language-filter">
//                         <SelectValue placeholder="Select languages" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="en">English Only</SelectItem>
//                         <SelectItem value="en,es,fr">
//                           English, Spanish, French
//                         </SelectItem>
//                         <SelectItem value="en,es,fr,de,it">
//                           Major European Languages
//                         </SelectItem>
//                         <SelectItem value="">All Languages</SelectItem>
//                       </SelectContent>
//                     </Select>
//                     <p className="text-xs text-slate-500">
//                       Only collect testimonials in selected languages
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               <div className="space-y-3">
//                 <div className="flex items-center justify-between">
//                   <Label
//                     htmlFor="blacklist-input"
//                     className="flex items-center"
//                   >
//                     <EyeOff className="h-4 w-4 text-slate-500 mr-2" />
//                     <span>Blocked Terms</span>
//                   </Label>
//                   <Badge
//                     variant="outline"
//                     className="bg-blue-50 text-blue-700 border-blue-100"
//                   >
//                     {filtering.wordBlacklist?.length || 0} Terms
//                   </Badge>
//                 </div>

//                 <div className="flex gap-2">
//                   <Input
//                     id="blacklist-input"
//                     placeholder="Add word or phrase to block"
//                     value={newBlacklistWord}
//                     onChange={(e) => setNewBlacklistWord(e.target.value)}
//                     onKeyDown={(e) => {
//                       if (e.key === "Enter") {
//                         e.preventDefault();
//                         handleBlacklistAdd();
//                       }
//                     }}
//                     disabled={!aiFilteringEnabled}
//                   />
//                   <Button
//                     variant="outline"
//                     onClick={handleBlacklistAdd}
//                     disabled={!newBlacklistWord || !aiFilteringEnabled}
//                   >
//                     <Plus className="h-4 w-4" />
//                   </Button>
//                 </div>

//                 <div className="flex flex-wrap gap-2 mt-2">
//                   {(filtering.wordBlacklist || []).map((word) => (
//                     <Badge
//                       key={word}
//                       variant="outline"
//                       className="bg-slate-100 hover:bg-slate-200 transition-colors py-1 gap-1 pl-2 pr-1"
//                     >
//                       {word}
//                       <Button
//                         variant="ghost"
//                         className="h-5 w-5 p-0 hover:bg-slate-300 rounded-full"
//                         onClick={() => handleBlacklistRemove(word)}
//                       >
//                         <span className="sr-only">Remove</span>
//                         <X className="h-3 w-3" />
//                       </Button>
//                     </Badge>
//                   ))}
//                   {(filtering.wordBlacklist || []).length === 0 && (
//                     <span className="text-xs text-muted-foreground italic">
//                       No blocked terms added yet
//                     </span>
//                   )}
//                 </div>
//               </div>

//               <div
//                 className={cn(
//                   "bg-amber-50 border border-amber-100 rounded-lg p-4 transition-opacity",
//                   !aiFilteringEnabled && "opacity-50"
//                 )}
//               >
//                 <div className="flex items-start gap-3">
//                   <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
//                   <div>
//                     <h4 className="text-sm font-medium text-amber-800 mb-1">
//                       Filtering Recommendations
//                     </h4>
//                     <p className="text-xs text-amber-700 mb-2">
//                       Striking the right balance with content filtering is
//                       important:
//                     </p>
//                     <ul className="text-xs text-amber-700 space-y-1">
//                       <li>
//                         • <span className="font-medium">Too strict</span> - May
//                         filter out valuable testimonials
//                       </li>
//                       <li>
//                         • <span className="font-medium">Too loose</span> - May
//                         allow inappropriate or irrelevant content
//                       </li>
//                       <li>
//                         • <span className="font-medium">Best approach</span> -
//                         Start with moderate filtering and adjust based on
//                         results
//                       </li>
//                     </ul>
//                   </div>
//                 </div>
//               </div>
//             </CardContent>
//             <CardFooter className="border-t pt-4">
//               <Button
//                 variant="outline"
//                 onClick={() => {
//                   // Reset to default filtering settings
//                   onFilteringChange("negativeSentiment", true);
//                   onFilteringChange("competitorMentions", true);
//                   onFilteringChange("inappropriate", true);
//                   onFilteringChange("spamDetection", true);
//                   onFilteringChange("minimumFollowers", 0);
//                   onFilteringChange("accountAge", 0);
//                   onFilteringChange("languageFilter", []);
//                   onFilteringChange("wordBlacklist", []);

//                   showToast({
//                     title: "Filtering reset",
//                     description:
//                       "Filtering settings have been reset to default values.",
//                     variant: "default",
//                   });
//                 }}
//                 className="mr-auto"
//                 disabled={!aiFilteringEnabled}
//               >
//                 <RefreshCw className="h-4 w-4 mr-2" />
//                 Reset to Default
//               </Button>
//               <Button
//                 onClick={() => {
//                   showToast({
//                     title: "Settings saved",
//                     description:
//                       "Filtering settings have been saved successfully.",
//                     variant: "default",
//                   });
//                 }}
//                 disabled={!aiFilteringEnabled}
//                 className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
//               >
//                 <Save className="h-4 w-4 mr-2" />
//                 Save Filtering Settings
//               </Button>
//             </CardFooter>
//           </Card>

//           <Card>
//             <CardHeader className="pb-3">
//               <CardTitle className="text-base flex items-center gap-2">
//                 <PieChart className="h-4 w-4 text-indigo-600" />
//                 <span>Filtering Results</span>
//               </CardTitle>
//               <CardDescription>
//                 Summary of content filtering impact
//               </CardDescription>
//             </CardHeader>
//             <CardContent className="pb-3 space-y-5">
//               <div className="flex items-center justify-center py-4">
//                 <div className="w-32 h-32 rounded-full border-8 border-indigo-100 flex items-center justify-center">
//                   <div className="text-center">
//                     <span className="text-3xl font-bold text-indigo-600">
//                       76%
//                     </span>
//                     <div className="text-xs text-slate-500">Pass Rate</div>
//                   </div>
//                 </div>
//               </div>

//               <div className="space-y-3">
//                 <div className="space-y-1">
//                   <div className="flex items-center justify-between text-sm">
//                     <span className="flex items-center gap-1.5">
//                       <ThumbsUp className="h-3.5 w-3.5 text-green-500" />
//                       <span>Approved</span>
//                     </span>
//                     <span>76%</span>
//                   </div>
//                   <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
//                     <div
//                       className="h-full bg-green-500"
//                       style={{ width: "76%" }}
//                     />
//                   </div>
//                 </div>

//                 <div className="space-y-1">
//                   <div className="flex items-center justify-between text-sm">
//                     <span className="flex items-center gap-1.5">
//                       <ThumbsDown className="h-3.5 w-3.5 text-red-500" />
//                       <span>Negative Sentiment</span>
//                     </span>
//                     <span>12%</span>
//                   </div>
//                   <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
//                     <div
//                       className="h-full bg-red-500"
//                       style={{ width: "12%" }}
//                     />
//                   </div>
//                 </div>

//                 <div className="space-y-1">
//                   <div className="flex items-center justify-between text-sm">
//                     <span className="flex items-center gap-1.5">
//                       <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
//                       <span>Inappropriate</span>
//                     </span>
//                     <span>8%</span>
//                   </div>
//                   <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
//                     <div
//                       className="h-full bg-amber-500"
//                       style={{ width: "8%" }}
//                     />
//                   </div>
//                 </div>

//                 <div className="space-y-1">
//                   <div className="flex items-center justify-between text-sm">
//                     <span className="flex items-center gap-1.5">
//                       <Shield className="h-3.5 w-3.5 text-blue-500" />
//                       <span>Spam</span>
//                     </span>
//                     <span>4%</span>
//                   </div>
//                   <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
//                     <div
//                       className="h-full bg-blue-500"
//                       style={{ width: "4%" }}
//                     />
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-slate-50 border rounded-lg p-3">
//                 <div className="text-sm">
//                   <div className="flex justify-between mb-2">
//                     <span className="font-medium">Last 30 Days:</span>
//                     <span className="text-slate-600">482 Posts</span>
//                   </div>
//                   <div className="flex justify-between text-xs text-slate-500">
//                     <span>Collected as testimonials:</span>
//                     <span className="font-medium text-green-600">366</span>
//                   </div>
//                   <div className="flex justify-between text-xs text-slate-500">
//                     <span>Filtered out:</span>
//                     <span className="font-medium text-red-600">116</span>
//                   </div>
//                 </div>
//               </div>
//             </CardContent>
//             <CardFooter className="border-t pt-4 flex justify-center">
//               <Button
//                 variant="outline"
//                 className="w-full"
//                 onClick={() => {
//                   // View detailed filtering logs
//                   showToast({
//                     title: "Filtering logs",
//                     description:
//                       "Viewing detailed filtering logs is not available in this preview.",
//                     variant: "default",
//                   });
//                 }}
//               >
//                 <Eye className="h-4 w-4 mr-2" />
//                 View Detailed Logs
//               </Button>
//             </CardFooter>
//           </Card>
//         </motion.div>

//         {/* AI Settings Card */}
//         <motion.div variants={itemVariants} initial="hidden" animate="visible">
//           <Card>
//             <CardHeader className="pb-3">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <CardTitle className="text-base flex items-center gap-2">
//                     <Sparkles className="h-4 w-4 text-purple-600" />
//                     <span>AI Processing Settings</span>
//                   </CardTitle>
//                   <CardDescription>
//                     Configure how AI analyzes and categorizes content
//                   </CardDescription>
//                 </div>
//               </div>
//             </CardHeader>
//             <CardContent className="pb-3">
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                 <div className="space-y-3">
//                   <h4 className="text-sm font-medium">Sentiment Analysis</h4>
//                   <div className="space-y-1.5">
//                     <Label htmlFor="sentiment-threshold">Sensitivity</Label>
//                     <Select
//                       //   id="sentiment-threshold"
//                       defaultValue="medium"
//                       disabled={!aiFilteringEnabled}
//                     >
//                       <SelectTrigger>
//                         <SelectValue placeholder="Select threshold" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="low">
//                           Low (Collect Most Content)
//                         </SelectItem>
//                         <SelectItem value="medium">
//                           Medium (Balanced)
//                         </SelectItem>
//                         <SelectItem value="high">
//                           High (Stricter Filtering)
//                         </SelectItem>
//                       </SelectContent>
//                     </Select>
//                     <p className="text-xs text-slate-500">
//                       How sensitive the sentiment detection should be
//                     </p>
//                   </div>
//                 </div>

//                 <div className="space-y-3">
//                   <h4 className="text-sm font-medium">Content Categories</h4>
//                   <div className="space-y-1.5">
//                     <div className="flex items-center justify-between">
//                       <Label
//                         htmlFor="auto-categorize"
//                         className="flex items-center gap-1.5 cursor-pointer"
//                       >
//                         <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
//                         <span>Auto-Categorize</span>
//                       </Label>
//                       <Switch
//                         id="auto-categorize"
//                         defaultChecked={true}
//                         disabled={!aiFilteringEnabled}
//                       />
//                     </div>
//                     <p className="text-xs text-slate-500 ml-5">
//                       Automatically categorize testimonials by topic and
//                       sentiment
//                     </p>
//                   </div>
//                 </div>

//                 <div className="space-y-3">
//                   <h4 className="text-sm font-medium">Quality Scoring</h4>
//                   <div className="space-y-1.5">
//                     <div className="flex items-center justify-between">
//                       <Label
//                         htmlFor="quality-score"
//                         className="flex items-center gap-1.5 cursor-pointer"
//                       >
//                         <Star className="h-3.5 w-3.5 text-slate-500" />
//                         <span>Quality Scoring</span>
//                       </Label>
//                       <Switch
//                         id="quality-score"
//                         defaultChecked={true}
//                         disabled={!aiFilteringEnabled}
//                       />
//                     </div>
//                     <p className="text-xs text-slate-500 ml-5">
//                       Score testimonials based on quality and usefulness
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               <div
//                 className={cn(
//                   "mt-6 bg-purple-50 border border-purple-100 rounded-lg p-4 transition-opacity",
//                   !aiFilteringEnabled && "opacity-50"
//                 )}
//               >
//                 <div className="flex items-start gap-3">
//                   <Sparkles className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
//                   <div>
//                     <h4 className="text-sm font-medium text-purple-800 mb-1">
//                       AI Processing Usage
//                     </h4>
//                     <p className="text-xs text-purple-700 mb-3">
//                       Your plan includes 10,000 AI-processed testimonials per
//                       month. You've used:
//                     </p>
//                     <div className="space-y-2">
//                       <div className="flex items-center justify-between text-xs text-purple-700">
//                         <span>Processed testimonials this month</span>
//                         <span className="font-medium">3,254 / 10,000</span>
//                       </div>
//                       <div className="h-2 w-full bg-purple-100 rounded-full overflow-hidden">
//                         <div
//                           className="h-full bg-purple-500"
//                           style={{ width: "32.54%" }}
//                         />
//                       </div>
//                       <div className="text-right text-xs text-purple-700">
//                         32.5% of monthly allocation
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </CardContent>
//             <CardFooter className="border-t pt-4">
//               <Button
//                 variant="outline"
//                 onClick={() => {
//                   // View AI insights
//                   showToast({
//                     title: "AI insights",
//                     description:
//                       "AI insights dashboard is not available in this preview.",
//                     variant: "default",
//                   });
//                 }}
//                 className="mr-auto"
//                 disabled={!aiFilteringEnabled}
//               >
//                 <BarChart3 className="h-4 w-4 mr-2" />
//                 View AI Insights
//               </Button>
//               <Button
//                 onClick={() => {
//                   showToast({
//                     title: "AI settings saved",
//                     description:
//                       "AI processing settings have been saved successfully.",
//                     variant: "default",
//                   });
//                 }}
//                 disabled={!aiFilteringEnabled}
//                 className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
//               >
//                 <Save className="h-4 w-4 mr-2" />
//                 Save AI Settings
//               </Button>
//             </CardFooter>
//           </Card>
//         </motion.div>
//       </TabsContent>
//     </div>
//   );
// };

// export default ContentMonitoring;

// src/components/collection-setup/social/ContentMonitoring.tsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Bell,
  Bot,
  CheckCircle2,
  Ear,
  Eye,
  EyeOff,
  Filter,
  Hash,
  HelpCircle,
  Info,
  LanguagesIcon,
  ListFilter,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Save,
  Shield,
  Sparkles,
  Star,
  ThumbsDown,
  ThumbsUp,
  Timer,
  UsersRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CollectionSettings } from "@/types/setup";

interface ContentMonitoringProps {
  monitoring?: CollectionSettings["social"]["monitoring"];
  filtering?: CollectionSettings["social"]["filtering"];
  onSettingsChange: (field: string, value: any) => void;
  onFilteringChange: (field: string, value: any) => void;
  showToast: (toast: {
    title: string;
    description: string;
    variant?: "default" | "destructive";
  }) => void;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

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

const ContentMonitoring: React.FC<ContentMonitoringProps> = ({
  monitoring = {
    frequency: "daily",
    keywords: [],
    competitors: [],
    alertThreshold: "high_priority",
  },
  filtering = {
    negativeSentiment: true,
    competitorMentions: true,
    inappropriate: true,
    spamDetection: true,
    minimumFollowers: 0,
    accountAge: 0,
    languageFilter: [],
    wordBlacklist: [],
  },
  onSettingsChange,
  onFilteringChange,
  showToast,
}) => {
  const [newKeyword, setNewKeyword] = useState("");
  const [newCompetitor, setNewCompetitor] = useState("");
  const [newBlacklistWord, setNewBlacklistWord] = useState("");
  const [monitoringEnabled, setMonitoringEnabled] = useState(true);
  const [aiFilteringEnabled, setAiFilteringEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<"monitoring" | "filtering">(
    "monitoring"
  );
  const [showTestMonitoringDialog, setShowTestMonitoringDialog] =
    useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showFiltersDialog, setShowFiltersDialog] = useState(false);
  const [isFilterConfiguring, setIsFilterConfiguring] = useState(false);

  const handleKeywordAdd = () => {
    if (!newKeyword) return;

    const updatedKeywords = [...(monitoring.keywords || []), newKeyword];
    onSettingsChange("keywords", updatedKeywords);
    setNewKeyword("");

    showToast({
      title: "Keyword added",
      description: `"${newKeyword}" has been added to your monitoring keywords.`,
      variant: "default",
    });
  };

  const handleKeywordRemove = (keyword: string) => {
    const updatedKeywords = (monitoring.keywords || []).filter(
      (k) => k !== keyword
    );
    onSettingsChange("keywords", updatedKeywords);
  };

  const handleCompetitorAdd = () => {
    if (!newCompetitor) return;

    const updatedCompetitors = [
      ...(monitoring.competitors || []),
      newCompetitor,
    ];
    onSettingsChange("competitors", updatedCompetitors);
    setNewCompetitor("");

    showToast({
      title: "Competitor added",
      description: `"${newCompetitor}" has been added to your competitor monitoring.`,
      variant: "default",
    });
  };

  const handleCompetitorRemove = (competitor: string) => {
    const updatedCompetitors = (monitoring.competitors || []).filter(
      (c) => c !== competitor
    );
    onSettingsChange("competitors", updatedCompetitors);
  };

  const handleBlacklistAdd = () => {
    if (!newBlacklistWord) return;

    const updatedBlacklist = [
      ...(filtering.wordBlacklist || []),
      newBlacklistWord,
    ];
    onFilteringChange("wordBlacklist", updatedBlacklist);
    setNewBlacklistWord("");

    showToast({
      title: "Blocked term added",
      description: `"${newBlacklistWord}" has been added to your blocked terms.`,
      variant: "default",
    });
  };

  const handleBlacklistRemove = (word: string) => {
    const updatedBlacklist = (filtering.wordBlacklist || []).filter(
      (w) => w !== word
    );
    onFilteringChange("wordBlacklist", updatedBlacklist);
  };

  const handleTestMonitoring = () => {
    setIsTesting(true);
    setShowTestMonitoringDialog(true);

    // Simulate API call with a delay
    setTimeout(() => {
      setIsTesting(false);
      showToast({
        title: "Monitoring test completed",
        description:
          "Your monitoring settings are working correctly. Found 5 relevant mentions.",
        variant: "default",
      });
    }, 2000);
  };

  const handleFilterTest = () => {
    setIsFilterConfiguring(true);

    // Simulate API call with a delay
    setTimeout(() => {
      setIsFilterConfiguring(false);
      setShowFiltersDialog(false);
      showToast({
        title: "Filters applied",
        description:
          "Your content filtering rules have been tested and applied successfully.",
        variant: "default",
      });
    }, 2000);
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header with overview */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h2 className="text-xl font-semibold tracking-tight mb-1">
            Content Monitoring & Filtering
          </h2>
          <p className="text-sm text-muted-foreground">
            Control what testimonials get collected and receive alerts for
            important mentions
          </p>
        </div>
        <div className="flex gap-3 flex-wrap justify-end">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as any)}
            className="w-auto"
          >
            <TabsList className="h-8 p-0.5">
              <TabsTrigger
                value="monitoring"
                className="text-xs h-7 px-3 rounded"
              >
                <Ear className="h-3.5 w-3.5 mr-1.5" />
                <span>Monitoring</span>
              </TabsTrigger>
              <TabsTrigger
                value="filtering"
                className="text-xs h-7 px-3 rounded"
              >
                <Filter className="h-3.5 w-3.5 mr-1.5" />
                <span>Filtering</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </motion.div>

      {/* Overview Card */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100">
          <CardContent className="pt-6 pb-4">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  {activeTab === "monitoring" ? (
                    <Ear className="h-5 w-5 text-purple-600" />
                  ) : (
                    <Filter className="h-5 w-5 text-purple-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-purple-900">
                    {activeTab === "monitoring" ? "Monitoring" : "Filtering"}{" "}
                    Status
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn(
                        "text-xs mt-1",
                        (activeTab === "monitoring" && monitoringEnabled) ||
                          (activeTab === "filtering" && aiFilteringEnabled)
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-amber-100 text-amber-700 border-amber-200"
                      )}
                    >
                      {(activeTab === "monitoring" && monitoringEnabled) ||
                      (activeTab === "filtering" && aiFilteringEnabled) ? (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      ) : (
                        <AlertCircle className="h-3 w-3 mr-1" />
                      )}
                      {(activeTab === "monitoring" && monitoringEnabled) ||
                      (activeTab === "filtering" && aiFilteringEnabled)
                        ? "Enabled"
                        : "Disabled"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-1">
                <div className="w-full h-1.5 bg-purple-100 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-purple-500"
                    style={{
                      width:
                        activeTab === "monitoring"
                          ? `${Math.min((monitoring.keywords?.length || 0) * 10, 100)}%`
                          : `${Math.min((filtering.wordBlacklist?.length || 0) * 10, 100)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-purple-700">
                  <span>Configuration Progress</span>
                  <span>
                    {activeTab === "monitoring"
                      ? `${monitoring.keywords?.length || 0} keywords`
                      : `${filtering.wordBlacklist?.length || 0} filter terms`}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 self-end md:self-auto">
                {activeTab === "monitoring" ? (
                  <Button
                    size="sm"
                    className="h-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    onClick={handleTestMonitoring}
                  >
                    <Ear className="h-3.5 w-3.5 mr-1.5" />
                    <span>Test Monitoring</span>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="h-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    onClick={() => setShowFiltersDialog(true)}
                  >
                    <ListFilter className="h-3.5 w-3.5 mr-1.5" />
                    <span>Test Filters</span>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <TabsContent
        value="monitoring"
        className="mt-0 space-y-6"
        // active={activeTab === "monitoring"}
      >
        {/* Monitoring Settings Card */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 gap-4 lg:grid-cols-3"
        >
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Ear className="h-4 w-4 text-purple-600" />
                    <span>Monitoring Settings</span>
                  </CardTitle>
                  <CardDescription>
                    Configure what content to monitor across social platforms
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="monitoring-enabled" className="text-sm">
                    Enabled
                  </Label>
                  <Switch
                    id="monitoring-enabled"
                    checked={monitoringEnabled}
                    onCheckedChange={setMonitoringEnabled}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-3 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="monitoring-frequency">
                      Monitoring Frequency
                    </Label>
                    <Select
                      value={monitoring.frequency}
                      onValueChange={(value) =>
                        onSettingsChange("frequency", value)
                      }
                      disabled={!monitoringEnabled}
                    >
                      <SelectTrigger id="monitoring-frequency">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realtime">
                          Real-time (webhook)
                        </SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      How often to check for new mentions and content
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alert-threshold">Alert Threshold</Label>
                    <Select
                      value={monitoring.alertThreshold}
                      onValueChange={(value) =>
                        onSettingsChange("alertThreshold", value)
                      }
                      disabled={!monitoringEnabled}
                    >
                      <SelectTrigger id="alert-threshold">
                        <SelectValue placeholder="Select threshold" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Mentions</SelectItem>
                        <SelectItem value="high_priority">
                          High Priority Only
                        </SelectItem>
                        <SelectItem value="critical">Critical Only</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      What level of mention importance triggers notifications
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="report-schedule">Report Schedule</Label>
                    <Select
                      value={monitoring.reportSchedule || "weekly"}
                      onValueChange={(value) =>
                        onSettingsChange("reportSchedule", value)
                      }
                      disabled={!monitoringEnabled}
                    >
                      <SelectTrigger id="report-schedule">
                        <SelectValue placeholder="Select schedule" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="none">No Reports</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      How often to receive summary reports of collected
                      testimonials
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="keyword-input"
                        className="flex items-center"
                      >
                        <Hash className="h-4 w-4 text-slate-500 mr-2" />
                        <span>Monitoring Keywords</span>
                      </Label>
                      <Badge
                        variant="outline"
                        className="bg-purple-50 text-purple-700 border-purple-100"
                      >
                        {monitoring.keywords?.length || 0} Keywords
                      </Badge>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        id="keyword-input"
                        placeholder="Add keyword to monitor"
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleKeywordAdd();
                          }
                        }}
                        disabled={!monitoringEnabled}
                      />
                      <Button
                        variant="outline"
                        onClick={handleKeywordAdd}
                        disabled={!newKeyword || !monitoringEnabled}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {(monitoring.keywords || []).map((keyword) => (
                        <Badge
                          key={keyword}
                          variant="outline"
                          className="bg-purple-50 hover:bg-purple-100 transition-colors py-1 gap-1 pl-2 pr-1"
                        >
                          {keyword}
                          <Button
                            variant="ghost"
                            className="h-5 w-5 p-0 hover:bg-purple-200 rounded-full"
                            onClick={() => handleKeywordRemove(keyword)}
                          >
                            <span className="sr-only">Remove</span>
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                      {(monitoring.keywords || []).length === 0 && (
                        <span className="text-xs text-muted-foreground italic">
                          No keywords added yet
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="competitor-input"
                        className="flex items-center"
                      >
                        <UsersRound className="h-4 w-4 text-slate-500 mr-2" />
                        <span>Competitor Accounts</span>
                      </Label>
                      <Badge
                        variant="outline"
                        className="bg-purple-50 text-purple-700 border-purple-100"
                      >
                        {monitoring.competitors?.length || 0} Competitors
                      </Badge>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        id="competitor-input"
                        placeholder="Add competitor account"
                        value={newCompetitor}
                        onChange={(e) => setNewCompetitor(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleCompetitorAdd();
                          }
                        }}
                        disabled={!monitoringEnabled}
                      />
                      <Button
                        variant="outline"
                        onClick={handleCompetitorAdd}
                        disabled={!newCompetitor || !monitoringEnabled}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {(monitoring.competitors || []).map((competitor) => (
                        <Badge
                          key={competitor}
                          variant="outline"
                          className="bg-purple-50 hover:bg-purple-100 transition-colors py-1 gap-1 pl-2 pr-1"
                        >
                          @{competitor}
                          <Button
                            variant="ghost"
                            className="h-5 w-5 p-0 hover:bg-purple-200 rounded-full"
                            onClick={() => handleCompetitorRemove(competitor)}
                          >
                            <span className="sr-only">Remove</span>
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                      {(monitoring.competitors || []).length === 0 && (
                        <span className="text-xs text-muted-foreground italic">
                          No competitors added yet
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  "bg-indigo-50 border border-indigo-100 rounded-lg p-4 transition-opacity",
                  !monitoringEnabled && "opacity-50"
                )}
              >
                <div className="flex items-start gap-3">
                  <Bot className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-indigo-800 mb-1">
                      AI-Powered Monitoring Tips
                    </h4>
                    <ul className="text-xs text-indigo-700 space-y-1">
                      <li>
                        •{" "}
                        <span className="font-medium">
                          Be specific with keywords
                        </span>{" "}
                        - Use product names, branded terms, and customer pain
                        points
                      </li>
                      <li>
                        •{" "}
                        <span className="font-medium">
                          Monitor competitors strategically
                        </span>{" "}
                        - Track their customers' feedback for opportunities
                      </li>
                      <li>
                        •{" "}
                        <span className="font-medium">
                          Set alert thresholds appropriately
                        </span>{" "}
                        - Too many alerts can lead to alert fatigue
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  // Reset to default monitoring settings
                  onSettingsChange("frequency", "daily");
                  onSettingsChange("keywords", []);
                  onSettingsChange("competitors", []);
                  onSettingsChange("alertThreshold", "high_priority");

                  showToast({
                    title: "Monitoring reset",
                    description:
                      "Monitoring settings have been reset to default values.",
                    variant: "default",
                  });
                }}
                className="mr-auto"
                disabled={!monitoringEnabled}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset to Default
              </Button>
              <Button
                onClick={() => {
                  showToast({
                    title: "Settings saved",
                    description:
                      "Monitoring settings have been saved successfully.",
                    variant: "default",
                  });
                }}
                disabled={!monitoringEnabled}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Monitoring Settings
              </Button>
            </CardFooter>
          </Card>

          <Card className="lg:row-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4 text-purple-600" />
                <span>Alert Settings</span>
              </CardTitle>
              <CardDescription>
                Configure how you receive alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-3 space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="email-alerts"
                    className="text-sm cursor-pointer"
                  >
                    Email Alerts
                  </Label>
                  <Switch
                    id="email-alerts"
                    defaultChecked={true}
                    disabled={!monitoringEnabled}
                  />
                </div>
                <Input
                  placeholder="email@example.com"
                  defaultValue="user@example.com"
                  disabled={!monitoringEnabled}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="slack-alerts"
                    className="text-sm cursor-pointer"
                  >
                    Slack Notifications
                  </Label>
                  <Switch
                    id="slack-alerts"
                    defaultChecked={false}
                    disabled={!monitoringEnabled}
                  />
                </div>
                <Input placeholder="#channel-name" disabled={true} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="webhook-alerts"
                    className="text-sm cursor-pointer"
                  >
                    Webhook Notifications
                  </Label>
                  <Switch
                    id="webhook-alerts"
                    defaultChecked={false}
                    disabled={!monitoringEnabled}
                  />
                </div>
                <Input
                  placeholder="https://example.com/webhook"
                  disabled={true}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Alert For:</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="new-testimonial-alert"
                      className="text-sm cursor-pointer flex items-center gap-1.5"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
                      <span>New Testimonials</span>
                    </Label>
                    <Switch
                      id="new-testimonial-alert"
                      defaultChecked={true}
                      disabled={!monitoringEnabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="negative-alert"
                      className="text-sm cursor-pointer flex items-center gap-1.5"
                    >
                      <ThumbsDown className="h-3.5 w-3.5 text-slate-500" />
                      <span>Negative Sentiment</span>
                    </Label>
                    <Switch
                      id="negative-alert"
                      defaultChecked={true}
                      disabled={!monitoringEnabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="keywords-alert"
                      className="text-sm cursor-pointer flex items-center gap-1.5"
                    >
                      <Hash className="h-3.5 w-3.5 text-slate-500" />
                      <span>Specific Keywords</span>
                    </Label>
                    <Switch
                      id="keywords-alert"
                      defaultChecked={true}
                      disabled={!monitoringEnabled}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border rounded-lg p-3">
                <h4 className="text-sm font-medium mb-2">Alert Frequencies</h4>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>Critical</span>
                      <span className="text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded">
                        Immediate
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>High Priority</span>
                      <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                        Hourly
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>Normal</span>
                      <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                        Daily Digest
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-center">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  // Test notification functionality
                  showToast({
                    title: "Test alert sent",
                    description:
                      "A test alert has been sent to your configured channels.",
                    variant: "default",
                  });
                }}
                disabled={!monitoringEnabled}
              >
                <Bell className="h-4 w-4 mr-2" />
                Send Test Alert
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </TabsContent>

      <TabsContent
        value="filtering"
        className="mt-0 space-y-6"
        // active={activeTab === "filtering"}
      >
        {/* Filtering Settings Card */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 gap-4 lg:grid-cols-3"
        >
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Filter className="h-4 w-4 text-purple-600" />
                    <span>Content Filtering</span>
                  </CardTitle>
                  <CardDescription>
                    Define rules to filter out unwanted content
                  </CardDescription>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        <Bot className="h-3.5 w-3.5" />
                        <span>AI-Powered</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-xs">
                        Content filtering uses AI to detect sentiment, context,
                        and appropriateness to ensure only quality testimonials
                        are collected.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent className="pb-3 space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-medium">
                      AI Content Filtering
                    </h3>
                    <Switch
                      id="ai-filtering"
                      checked={aiFilteringEnabled}
                      onCheckedChange={setAiFilteringEnabled}
                    />
                  </div>
                  <p className="text-sm text-slate-500">
                    Automatically filter content to ensure quality testimonials
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Content Filters</h4>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="negative-sentiment"
                        className="flex items-center gap-1.5 cursor-pointer"
                      >
                        <ThumbsDown className="h-3.5 w-3.5 text-slate-500" />
                        <span>Filter Negative Sentiment</span>
                      </Label>
                      <Switch
                        id="negative-sentiment"
                        checked={filtering.negativeSentiment}
                        onCheckedChange={(checked) =>
                          onFilteringChange("negativeSentiment", checked)
                        }
                        disabled={!aiFilteringEnabled}
                      />
                    </div>
                    <p className="text-xs text-slate-500 ml-5">
                      Skip testimonials with negative sentiment
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="competitor-mentions"
                        className="flex items-center gap-1.5 cursor-pointer"
                      >
                        <UsersRound className="h-3.5 w-3.5 text-slate-500" />
                        <span>Filter Competitor Mentions</span>
                      </Label>
                      <Switch
                        id="competitor-mentions"
                        checked={filtering.competitorMentions}
                        onCheckedChange={(checked) =>
                          onFilteringChange("competitorMentions", checked)
                        }
                        disabled={!aiFilteringEnabled}
                      />
                    </div>
                    <p className="text-xs text-slate-500 ml-5">
                      Skip testimonials that mention competitors
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="inappropriate-content"
                        className="flex items-center gap-1.5 cursor-pointer"
                      >
                        <AlertTriangle className="h-3.5 w-3.5 text-slate-500" />
                        <span>Filter Inappropriate Content</span>
                      </Label>
                      <Switch
                        id="inappropriate-content"
                        checked={filtering.inappropriate}
                        onCheckedChange={(checked) =>
                          onFilteringChange("inappropriate", checked)
                        }
                        disabled={!aiFilteringEnabled}
                      />
                    </div>
                    <p className="text-xs text-slate-500 ml-5">
                      Skip testimonials with inappropriate language or content
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="spam-detection"
                        className="flex items-center gap-1.5 cursor-pointer"
                      >
                        <Shield className="h-3.5 w-3.5 text-slate-500" />
                        <span>Spam Detection</span>
                      </Label>
                      <Switch
                        id="spam-detection"
                        checked={filtering.spamDetection}
                        onCheckedChange={(checked) =>
                          onFilteringChange("spamDetection", checked)
                        }
                        disabled={!aiFilteringEnabled}
                      />
                    </div>
                    <p className="text-xs text-slate-500 ml-5">
                      Skip testimonials that appear to be spam
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Account Filters</h4>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="min-followers"
                      className="flex items-center gap-1.5"
                    >
                      <UsersRound className="h-3.5 w-3.5 text-slate-500" />
                      <span>
                        Minimum Followers ({filtering.minimumFollowers || 0})
                      </span>
                    </Label>
                    <Slider
                      id="min-followers"
                      value={[filtering.minimumFollowers || 0]}
                      min={0}
                      max={1000}
                      step={100}
                      onValueChange={(value) =>
                        onFilteringChange("minimumFollowers", value[0])
                      }
                      disabled={!aiFilteringEnabled}
                      className="py-1.5"
                    />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Any</span>
                      <span>1000+</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Skip testimonials from accounts with fewer followers
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="account-age"
                      className="flex items-center gap-1.5"
                    >
                      <Timer className="h-3.5 w-3.5 text-slate-500" />
                      <span>
                        Minimum Account Age ({filtering.accountAge || 0} days)
                      </span>
                    </Label>
                    <Slider
                      id="account-age"
                      value={[filtering.accountAge || 0]}
                      min={0}
                      max={90}
                      step={15}
                      onValueChange={(value) =>
                        onFilteringChange("accountAge", value[0])
                      }
                      disabled={!aiFilteringEnabled}
                      className="py-1.5"
                    />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Any</span>
                      <span>90+ days</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Skip testimonials from new accounts
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="language-filter"
                      className="flex items-center gap-1.5"
                    >
                      <LanguagesIcon className="h-3.5 w-3.5 text-slate-500" />
                      <span>Language Filter</span>
                    </Label>
                    <Select
                      value={(filtering.languageFilter || []).join(",")}
                      onValueChange={(value) => {
                        const languages = value ? value.split(",") : [];
                        onFilteringChange("languageFilter", languages);
                      }}
                      disabled={!aiFilteringEnabled}
                    >
                      <SelectTrigger id="language-filter">
                        <SelectValue placeholder="Select languages" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English Only</SelectItem>
                        <SelectItem value="en,es,fr">
                          English, Spanish, French
                        </SelectItem>
                        <SelectItem value="en,es,fr,de,it">
                          Major European Languages
                        </SelectItem>
                        <SelectItem value="">All Languages</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">
                      Only collect testimonials in selected languages
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="blacklist-input"
                    className="flex items-center"
                  >
                    <EyeOff className="h-4 w-4 text-slate-500 mr-2" />
                    <span>Blocked Terms</span>
                  </Label>
                  <Badge
                    variant="outline"
                    className="bg-purple-50 text-purple-700 border-purple-100"
                  >
                    {filtering.wordBlacklist?.length || 0} Terms
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Input
                    id="blacklist-input"
                    placeholder="Add word or phrase to block"
                    value={newBlacklistWord}
                    onChange={(e) => setNewBlacklistWord(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleBlacklistAdd();
                      }
                    }}
                    disabled={!aiFilteringEnabled}
                  />
                  <Button
                    variant="outline"
                    onClick={handleBlacklistAdd}
                    disabled={!newBlacklistWord || !aiFilteringEnabled}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  {(filtering.wordBlacklist || []).map((word) => (
                    <Badge
                      key={word}
                      variant="outline"
                      className="bg-purple-50 hover:bg-purple-100 transition-colors py-1 gap-1 pl-2 pr-1"
                    >
                      {word}
                      <Button
                        variant="ghost"
                        className="h-5 w-5 p-0 hover:bg-purple-200 rounded-full"
                        onClick={() => handleBlacklistRemove(word)}
                      >
                        <span className="sr-only">Remove</span>
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                  {(filtering.wordBlacklist || []).length === 0 && (
                    <span className="text-xs text-muted-foreground italic">
                      No blocked terms added yet
                    </span>
                  )}
                </div>
              </div>

              <div
                className={cn(
                  "bg-amber-50 border border-amber-100 rounded-lg p-4 transition-opacity",
                  !aiFilteringEnabled && "opacity-50"
                )}
              >
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-amber-800 mb-1">
                      Filtering Recommendations
                    </h4>
                    <p className="text-xs text-amber-700 mb-2">
                      Striking the right balance with content filtering is
                      important:
                    </p>
                    <ul className="text-xs text-amber-700 space-y-1">
                      <li>
                        • <span className="font-medium">Too strict</span> - May
                        filter out valuable testimonials
                      </li>
                      <li>
                        • <span className="font-medium">Too loose</span> - May
                        allow inappropriate or irrelevant content
                      </li>
                      <li>
                        • <span className="font-medium">Best approach</span> -
                        Start with moderate filtering and adjust based on
                        results
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  // Reset to default filtering settings
                  onFilteringChange("negativeSentiment", true);
                  onFilteringChange("competitorMentions", true);
                  onFilteringChange("inappropriate", true);
                  onFilteringChange("spamDetection", true);
                  onFilteringChange("minimumFollowers", 0);
                  onFilteringChange("accountAge", 0);
                  onFilteringChange("languageFilter", []);
                  onFilteringChange("wordBlacklist", []);

                  showToast({
                    title: "Filtering reset",
                    description:
                      "Filtering settings have been reset to default values.",
                    variant: "default",
                  });
                }}
                className="mr-auto"
                disabled={!aiFilteringEnabled}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset to Default
              </Button>
              <Button
                onClick={() => {
                  showToast({
                    title: "Settings saved",
                    description:
                      "Filtering settings have been saved successfully.",
                    variant: "default",
                  });
                }}
                disabled={!aiFilteringEnabled}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Filtering Settings
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-purple-600" />
                <span>Filtering Results</span>
              </CardTitle>
              <CardDescription>
                Summary of content filtering impact
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-3 space-y-5">
              <div className="flex items-center justify-center py-4">
                <div className="w-32 h-32 rounded-full border-8 border-indigo-100 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-3xl font-bold text-indigo-600">
                      76%
                    </span>
                    <div className="text-xs text-slate-500">Pass Rate</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5">
                      <ThumbsUp className="h-3.5 w-3.5 text-green-500" />
                      <span>Approved</span>
                    </span>
                    <span>76%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: "76%" }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5">
                      <ThumbsDown className="h-3.5 w-3.5 text-red-500" />
                      <span>Negative Sentiment</span>
                    </span>
                    <span>12%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500"
                      style={{ width: "12%" }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      <span>Inappropriate</span>
                    </span>
                    <span>8%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500"
                      style={{ width: "8%" }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-blue-500" />
                      <span>Spam</span>
                    </span>
                    <span>4%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: "4%" }}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border rounded-lg p-3">
                <div className="text-sm">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Last 30 Days:</span>
                    <span className="text-slate-600">482 Posts</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Collected as testimonials:</span>
                    <span className="font-medium text-green-600">366</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Filtered out:</span>
                    <span className="font-medium text-red-600">116</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-center">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  // View detailed filtering logs
                  showToast({
                    title: "Filtering logs",
                    description:
                      "Viewing detailed filtering logs is not available in this preview.",
                    variant: "default",
                  });
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Detailed Logs
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        {/* AI Settings Card */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <span>AI Processing Settings</span>
                  </CardTitle>
                  <CardDescription>
                    Configure how AI analyzes and categorizes content
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Sentiment Analysis</h4>
                  <div className="space-y-1.5">
                    <Label htmlFor="sentiment-threshold">Sensitivity</Label>
                    <Select
                      defaultValue="medium"
                      disabled={!aiFilteringEnabled}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select threshold" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">
                          Low (Collect Most Content)
                        </SelectItem>
                        <SelectItem value="medium">
                          Medium (Balanced)
                        </SelectItem>
                        <SelectItem value="high">
                          High (Stricter Filtering)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">
                      How sensitive the sentiment detection should be
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Content Categories</h4>
                  <div className="space-y-1.5">
                    <Label htmlFor="auto-categorize">Categorization</Label>
                    <Select defaultValue="auto" disabled={!aiFilteringEnabled}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Automatic</SelectItem>
                        <SelectItem value="manual">Manual Review</SelectItem>
                        <SelectItem value="hybrid">
                          Hybrid (AI + Review)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">
                      How content is categorized and organized
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Quality Threshold</h4>
                  <div className="space-y-1.5">
                    <Label htmlFor="quality-threshold">
                      Minimum Quality Score (%)
                    </Label>
                    <Slider
                      id="quality-threshold"
                      defaultValue={[70]}
                      min={30}
                      max={95}
                      step={5}
                      disabled={!aiFilteringEnabled}
                      className="py-1.5"
                    />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>More Content</span>
                      <span>Higher Quality</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Minimum quality score required for testimonials
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  "mt-6 bg-purple-50 border border-purple-100 rounded-lg p-4 transition-opacity",
                  !aiFilteringEnabled && "opacity-50"
                )}
              >
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-purple-800 mb-1">
                      AI Processing Usage
                    </h4>
                    <p className="text-xs text-purple-700 mb-3">
                      Your plan includes 10,000 AI-processed testimonials per
                      month. You've used:
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-purple-700">
                        <span>Processed testimonials this month</span>
                        <span className="font-medium">3,254 / 10,000</span>
                      </div>
                      <div className="h-2 w-full bg-purple-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500"
                          style={{ width: "32.54%" }}
                        />
                      </div>
                      <div className="text-right text-xs text-purple-700">
                        32.5% of monthly allocation
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  // View AI insights
                  showToast({
                    title: "AI insights",
                    description:
                      "AI insights dashboard is not available in this preview.",
                    variant: "default",
                  });
                }}
                className="mr-auto"
                disabled={!aiFilteringEnabled}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View AI Insights
              </Button>
              <Button
                onClick={() => {
                  showToast({
                    title: "AI settings saved",
                    description:
                      "AI processing settings have been saved successfully.",
                    variant: "default",
                  });
                }}
                disabled={!aiFilteringEnabled}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Save AI Settings
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </TabsContent>

      {/* Test Monitoring Dialog */}
      <Dialog
        open={showTestMonitoringDialog}
        onOpenChange={setShowTestMonitoringDialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Testing Monitoring Settings</DialogTitle>
            <DialogDescription>
              {isTesting
                ? "Testing your monitoring configuration..."
                : "Results of monitoring test"}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {isTesting ? (
              <div className="text-center space-y-4 py-8">
                <div className="flex justify-center">
                  <Ear className="h-12 w-12 text-purple-400 animate-pulse" />
                </div>
                <p className="text-sm text-slate-600">
                  Testing your monitoring settings...
                </p>
                <Progress value={45} className="max-w-xs mx-auto" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 p-3 rounded-md flex gap-3 items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Monitoring settings active
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Your monitoring setup is correctly configured and active.
                    </p>
                  </div>
                </div>

                <div className="border rounded-md p-3">
                  <h3 className="text-sm font-medium mb-2">Sample Results</h3>
                  <div className="space-y-2">
                    <div className="text-xs p-2 bg-slate-50 rounded border flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Hash className="h-3 w-3 text-purple-500" />
                        <span className="font-medium">greatproduct</span>
                      </div>
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        3 mentions
                      </Badge>
                    </div>
                    <div className="text-xs p-2 bg-slate-50 rounded border flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Hash className="h-3 w-3 text-purple-500" />
                        <span className="font-medium">amazingservice</span>
                      </div>
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        2 mentions
                      </Badge>
                    </div>
                    <div className="text-xs p-2 bg-slate-50 rounded border flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <UsersRound className="h-3 w-3 text-purple-500" />
                        <span className="font-medium">competitor1</span>
                      </div>
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                        1 mention
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              disabled={isTesting}
              onClick={() => setShowTestMonitoringDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Filters Dialog */}
      <Dialog open={showFiltersDialog} onOpenChange={setShowFiltersDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Test Filters</DialogTitle>
            <DialogDescription>
              Test how your filtering settings would affect content collection
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Sample Content</Label>
              <div className="border rounded-md p-3 space-y-3">
                <div className="pb-2 border-b text-sm">
                  Love your product! It's so much better than what I was using
                  before. #greatproduct
                </div>
                <div className="flex items-center justify-between">
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    <ThumbsUp className="h-3 w-3 mr-1" />
                    Positive Sentiment
                  </Badge>

                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                    <Star className="h-3 w-3 mr-1" />
                    95% Quality Score
                  </Badge>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-md">
              <div className="flex gap-2 items-start">
                <Info className="h-4 w-4 text-indigo-600 mt-0.5" />
                <div className="text-xs text-indigo-800">
                  <p className="font-medium">Filter Test Results</p>
                  <p className="mt-1">
                    This content passes all your current filters and would be
                    collected as a testimonial.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <h4 className="text-sm font-medium">Adjustment Preview</h4>
              <div className="grid grid-cols-2 gap-2">
                <Select defaultValue="positive">
                  <SelectTrigger id="sentiment-test">
                    <SelectValue placeholder="Sentiment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">Positive Only</SelectItem>
                    <SelectItem value="all">All Sentiment</SelectItem>
                    <SelectItem value="neutral">Neutral & Positive</SelectItem>
                  </SelectContent>
                </Select>

                <Select defaultValue="50">
                  <SelectTrigger id="followers-test">
                    <SelectValue placeholder="Min. Followers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No minimum</SelectItem>
                    <SelectItem value="50">50+ followers</SelectItem>
                    <SelectItem value="100">100+ followers</SelectItem>
                    <SelectItem value="500">500+ followers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFiltersDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleFilterTest} disabled={isFilterConfiguring}>
              {isFilterConfiguring ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Filter className="h-4 w-4 mr-2" />
                  Apply Filters
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default ContentMonitoring;
