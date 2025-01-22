import React from 'react';
import { Rocket, Shield, Target, Users, Award, Clock } from 'lucide-react';

const TransformationCard = () => {
  return (
    <div className="max-w-6xl mx-auto p-8 overflow-hidden">
      <div className="text-center mb-12">
        <blockquote className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
          "Transform your business journey with the power of social proof"
        </blockquote>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-gray-50 rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="bg-rose-50 text-rose-600 inline-block px-4 py-2 rounded-full font-medium mb-4">
            Before Social Proof
          </div>
          
          <div className="space-y-4">
            {[
              { icon: Clock, text: "Longer sales cycles" },
              { icon: Shield, text: "Trust building from scratch" },
              { icon: Target, text: "Manual conversion optimization" },
              { icon: Users, text: "Limited audience reach" }
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 text-gray-600">
                <item.icon className="w-5 h-5 text-gray-400" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-rose-50/50 rounded-xl p-4">
            <p className="text-rose-600 text-sm">Average conversion rate: 2.35%</p>
          </div>
        </div>

        <div className="bg-teal-50 rounded-2xl p-6 shadow-lg border border-teal-100">
          <div className="bg-teal-500 text-white inline-block px-4 py-2 rounded-full font-medium mb-4">
            With Social Proof
          </div>

          <div className="space-y-4">
            {[
              { icon: Rocket, text: "Accelerated customer acquisition" },
              { icon: Shield, text: "Instant credibility boost" },
              { icon: Target, text: "Automated trust building" },
              { icon: Award, text: "Competitive advantage" }
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 text-gray-800">
                <item.icon className="w-5 h-5 text-teal-500" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-white rounded-xl p-4">
            <p className="text-teal-600 font-medium">Average conversion rate: 8.47%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransformationCard;