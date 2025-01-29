// // import React from 'react';
// // import { Quote, Star, ArrowRight } from 'lucide-react';

// // const ProductTestimonial = () => {
// //   return (
// //     <div className='flex items-center justify-center'>

   
// //     <div className="w-4/4 max-w-7xl bg-[#31E981] text-white">
// //       <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
// //         <div className="grid lg:grid-cols-2 gap-12 items-center">
// //           {/* Left Content Side */}
// //           <div className="space-y-8">
// //             <div className="space-y-4">
// //               <h2 className="text-3xl font-bold tracking-tight text-[#0C0C0C]">Product Data</h2>
// //               <p className="text-xl font-semibold text-white">
// //                 Elevating Product Insights Through Reviews
// //               </p>
// //             </div>
            
// //             <p className="text-lg text-[#0C0C0C]">
// //               Gathering product reviews may be a simple task, but collecting accurate 
// //               information and displaying it strategically to customers can make the 
// //               difference between an average product page and one that genuinely converts.
// //             </p>

// //             {/* Review Stats */}
// //             <div className="grid grid-cols-2 gap-6">
// //               <div className="bg-white/10 p-6 rounded-xl">
// //                 <div className="flex items-center space-x-1 mb-2">
// //                   {[...Array(5)].map((_, i) => (
// //                     <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
// //                   ))}
// //                 </div>
// //                 <div className="text-2xl font-bold">4.9/5.0</div>
// //                 <div className="text-sm text-[#0C0C0C]">Average Customer Rating</div>
// //               </div>
// //               <div className="bg-white/10 p-6 rounded-xl">
// //                 <div className="text-2xl font-bold">98%</div>
// //                 <div className="text-sm text-[#0C0C0C]">Customer Satisfaction</div>
// //                 <div className="text-xs mt-2 text-white-50">Based on 1000+ reviews</div>
// //               </div>
// //             </div>
// //           </div>
       
// //           {/* Right Testimonial Side */}
// //           <div className="relative">
// //             <div className="bg-white rounded-2xl p-8 shadow-xl">
// //               <Quote className="w-12 h-12 text-[#31E981] mb-4" />
// //               <blockquote className="text-gray-800 text-xl font-medium mb-6">
// //                 "Cenphi.io offers a wealth of features to quickly gain and build trust 
// //                 for products, strategically displaying customer feedback that transforms 
// //                 a good product page into a converting powerhouse."
// //               </blockquote>
              
// //               <div className="flex items-center space-x-4">
// //                 <div className="w-12 h-12 bg-[#31E981] rounded-full flex items-center justify-center text-white font-bold">
// //                   DS
// //                 </div>
// //                 <div>
// //                   <div className="font-bold text-gray-900">Daniel Singh</div>
// //                   <div className="text-gray-600">Co-Founder @ Concrete Jungle</div>
// //                 </div>
// //               </div>

// //               <div className="mt-8">
// //                 <button className="flex items-center space-x-2 text-[#31E981] font-semibold hover:text-green-400 transition-colors">
// //                   <span>READ CASE STUDY</span>
// //                   <ArrowRight className="w-4 h-4" />
// //                 </button>
// //               </div>
// //             </div>

// //             {/* Decorative Elements */}
// //             <div className="absolute -z-10 inset-0 transform translate-x-4 translate-y-4">
// //               <div className="absolute inset-0 bg-blue-200 rounded-2xl opacity-20"></div>
// //             </div>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //     </div>
// //   );
// // };

// // export default ProductTestimonial;

import React from 'react';
import { Star } from 'lucide-react';
import { Quote } from 'lucide-react';

