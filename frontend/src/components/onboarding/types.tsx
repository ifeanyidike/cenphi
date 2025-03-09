import { LucideIcon } from "lucide-react";
import React from "react";

// Form state type
export interface OnboardingFormData {
  businessName: string;
  websiteUrl: string;
  industry: string;
  companySize: string;
}

// Form validation type
export interface FormErrors {
  businessName?: string;
  websiteUrl?: string;
  industry?: string;
  companySize?: string;
}

// Benefit item type
export interface BenefitItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  accentColor: string;
}

// Progress step type
export interface ProgressStep {
  name: string;
  status: "complete" | "current" | "upcoming";
}

// Industry option type
export interface IndustryOption {
  value: string;
  label: string;
  icon: LucideIcon;
}

// Company size option type
export interface CompanySizeOption {
  value: string;
  label: string;
}
