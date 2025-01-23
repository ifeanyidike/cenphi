import React from 'react'
import TestimonialImage from '@/assets/bun-bro.png'
import Femalecheftestimonial from '@/assets/femalechef-rafiki.png'

const TestimonialsSection = () => {
    return (
      <section className="bg-gray-50 py-16 overflow-hidden">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-gray-800">
            Your ultimate tool for gathering and showcasing{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-rose-500">authentic social proof</span>
          </h2>
          <p className="mt-4 text-gray-600">
            Simplify the process of collecting, managing, and displaying powerful customer testimonials effortlessly.
          </p>
        </div>
  
        {/* Content Grid */}
        <div className="mt-12 grid gap-12 md:grid-cols-2 px-4 md:px-16 lg:px-24">
          {/* Testimonial Card 1 */}
          <div className="rounded-full border-2 border-white bg-teal-600 text-white p-8 rounded-lg shadow-lg">
            <p className="text-lg italic">
              "The setup was incredibly simple. It took less than 5 minutes to get started with collecting reviews. We
              were able to import existing reviews, which is such an important feature to have."
            </p>
            <div className="mt-6 flex items-center">
              <img
                src={TestimonialImage}
                alt="Matt Davies"
                className="w-12 h-12 rounded-full border-2 border-white shadow-md"
              />
              <div className="ml-4">
                <p className="font-semibold">Matt Davies</p>
                <p className="text-sm">Co-founder, Funnel Packs</p>
              </div>
            </div>
          </div>
  
          {/* Features List */}
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-gray-800">Get started in minutes</h3>
            <ul className="mt-4 space-y-4">
              <li className="flex items-start">
                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                  <i className="fas fa-cogs"></i>
                </div>
                <div className="ml-4">
                  <p className="font-semibold">Customizable Forms</p>
                  <p className="text-sm text-gray-600">
                    Quickly set up branded forms to collect video and text testimonials.
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                  <i className="fas fa-database"></i>
                </div>
                <div className="ml-4">
                  <p className="font-semibold">No-Code Integration</p>
                  <p className="text-sm text-gray-600">
                    Drag and drop testimonials right into your website or social posts.
                  </p>
                </div>
              </li>
            </ul>
          </div>
  
          {/* Testimonial Card 2 */}
          <div className="rounded-full border-2 border-white bg-teal-600 text-white p-8 rounded-lg shadow-lg">
            <p className="text-lg italic">
              "In the beginning, I thought collecting testimonials was easy. I underestimated the value of managing and
              displaying them effectively. This tool saved a lot of development time."
            </p>
            <div className="mt-6 flex items-center">
              <img
                src={Femalecheftestimonial}
                alt="Adrian Spataru"
                className="w-12 h-12 border-2 border-white rounded-full shadow-md"
              />
              <div className="ml-4">
                <p className="font-semibold">Adrian Spataru</p>
                <p className="text-sm">Founder, CleanSocial</p>
              </div>
            </div>
          </div>
  
          {/* Features List */}
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-gray-800">Effortlessly collect testimonials</h3>
            <ul className="mt-4 space-y-4">
              <li className="flex items-start">
                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                  <i className="fas fa-star"></i>
                </div>
                <div className="ml-4">
                  <p className="font-semibold">Incentivize Collection</p>
                  <p className="text-sm text-gray-600">
                    Reward customers for sharing their stories with discounts or gifts.
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                  <i className="fas fa-chart-bar"></i>
                </div>
                <div className="ml-4">
                  <p className="font-semibold">Powerful Dashboard</p>
                  <p className="text-sm text-gray-600">
                    Manage, filter, and display testimonials in one convenient place.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>
    );
  };
  
  export default TestimonialsSection;
  