// import React from 'react';
// import { Rocket, Shield, Target, Users, Award, Clock } from 'lucide-react';
// import Businessfail from "@/assets/businessfail.png";
// import BusinessSuccess from "@/assets/businesssucess.png";

// const TransformationCard = () => {
//   return (
//     <div className="max-w-7xl mx-auto p-8 overflow-hidden">
//       <div className="flex items-center justify-center text-center mb-12">
//         <blockquote className="w-2/4 text-2xl md:text-3xl font-bold text-[#0C0C0C] mb-4">
//           "Transform your business journey with the power of social proof"
//         </blockquote>
//       </div>

//       <div className="grid md:grid-cols-2 gap-8">
//         {/* Before Card */}
//         <div className="bg-white rounded-2xl shadow-lg relative overflow-hidden border-2 border-[#FE5F55]">
//           {/* Image Container with Overlay */}
//           <div className="relative h-64">
//             <img 
//               src={Businessfail} 
//               alt="Business challenges" 
//               className="w-full h-full object-cover"
//             />
//             <div className="absolute inset-0 bg-gradient-to-b from-[#FE5F55]/50 to-transparent"></div>
//             {/* Enhanced heading with semi-transparent background */}
//             <h3 className="absolute top-8 left-6 inline-block px-6 py-3 bg-white/70 text-[#FE5F55] font-bold text-lg rounded-full shadow-lg border border-[#FE5F55]/20">
//               Before Social Proof
//             </h3>
//           </div>
          
//           {/* Content Section */}
//           <div className="p-6">
//             <div className="space-y-4">
//               {[
//                 { icon: Clock, text: "Longer sales cycles" },
//                 { icon: Shield, text: "Trust building from scratch" },
//                 { icon: Target, text: "Manual conversion optimization" },
//                 { icon: Users, text: "Limited audience reach" }
//               ].map((item, index) => (
//                 <div key={index} className="flex items-center gap-3 text-[#6B818C]">
//                   <div className="bg-[#FE5F55]/10 p-2 rounded-full">
//                     <item.icon className="w-4 h-4 text-[#FE5F55]" />
//                   </div>
//                   <span className="font-medium">{item.text}</span>
//                 </div>
//               ))}
//             </div>

//             <div className="mt-6 bg-[#FE5F55]/5 rounded-xl p-4">
//               <p className="text-[#FE5F55] font-medium">Average conversion rate: 2.35%</p>
//             </div>
//           </div>
//         </div>

//         {/* After Card */}
//         <div className="bg-[#31E981] rounded-2xl shadow-lg relative overflow-hidden">
//           {/* Image Container with Overlay */}
//           <div className="relative h-64">
//             <img 
//               src={BusinessSuccess} 
//               alt="Business success" 
//               className="w-full h-full object-cover"
//             />
//             <div className="absolute inset-0 bg-gradient-to-b from-[#31E981]/50 to-transparent"></div>
//             {/* Enhanced heading with semi-transparent background */}
//             <h3 className="absolute top-8 left-6 inline-block px-6 py-3 backdrop-blur-sm text-white font-bold text-lg rounded-full shadow-lg border border-white/20">
//               With Social Proof
//             </h3>
//           </div>

//           {/* Content Section */}
//           <div className="p-6">
//             <div className="space-y-4">
//               {[
//                 { icon: Rocket, text: "Accelerated customer acquisition" },
//                 { icon: Shield, text: "Instant credibility boost" },
//                 { icon: Target, text: "Automated trust building" },
//                 { icon: Award, text: "Competitive advantage" }
//               ].map((item, index) => (
//                 <div key={index} className="flex items-center gap-3 text-[#0C0C0C]">
//                   <div className="bg-[#0C0C0C]/10 p-2 rounded-full">
//                     <item.icon className="w-4 h-4 text-[#0C0C0C]" />
//                   </div>
//                   <span className="font-medium">{item.text}</span>
//                 </div>
//               ))}
//             </div>

//             <div className="mt-6 bg-white rounded-xl p-4">
//               <p className="text-[#0C0C0C] font-medium">Average conversion rate: 8.47%</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TransformationCard;

import React from 'react';
import { Rocket, Shield, Target, Users, Award, Clock } from 'lucide-react';
import Businessfail from "@/assets/businessfail.png";
import BusinessSuccess from "@/assets/businesssucess.png";

const TransformationCard = () => {
  return (
    <div className="max-w-7xl mx-auto p-8 overflow-hidden">
      <div className="flex items-center justify-center text-center mb-12">
        <blockquote className="w-2/4 text-2xl md:text-3xl font-bold text-[#2D2D2A] mb-4">
          "Transform your business journey with the power of social proof"
        </blockquote>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Before Card */}
        <div className="bg-white rounded-2xl shadow-lg relative overflow-hidden border border-[#848FA5]">
          {/* Image Container with Overlay */}
          <div className="relative h-64">
            <img 
              src={Businessfail} 
              alt="Business challenges" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#4C4C47]/60 to-transparent"></div>
            <h3 className="absolute top-8 left-6 inline-block px-6 py-3 bg-white/90 text-[#2D2D2A] font-bold text-lg rounded-full shadow-lg border border-[#848FA5]">
              Before Social Proof
            </h3>
          </div>
          
          {/* Content Section */}
          <div className="p-6">
            <div className="space-y-4">
              {[
                { icon: Clock, text: "Longer sales cycles" },
                { icon: Shield, text: "Trust building from scratch" },
                { icon: Target, text: "Manual conversion optimization" },
                { icon: Users, text: "Limited audience reach" }
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 text-[#4C4C47] group hover:text-[#2D2D2A] transition-colors duration-300">
                  <div className="bg-[#E5DCC5] p-2 rounded-full group-hover:bg-[#848FA5]/20">
                    <item.icon className="w-4 h-4 text-[#C14953]" />
                  </div>
                  <span className="font-medium">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-[#E5DCC5] rounded-xl p-4">
              <p className="text-[#2D2D2A] font-medium">Average conversion rate: 2.35%</p>
            </div>
          </div>
        </div>

        {/* After Card */}
        <div className="bg-[#2D2D2A] rounded-2xl shadow-lg relative overflow-hidden">
          {/* Image Container with Overlay */}
          <div className="relative h-64">
            <img 
              src={BusinessSuccess} 
              alt="Business success" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#2D2D2A]/60 to-transparent"></div>
            <h3 className="absolute top-8 left-6 inline-block px-6 py-3 bg-[#C14953] text-[#E5DCC5] font-bold text-lg rounded-full shadow-lg border border-[#E5DCC5]/20">
              With Social Proof
            </h3>
          </div>

          {/* Content Section */}
          <div className="p-6">
            <div className="space-y-4">
              {[
                { icon: Rocket, text: "Accelerated customer acquisition" },
                { icon: Shield, text: "Instant credibility boost" },
                { icon: Target, text: "Automated trust building" },
                { icon: Award, text: "Competitive advantage" }
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 text-[#848FA5] group hover:text-[#E5DCC5] transition-colors duration-300">
                  <div className="bg-[#4C4C47] p-2 rounded-full group-hover:bg-[#C14953]">
                    <item.icon className="w-4 h-4 text-[#E5DCC5]" />
                  </div>
                  <span className="font-medium">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-[#4C4C47] rounded-xl p-4">
              <p className="text-[#E5DCC5] font-medium">Average conversion rate: 8.47%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransformationCard;