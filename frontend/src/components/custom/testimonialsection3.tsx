import React from 'react';
import { Card } from '@/components/ui/card';
import { Heart, Share2, Infinity } from 'lucide-react';
import { Quote } from 'lucide-react';

const FeatureCard = ({ icon, title, description }) => (
  <Card className="p-6 bg-white hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#C14953]/30">
    <div className="p-3 bg-[#C14953]/10 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3 text-[#2D2D2A]">{title}</h3>
    <p className="text-[#848FA5] leading-relaxed">{description}</p>
  </Card>
);

const TestimonialSharingSection = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <div className="space-y-6">
            <span className="text-[#C14953] font-medium">Testimonial Sharing</span>
            <h2 className="text-4xl font-bold text-[#2D2D2A] leading-tight">
              Share proof anywhere &{' '}
              <span className="block">boost conversions</span>
            </h2>
          </div>

          <div className="grid gap-6">
            <FeatureCard
              icon={<Heart className="w-6 h-6 text-[#C14953]" />}
              title="Walls of Love"
              description="Create gorgeous testimonial galleries with fully customizable layouts to show off on any page."
            />

            <FeatureCard
              icon={<Share2 className="w-6 h-6 text-[#C14953]" />}
              title="Widgets & Images"
              description="Easily drop testimonials into your emails, websites, or social media in just a few clicks."
            />

            <FeatureCard
              icon={<Infinity className="w-6 h-6 text-[#C14953]" />}
              title="Unlimited Embeds"
              description="Add testimonials to your landing pages, product pages, or anywhere you want — without a developer."
            />
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#2D2D2A] to-[#4C4C47] rounded-3xl transform rotate-2"></div>
          <Card className="relative bg-[#2D2D2A] text-[#E5DCC5] p-8 rounded-3xl">
            <div className="hidden lg:flex">
                            <Quote className="w-10 h-10 text-[#C14953] transform -scale-x-100" />
                          </div>
            <p className="text-2xl font-medium leading-relaxed mb-8">
              Hands down the best testimonial tool for SaaS. We sell x2 more just because every landing page has a stunning wall of love.
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#848FA5]/20"></div>
              <div>
                <p className="font-semibold">Denis Kulkov</p>
                <p className="text-sm text-[#E5DCC5]/70">Founder, TechFlow</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TestimonialSharingSection;