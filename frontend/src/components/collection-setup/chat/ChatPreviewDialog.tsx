import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  ThumbsUp,
  Star,
  Clock,
  Video,
  Mic,
  FileText,
  Image as ImageIcon,
  RefreshCw,
  MessageCircle,
  PanelLeftClose,
  MessagesSquare,
  ChevronRight,
  ChevronLeft,
  Laptop,
  Smartphone,
  Tablet,
  MoreHorizontal,
  CheckCircle,
  PauseCircle,
  PlayCircle,
  ShoppingCart,
  HeartHandshake,
  Sparkles,
  Settings,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { CollectionSettings } from "@/types/setup";
import { cn } from "@/lib/utils";

const messageVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.1,
      ease: "easeIn",
    },
  },
};

const typingVariants = {
  initial: { opacity: 0, y: 5 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 5 },
};

// Types
interface ChatPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: CollectionSettings["chat"];
}

type ChatPlatformId = "intercom" | "zendesk" | "drift" | "crisp" | "tawkto";

interface ChatPlatformConfig {
  id: ChatPlatformId;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  logo: React.ReactNode;
  agentAvatar: string;
  customerAvatar: string;
  agentName: string;
  typing: {
    bubbleCount: number;
    bubbleColor: string;
    bubbleSize: string;
  };
  layout: {
    borderRadius: string;
    messagePadding: string;
    headerStyle: string;
    inputStyle: string;
  };
}