const ProductDataCard = () => {
  return (
<div className="w-full max-w-7xl mx-auto p-8 overflow-hidden">


   <div className=" bg-[#2D2D2A] rounded-2xl text-[#E5DCC5] p-8 min-h-[400px]">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <h1 className="text-4xl font-bold mb-2">Product Data</h1>
        <h2 className="text-2xl mb-8 text-[#848FA5]">
          Elevating Product Insights Through Reviews
        </h2>

        {/* Main Text */}
        <p className="text-lg mb-12 max-w-3xl">
          Gathering product reviews may be a simple task, but collecting accurate
          information and displaying it strategically to customers can make the
          difference between an average product page and one that genuinely
          converts.
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Rating Card */}
          <div className="bg-[#4C4C47] p-6 rounded-lg">
            <div className="flex items-center mb-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-6 h-6 text-yellow-500 fill-yellow-500"
                />
              ))}
            </div>
            <div className="text-3xl font-bold mb-1">4.9/5.0</div>
            <div className="text-[#848FA5]">Average Customer Rating</div>
          </div>

          {/* Satisfaction Card */}
          <div className="bg-[#4C4C47] p-6 rounded-lg">
            <div className="text-3xl font-bold mb-1">98%</div>
            <div className="text-[#848FA5]">Customer Satisfaction</div>
            <div className="text-sm mt-1">Based on 1000+ reviews</div>
          </div>
        </div>

        {/* Testimonial Card */}
        <div className="bg-[#E5DCC5] text-[#2D2D2A] p-8 rounded-lg">
          <div className="hidden lg:flex">
                         <Quote className="w-10 h-10 text-[#C14953] transform -scale-x-100" />
                       </div>
          <p className="text-lg mb-6">
            Cenphi.io offers a wealth of features to quickly gain and build trust
            for products, strategically displaying customer feedback that
            transforms a good product page into a converting powerhouse.
          </p>
          
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-[#C14953] flex items-center justify-center text-[#E5DCC5] font-bold mr-4">
              DS
            </div>
            <div>
              <div className="font-bold">Daniel Singh</div>
              <div className="text-[#4C4C47]">Co-Founder @ Concrete Jungle</div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button className="mt-8 bg-[#C14953] text-[#E5DCC5] px-6 py-3 rounded-lg hover:bg-opacity-90 transition-opacity flex items-center">
          READ CASE STUDY
          <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
    
   </div>
  );
};

export default ProductDataCard;

// import React from 'react';
// import { Star } from 'lucide-react';

// const ProductDataCard = () => {
//   return (
//     <div className="bg-white p-12 min-h-[400px]">
//       <div className="max-w-6xl mx-auto">
//         {/* Header Section */}
//         <h1 className="text-4xl font-bold mb-2 text-[#848FA5]">Product Data</h1>
//         <h2 className="text-2xl mb-12 text-black">
//           Elevating Product Insights Through Reviews
//         </h2>

//         {/* Main Text */}
//         <p className="text-lg mb-16 max-w-3xl text-gray-600">
//           Gathering product reviews may be a simple task, but collecting accurate
//           information and displaying it strategically to customers can make the
//           difference between an average product page and one that genuinely
//           converts.
//         </p>

//         {/* Stats Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
//           {/* Rating Card */}
//           <div className="bg-white border border-gray-100 p-8 rounded-lg shadow-sm">
//             <div className="flex items-center mb-3">
//               {[...Array(5)].map((_, i) => (
//                 <Star
//                   key={i}
//                   className="w-6 h-6 fill-[#C14953] text-[#C14953]"
//                 />
//               ))}
//             </div>
//             <div className="text-4xl font-bold mb-2 text-[#848FA5]">4.9/5.0</div>
//             <div className="text-gray-500">Average Customer Rating</div>
//           </div>

//           {/* Satisfaction Card */}
//           <div className="bg-white border border-gray-100 p-8 rounded-lg shadow-sm">
//             <div className="text-4xl font-bold mb-2 text-[#848FA5]">98%</div>
//             <div className="text-gray-500">Customer Satisfaction</div>
//             <div className="text-sm mt-2 text-gray-400">Based on 1000+ reviews</div>
//           </div>
//         </div>

//         {/* Testimonial Card */}
//         <div className="bg-white border border-gray-100 p-10 rounded-lg shadow-sm mb-12">
//           <div className="text-[#C14953] text-6xl mb-6">"</div>
//           <p className="text-xl mb-8 text-gray-600 leading-relaxed">
//             Cenphi.io offers a wealth of features to quickly gain and build trust
//             for products, strategically displaying customer feedback that
//             transforms a good product page into a converting powerhouse.
//           </p>
          
