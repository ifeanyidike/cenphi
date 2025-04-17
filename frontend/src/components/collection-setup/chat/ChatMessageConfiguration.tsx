import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  RefreshCw,
  Info,
  CheckCircle,
  Shield,
  Sparkles,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CollectionSettings } from "@/types/setup";
import { observer } from "mobx-react-lite";

interface ChatMessageConfigurationProps {
  settings: CollectionSettings["chat"];
  timeout: string;
  onSettingsChange: (
    field: keyof CollectionSettings["chat"],
    value: any
  ) => void;
}

const ChatMessageConfiguration: React.FC<ChatMessageConfigurationProps> =
  observer(({ timeout, onSettingsChange }) => {
    const [currentTimeout, setCurrentTimeout] = useState(timeout);
    const [showAsBotMessage, setShowAsBotMessage] = useState(true);
    const [disableDuringActive, setDisableDuringActive] = useState(true);
    const [showSuccessIndicator, setShowSuccessIndicator] = useState(false);

    // Apply changes
    const handleApplyChanges = () => {
      onSettingsChange("timeout", currentTimeout);
      // onSettingsChange("showAsBotMessage", showAsBotMessage);
      // onSettingsChange("disableDuringActive", disableDuringActive);

      // Show success indicator
      setShowSuccessIndicator(true);
      setTimeout(() => setShowSuccessIndicator(false), 2000);
    };

    // Reset to defaults
    const handleResetToDefaults = () => {
      setCurrentTimeout("5"); // default timeout
      setShowAsBotMessage(true);
      setDisableDuringActive(true);
    };

    return (
      <div className="relative">
        {/* Background decorative elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-200 dark:bg-blue-900/20 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-300 dark:bg-indigo-900/30 rounded-full blur-3xl opacity-20"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="backdrop-blur-[2px]"
        >
          <Card className="overflow-hidden border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_-15px_rgba(0,0,0,0.3)] rounded-2xl">
            {/* Decorative header with abstract wave pattern */}
            <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-600 relative overflow-hidden">
              <svg
                className="w-full h-6 absolute -bottom-8"
                viewBox="0 0 600 60"
                preserveAspectRatio="none"
              >
                <path
                  d="M0,0 C150,40 350,0 500,30 L500,60 L0,60 Z"
                  fill="url(#headerGradient)"
                ></path>
                <defs>
                  <linearGradient
                    id="headerGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="50%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <CardContent className="p-8 space-y-8">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-0.5 rounded-lg shadow-lg">
                      <div className="bg-white dark:bg-slate-900 p-1.5 rounded-[5px]">
                        <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 dark:from-blue-400 dark:via-indigo-400 dark:to-violet-400">
                      Chat Testimonial Controls
                    </h2>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 pl-11 text-sm">
                    Configure how testimonial requests behave in chat
                    conversations
                  </p>
                </div>

                <AnimatePresence>
                  {showSuccessIndicator && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-full"
                    >
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span className="text-xs font-medium text-emerald-800 dark:text-emerald-400">
                        Settings saved
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Request Timeout */}
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="p-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50/90 dark:from-slate-900 dark:to-slate-800/50 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group"
                >
                  {/* Decorative backgrounds */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/50 dark:bg-blue-900/10 rounded-full blur-2xl -mr-10 -mt-10 opacity-0 group-hover:opacity-70 transition-opacity duration-300"></div>

                  <div className="relative">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20 dark:shadow-blue-900/20">
                        <Clock className="h-7 w-7 text-white" />
                      </div>
                      <div className="space-y-1">
                        <Label
                          htmlFor="request-timeout"
                          className="text-lg font-semibold text-slate-900 dark:text-white leading-tight"
                        >
                          Request Timeout
                        </Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Time before a testimonial request expires
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center gap-4 pl-2">
                      <div className="relative w-full max-w-[240px]">
                        <Input
                          id="request-timeout"
                          type="number"
                          min="1"
                          max="60"
                          value={currentTimeout}
                          onChange={(e) => setCurrentTimeout(e.target.value)}
                          className={cn(
                            "pr-24 pl-5 py-6 text-lg font-medium",
                            "border-0 bg-white dark:bg-slate-800",
                            "focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400",
                            "rounded-xl shadow-sm transition-all duration-200"
                          )}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none bg-gradient-to-r from-transparent to-slate-50 dark:to-slate-700 h-full rounded-r-xl">
                          <span className="text-base font-medium bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                            minutes
                          </span>
                        </div>
                      </div>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="p-2.5 rounded-full flex items-center justify-center border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-help shadow-sm hover:shadow transition-shadow duration-200">
                              <Info className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg p-4 rounded-xl">
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              If the customer doesn't respond to the testimonial
                              request within this time period, the request will
                              expire and be removed from the chat.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </motion.div>

                {/* Display Controls */}
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="p-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50/90 dark:from-slate-900 dark:to-slate-800/50 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group"
                >
                  {/* Decorative backgrounds */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent dark:from-indigo-900/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/50 dark:bg-indigo-900/10 rounded-full blur-2xl -mr-10 -mt-10 opacity-0 group-hover:opacity-70 transition-opacity duration-300"></div>

                  <div className="relative">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/20 dark:shadow-indigo-900/20">
                        <Sparkles className="h-7 w-7 text-white" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white leading-tight">
                          Display Controls
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Configure testimonial request appearance
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-7 pl-2">
                      <div className="group/toggle flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm hover:shadow transition-shadow duration-200">
                        <div className="space-y-0.5 pr-4">
                          <Label
                            htmlFor="show-as-bot-message"
                            className="text-base font-semibold text-slate-900 dark:text-white group-hover/toggle:text-blue-600 dark:group-hover/toggle:text-blue-400 transition-colors duration-200"
                          >
                            Show as bot message
                          </Label>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Display requests from bot instead of agent
                          </p>
                        </div>
                        <Switch
                          id="show-as-bot-message"
                          checked={showAsBotMessage}
                          onCheckedChange={setShowAsBotMessage}
                          className="data-[state=checked]:bg-gradient-to-r from-blue-500 to-indigo-600 h-6 w-11"
                        />
                      </div>

                      <div className="group/toggle flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm hover:shadow transition-shadow duration-200">
                        <div className="space-y-0.5 pr-4">
                          <Label
                            htmlFor="disable-during-active"
                            className="text-base font-semibold text-slate-900 dark:text-white group-hover/toggle:text-blue-600 dark:group-hover/toggle:text-blue-400 transition-colors duration-200"
                          >
                            Disable during active issues
                          </Label>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Don't interrupt ongoing support chats
                          </p>
                        </div>
                        <Switch
                          id="disable-during-active"
                          checked={disableDuringActive}
                          onCheckedChange={setDisableDuringActive}
                          className="data-[state=checked]:bg-gradient-to-r from-blue-500 to-indigo-600 h-6 w-11"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Best practices tip */}
              <div className="relative overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-violet-600/10 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-violet-900/20 animate-gradient-x"></div>
                <div className="px-6 py-5 backdrop-blur-sm border border-blue-100/80 dark:border-blue-800/30 rounded-2xl relative flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-100 dark:border-blue-800/30 shadow-inner">
                    <Shield className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-base">
                      Best Practices
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                      For optimal results, request testimonials immediately
                      after resolving an issue successfully, but avoid
                      interrupting active support conversations.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="px-8 py-6 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900 backdrop-blur-sm border-t border-slate-100 dark:border-slate-800/50 flex justify-between items-center">
              <Button
                variant="outline"
                onClick={handleResetToDefaults}
                className="gap-2 border-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 shadow-sm"
              >
                <RefreshCw className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <span>Reset Defaults</span>
              </Button>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handleApplyChanges}
                  className="gap-2 bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 shadow-lg hover:shadow-xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-200 px-6 py-3 h-auto text-base font-semibold"
                >
                  <span>Save Configuration</span>
                  <ArrowRight className="h-5 w-5 ml-1" />
                </Button>
              </motion.div>
            </CardFooter>
          </Card>

          {/* Decorative floating elements */}
          <div className="absolute top-1/4 right-0 w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-400 dark:from-blue-600 dark:to-indigo-600 rounded-full blur-3xl opacity-30 -z-10 animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 left-0 w-24 h-24 bg-gradient-to-br from-indigo-400 to-violet-400 dark:from-indigo-600 dark:to-violet-600 rounded-full blur-3xl opacity-30 -z-10 animate-pulse-slow animation-delay-1000"></div>
        </motion.div>

        <style>{`
          @keyframes gradient-x {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }
          .animate-gradient-x {
            background-size: 200% 200%;
            animation: gradient-x 15s ease infinite;
          }
          .animate-pulse-slow {
            animation: pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          .animation-delay-1000 {
            animation-delay: 1s;
          }
        `}</style>
      </div>
    );
  });

export default ChatMessageConfiguration;