interface ChatTrigger {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface ChatMessage {
  id: string;
  sender: "agent" | "customer" | "system";
  content: string;
  timestamp: Date;
  isTestimonialRequest?: boolean;
  isTestimonialResponse?: boolean;
  testimonialRating?: number;
  productInfo?: {
    name: string;
    price: string;
    image?: string;
  };
  triggerType?: string;
  isTyping?: boolean;
}

type TestimonialFormatType = "video" | "audio" | "text" | "image";

interface ConversationScenario {
  id: string;
  name: string;
  description: string;
  triggerType: string;
  icon: React.ReactNode;
  messages: ChatMessage[];
}

const ChatPreviewDialog: React.FC<ChatPreviewDialogProps> = ({
  open,
  onOpenChange,
  settings,
}) => {
  // State
  const [activePlatform, setActivePlatform] =
    useState<ChatPlatformId>("intercom");
  const [deviceType, setDeviceType] = useState<"desktop" | "tablet" | "mobile">(
    "desktop"
  );
  const [activeTrigger, setActiveTrigger] = useState<string>("sentiment");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [testimonialRating, setTestimonialRating] = useState<number>(0);
  const [autoplayEnabled, setAutoplayEnabled] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [showTestimonialFormats, setShowTestimonialFormats] =
    useState<boolean>(false);
  const [typingIndicator, setTypingIndicator] = useState<boolean>(false);
  const [, setSelectedFormat] = useState<TestimonialFormatType | null>(null);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [conversationComplete, setConversationComplete] =
    useState<boolean>(false);
  const [activeScenario, setActiveScenario] = useState<string>("sentiment");

  // Refs
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const autoplayTimerRef = useRef<number | null>(null);

  // Company and user details
  const companyName = "Acme Inc";
  const customerName = "Alex";

  // Chat platform configurations
  const chatPlatforms: Record<ChatPlatformId, ChatPlatformConfig> = {
    intercom: {
      id: "intercom",
      name: "Intercom",
      primaryColor: "#286EFA",
      secondaryColor: "#E4EEFF",
      logo: <MessageCircle className="h-5 w-5" />,
      agentAvatar: "https://randomuser.me/api/portraits/women/44.jpg",
      customerAvatar: "https://randomuser.me/api/portraits/men/32.jpg",
      agentName: "Sarah from Intercom",
      typing: {
        bubbleCount: 3,
        bubbleColor: "#286EFA",
        bubbleSize: "w-2 h-2",
      },
      layout: {
        borderRadius: "rounded-lg",
        messagePadding: "p-3",
        headerStyle: "bg-white border-b",
        inputStyle: "bg-white border rounded-lg",
      },
    },
    zendesk: {
      id: "zendesk",
      name: "Zendesk Chat",
      primaryColor: "#03363D",
      secondaryColor: "#E9F9FB",
      logo: <MessagesSquare className="h-5 w-5" />,
      agentAvatar: "https://randomuser.me/api/portraits/women/68.jpg",
      customerAvatar: "https://randomuser.me/api/portraits/men/22.jpg",
      agentName: "Emma from Support",
      typing: {
        bubbleCount: 3,
        bubbleColor: "#03363D",
        bubbleSize: "w-2 h-2",
      },
      layout: {
        borderRadius: "rounded-md",
        messagePadding: "p-3",
        headerStyle: "bg-[#03363D] text-white",
        inputStyle: "bg-white border rounded-md",
      },
    },
    drift: {
      id: "drift",
      name: "Drift",
      primaryColor: "#4363EE",
      secondaryColor: "#EDF1FD",
      logo: <MessageSquare className="h-5 w-5" />,
      agentAvatar: "https://randomuser.me/api/portraits/women/56.jpg",
      customerAvatar: "https://randomuser.me/api/portraits/men/8.jpg",
      agentName: "Jake from Drift",
      typing: {
        bubbleCount: 3,
        bubbleColor: "#4363EE",
        bubbleSize: "w-2 h-2",
      },
      layout: {
        borderRadius: "rounded-xl",
        messagePadding: "p-3",
        headerStyle: "bg-gradient-to-r from-[#4363EE] to-[#6080FF] text-white",
        inputStyle: "bg-white border rounded-xl shadow-sm",
      },
    },
    crisp: {
      id: "crisp",
      name: "Crisp",
      primaryColor: "#7F45E3",
      secondaryColor: "#F3EEFD",
      logo: <MessageCircle className="h-5 w-5" />,
      agentAvatar: "https://randomuser.me/api/portraits/women/32.jpg",
      customerAvatar: "https://randomuser.me/api/portraits/men/62.jpg",
      agentName: "Michael from Crisp",
      typing: {
        bubbleCount: 3,
        bubbleColor: "#7F45E3",
        bubbleSize: "w-2 h-2",
      },
      layout: {
        borderRadius: "rounded-2xl",
        messagePadding: "p-3",
        headerStyle: "bg-[#7F45E3] text-white",
        inputStyle: "bg-white border rounded-full shadow-sm",
      },
    },
    tawkto: {
      id: "tawkto",
      name: "Tawk.to",
      primaryColor: "#13C175",
      secondaryColor: "#E7FBF2",
      logo: <MessageSquare className="h-5 w-5" />,
      agentAvatar: "https://randomuser.me/api/portraits/women/24.jpg",
      customerAvatar: "https://randomuser.me/api/portraits/men/42.jpg",
      agentName: "Lisa from Support",
      typing: {
        bubbleCount: 3,
        bubbleColor: "#13C175",
        bubbleSize: "w-2 h-2",
      },
      layout: {
        borderRadius: "rounded-md",
        messagePadding: "p-3",
        headerStyle: "bg-[#13C175] text-white",
        inputStyle: "bg-white border rounded-md",
      },
    },
  };

  // Trigger types for testimonial requests
  const chatTriggers: ChatTrigger[] = [
    {
      id: "sentiment",
      name: "Positive Sentiment",
      description:
        "Triggered when a customer expresses satisfaction or happiness",
      icon: <ThumbsUp className="h-4 w-4" />,
    },
    {
      id: "purchase",
      name: "Purchase Completed",
      description: "Triggered after a customer completes a purchase via chat",
      icon: <ShoppingCart className="h-4 w-4" />,
    },
    {
      id: "chat_end",
      name: "Chat Ending",
      description: "Triggered when a chat conversation is about to end",
      icon: <CheckCircle className="h-4 w-4" />,
    },
    {
      id: "support_resolved",
      name: "Support Issue Resolved",
      description:
        "Triggered after a support issue has been successfully resolved",
      icon: <HeartHandshake className="h-4 w-4" />,
    },
    {
      id: "duration",
      name: "Long Engagement",
      description: "Triggered after a lengthy and engaging conversation",
      icon: <Clock className="h-4 w-4" />,
    },
  ];

  // Conversation scenarios for different triggers
  const conversationScenarios: ConversationScenario[] = [
    // Positive Sentiment Scenario
    {
      id: "sentiment",
      name: "Positive Sentiment",
      description: "Customer expresses satisfaction with the product",
      triggerType: "sentiment",
      icon: <ThumbsUp className="h-4 w-4" />,
      messages: [
        {
          id: "s1-1",
          sender: "agent",
          content: `Hi ${customerName}! Welcome to ${companyName} support. How can I help you today?`,
          timestamp: new Date(),
        },
        {
          id: "s1-2",
          sender: "customer",
          content:
            "Hi there! I just wanted to let you know how much I'm loving your new feature. It's made my workflow so much faster!",
          timestamp: new Date(),
        },
        {
          id: "s1-3",
          sender: "agent",
          content:
            "That's wonderful to hear! I'm so glad you're enjoying the new feature. Our team worked really hard on it.",
          timestamp: new Date(),
        },
        {
          id: "s1-4",
          sender: "customer",
          content:
            "Yeah, it's been a game-changer for me. I used to spend hours on this task, and now it takes minutes. Really impressive work!",
          timestamp: new Date(),
        },
        {
          id: "s1-5",
          sender: "agent",
          content:
            "Thank you for the kind words! We love hearing this kind of feedback. It makes all the hard work worthwhile.",
          timestamp: new Date(),
          triggerType: "sentiment",
        },
        {
          id: "s1-6",
          sender: "agent",
          content:
            "Since you're enjoying our product, would you be willing to share your experience as a testimonial? It would help other potential customers see the value of our solution.",
          timestamp: new Date(),
          isTestimonialRequest: true,
        },
      ],
    },
    // Purchase Completed Scenario
    {
      id: "purchase",
      name: "Purchase Completed",
      description: "Customer completes a purchase through chat",
      triggerType: "purchase",
      icon: <ShoppingCart className="h-4 w-4" />,
      messages: [
        {
          id: "p1-1",
          sender: "agent",
          content: `Hi ${customerName}! Welcome to ${companyName}. How can I assist you today?`,
          timestamp: new Date(),
        },
        {
          id: "p1-2",
          sender: "customer",
          content:
            "Hi! I'm interested in your Premium plan, but I have a few questions before I make the purchase.",
          timestamp: new Date(),
        },
        {
          id: "p1-3",
          sender: "agent",
          content:
            "Of course! I'd be happy to answer any questions you have about our Premium plan. What would you like to know?",
          timestamp: new Date(),
        },
        {
          id: "p1-4",
          sender: "customer",
          content:
            "Does it include the advanced reporting features? And can I add team members later if needed?",
          timestamp: new Date(),
        },
        {
          id: "p1-5",
          sender: "agent",
          content:
            "Yes, the Premium plan includes all our advanced reporting features, including custom dashboards and automated reports. And you can absolutely add team members anytime – each additional seat is just $10/month.",
          timestamp: new Date(),
        },
        {
          id: "p1-6",
          sender: "customer",
          content:
            "That sounds perfect! I think I'm ready to subscribe to the Premium plan now.",
          timestamp: new Date(),
        },
        {
          id: "p1-7",
          sender: "agent",
          content:
            "Great choice! I can help you complete that purchase right now. Would you like to proceed with the annual plan at $499/year (saving you 20%) or the monthly plan at $49/month?",
          timestamp: new Date(),
        },
        {
          id: "p1-8",
          sender: "customer",
          content: "Let's go with the annual plan to get the discount.",
          timestamp: new Date(),
        },
        {
          id: "p1-9",
          sender: "system",
          content: "Payment process completed",
          timestamp: new Date(),
        },
        {
          id: "p1-10",
          sender: "agent",
          content:
            "Excellent! I've just processed your purchase for the Premium annual plan. You should receive a confirmation email shortly with all the details.",
          timestamp: new Date(),
          productInfo: {
            name: "Premium Annual Plan",
            price: "$499/year",
          },
        },
        {
          id: "p1-11",
          sender: "agent",
          content:
            "Your account has been upgraded to Premium, and all features are now active! 🎉",
          timestamp: new Date(),
          triggerType: "purchase",
        },
        {
          id: "p1-12",
          sender: "customer",
          content: "Awesome, thank you for your help!",
          timestamp: new Date(),
        },
        {
          id: "p1-13",
          sender: "agent",
          content:
            "You're very welcome! Now that you've experienced our purchase process, would you mind sharing your thoughts in a quick testimonial? It helps us improve and gives potential customers a real user's perspective.",
          timestamp: new Date(),
          isTestimonialRequest: true,
        },
      ],
    },
    // Chat Ending Scenario
    {
      id: "chat_end",
      name: "Chat Ending",
      description: "Testimonial request as chat conversation concludes",
      triggerType: "chat_end",
      icon: <CheckCircle className="h-4 w-4" />,
      messages: [
        {
          id: "e1-1",
          sender: "agent",
          content: `Hi ${customerName}! Thanks for contacting ${companyName} support. How can I help you today?`,
          timestamp: new Date(),
        },
        {
          id: "e1-2",
          sender: "customer",
          content:
            "Hello! I'm having trouble connecting my account to the mobile app. It keeps giving me an authentication error.",
          timestamp: new Date(),
        },
        {
          id: "e1-3",
          sender: "agent",
          content:
            "I'm sorry to hear that you're experiencing this issue. Let's get it resolved for you. Could you tell me what version of the app you're using?",
          timestamp: new Date(),
        },
        {
          id: "e1-4",
          sender: "customer",
          content:
            "I'm using the latest version, 3.4.2. I've tried reinstalling it but still get the same error.",
          timestamp: new Date(),
        },
        {
          id: "e1-5",
          sender: "agent",
          content:
            "Thank you for that information. Let's try a few troubleshooting steps. First, could you try clearing the app cache, and then try signing out of all devices from your account settings page on our website?",
          timestamp: new Date(),
        },
        {
          id: "e1-6",
          sender: "customer",
          content: "Give me a moment to try that...",
          timestamp: new Date(),
        },
        {
          id: "e1-7",
          sender: "customer",
          content:
            "It worked! I can log in to the app now. Thank you so much for your help!",
          timestamp: new Date(),
        },
        {
          id: "e1-8",
          sender: "agent",
          content:
            "That's excellent news! I'm glad we were able to resolve your issue. Is there anything else I can assist you with today?",
          timestamp: new Date(),
        },
        {
          id: "e1-9",
          sender: "customer",
          content: "No, that's all I needed. Thanks again for your quick help!",
          timestamp: new Date(),
        },
        {
          id: "e1-10",
          sender: "agent",
          content:
            "You're very welcome! Before we wrap up, would you be willing to share your experience in a quick testimonial? Your feedback would be invaluable to us and help other customers.",
          timestamp: new Date(),
          isTestimonialRequest: true,
          triggerType: "chat_end",
        },
      ],
    },
    // Support Issue Resolved Scenario
    {
      id: "support_resolved",
      name: "Support Issue Resolved",
      description: "Customer's complex support issue is resolved successfully",
      triggerType: "support_resolved",
      icon: <HeartHandshake className="h-4 w-4" />,
      messages: [
        {
          id: "sr1-1",
          sender: "agent",
          content: `Hi ${customerName}! Welcome back to ${companyName} support. I see you've been working with us on your integration issue. How are things going?`,
          timestamp: new Date(),
        },
        {
          id: "sr1-2",
          sender: "customer",
          content:
            "Hi! Yes, I've been trying the solutions we discussed yesterday, but I'm still experiencing some problems with the API connection.",
          timestamp: new Date(),
        },
        {
          id: "sr1-3",
          sender: "agent",
          content:
            "I understand how frustrating this must be. Let's dig deeper into this issue. Could you share the specific error message you're seeing?",
          timestamp: new Date(),
        },
        {
          id: "sr1-4",
          sender: "customer",
          content:
            "I'm getting 'Error 403: Unauthorized access' when trying to connect using the API key you provided.",
          timestamp: new Date(),
        },
        {
          id: "sr1-5",
          sender: "agent",
          content:
            "Thank you for that information. Let me check your account permissions... I see the issue now. It appears there was a misconfiguration in your account's API access level. I'll fix that right away.",
          timestamp: new Date(),
        },
        {
          id: "sr1-6",
          sender: "agent",
          content:
            "I've updated your permissions and generated a new API key. Could you try using this new key: ACM-API-29X8ZY73Q? This should resolve the authorization issue.",
          timestamp: new Date(),
        },
        {
          id: "sr1-7",
          sender: "customer",
          content: "Let me try that...",
          timestamp: new Date(),
        },
        {
          id: "sr1-8",
          sender: "customer",
          content:
            "Perfect! It's working now! All our systems are connecting properly. Thank you so much for your patience and expertise in solving this!",
          timestamp: new Date(),
        },
        {
          id: "sr1-9",
          sender: "agent",
          content:
            "That's great news! I'm really happy we could get this resolved for you. This was a complex issue, and I appreciate your patience throughout the troubleshooting process.",
          timestamp: new Date(),
          triggerType: "support_resolved",
        },
        {
          id: "sr1-10",
          sender: "agent",
          content:
            "Since we've successfully resolved this complex integration issue, would you consider sharing your experience as a testimonial? Your feedback on how we handled this technical challenge would be incredibly valuable for other businesses facing similar issues.",
          timestamp: new Date(),
          isTestimonialRequest: true,
        },
      ],
    },
    // Long Engagement Scenario
    {
      id: "duration",
      name: "Long Engagement",
      description: "Extended conversation with valuable engagement",
      triggerType: "duration",
      icon: <Clock className="h-4 w-4" />,
      messages: [
        {
          id: "le1-1",
          sender: "agent",
          content: `Welcome back, ${customerName}! It's great to see you again. How has your experience been with our platform since our last conversation?`,
          timestamp: new Date(),
        },
        {
          id: "le1-2",
          sender: "customer",
          content:
            "It's been quite good! I've been exploring all the features we discussed last time, and I'm starting to see how powerful the analytics dashboard really is.",
          timestamp: new Date(),
        },
        {
          id: "le1-3",
          sender: "agent",
          content:
            "That's fantastic! I'm glad you're discovering the full potential of our analytics tools. Have you had a chance to set up any custom reports yet?",
          timestamp: new Date(),
        },
        {
          id: "le1-4",
          sender: "customer",
          content:
            "Yes, I've created a few for our marketing team. They're loving the insights! Quick question though - is there a way to schedule automated exports of these reports?",
          timestamp: new Date(),
        },
        {
          id: "le1-5",
          sender: "agent",
          content:
            "Absolutely! Let me walk you through setting up scheduled exports. Go to the report you want to automate, click the three dots in the upper right corner, and select 'Schedule'. From there, you can set the frequency and delivery method.",
          timestamp: new Date(),
        },
        {
          id: "le1-6",
          sender: "customer",
          content:
            "Perfect! Finding it now... Oh, I see it. This is going to save us so much time. Thanks!",
          timestamp: new Date(),
        },
        {
          id: "le1-7",
          sender: "agent",
          content:
            "Happy to help! While you're in the analytics section, have you discovered the funnel visualization tool? It's relatively new but extremely powerful for conversion analysis.",
          timestamp: new Date(),
        },
        {
          id: "le1-8",
          sender: "customer",
          content: "I haven't tried that yet! Where can I find it?",
          timestamp: new Date(),
        },
        {
          id: "le1-9",
          sender: "agent",
          content:
            "It's under 'Advanced Analytics' > 'Conversion Tools' > 'Funnel Builder'. You can drag and drop different user actions to create custom funnels and see where users might be dropping off.",
          timestamp: new Date(),
        },
        {
          id: "le1-10",
          sender: "system",
          content: "Conversation duration: 25 minutes",
          timestamp: new Date(),
        },
        {
          id: "le1-11",
          sender: "agent",
          content:
            "I've noticed we've been having a productive conversation for quite a while now. I appreciate your engagement with our platform and all your great questions!",
          timestamp: new Date(),
          triggerType: "duration",
        },
        {
          id: "le1-12",
          sender: "agent",
          content:
            "Since you've been using our platform extensively and we've had such a detailed conversation today, would you be interested in sharing your experience as a testimonial? Your insights as a power user would be incredibly valuable.",
          timestamp: new Date(),
          isTestimonialRequest: true,
        },
      ],
    },
  ];

  // Get active platform configuration
  const getActivePlatform = (): ChatPlatformConfig => {
    return chatPlatforms[activePlatform];
  };

  // Reset conversation
  const resetConversation = () => {
    // Stop any running timers
    if (autoplayTimerRef.current) {
      clearTimeout(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }

    // Reset state
    setCurrentStep(0);
    setTestimonialRating(0);
    setShowTestimonialFormats(false);
    setTypingIndicator(false);
    setSelectedFormat(null);
    setConversationComplete(false);

    // Initialize conversation based on active scenario
    const scenario = conversationScenarios.find((s) => s.id === activeScenario);
    if (scenario) {
      setMessages([scenario.messages[0]]);
    }
  };

  // Change active scenario
  const changeScenario = (scenarioId: string) => {
    setActiveScenario(scenarioId);
    setActiveTrigger(scenarioId);
    const scenario = conversationScenarios.find((s) => s.id === scenarioId);
    if (scenario) {
      setMessages([scenario.messages[0]]);
      setCurrentStep(0);
      setTestimonialRating(0);
      setShowTestimonialFormats(false);
      setTypingIndicator(false);
      setSelectedFormat(null);
      setConversationComplete(false);
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop =
            messagesContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [messages, showTestimonialFormats, typingIndicator]);

  // Initialize conversation when dialog opens or scenario changes
  useEffect(() => {
    if (open) {
      resetConversation();
    }
  }, [open, activeScenario]);

  // Advance conversation when autoplay is enabled
  useEffect(() => {
    if (!open || !autoplayEnabled || isPaused || conversationComplete) return;

    const currentScenario = conversationScenarios.find(
      (s) => s.id === activeScenario
    );
    if (!currentScenario) return;

    if (currentStep < currentScenario.messages.length) {
      const advance = () => {
        // Show typing indicator first
        setTypingIndicator(true);

        // After a short delay, add the next message
        setTimeout(() => {
          setTypingIndicator(false);

          // Add the next message
          const nextMessage = currentScenario.messages[currentStep];
          setMessages((prev) => [...prev, nextMessage]);

          // If this is a testimonial request, stop auto-advance
          if (nextMessage.isTestimonialRequest) {
            // After a brief pause, show the rating UI
            setTimeout(() => {
              if (!conversationComplete) {
                setShowTestimonialFormats(false);
              }
            }, 1000);
          } else {
            // Continue to next step
            setCurrentStep((prev) => prev + 1);
          }
        }, 1500);
      };

      // Set delay based on message length (longer messages take longer to type)
      const prevMessage =
        currentStep > 0 ? currentScenario.messages[currentStep - 1] : null;
      const typingDelay = prevMessage
        ? Math.min(prevMessage.content.length * 30, 2000)
        : 1000;

      autoplayTimerRef.current = setTimeout(advance, typingDelay);

      return () => {
        if (autoplayTimerRef.current) {
          clearTimeout(autoplayTimerRef.current);
        }
      };
    }
  }, [
    currentStep,
    autoplayEnabled,
    isPaused,
    open,
    activeScenario,
    conversationComplete,
  ]);

  // Handle testimonial rating submission
  const handleRatingSubmit = (rating: number) => {
    setTestimonialRating(rating);

    // Add rating message
    const ratingMessage: ChatMessage = {
      id: `rating-${Math.random().toString(36).slice(2, 9)}`,
      sender: "customer",
      content: `[Rating: ${rating}/5 stars]`,
      timestamp: new Date(),
      isTestimonialResponse: true,
      testimonialRating: rating,
    };

    setMessages((prev) => [...prev, ratingMessage]);

    // If rating is good (4-5), show format selection
    if (rating >= 4 && settings.formats.some((f) => f.enabled)) {
      setTimeout(() => {
        setShowTestimonialFormats(true);
      }, 500);
    } else {
      // For lower ratings, add a thank you message
      setTimeout(() => {
        const thankYouMessage: ChatMessage = {
          id: `thanks-${Math.random().toString(36).slice(2, 9)}`,
          sender: "agent",
          content:
            "Thank you for your feedback! We appreciate your honesty and will use it to improve our service.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, thankYouMessage]);
        setConversationComplete(true);
      }, 1000);
    }
  };

  // Handle testimonial format selection
  const handleFormatSelect = (format: TestimonialFormatType) => {
    setSelectedFormat(format);
    setShowTestimonialFormats(false);

    // Add format selection message
    const formatMessage: ChatMessage = {
      id: `format-${Math.random().toString(36).slice(2, 9)}`,
      sender: "customer",
      content: `I'll provide a ${format} testimonial.`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, formatMessage]);

    // Add thank you message
    setTimeout(() => {
      const thankYouMessage: ChatMessage = {
        id: `thanks-${Math.random().toString(36).slice(2, 9)}`,
        sender: "agent",
        content: `Thank you so much! I've sent you a ${format} testimonial form. Your feedback is incredibly valuable to us!`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, thankYouMessage]);
      setConversationComplete(true);
    }, 1000);
  };

  // Toggle autoplay pause/resume
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // Manually advance to next message
  const advanceMessage = () => {
    const currentScenario = conversationScenarios.find(
      (s) => s.id === activeScenario
    );
    if (!currentScenario || currentStep >= currentScenario.messages.length)
      return;

    // Show typing indicator
    setTypingIndicator(true);

    // After a delay, show the message
    setTimeout(() => {
      setTypingIndicator(false);

      // Add the next message
      const nextMessage = currentScenario.messages[currentStep];
      setMessages((prev) => [...prev, nextMessage]);

      // Increment step
      setCurrentStep((prev) => prev + 1);
    }, 500);
  };

  // Go back to previous message
  const goToPreviousMessage = () => {
    if (messages.length <= 1) return;

    // Remove the last message
    setMessages((prev) => prev.slice(0, prev.length - 1));

    // Decrement step
    setCurrentStep((prev) => Math.max(prev - 1, 0));

    // Reset certain states if needed
    setShowTestimonialFormats(false);
    setSelectedFormat(null);
    setConversationComplete(false);
  };

  // Handle sending a custom message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Add customer message
    const customerMessage: ChatMessage = {
      id: `custom-${Math.random().toString(36).slice(2, 9)}`,
      sender: "customer",
      content: newMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, customerMessage]);
    setNewMessage("");

    // Show typing indicator
    setTypingIndicator(true);

    // After a delay, show a generic response
    setTimeout(() => {
      setTypingIndicator(false);

      const responseMessage: ChatMessage = {
        id: `response-${Math.random().toString(36).slice(2, 9)}`,
        sender: "agent",
        content: "Thanks for your message! How else can I help you today?",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, responseMessage]);
    }, 1500);
  };

  // Render chat message
  const renderMessage = (message: ChatMessage, index: number) => {
    const platform = getActivePlatform();
    const isAgent = message.sender === "agent";
    const isSystem = message.sender === "system";
    const showTimestamp =
      index === 0 ||
      messages[index - 1]?.sender !== message.sender ||
      message.timestamp.getTime() -
        (messages[index - 1]?.timestamp.getTime() || 0) >
        60000;

    if (isSystem) {
      return (
        <motion.div
          key={message.id}
          variants={messageVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="flex justify-center my-2"
        >
          <div className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-500">
            {message.content}
          </div>
        </motion.div>
      );
    }

    // Product purchase info display (for purchase trigger)
    const hasProductInfo =
      message.productInfo && message.triggerType === "purchase";

    // Get appropriate icon for trigger type
    const getTriggerIcon = () => {
      if (!message.triggerType) return null;

      const trigger = chatTriggers.find((t) => t.id === message.triggerType);
      if (!trigger) return null;

      return (
        <div
          className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 p-1 rounded-full z-10"
          style={{ backgroundColor: platform.primaryColor }}
        >
          <div className="text-white">{trigger.icon}</div>
        </div>
      );
    };

    return (
      <motion.div
        key={message.id}
        variants={messageVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={cn("mb-3", isAgent ? "pr-12" : "pl-12")}
      >
        <div
          className={cn(
            "flex items-start gap-2 relative",
            isAgent ? "justify-start" : "justify-end"
          )}
        >
          {isAgent && (
            <div className="relative flex-shrink-0">
              <div
                className="w-8 h-8 rounded-full overflow-hidden border-2"
                style={{ borderColor: platform.primaryColor }}
              >
                <img
                  src={platform.agentAvatar}
                  alt="Agent"
                  className="w-full h-full object-cover"
                />
              </div>
              {message.triggerType && getTriggerIcon()}
            </div>
          )}

          <div
            className={cn(
              "max-w-[80%]",
              platform.layout.messagePadding,
              platform.layout.borderRadius,
              isAgent ? "bg-white border border-gray-200" : "text-white"
            )}
            style={isAgent ? {} : { backgroundColor: platform.primaryColor }}
          >
            {showTimestamp && (
              <div
                className={cn(
                  "text-xs mb-1",
                  isAgent ? "text-gray-500" : "text-white/70"
                )}
              >
                {isAgent ? `${platform.agentName}` : customerName} •{" "}
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            )}

            <div
              className={cn(
                "text-sm whitespace-pre-line",
                isAgent ? "text-gray-800" : "text-white"
              )}
            >
              {message.content}
            </div>

            {/* Product purchase info */}
            {hasProductInfo && (
              <div
                className={cn(
                  "mt-3 p-3 rounded",
                  isAgent
                    ? "bg-green-50 border border-green-100"
                    : "bg-white/10"
                )}
              >
                <div
                  className={cn(
                    "font-medium",
                    isAgent ? "text-green-700" : "text-white"
                  )}
                >
                  Purchase Completed ✓
                </div>
                <div
                  className={cn(
                    "text-sm mt-1",
                    isAgent ? "text-green-600" : "text-white/90"
                  )}
                >
                  {message?.productInfo?.name} - {message.productInfo?.price}
                </div>
              </div>
            )}

            {/* Testimonial request UI */}
            {message.isTestimonialRequest && (
              <div
                className={cn(
                  "mt-3 pt-3 border-t",
                  isAgent ? "border-gray-100" : "border-white/10"
                )}
              >
                <div
                  className={cn(
                    "text-sm font-medium",
                    isAgent ? "text-gray-700" : "text-white"
                  )}
                >
                  Would you rate your experience?
                </div>
                <div className="flex items-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      className="focus:outline-none transition-transform hover:scale-110"
                      onClick={() => handleRatingSubmit(rating)}
                    >
                      <Star
                        className={cn(
                          "h-6 w-6",
                          testimonialRating >= rating
                            ? "text-yellow-400 fill-yellow-400"
                            : isAgent
                              ? "text-gray-300"
                              : "text-white/40"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Testimonial response (rating) */}
            {message.isTestimonialResponse && message.testimonialRating && (
              <div className="flex items-center gap-1 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-3 w-3"
                    fill={
                      i < (message.testimonialRating || 0) ? "#FBBF24" : "none"
                    }
                    stroke={
                      i < (message.testimonialRating || 0)
                        ? "#FBBF24"
                        : "currentColor"
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {!isAgent && (
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
              <img
                src={platform.customerAvatar}
                alt="Customer"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // Render typing indicator
  const renderTypingIndicator = () => {
    if (!typingIndicator) return null;

    const platform = getActivePlatform();

    return (
      <motion.div
        variants={typingVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="flex items-start gap-2 mb-4"
      >
        <div
          className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border-2"
          style={{ borderColor: platform.primaryColor }}
        >
          <img
            src={platform.agentAvatar}
            alt="Agent"
            className="w-full h-full object-cover"
          />
        </div>

        <div
          className={cn(
            "py-3 px-4 bg-white border border-gray-200",
            platform.layout.borderRadius
          )}
        >
          <div className="flex items-center gap-1">
            {[...Array(platform.typing.bubbleCount)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  opacity: [0.4, 1, 0.4],
                  y: [0, -3, 0],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                className={cn("rounded-full", platform.typing.bubbleSize)}
                style={{ backgroundColor: platform.typing.bubbleColor }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    );
  };

  // Render format options
  const renderFormatOptions = () => {
    if (!showTestimonialFormats) return null;

    const enabledFormats = settings.formats.filter((f) => f.enabled);
    const platform = getActivePlatform();

    const formatIcons = {
      text: <FileText className="h-5 w-5" />,
      video: <Video className="h-5 w-5" />,
      audio: <Mic className="h-5 w-5" />,
      image: <ImageIcon className="h-5 w-5" />,
    };

    return (
      <motion.div
        variants={messageVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={cn(
          "p-4 bg-white border border-gray-200 mb-3 mr-12",
          platform.layout.borderRadius
        )}
      >
        <div className="flex items-center gap-2 mb-3">
          <div
            className="p-1 rounded"
            style={{ backgroundColor: `${platform.primaryColor}20` }}
          >
            <Sparkles
              className="h-4 w-4"
              style={{ color: platform.primaryColor }}
            />
          </div>
          <div className="text-sm font-medium">
            How would you like to share your testimonial?
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {enabledFormats.map((format) => (
            <button
              key={format.type}
              className={cn(
                "flex items-center justify-center gap-2 py-3 px-4 border rounded-lg hover:bg-gray-50 transition-colors",
                platform.layout.borderRadius
              )}
              onClick={() => handleFormatSelect(format.type)}
            >
              <div
                className="p-1 rounded"
                style={{ color: platform.primaryColor }}
              >
                {formatIcons[format.type as keyof typeof formatIcons]}
              </div>
              <span className="text-sm font-medium capitalize">
                {format.type}
              </span>
            </button>
          ))}
        </div>
      </motion.div>
    );
  };

  // Progress percentage for conversation
  const getProgressPercentage = () => {
    const scenario = conversationScenarios.find((s) => s.id === activeScenario);
    if (!scenario) return 0;

    if (conversationComplete) return 100;

    return Math.min(
      Math.floor((currentStep / scenario.messages.length) * 100),
      100
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 h-[650px] max-h-[90vh] flex flex-col">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl flex items-center gap-2">
              <div
                className="p-1 rounded"
                style={{
                  backgroundColor: `${getActivePlatform().primaryColor}20`,
                  color: getActivePlatform().primaryColor,
                }}
              >
                {getActivePlatform().logo}
              </div>
              <span>Chat Testimonial Request Preview</span>
            </DialogTitle>

            <div className="flex items-center gap-4">
              {/* Platform selector */}
              <Select
                value={activePlatform}
                onValueChange={(value) =>
                  setActivePlatform(value as ChatPlatformId)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(chatPlatforms).map((platform) => (
                    <SelectItem key={platform.id} value={platform.id}>
                      <div className="flex items-center gap-2">
                        <div style={{ color: platform.primaryColor }}>
                          {platform.logo}
                        </div>
                        <span>{platform.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Device type selector */}
              <div className="border rounded-lg flex overflow-hidden">
                <Button
                  variant={deviceType === "desktop" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none h-8 px-3"
                  onClick={() => setDeviceType("desktop")}
                >
                  <Laptop className="h-4 w-4" />
                </Button>
                <Button
                  variant={deviceType === "tablet" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none h-8 px-3"
                  onClick={() => setDeviceType("tablet")}
                >
                  <Tablet className="h-4 w-4" />
                </Button>
                <Button
                  variant={deviceType === "mobile" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none h-8 px-3"
                  onClick={() => setDeviceType("mobile")}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>

              {/* Settings button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setShowSettings(!showSettings)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Configure preview</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex">
          {/* Sidebar for scenarios */}
          <div className="w-64 border-r bg-slate-50 flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-medium mb-2">Trigger Scenarios</h3>
              <p className="text-xs text-slate-500">
                Select a scenario to preview how testimonials are requested in
                different contexts.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {chatTriggers.map((trigger) => (
                <button
                  key={trigger.id}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg mb-1 text-sm transition-colors",
                    activeTrigger === trigger.id
                      ? "bg-primary text-white"
                      : "hover:bg-slate-100"
                  )}
                  onClick={() => changeScenario(trigger.id)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={
                        activeTrigger === trigger.id
                          ? "text-white"
                          : "text-primary"
                      }
                    >
                      {trigger.icon}
                    </div>
                    <div>
                      <div className="font-medium">{trigger.name}</div>
                      <div
                        className={cn(
                          "text-xs mt-0.5",
                          activeTrigger === trigger.id
                            ? "text-white/80"
                            : "text-slate-500"
                        )}
                      >
                        {trigger.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Progress</div>
                <div className="text-xs text-slate-500">
                  {getProgressPercentage()}%
                </div>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${getProgressPercentage()}%`,
                    backgroundColor: getActivePlatform().primaryColor,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Main chat interface */}
          <div className="flex-1 flex flex-col relative">
            {/* Chat container */}
            <div
              className={cn(
                "flex-1 flex flex-col transition-all overflow-hidden",
                deviceType === "mobile"
                  ? "max-w-sm mx-auto"
                  : deviceType === "tablet"
                    ? "max-w-md mx-auto"
                    : "w-full"
              )}
            >
              {/* Chat Header */}
              <div
                className={cn(
                  "flex items-center justify-between p-3 px-4 shadow-sm",
                  getActivePlatform().layout.headerStyle
                )}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border-2"
                    style={
                      getActivePlatform().layout.headerStyle.includes(
                        "bg-white"
                      )
                        ? { borderColor: getActivePlatform().primaryColor }
                        : { borderColor: "white" }
                    }
                  >
                    <img
                      src={getActivePlatform().agentAvatar}
                      alt="Agent"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div
                      className={cn(
                        "font-medium text-sm",
                        getActivePlatform().layout.headerStyle.includes(
                          "text-white"
                        )
                          ? "text-white"
                          : "text-gray-800"
                      )}
                    >
                      {getActivePlatform().agentName}
                    </div>
                    <div
                      className={cn(
                        "text-xs flex items-center gap-1",
                        getActivePlatform().layout.headerStyle.includes(
                          "text-white"
                        )
                          ? "text-white/70"
                          : "text-gray-500"
                      )}
                    >
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                      <span>Online</span>
                    </div>
                  </div>
                </div>

                <div
                  className={cn(
                    "flex items-center gap-1",
                    getActivePlatform().layout.headerStyle.includes(
                      "text-white"
                    )
                      ? "text-white/70"
                      : "text-gray-400"
                  )}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 rounded-full",
                      getActivePlatform().layout.headerStyle.includes(
                        "text-white"
                      )
                        ? "hover:bg-white/10"
                        : "hover:bg-gray-100"
                    )}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                  {deviceType === "desktop" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-8 w-8 rounded-full",
                        getActivePlatform().layout.headerStyle.includes(
                          "text-white"
                        )
                          ? "hover:bg-white/10"
                          : "hover:bg-gray-100"
                      )}
                    >
                      <PanelLeftClose className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Chat Messages with ref */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 bg-gray-50"
              >
                <AnimatePresence>
                  {messages.map((message, index) =>
                    renderMessage(message, index)
                  )}
                  {renderTypingIndicator()}
                  {renderFormatOptions()}
                </AnimatePresence>
              </div>

              {/* Chat Input */}
              <div className="p-3 border-t bg-white">
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-2"
                >
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className={cn(
                      "flex-1",
                      getActivePlatform().layout.inputStyle
                    )}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!newMessage.trim()}
                    style={{
                      backgroundColor: getActivePlatform().primaryColor,
                    }}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Switch
                id="autoplay"
                checked={autoplayEnabled}
                onCheckedChange={setAutoplayEnabled}
              />
              <Label htmlFor="autoplay" className="text-sm cursor-pointer">
                Autoplay
              </Label>
            </div>

            {autoplayEnabled && (
              <Button
                variant="outline"
                size="sm"
                onClick={togglePause}
                className="gap-1.5"
              >
                {isPaused ? (
                  <>
                    <PlayCircle className="h-4 w-4" />
                    <span>Resume</span>
                  </>
                ) : (
                  <>
                    <PauseCircle className="h-4 w-4" />
                    <span>Pause</span>
                  </>
                )}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={resetConversation}
              className="gap-1.5"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reset</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMessage}
              disabled={currentStep === 0 || messages.length <= 1}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={advanceMessage}
              disabled={
                !conversationScenarios.find((s) => s.id === activeScenario) ||
                currentStep >=
                  conversationScenarios.find((s) => s.id === activeScenario)!
                    .messages.length ||
                conversationComplete
              }
              className="gap-1"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChatPreviewDialog;
