import {
  Award,
  Globe,
  MessageSquare,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  BenefitItem,
  CompanySizeOption,
  IndustryOption,
  ProgressStep,
} from "./types";

// Progress steps data
export const stepSetup = (currentStep: number): ProgressStep[] => [
  {
    name: "Company",
    status:
      currentStep === 1 ? "current" : currentStep > 1 ? "complete" : "upcoming",
  },
  {
    name: "Website",
    status:
      currentStep === 2 ? "current" : currentStep > 2 ? "complete" : "upcoming",
  },
  {
    name: "Industry",
    status:
      currentStep === 3 ? "current" : currentStep > 3 ? "complete" : "upcoming",
  },
  //   {
  //     name: "Team",
  //     status:
  //       currentStep === 4 ? "current" : currentStep > 4 ? "complete" : "upcoming",
  //   },
];

// Industry options
export const industries: IndustryOption[] = [
  { value: "technology", label: "Technology & SaaS", icon: Sparkles },
  { value: "ecommerce", label: "E-Commerce & Retail", icon: Globe },
  { value: "services", label: "Professional Services", icon: TrendingUp },
  { value: "healthcare", label: "Healthcare & Wellness", icon: Users },
];

// Company size options
export const companySizes: CompanySizeOption[] = [
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "501+", label: "501+ employees" },
];

// Benefits data
export const benefits: BenefitItem[] = [
  {
    icon: <Star className="h-5 w-5" />,
    title: "AI-Powered Analytics",
    description:
      "Leverage machine learning to identify your most impactful testimonials",
    accentColor: "text-amber-500 bg-amber-500/10",
  },
  {
    icon: <MessageSquare className="h-5 w-5" />,
    title: "Smart Content Curation",
    description:
      "Automatically format and optimize your testimonials for any channel",
    accentColor: "text-blue-500 bg-blue-500/10",
  },
  {
    icon: <Award className="h-5 w-5" />,
    title: "Conversion Boosting",
    description:
      "Place testimonials strategically to increase conversion rates by up to 34%",
    accentColor: "text-purple-500 bg-purple-500/10",
  },
];
