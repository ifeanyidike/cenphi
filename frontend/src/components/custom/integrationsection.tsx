import React from 'react';
import { Card } from '@/components/ui/card';
import { Upload, Workflow, Code } from 'lucide-react';

const IntegrationSection = () => {
  const features = [
    {
      title: "Import from 30+ Platforms",
      description: "Easily import testimonials from leading platforms to get started faster.",
      icon: <Upload className="w-6 h-6 text-[#31E981]" />
    },
    {
      title: "Zapier Integration",
      description: "Connect with your favorite tools and automate testimonial collection seamlessly.",
      icon: <Workflow className="w-6 h-6 text-[#31E981]" />
    },
    {
      title: "API & Webhooks",
      description: "Get access to powerful API and webhook capabilities for custom integrations.",
      icon: <Code className="w-6 h-6 text-[#31E981]" />
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-2 text-[#0C0C0C]">
          "The best part is that it{' '}
          <span className="text-[#31E981]">integrates seamlessly</span>"
        </h2>
        <div className="mt-4 flex justify-center">
          <div className="w-12 h-12 bg-[#6B818C] rounded-full" />
        </div>
        <p className="text-[#6B818C] mt-2">Integration Specialist</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="relative">
          <div className="grid grid-cols-3 gap-4 p-8 bg-[#6B818C] bg-opacity-10 rounded-xl">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-white shadow-sm flex items-center justify-center">
                <div className="w-8 h-8 bg-[#6B818C] bg-opacity-20 rounded" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <p className="text-lg text-[#6B818C]">
            It's never been easier to connect your favorite tools to simplify testimonial collection & showcase your success everywhere.
          </p>
          
          <div className="space-y-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="mt-1">{feature.icon}</div>
                <div>
                  <h3 className="font-semibold text-[#0C0C0C] mb-1">{feature.title}</h3>
                  <p className="text-[#6B818C]">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationSection;