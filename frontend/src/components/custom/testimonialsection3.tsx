// import React from 'react';
// import { Card } from '@/components/ui/card';
// import { Heart, Share2, Infinity, Quote } from 'lucide-react';

// const FeatureCard = ({ icon, title, description }) => (
//   <Card className="p-6 bg-white hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#C14953]/30">
//     <div className="p-3 bg-[#C14953]/10 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
//       {icon}
//     </div>
//     <h3 className="text-xl font-bold mb-3 text-[#2D2D2A]">{title}</h3>
//     <p className="text-[#848FA5] leading-relaxed">{description}</p>
//   </Card>
// );

// const TestimonialCard = ({ quote, author, position, rotation = "0" }) => (
//   <div className="relative mb-8">
//     <div className={`absolute inset-0 bg-gradient-to-br from-[#2D2D2A] to-[#4C4C47] rounded-3xl transform ${rotation}`}></div>
//     <Card className="relative bg-[#2D2D2A] text-[#E5DCC5] p-8 rounded-3xl">
//       <div className="hidden lg:flex">
//         <Quote className="w-10 h-10 text-[#C14953] transform -scale-x-100" />
//       </div>
//       <p className="text-2xl font-medium leading-relaxed mb-8">
//         {quote}
//       </p>
//       <div className="flex items-center gap-4">
//         <div className="w-12 h-12 rounded-full bg-[#848FA5]/20"></div>
//         <div>
//           <p className="font-semibold">{author}</p>
//           <p className="text-sm text-[#E5DCC5]/70">{position}</p>
//         </div>
//       </div>
//     </Card>
//   </div>
// );

// const TestimonialSharingSection = () => {
//   const testimonials = [
//     {
//       quote: "Hands down the best testimonial tool for SaaS. We sell x2 more just because every landing page has a stunning wall of love.",
//       author: "Denis Kulkov",
//       position: "Founder, TechFlow",
//       rotation: "rotate-2"
//     },
//     {
//       quote: "The testimonial walls increased our conversion rate by 45%. Integration was seamless and the results speak for themselves.",
//       author: "Sarah Chen",
//       position: "CMO, GrowthMaster",
//       rotation: "-rotate-1"
//     },
//     {
//       quote: "Our customers love seeing real feedback displayed beautifully. It's been a game-changer for building trust and credibility.",
//       author: "Michael Torres",
//       position: "CEO, WebScale",
//       rotation: "rotate-3"
//     }
//   ];

//   return (
//     <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 bg-gradient-to-b from-white to-gray-50">
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
//         <div className="space-y-8">
//           <div className="space-y-6">
//             <span className="text-[#C14953] font-medium">Testimonial Sharing</span>
//             <h2 className="text-3xl md:text-4xl font-bold text-[#2D2D2A] leading-tight">
//               Share proof anywhere &{' '}
//               <span className="block">boost conversions</span>
//             </h2>
//           </div>

//           <div className="grid gap-6">
//             <FeatureCard
//               icon={<Heart className="w-6 h-6 text-[#C14953]" />}
//               title="Walls of Love"
//               description="Create gorgeous testimonial galleries with fully customizable layouts to show off on any page."
//             />

//             <FeatureCard
//               icon={<Share2 className="w-6 h-6 text-[#C14953]" />}
//               title="Widgets & Images"
//               description="Easily drop testimonials into your emails, websites, or social media in just a few clicks."
//             />

//             <FeatureCard
//               icon={<Infinity className="w-6 h-6 text-[#C14953]" />}
//               title="Unlimited Embeds"
//               description="Add testimonials to your landing pages, product pages, or anywhere you want — without a developer."
//             />
//           </div>
//         </div>

//         <div className="space-y-6">
//           {testimonials.map((testimonial, index) => (
//             <TestimonialCard
//               key={index}
//               quote={testimonial.quote}
//               author={testimonial.author}
//               position={testimonial.position}
//               rotation={testimonial.rotation}
//             />
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TestimonialSharingSection; 

import React from 'react';
import { Card } from '@/components/ui/card';
import { Heart, Share2, Infinity, Quote } from 'lucide-react';

const FeatureCard = ({ icon, title, description }) => (
  <Card className="p-6 bg-white hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#C14953]/30">
    <div className="p-3 bg-[#C14953]/10 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3 text-[#2D2D2A]">{title}</h3>
    <p className="text-[#848FA5] leading-relaxed">{description}</p>
  </Card>
);

const TestimonialCard = ({ quote, author, position, variant = "default" }: { quote: string; author: string; position: string; variant?: "default" | "gradient" | "light" }) => {
  const variants = {
    default: {
      container: "bg-[#2D2D2A] text-[#E5DCC5]",
      quoteIcon: "text-[#C14953]",
      authorBg: "bg-[#848FA5]/20"
    },
    gradient: {
      container: "bg-gradient-to-br from-[#C14953] to-[#922B33] text-white",
      quoteIcon: "text-white/80",
      authorBg: "bg-white/20"
    },
    light: {
      container: "bg-white text-[#2D2D2A] border-2 border-[#C14953]/20",
      quoteIcon: "text-[#C14953]",
      authorBg: "bg-[#C14953]/10"
    }
  };

  const style = variants[variant];

  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-[#C14953]/20 to-[#2D2D2A]/20 rounded-3xl blur-xl transition-opacity duration-300 opacity-0 group-hover:opacity-100" />
      <Card className={`relative ${style.container} p-8 rounded-3xl transform transition-all duration-500 hover:-translate-y-1`}>
        <div className="hidden lg:flex mb-4">
          <Quote className={`w-10 h-10 ${style.quoteIcon} transform -scale-x-100`} />
        </div>
        <p className="text-2xl font-medium leading-relaxed mb-8">
          {quote}
        </p>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full ${style.authorBg}`} />
          <div>
            <p className="font-semibold">{author}</p>
            <p className={`text-sm ${variant === 'default' ? 'text-[#E5DCC5]/70' : 'opacity-80'}`}>
              {position}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

const TestimonialSharingSection = () => {
  type Testimonial = {
    quote: string;
    author: string;
    position: string;
    variant: "default" | "gradient" | "light";
  };

  const testimonials: Testimonial[] = [
    {
      quote: "Hands down the best testimonial tool for SaaS. We sell x2 more just because every landing page has a stunning wall of love.",
      author: "Denis Kulkov",
      position: "Founder, TechFlow",
      variant: "default"
    },
    {
      quote: "The testimonial walls increased our conversion rate by 45%. Integration was seamless and the results speak for themselves.",
      author: "Sarah Chen",
      position: "CMO, GrowthMaster",
      variant: "gradient"
    },
    {
      quote: "Our customers love seeing real feedback displayed beautifully. It's been a game-changer for building trust and credibility.",
      author: "Michael Torres",
      position: "CEO, WebScale",
      variant: "light"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
        <div className="space-y-8">
          <div className="space-y-6">
            <span className="text-[#C14953] font-medium">Testimonial Sharing</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#2D2D2A] leading-tight">
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

        <div className="space-y-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={index}
              quote={testimonial.quote}
              author={testimonial.author}
              position={testimonial.position}
              variant={testimonial.variant}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestimonialSharingSection;