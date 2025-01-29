// // import React from 'react';
// // import { Card } from '@/components/ui/card';
// // import { Upload, Workflow, Code } from 'lucide-react';

// // const IntegrationSection = () => {
// //   const features = [
// //     {
// //       title: "Import from 30+ Platforms",
// //       description: "Easily import testimonials from leading platforms to get started faster.",
// //       icon: <Upload className="w-6 h-6 text-[#31E981]" />
// //     },
// //     {
// //       title: "Zapier Integration",
// //       description: "Connect with your favorite tools and automate testimonial collection seamlessly.",
// //       icon: <Workflow className="w-6 h-6 text-[#31E981]" />
// //     },
// //     {
// //       title: "API & Webhooks",
// //       description: "Get access to powerful API and webhook capabilities for custom integrations.",
// //       icon: <Code className="w-6 h-6 text-[#31E981]" />
// //     }
// //   ];

// //   return (
// //     <div className="max-w-7xl mx-auto px-4 py-16 overflow-hidden">
// //       <div className="text-center mb-12">
// //         <h2 className="text-3xl font-bold mb-2 text-[#0C0C0C]">
// //           "The best part is that it{' '}
// //           <span className="text-[#31E981]">integrates seamlessly</span>"
// //         </h2>
// //         <div className="mt-4 flex justify-center">
// //           <div className="w-12 h-12 bg-[#6B818C] rounded-full" />
// //         </div>
// //         <p className="text-[#6B818C] mt-2">Integration Specialist</p>
// //       </div>

// //       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
// //         <div className="relative">
// //           <div className="grid grid-cols-3 gap-4 p-8 bg-[#6B818C] bg-opacity-10 rounded-xl">
// //             {[...Array(12)].map((_, i) => (
// //               <div key={i} className="aspect-square rounded-lg bg-white shadow-sm flex items-center justify-center">
// //                 <div className="w-8 h-8 bg-[#6B818C] bg-opacity-20 rounded" />
// //               </div>
// //             ))}
// //           </div>
// //         </div>

// //         <div className="space-y-8">
// //           <p className="text-lg text-[#6B818C]">
// //             It's never been easier to connect your favorite tools to simplify testimonial collection & showcase your success everywhere.
// //           </p>
          
// //           <div className="space-y-6">
// //             {features.map((feature, index) => (
// //               <div key={index} className="flex items-start gap-4">
// //                 <div className="mt-1">{feature.icon}</div>
// //                 <div>
// //                   <h3 className="font-semibold text-[#0C0C0C] mb-1">{feature.title}</h3>
// //                   <p className="text-[#6B818C]">{feature.description}</p>
// //                 </div>
// //               </div>
// //             ))}
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // export default IntegrationSection;

// import React from 'react';
// import { Card } from '@/components/ui/card';
// import { Upload, Workflow, Code } from 'lucide-react';
// import UdemyLogo from '@/assets/Udemy.png';
// import FigmaLog from '@/assets/figmalogo.png';
// import WixLogo from '@/assets/wixlogo.png';
// import WordPressLogo from '@/assets/wordpresslogo.png';
// import SquareSpaceLogo from '@/assets/squarespacelogo.png';
// import SkoolLogo from '@/assets/skoollogo.png';
// import SkillShareLogo from '@/assets/skillsharelogo.jpg';
// import PininterestLogo from '@/assets/pininterestlogo.png';
// import ZappierLogo from '@/assets/zapierlogo.png';
// import HubspotLogo from '@/assets/hubspotlogo.png';
// import SlackLogo from '@/assets/slacklogo.png';
// import TrelloLogo from '@/assets/trellologo.png';
// import JumiaLogo from '@/assets/jumialogo.png';
// import XLogo from '@/assets/xlogo.png';
// import FacebookLogo from '@/assets/facebooklogo.png';
// import LinkedInLogo from '@/assets/linkedinlogo.png';
// import SalesforceLogo from '@/assets/salesforcelogo.png';
// import BusinessSuccess from '@/assets/bun-bro.png';




// const IntegrationSection = () => {
//   // 🔹 Array of companies being integrated
//   const companies = [
//     { name: "Udemy", logo: UdemyLogo },
//     { name: "Figma", logo: FigmaLog },
//     { name: "Wix", logo: WixLogo },
//     { name: "WordPress", logo: WordPressLogo },
//     { name: "Squarespace", logo: SquareSpaceLogo },
//     { name: "Skool", logo: SkoolLogo },
//     { name: "Skillshare", logo: SkillShareLogo},
//     { name: "Pininterest", logo: PininterestLogo },
//     { name: "Zappier", logo: ZappierLogo },
//     { name: "HubSpot", logo: HubspotLogo },
//     { name: "Slack", logo: SlackLogo },
//     { name: "Trello", logo: TrelloLogo},
//     { name: "Facebook", logo: FacebookLogo},
//     { name: "LinkedIn", logo: LinkedInLogo },
//     { name: "Salesforce", logo: SalesforceLogo},
//     { name: "X (Twitter)", logo: XLogo},
//     { name: "Salesforce", logo: JumiaLogo},
//     { name: "X (Twitter)", logo: XLogo},
//   ];

//   // 🔹 Array of integration features
//   const features = [
//     {
//       title: "Import from 30+ Platforms",
//       description: "Easily import testimonials from leading platforms to get started faster.",
//       icon: <Upload className="w-6 h-6 text-[#C14953]" />
//     },
//     {
//       title: "Zapier Integration",
//       description: "Connect with your favorite tools and automate testimonial collection seamlessly.",
//       icon: <Workflow className="w-6 h-6 text-[#C14953]" />
//     },
//     {
//       title: "API & Webhooks",
//       description: "Get access to powerful API and webhook capabilities for custom integrations.",
//       icon: <Code className="w-6 h-6 text-[#C14953]" />
//     }
//   ];

//   return (
//     <div className="max-w-7xl mx-auto px-4 py-16">
//       <Card className="bg-white shadow-lg rounded-2xl p-8">
//         <div className="text-center mb-10">
//           <h2 className="text-3xl font-bold text-center text-[#2D2D2A]">
//             "The best part is that it{' '}
//             <span className="text-[#C14953]">integrates seamlessly</span>"
//           </h2>

//           {/* 🔹 Logo Placeholder for Your Company */}
//           <div className="mt-4 flex justify-center">
//             <div className="w-16 h-16 bg-[#848FA5] rounded-full flex items-center justify-center">
//               <img src={BusinessSuccess} alt="Company Logo" className="w-10 h-10" />
//             </div>
//           </div>

//           <p className="text-[#4C4C47] mt-2">Integration Specialist</p>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//           {/* 🔹 Company Logos Grid */}
//           <div className="relative bg-[#2D2D2A] rounded-2xl p-8">
//             <Card className="p-8 bg-[#E5DCC5]/10 rounded-full w-3/4 mx-auto border-none">
//               <div className="grid grid-cols-4 gap-4 ">
//                 {companies.map((company, i) => (
//                   <div 
//                     key={i} 
//                     className="aspect-square rounded-lg bg-white shadow-lg border w-3/4 flex items-center justify-center p-1"
//                   >
//                     <img src={company.logo} alt={company.name} className="w-15 h-15 object-contain" />
//                   </div>
//                 ))}
//               </div>
//             </Card>
//           </div>

//           {/* 🔹 Features Section */}
//           <div className="space-y-8">
//             <p className="text-lg text-[#4C4C47]">
//               It's never been easier to connect your favorite tools to simplify testimonial collection & showcase your success everywhere.
//             </p>

//             <div className="space-y-6">
//               {features.map((feature, index) => (
//                 <Card key={index} className="p-4 bg-white shadow-md flex items-start gap-4 rounded-xl">
//                   <div className="mt-1">{feature.icon}</div>
//                   <div>
//                     <h3 className="font-semibold text-[#2D2D2A] mb-1">{feature.title}</h3>
//                     <p className="text-[#4C4C47]">{feature.description}</p>
//                   </div>
//                 </Card>
//               ))}
//             </div>
//           </div>
//         </div>
//       </Card>
//     </div>
//   );
// };

// export default IntegrationSection;

import React from 'react';
import { Card } from '@/components/ui/card';
import { Upload, Workflow, Code, ArrowRight } from 'lucide-react';
import FigmaLog from '@/assets/figmalogo.png';
import WixLogo from '@/assets/wixlogo.png';
import WordPressLogo from '@/assets/wordpresslogo.png';
import SquareSpaceLogo from '@/assets/squarespacelogo.png';
import SkoolLogo from '@/assets/skoollogo.png';
import SkillShareLogo from '@/assets/skillsharelogo.jpg';
import PininterestLogo from '@/assets/pininterestlogo.png';
import ZappierLogo from '@/assets/zapierlogo.png';
import HubspotLogo from '@/assets/hubspotlogo.png';
import SlackLogo from '@/assets/slacklogo.png';
import TrelloLogo from '@/assets/trellologo.png';
import JumiaLogo from '@/assets/jumialogo.png';
import XLogo from '@/assets/xlogo.png';
import FacebookLogo from '@/assets/facebooklogo.png';
import LinkedInLogo from '@/assets/linkedinlogo.png';
import SalesforceLogo from '@/assets/salesforcelogo.png';
import BusinessSuccess from '@/assets/bun-bro.png';

const IntegrationSection = () => {
  const companies = [
    { name: "Udemy", logo: JumiaLogo },
    { name: "Figma", logo: FigmaLog },
    { name: "Wix", logo: WixLogo },
    { name: "WordPress", logo: WordPressLogo },
    { name: "Squarespace", logo: SquareSpaceLogo },
    { name: "Skool", logo: SkoolLogo },
    { name: "Skillshare", logo: SkillShareLogo},
    { name: "Pinterest", logo: PininterestLogo },
    { name: "Zapier", logo: ZappierLogo },
    { name: "HubSpot", logo: HubspotLogo },
    { name: "Slack", logo: SlackLogo },
    { name: "Trello", logo: TrelloLogo},
    { name: "Facebook", logo: FacebookLogo},
    { name: "LinkedIn", logo: LinkedInLogo },
    { name: "Salesforce", logo: SalesforceLogo},
    { name: "X", logo: XLogo}
  ];

  const features = [
    {
      title: "Import from 30+ Platforms",
      description: "Easily import testimonials from leading platforms to get started faster.",
      icon: <Upload className="w-6 h-6 text-[#C14953]" />
    },
    {
      title: "Zapier Integration",
      description: "Connect with your favorite tools and automate testimonial collection seamlessly.",
      icon: <Workflow className="w-6 h-6 text-[#C14953]" />
    },
    {
      title: "API & Webhooks",
      description: "Get access to powerful API and webhook capabilities for custom integrations.",
      icon: <Code className="w-6 h-6 text-[#C14953]" />
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold mb-6 text-[#2D2D2A]">
          "The best part is that it{' '}
          <span className="text-[#C14953] relative">
            integrates seamlessly
            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 100 8" preserveAspectRatio="none">
              <path d="M0,5 Q50,8 100,5" stroke="#C14953" strokeWidth="2" fill="none"/>
            </svg>
          </span>"
        </h2>
        
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-[#2D2D2A] rounded-full flex items-center justify-center p-1 border-4 border-white shadow-lg">
            <img src={BusinessSuccess} alt="Integration Specialist" className="w-16 h-16 rounded-full object-cover" />
          </div>
          <div>
            <p className="font-semibold text-[#2D2D2A]">Sarah Thompson</p>
            <p className="text-[#4C4C47]">Integration Specialist</p>
          </div>
        </div>
      </div>

      <Card className="bg-white shadow-xl rounded-3xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 p-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#2D2D2A] to-[#4C4C47] rounded-2xl transform -rotate-1"></div>
            <Card className="relative p-8 bg-[#2D2D2A] rounded-2xl">
              <div className="grid grid-cols-4 gap-6">
                {companies.map((company, i) => (
                  <div 
                    key={i} 
                    className="aspect-square rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 flex items-center justify-center p-3 transform hover:-translate-y-1 transition-transform duration-300"
                  >
                    <img src={company.logo} alt={company.name} className="w-full h-full object-contain" />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-8 lg:pl-6">
            <p className="text-xl text-[#4C4C47] leading-relaxed">
              Connect your favorite tools to simplify testimonial collection & showcase your success everywhere.
            </p>

            <div className="space-y-4">
              {features.map((feature, index) => (
                <Card 
                  key={index} 
                  className="p-6 bg-white hover:shadow-lg transition-shadow duration-300 flex items-start gap-6 rounded-xl border-l-4 border-[#C14953]"
                >
                  <div className="p-3 bg-[#C14953]/10 rounded-lg">{feature.icon}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#2D2D2A] mb-2 flex items-center gap-2">
                      {feature.title}
                      <ArrowRight className="w-4 h-4 text-[#C14953]" />
                    </h3>
                    <p className="text-[#4C4C47] leading-relaxed">{feature.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default IntegrationSection;