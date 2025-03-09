export type Testimonial = {
  id: number;
  text: string;
  author: string;
  role: string;
  company: string;
  category: string;
  rating: number;
  metrics: {
    conversionLift: string;
    testimonialEngagement: string;
    brandTrust: string;
    roi: string;
    customerSatisfaction: string;
    referralRate: string;
  };
  keywords: string[];
  image: string;
  verification: {
    verified: boolean;
    platform: string;
    date: string;
  };
};
