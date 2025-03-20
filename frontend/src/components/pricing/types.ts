export type Feature = {
  name: string;
  included: boolean;
  highlight?: boolean;
};
export type Plan = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactElement;
  monthlyPrice?: number;
  yearlyPrice?: number;
  features: Feature[];
  cta: string;
  color: string;
  hoverColor: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  glowColor: string;
  iconBg: string;
  popular?: boolean;
  customPrice?: boolean;
  featured?: boolean;
};

export type PricingCardProps = {
  plan: Plan;
  activePlan: string;
  setActivePlan: (id: string) => void;
  annual: boolean;
  currentPlan: string | undefined;
};

export type PriceDisplayProps = {
  plan: Plan;
  annual: boolean;
};

export type CardFeaturesProps = {
  plan: Plan;
  activePlan: string;
  isActive: boolean;
};
