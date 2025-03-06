export interface SubFeature {
  title: string;
  description: string;
  icon: React.ReactNode;
  benefits: string[];
}

export interface Feature {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  bgGradient: string;
  accentColor: string;
  accentText: string;
  borderColor: string;
  chartColor: string;
  // For features without sub-features, use benefits
  benefits?: string[];
  // For features with nested content, use subFeatures
  subFeatures?: SubFeature[];
}