//           <div className="flex items-center">
//             <div className="w-12 h-12 rounded-full bg-[#848FA5] flex items-center justify-center text-white font-bold mr-4">
//               DS
//             </div>
//             <div>
//               <div className="font-bold text-gray-800">Daniel Singh</div>
//               <div className="text-gray-500">Co-Founder @ Concrete Jungle</div>
//             </div>
//           </div>
//         </div>

//         {/* CTA Button */}
//         <button className="bg-white border-2 border-[#C14953] text-[#C14953] px-8 py-3 rounded-lg hover:bg-[#C14953] hover:text-white transition-all duration-200 flex items-center font-medium">
//           READ CASE STUDY
//           <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//             <path d="M5 12h14M12 5l7 7-7 7"/>
//           </svg>
//         </button>
//       </div>
//     </div>
//   );
// };

// export default ProductDataCard;


// import React from 'react';
// import { Quote, Star, ArrowRight } from 'lucide-react';
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";

// const ProductDataCard = () => {
//   return (
//     <div className="w-full max-w-7xl mx-auto p-8">
//       <Card className="bg-[#2D2D2A] text-[#E5DCC5] border-none">
//         <CardContent className="p-8">
//           <div className="space-y-8">
//             {/* Header Section */}
//             <div className="space-y-4">
//               <CardTitle className="text-4xl">Product Data</CardTitle>
//               <h2 className="text-2xl text-[#848FA5]">
//                 Elevating Product Insights Through Reviews
//               </h2>
//             </div>

//             {/* Main Text */}
//             <p className="text-lg max-w-3xl">
//               Gathering product reviews may be a simple task, but collecting accurate
//               information and displaying it strategically to customers can make the
//               difference between an average product page and one that genuinely converts.
//             </p>

//             {/* Stats Grid */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               {/* Rating Card */}
//               <Card className="bg-[#4C4C47] border-none">
//                 <CardContent className="p-6">
//                   <div className="flex items-center mb-2">
//                     {[...Array(5)].map((_, i) => (
//                       <Star
//                         key={i}
//                         className="w-6 h-6 fill-[#C14953] text-[#C14953]"
//                       />
//                     ))}
//                   </div>
//                   <div className="text-3xl font-bold mb-1">4.9/5.0</div>
//                   <div className="text-[#848FA5]">Average Customer Rating</div>
//                 </CardContent>
//               </Card>

//               {/* Satisfaction Card */}
//               <Card className="bg-[#4C4C47] border-none">
//                 <CardContent className="p-6">
//                   <div className="text-3xl font-bold mb-1">98%</div>
//                   <div className="text-[#848FA5]">Customer Satisfaction</div>
//                   <div className="text-sm mt-1">Based on 1000+ reviews</div>
//                 </CardContent>
//               </Card>
//             </div>

//             {/* Testimonial Card */}
//             <Card className="bg-[#E5DCC5] border-none">
//               <CardContent className="p-8">
//                 <Quote className="w-12 h-12 text-[#C14953] mb-4" />
//                 <p className="text-lg text-[#2D2D2A] mb-6">
//                   Cenphi.io offers a wealth of features to quickly gain and build trust
//                   for products, strategically displaying customer feedback that
//                   transforms a good product page into a converting powerhouse.
//                 </p>
                
//                 <div className="flex items-center">
//                   <div className="w-12 h-12 rounded-full bg-[#C14953] flex items-center justify-center text-[#E5DCC5] font-bold mr-4">
//                     DS
//                   </div>
//                   <div>
//                     <div className="font-bold text-[#2D2D2A]">Daniel Singh</div>
//                     <div className="text-[#4C4C47]">Co-Founder @ Concrete Jungle</div>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* CTA Button */}
//             <Button 
//               className="bg-[#C14953] text-[#E5DCC5] hover:bg-[#A13943] transition-colors"
//             >
//               READ CASE STUDY
//               <ArrowRight className="w-4 h-4 ml-2" />
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default ProductDataCard;