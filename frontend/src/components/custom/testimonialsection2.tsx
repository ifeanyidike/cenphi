import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, VideoIcon, BarChart2, Share2 } from 'lucide-react';

const StepCard = ({ number, icon, title, description }) => (
  <div className="flex-1 p-6 rounded-lg bg-[#6B818C] bg-opacity-10">
    <div className="flex items-center gap-4 mb-4">
      <div className="w-8 h-8 rounded-full bg-[#31E981] text-white flex items-center justify-center font-bold">
        {number}
      </div>
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-2 text-[#0C0C0C]">{title}</h3>
    <p className="text-[#6B818C]">{description}</p>
  </div>
);

const TestimonialSection = () => {
  const steps = [
    {
      number: 1,
      icon: <FileText className="w-6 h-6 text-[#31E981]" />,
      title: "Import",
      description: "Import your existing testimonials from multiple platforms or upload a CSV file. Our system makes organization and filtering simple."
    },
    {
      number: 2,
      icon: <VideoIcon className="w-6 h-6 text-[#31E981]" />,
      title: "Collect",
      description: "Create custom forms to gather new testimonials. Supports both video and text submissions with automatic transcription."
    },
    {
      number: 3,
      icon: <BarChart2 className="w-6 h-6 text-[#31E981]" />,
      title: "Manage & Analyze",
      description: "Categorize testimonials by type and analyze sentiment. Identify trends and highlight your best feedback."
    },
    {
      number: 4,
      icon: <Share2 className="w-6 h-6 text-[#31E981]" />,
      title: "Share",
      description: "Display testimonials across your digital presence with customizable widgets and integrated sharing tools."
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <span className="text-[#31E981] font-medium">How it works</span>
        <h2 className="text-4xl font-bold mt-2 mb-4 text-[#0C0C0C]">
          Start collecting & sharing testimonials
        </h2>
        <p className="text-2xl text-[#31E981]">in a few easy steps</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step) => (
          <StepCard key={step.number} {...step} />
        ))}
      </div>

      <Card className="mt-12 bg-[#31E981] text-white">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex mb-2">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-300">★</span>
                ))}
              </div>
              <p className="text-lg font-medium">
                "Getting started was incredibly simple - the interface is clean and intuitive. Exactly what we needed for managing our testimonials."
              </p>
              <div className="mt-4">
                <p className="font-semibold">Sample User</p>
                <p className="text-sm opacity-90">company.com</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestimonialSection;