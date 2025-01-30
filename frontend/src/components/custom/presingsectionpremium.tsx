import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Zap, Globe, Video, Share2, Users, RefreshCw, Workflow, Code, Webhook } from 'lucide-react';

interface Tier {
  name: string;
  price: number;
  includedFeatures: string[];
  bestValue: boolean;
}

const PricingTier = ({ tier, isYearly }: { tier: Tier; isYearly: boolean }) => {
  const monthlyPrice = tier.price;
  const displayPrice = isYearly ? (monthlyPrice * 0.85).toFixed(2) : monthlyPrice;
  return (
    <Card className="bg-[#E5DCC5] p-8 rounded-2xl border border-[#4C4C47] hover:border-[#C14953] transition-all duration-300 shadow-md hover:shadow-xl">
      <div className="space-y-6 text-[#2D2D2A]">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold">{tier.name}</h3>
          {tier.bestValue && <span className="bg-[#C14953] text-white px-3 py-1 rounded-lg text-xs">Best Value</span>}
        </div>
        <div className="flex items-baseline">
          <span className="text-4xl font-bold">${displayPrice}</span>
          <span className="text-lg text-[#4C4C47]">/month</span>
        </div>
        <div className="space-y-4">
          {tier.includedFeatures.map((feature: string, index: number) => (
            <div key={index} className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#C14953]" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>
        <button className="w-full py-3 px-6 bg-[#C14953] text-white rounded-xl font-semibold hover:bg-[#848FA5] transition-all duration-300 transform hover:scale-105">
          Get started
        </button>
      </div>
    </Card>
  );
};

const PricingPremiumSection = () => {
  const [isYearly, setIsYearly] = useState(false);
  const tiers = [
    {
      name: "Starter",
      price: 29,
      includedFeatures: [
        "Unlimited testimonials",
        "3 Forms",
        "1 Project",
        "2 Seats",
        "Everything in free plus..."
      ],
      features: [
        {
          name: "Spin the Wheel",
          description: "Collect twice as many testimonials with our reward system",
          icon: <RefreshCw />
        },
        {
          name: "Custom Domains",
          description: "Use your own domain for forms and Walls of Love",
          icon: <Globe />
        },
        {
          name: "HD video exports",
          description: "Export your testimonial videos in high definition",
          icon: <Video />
        }
      ],
      bestValue: false
    },
    {
      name: "Pro",
      price: 59,
      includedFeatures: [
        "Unlimited testimonials",
        "Unlimited Forms",
        "5 Projects ($10/month per extra)",
        "5 Seats ($5/month per extra)",
        "Everything in Starter plus..."
      ],
      features: [
        {
          name: "Team access",
          description: "Let everyone on your team get to share your social proof with 5 seats included",
          icon: <Users />
        },
        {
          name: "API Integration",
          description: "Full testimonial collection and sharing on autopilot",
          icon: <Code />
        },
        {
          name: "Webhooks",
          description: "Send your testimonials to your own custom webhooks",
          icon: <Webhook />
        }
      ],
      bestValue: true
    }
  ];
  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 overflow-hidden">
<div className="py-20 px-4 bg-gradient-to-b from-[#2D2D2A] to-[#4C4C47] text-[#E5DCC5] rounded-2xl">
      <div className="text-center mb-16">
        <h2 className="text-5xl font-bold mb-5">Choose the perfect plan</h2>
        <p className="text-lg">Upgrade to unlock powerful features and grow faster.</p>
      </div>
      <div className="flex justify-center mb-12">
        <div className="bg-[#848FA5] p-2 rounded-full inline-flex items-center">
          <button className={`px-6 py-2 rounded-full transition-all ${!isYearly ? 'bg-white text-[#2D2D2A]' : 'text-white'}`} onClick={() => setIsYearly(false)}>Monthly</button>
          <button className={`px-6 py-2 rounded-full transition-all ${isYearly ? 'bg-white text-[#2D2D2A]' : 'text-white'}`} onClick={() => setIsYearly(true)}>Yearly</button>
          <div className="ml-3 bg-[#C14953] text-white text-sm px-3 py-1 rounded-full">Save 15%</div>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-10">
        {tiers.map((tier, index) => (
          <PricingTier key={index} tier={tier} isYearly={isYearly} />
        ))}
      </div>
    </div>
    </div>
    
  );
};

export default PricingPremiumSection;



 
      

  