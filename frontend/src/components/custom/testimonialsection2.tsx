// import React from 'react';
// import { Card, CardContent } from '@/components/ui/card';
// import { FileText, VideoIcon, BarChart2, Share2 } from 'lucide-react';

// const StepCard = ({ number, icon, title, description }) => (
//   <div className="flex-1 p-6 rounded-lg bg-[#848FA5] bg-opacity-10">
//     <div className="flex items-center gap-4 mb-4">
//       <div className="w-8 h-8 rounded-full bg-[#C14953] text-white flex items-center justify-center font-bold">
//         {number}
//       </div>
//       {icon}
//     </div>
//     <h3 className="text-xl font-bold mb-2 text-[#2D2D2A]">{title}</h3>
//     <p className="text-[#6B818C]">{description}</p>
//   </div>
// );

// const TestimonialSection = () => {
//   const steps = [
//     {
//       number: 1,
//       icon: <FileText className="w-6 h-6 text-[#C14953]" />,
//       title: "Import",
//       description: "Import your existing testimonials from multiple platforms or upload a CSV file. Our system makes organization and filtering simple."
//     },
//     {
//       number: 2,
//       icon: <VideoIcon className="w-6 h-6 text-[#C14953]" />,
//       title: "Collect",
//       description: "Create custom forms to gather new testimonials. Supports both video and text submissions with automatic transcription."
//     },
//     {
//       number: 3,
//       icon: <BarChart2 className="w-6 h-6 text-[#C14953]" />,
//       title: "Manage & Analyze",
//       description: "Categorize testimonials by type and analyze sentiment. Identify trends and highlight your best feedback."
//     },
//     {
//       number: 4,
//       icon: <Share2 className="w-6 h-6 text-[#C14953]" />,
//       title: "Share",
//       description: "Display testimonials across your digital presence with customizable widgets and integrated sharing tools."
//     }
//   ];

//   return (
//     <div className="max-w-7xl mx-auto px-4 py-16 overflow-hidden">
//      <div className="flex item-center justify-center">
//      <div className="text-left mb-10 w-2/4">
//         <span className="text-[#848FA5] font-medium italic">How it works</span>
//         <h2 className="text-4xl font-bold mt-2 mb-4 text-[#2D2D2A]">
//           Start collecting & sharing testimonials
//         </h2>
//         <p className="text-2xl text-[#2D2D2A]/50">in a few easy steps</p>
//       </div>
//      <Card className="mt-5 bg-[#2D2D2A] mb-10 text-[#E5DCC5] w-2/4">
//         <CardContent className="p-6">
//           <div className="flex items-start gap-4">
//             <div className="flex-1">
//               <div className="flex mb-2">
//                 {[...Array(5)].map((_, i) => (
//                   <span key={i} className="text-yellow-300">★</span>
//                 ))}
//               </div>
//               <p className="text-lg font-medium">
//                 "Getting started was incredibly simple - the interface is clean and intuitive. Exactly what we needed for managing our testimonials."
//               </p>
//               <div className="mt-4">
//                 <p className="font-semibold">Sample User</p>
//                 <p className="text-sm opacity-90">company.com</p>
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//      </div>
     

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         {steps.map((step) => (
//           <StepCard key={step.number} {...step} />
//         ))}
//       </div>

     
//     </div>
//   );
// };

// export default TestimonialSection;

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, VideoIcon, BarChart2, Share2, Quote } from 'lucide-react';

const StepCard = ({ number, icon, title, description, isLast }) => (
  <div className="relative group">
    {!isLast && (
      <div className="hidden lg:block absolute top-12 right-0 w-full h-2 border-t-2 border-dashed border-[#C14953]/30 translate-x-1/2" />
    )}
    <div className="relative h-full p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group-hover:border-[#C14953]/30">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#C14953]/10 text-[#C14953] flex items-center justify-center font-bold text-xl transform group-hover:scale-110 transition-transform duration-300">
          {number}
        </div>
        <div className="p-3 bg-[#C14953]/10 rounded-lg transform group-hover:rotate-6 transition-transform duration-300">
          {icon}
        </div>
      </div>
      <h3 className="text-2xl font-bold mb-3 text-[#2D2D2A] group-hover:text-[#C14953] transition-colors duration-300">
        {title}
      </h3>
      <p className="text-[#6B818C] leading-relaxed">{description}</p>
    </div>
  </div>
);

const TestimonialSection = () => {
  const steps = [
    {
      number: 1,
      icon: <FileText className="w-6 h-6 text-[#C14953]" />,
      title: "Import",
      description: "Import your existing testimonials from multiple platforms or upload a CSV file. Our system makes organization and filtering simple."
    },
    {
      number: 2,
      icon: <VideoIcon className="w-6 h-6 text-[#C14953]" />,
      title: "Collect",
      description: "Create custom forms to gather new testimonials. Supports both video and text submissions with automatic transcription."
    },
    {
      number: 3,
      icon: <BarChart2 className="w-6 h-6 text-[#C14953]" />,
      title: "Manage & Analyze",
      description: "Categorize testimonials by type and analyze sentiment. Identify trends and highlight your best feedback."
    },
    {
      number: 4,
      icon: <Share2 className="w-6 h-6 text-[#C14953]" />,
      title: "Share",
      description: "Display testimonials across your digital presence with customizable widgets and integrated sharing tools."
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-24 overflow-hidden bg-gradient-to-b from-white to-gray-50">
      <div className="flex flex-col lg:flex-row items-start justify-between gap-12 mb-20">
        <div className="lg:w-1/2 space-y-6">
          <div className="inline-block px-4 py-2 bg-[#C14953]/10 rounded-full">
            <span className="text-[#C14953] font-medium">How it works</span>
          </div>
          <h2 className="text-5xl font-bold text-[#2D2D2A] leading-tight">
            Start collecting & sharing testimonials{' '}
            <span className="text-3xl text-[#2D2D2A]/50 block mt-2">
              in a few easy steps
            </span>
          </h2>
        </div>

        <Card className="lg:w-1/2 bg-gradient-to-br from-[#2D2D2A] to-[#3D3D3A] text-[#E5DCC5] transform hover:scale-[1.02] transition-transform duration-300">
          <CardContent className="p-8">
            <div className="flex items-start gap-6">
              <div className="hidden lg:flex">
                <Quote className="w-10 h-10 text-[#C14953] transform -scale-x-100" />
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex mb-2">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-500">★</span>
                  ))}
                </div>
                <p className="text-xl font-medium leading-relaxed">
                  "Getting started was incredibly simple - the interface is clean and intuitive. Exactly what we needed for managing our testimonials."
                </p>
                <div className="pt-4 border-t border-white/10">
                  <p className="font-semibold">Sarah Thompson</p>
                  <p className="text-sm opacity-75">Marketing Director, TechFlow Inc.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {steps.map((step, index) => (
          <StepCard 
            key={step.number} 
            {...step} 
            isLast={index === steps.length - 1}
          />
        ))}
      </div>
    </div>
  );
};

export default TestimonialSection;