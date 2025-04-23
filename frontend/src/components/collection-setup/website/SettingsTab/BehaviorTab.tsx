// import React from "react";
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
// import { Textarea } from "@/components/ui/textarea";
// import { Switch } from "@/components/ui/switch";
// import { Button } from "@/components/ui/button";
// import { Slider } from "@/components/ui/slider";
// import { Separator } from "@/components/ui/separator";
// import {
//   Target,
//   Clock,
//   MousePointerClick,
//   Eye,
//   ArrowDownToLine,
//   Shield,
//   AlertTriangle,
//   Timer,
//   RefreshCw,
//   Info,
//   BarChart4,
// } from "lucide-react";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@/components/ui/tooltip";

// // Types
// import { defaultDisplayRules } from "../constants";
// import { DisplayRules } from "@/types/setup";
// import { observer } from "mobx-react-lite";
// import { runInAction } from "mobx";
// import { testimonialSettingsStore } from "@/stores/testimonialSettingsStore";

// interface BehaviorTabProps {
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

// const BehaviorScoreInfo = () => (
//   <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
//     <div className="flex items-start gap-3">
//       <div className="mt-1">
//         <BarChart4 className="h-5 w-5 text-blue-600" />
//       </div>
//       <div>
//         <h4 className="text-sm font-medium text-blue-800 mb-1">
//           Smart Behavior Score: 82/100
//         </h4>
//         <p className="text-xs text-blue-700 mb-2">
//           Your current settings provide a good balance between visibility and
//           user experience. Consider these optimizations to improve your score:
//         </p>
//         <ul className="space-y-1 text-xs text-blue-600">
//           <li>• Enable exit intent to capture feedback before users leave</li>
//           <li>
//             • Increase minimum time on page slightly to ensure users have
//             experienced your product
//           </li>
//           <li>
//             • Add more specific page targeting to show on high-intent pages
//           </li>
//         </ul>
//       </div>
//     </div>
//   </div>
// );

// const BehaviorTab: React.FC<BehaviorTabProps> = ({ onShowPreview }) => {
//   const store = testimonialSettingsStore;
//   const { displayRules } = store.settings.website;

//   function onUpdateDisplayRules(update: Partial<DisplayRules>) {
//     runInAction(() => {
//       store.updateSettings("website", "displayRules", {
//         ...displayRules,
//         ...update,
//       });
//     });
//   }
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
//             Display Behavior
//           </h2>
//           <p className="text-sm text-muted-foreground">
//             Control when, where, and how your testimonial widget appears to
//             visitors
//           </p>
//         </div>
//       </div>

//       {/* Smart Behavior Score Card */}
//       <BehaviorScoreInfo />

//       {/* Timing Rules Card */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Timing Controls</CardTitle>
//           <CardDescription>
//             Define when your testimonial widget should appear to visitors
//           </CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-8">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//             {/* Time-based Triggers */}
//             <div className="space-y-6">
//               <div className="space-y-3">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-2">
//                     <Clock className="h-4 w-4 text-slate-500" />
//                     <Label className="text-base font-medium">
//                       Time on Page
//                     </Label>
//                   </div>
//                   <span className="text-sm font-medium">
//                     {displayRules?.minTimeOnPage || 0} seconds
//                   </span>
//                 </div>
//                 <Slider
//                   value={[displayRules?.minTimeOnPage || 0]}
//                   min={0}
//                   max={120}
//                   step={5}
//                   className="py-1"
//                   onValueChange={([value]) =>
//                     onUpdateDisplayRules({ minTimeOnPage: value })
//                   }
//                 />
//                 <div className="flex justify-between text-xs text-slate-500">
//                   <span>Immediate</span>
//                   <span>2 minutes</span>
//                 </div>
//                 <p className="text-sm text-muted-foreground">
//                   Wait until the visitor has been on the current page for this
//                   amount of time
//                 </p>

//                 <div className="py-2">
//                   <div className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-lg p-3">
//                     <div className="flex items-start gap-1.5">
//                       <Info className="h-3.5 w-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
//                       <p>
//                         Research shows that 20-45 seconds is the optimal delay
//                         for testimonial requests. This gives users enough time
//                         to engage with the page but catches them before they
//                         lose interest.
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               <div className="space-y-3">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-2">
//                     <Timer className="h-4 w-4 text-slate-500" />
//                     <Label className="text-base font-medium">
//                       Time on Site
//                     </Label>
//                   </div>
//                   <span className="text-sm font-medium">
//                     {displayRules?.minTimeOnSite || 0} seconds
//                   </span>
//                 </div>
//                 <Slider
//                   value={[displayRules?.minTimeOnSite || 0]}
//                   min={0}
//                   max={300}
//                   step={15}
//                   className="py-1"
//                   onValueChange={([value]) =>
//                     onUpdateDisplayRules({ minTimeOnSite: value })
//                   }
//                 />
//                 <div className="flex justify-between text-xs text-slate-500">
//                   <span>Immediate</span>
//                   <span>5 minutes</span>
//                 </div>
//                 <p className="text-sm text-muted-foreground">
//                   Wait until the visitor has been on your website for this
//                   amount of time
//                 </p>
//               </div>
//             </div>

//             {/* Action-based Triggers */}
//             <div className="space-y-6">
//               <div className="space-y-3">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-2">
//                     <ArrowDownToLine className="h-4 w-4 text-slate-500" />
//                     <Label className="text-base font-medium">
//                       Scroll Depth
//                     </Label>
//                   </div>
//                   <span className="text-sm font-medium">
//                     {displayRules?.minScrollDepth || 0}%
//                   </span>
//                 </div>
//                 <Slider
//                   value={[displayRules?.minScrollDepth || 0]}
//                   min={0}
//                   max={100}
//                   step={10}
//                   className="py-1"
//                   onValueChange={([value]) =>
//                     onUpdateDisplayRules({ minScrollDepth: value })
//                   }
//                 />
//                 <div className="flex justify-between text-xs text-slate-500">
//                   <span>Page top</span>
//                   <span>Page bottom</span>
//                 </div>
//                 <p className="text-sm text-muted-foreground">
//                   Show after visitor scrolls to this percentage of the page
//                 </p>
//               </div>

//               <div className="pt-2 pb-1">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-2">
//                     <MousePointerClick className="h-4 w-4 text-slate-500" />
//                     <Label
//                       htmlFor="exit-intent"
//                       className="text-base font-medium cursor-pointer"
//                     >
//                       Exit Intent
//                     </Label>
//                   </div>
//                   <Switch
//                     id="exit-intent"
//                     checked={displayRules?.showOnExit || false}
//                     onCheckedChange={(checked) =>
//                       onUpdateDisplayRules({ showOnExit: checked })
//                     }
//                   />
//                 </div>
//                 <p className="text-sm text-muted-foreground mt-1 ml-6">
//                   Trigger the widget when visitor moves cursor to leave the page
//                 </p>
//                 <TooltipProvider>
//                   <Tooltip>
//                     <TooltipTrigger asChild>
//                       <div className="ml-6 text-xs text-amber-700 bg-amber-50 rounded-lg py-1 px-2 border border-amber-100 inline-flex items-center gap-1 mt-2 cursor-help">
//                         <AlertTriangle className="h-3 w-3" />
//                         <span>Only works on desktop devices</span>
//                       </div>
//                     </TooltipTrigger>
//                     <TooltipContent>
//                       <p className="text-xs max-w-xs">
//                         Exit intent detection requires a mouse cursor and
//                         doesn't work on mobile or tablet devices. Consider
//                         enabling other trigger methods for mobile users.
//                       </p>
//                     </TooltipContent>
//                   </Tooltip>
//                 </TooltipProvider>
//               </div>
//             </div>
//           </div>

//           <Separator />

//           {/* Frequency Controls */}
//           <div className="space-y-4">
//             <h3 className="text-base font-medium flex items-center gap-2">
//               <RefreshCw className="h-4 w-4 text-slate-500" />
//               <span>Frequency Control</span>
//             </h3>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div className="space-y-2">
//                 <Label htmlFor="max-frequency">
//                   Maximum Prompts per Session
//                 </Label>
//                 <div className="flex items-center gap-2">
//                   <div className="grid grid-cols-5 gap-2 w-full">
//                     {[1, 2, 3, 5, 10].map((num) => (
//                       <Button
//                         key={num}
//                         type="button"
//                         variant={
//                           displayRules?.maxPromptFrequency === num
//                             ? "default"
//                             : "outline"
//                         }
//                         className="h-10"
//                         onClick={() =>
//                           onUpdateDisplayRules({ maxPromptFrequency: num })
//                         }
//                       >
//                         {num}
//                       </Button>
//                     ))}
//                   </div>
//                 </div>
//                 <p className="text-xs text-muted-foreground">
//                   Maximum number of times to show the testimonial widget to a
//                   single visitor in one session
//                 </p>
//               </div>

//               <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
//                 <h4 className="text-sm font-medium flex items-center gap-1.5">
//                   <Shield className="h-4 w-4 text-slate-500" />
//                   <span>Frequency Best Practices</span>
//                 </h4>
//                 <p className="text-xs text-slate-600">
//                   For optimal user experience and conversion rates, we recommend
//                   limiting prompts to 1-2 per session. Showing your widget too
//                   frequently can lead to "banner blindness" and decreased
//                   response rates.
//                 </p>
//               </div>
//             </div>
//           </div>
//         </CardContent>
//         <CardFooter className="border-t pt-6 flex justify-between">
//           <Button
//             variant="outline"
//             className="flex items-center gap-2"
//             onClick={() => {
//               onUpdateDisplayRules(defaultDisplayRules);
//             }}
//           >
//             <RefreshCw className="h-4 w-4" />
//             <span>Reset to Recommended</span>
//           </Button>
//           <Button onClick={onShowPreview} className="flex items-center gap-2">
//             <Eye className="h-4 w-4" />
//             <span>Test Behavior</span>
//           </Button>
//         </CardFooter>
//       </Card>

//       {/* Page Targeting Card */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Page Targeting</CardTitle>
//           <CardDescription>
//             Control which pages the testimonial widget appears on
//           </CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-6">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//             {/* Exclusion Rules */}
//             <div className="space-y-2">
//               <Label htmlFor="excluded-pages" className="text-base font-medium">
//                 Excluded Pages
//               </Label>
//               <Textarea
//                 id="excluded-pages"
//                 value={(displayRules?.excludedPages || []).join("\n")}
//                 onChange={(e) => {
//                   const pages = e.target.value
//                     .split("\n")
//                     .map((p) => p.trim())
//                     .filter(Boolean);
//                   onUpdateDisplayRules({ excludedPages: pages });
//                 }}
//                 placeholder="/checkout/*&#10;/account/*&#10;/login&#10;/signup"
//                 rows={5}
//                 className="font-mono text-sm"
//               />
//               <div className="flex justify-between text-xs text-muted-foreground">
//                 <span>One URL pattern per line. Use * for wildcards.</span>
//                 <span>{(displayRules?.excludedPages || []).length} rules</span>
//               </div>
//               <div className="mt-2 text-xs text-muted-foreground">
//                 Widget will <span className="font-medium">never</span> appear on
//                 these pages
//               </div>
//             </div>

//             {/* Inclusion Rules */}
//             <div className="space-y-2">
//               <Label
//                 htmlFor="included-pages"
//                 className="text-base font-medium flex items-center justify-between"
//               >
//                 <span>Included Pages</span>
//                 <span className="text-xs font-normal text-muted-foreground">
//                   Leave empty to show on all non-excluded pages
//                 </span>
//               </Label>
//               <Textarea
//                 id="included-pages"
//                 value={(displayRules?.includedPages || []).join("\n")}
//                 onChange={(e) => {
//                   const pages = e.target.value
//                     .split("\n")
//                     .map((p) => p.trim())
//                     .filter(Boolean);
//                   onUpdateDisplayRules({ includedPages: pages });
//                 }}
//                 placeholder="/products/*&#10;/services/*&#10;/about"
//                 rows={5}
//                 className="font-mono text-sm"
//               />
//               <div className="flex justify-between text-xs text-muted-foreground">
//                 <span>One URL pattern per line. Use * for wildcards.</span>
//                 <span>{(displayRules?.includedPages || []).length} rules</span>
//               </div>
//               <div className="mt-2 text-xs text-muted-foreground">
//                 Widget will <span className="font-medium">only</span> appear on
//                 these pages (if specified)
//               </div>
//             </div>
//           </div>

//           <div className="space-y-4 bg-blue-50 rounded-lg p-4 border border-blue-100 mt-4">
//             <h3 className="text-sm font-medium text-blue-800">
//               Strategic Page Targeting
//             </h3>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <h4 className="text-xs font-medium text-blue-700">
//                   High-Conversion Pages ✓
//                 </h4>
//                 <ul className="text-xs text-blue-600 space-y-1">
//                   <li>• Product pages (after viewing details)</li>
//                   <li>• Thank you pages (post-conversion)</li>
//                   <li>• Feature showcase pages</li>
//                   <li>• Success story pages</li>
//                 </ul>
//               </div>
//               <div className="space-y-2">
//                 <h4 className="text-xs font-medium text-blue-700">
//                   Low-Conversion Pages ✗
//                 </h4>
//                 <ul className="text-xs text-blue-600 space-y-1">
//                   <li>• Checkout/payment pages</li>
//                   <li>• Login/signup pages</li>
//                   <li>• Legal/terms pages</li>
//                   <li>• Support/help pages</li>
//                 </ul>
//               </div>
//             </div>
//           </div>

//           <div className="pt-4">
//             <Button
//               onClick={onShowPreview}
//               variant="outline"
//               className="w-full flex items-center justify-center gap-2"
//             >
//               <Target className="h-4 w-4" />
//               <span>Test Page Targeting Rules</span>
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
//     </motion.div>
//   );
// };

// export default observer(BehaviorTab);

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Clock, Eye, Target } from "lucide-react";
import { defaultDisplayRules } from "../constants";
import { DisplayRules } from "@/types/setup";
import { observer } from "mobx-react-lite";
import { runInAction } from "mobx";
import { testimonialSettingsStore } from "@/stores/testimonialSettingsStore";

interface BehaviorTabProps {
  onShowPreview: () => void;
}

const BehaviorTab: React.FC<BehaviorTabProps> = ({ onShowPreview }) => {
  const store = testimonialSettingsStore;
  const { displayRules } = store.settings.website;

  function onUpdateDisplayRules(update: Partial<DisplayRules>) {
    runInAction(() => {
      store.updateSettings("website", "displayRules", {
        ...displayRules,
        ...update,
      });
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          Display Behavior
        </h2>
        <p className="text-sm text-muted-foreground">
          Control when and where your testimonial widget appears
        </p>
      </div>

      {/* Timing Rules Card */}
      <Card>
        <CardHeader>
          <CardTitle>Timing</CardTitle>
          <CardDescription>
            Define when your testimonial widget should appear
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-500" />
                <Label className="text-base font-medium">Time on Page</Label>
              </div>
              <span className="text-sm font-medium">
                {displayRules?.minTimeOnPage || 0} seconds
              </span>
            </div>
            <Slider
              value={[displayRules?.minTimeOnPage || 0]}
              min={0}
              max={120}
              step={5}
              className="py-1"
              onValueChange={([value]) =>
                onUpdateDisplayRules({ minTimeOnPage: value })
              }
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>Immediate</span>
              <span>2 minutes</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Wait until the visitor has been on the page for this amount of
              time
            </p>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6 flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              onUpdateDisplayRules({
                minTimeOnPage: defaultDisplayRules.minTimeOnPage,
              });
            }}
          >
            Reset
          </Button>
          <Button onClick={onShowPreview} className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span>Test</span>
          </Button>
        </CardFooter>
      </Card>

      {/* Page Targeting Card */}
      <Card>
        <CardHeader>
          <CardTitle>Page Targeting</CardTitle>
          <CardDescription>
            Control which pages the testimonial widget appears on
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="excluded-pages" className="text-base font-medium">
              Excluded Pages
            </Label>
            <Textarea
              id="excluded-pages"
              value={(displayRules?.excludedPages || []).join("\n")}
              onChange={(e) => {
                const pages = e.target.value
                  .split("\n")
                  .map((p) => p.trim())
                  .filter(Boolean);
                onUpdateDisplayRules({ excludedPages: pages });
              }}
              placeholder="/checkout/*&#10;/account/*&#10;/login&#10;/signup"
              rows={4}
              className="font-mono text-sm"
            />
            <div className="text-xs text-muted-foreground">
              One URL pattern per line. Use * for wildcards.
            </div>
            <div className="text-xs text-muted-foreground">
              Widget will <span className="font-medium">never</span> appear on
              these pages
            </div>
          </div>

          <div className="pt-2">
            <Button
              onClick={onShowPreview}
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
            >
              <Target className="h-4 w-4" />
              <span>Test Page Targeting</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default observer(BehaviorTab);
