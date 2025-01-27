import React from 'react';
import { Rocket, Shield, Target, Users, Award, Clock } from 'lucide-react';
import Businessfail from "@/assets/businessfail.png";
import BusinessSuccess from "@/assets/businesssucess.png";

const TransformationCard = () => {
  return (
    <div className="max-w-4xl mx-auto p-8 overflow-hidden">
      <div className="flex item-center justify-center text-center mb-12">
        <blockquote className=" w-2/4 text-2xl md:text-3xl font-bold text-gray-800 mb-4">
          "Transform your business journey with the power of social proof"
        </blockquote>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-[#FE5F55]/10 rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="inline-block ">
          <h3 className=' px-4 py-2 text-[#FE5F55] font-medium mb-4 rounded-full transition-colors'>
            Before Social Proof
            </h3>  
            <img src={Businessfail} alt="our pictuire" />
          </div>
         
          
          <div className="space-y-4">
            {[
              { icon: Clock, text: "Longer sales cycles" },
              { icon: Shield, text: "Trust building from scratch" },
              { icon: Target, text: "Manual conversion optimization" },
              { icon: Users, text: "Limited audience reach" }
            ].map((item, index) => (
              <div key={index} className="flex items-center  gap-3 text-gray-600">
                <item.icon className="w-5 h-5 text-[#FE5F55] bg-[#FE5F55]/20 rounded-full" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-rose-50/50 rounded-xl p-4">
            <p className="text-[#FE5F55] text-sm">Average conversion rate: 2.35%</p>
          </div>
        </div>

        <div className="bg-teal-50 rounded-2xl p-6 shadow-lg border border-teal-100">
          <div className=" inline-block">
           <h3 className='px-4 py-2 text-[#31E981] font-medium mb-4 rounded-full transition-colors'> With Social Proof</h3>
           <img src={BusinessSuccess} alt="successful business" />
          </div>

          <div className="space-y-4">
            {[
              { icon: Rocket, text: "Accelerated customer acquisition" },
              { icon: Shield, text: "Instant credibility boost" },
              { icon: Target, text: "Automated trust building" },
              { icon: Award, text: "Competitive advantage" }
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 text-gray-800">
                <item.icon className="w-5 h-5 w-5 h-5 text-[#31E981] bg-[#31E981]/20 rounded-full" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-white rounded-xl p-4">
            <p className="text-[#31E981] font-medium">Average conversion rate: 8.47%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransformationCard;