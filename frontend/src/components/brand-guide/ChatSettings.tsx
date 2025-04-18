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
