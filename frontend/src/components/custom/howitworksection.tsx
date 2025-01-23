import { UploadCloud, Video, BarChart, Share2 } from "lucide-react";

const HowItWorks = () => {
  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-6 md:px-12">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 w-2/4 text-center mx-auto">
            Start collecting & sharing testimonials
            <span className="text-rose-500"> in a few easy steps</span>
          </h2>
        </div>

        {/* Steps Grid */}
        <div className="grid gap-8 md:grid-cols-4">
          {/* Step 1 */}
          <div className="bg-white shadow-lg rounded-lg p-6 text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-gradient-to-r from-purple-400 to-pink-500 text-white rounded-full">
              <UploadCloud size={28} />
            </div>
            <h3 className="text-xl font-semibold mt-4">Import</h3>
            <p className="text-gray-600 mt-2">
              Grab all your testimonials from over 30 platforms or drag in a CSV to get started.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white shadow-lg rounded-lg p-6 text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-gradient-to-r from-blue-400 to-cyan-500 text-white rounded-full">
              <Video size={28} />
            </div>
            <h3 className="text-xl font-semibold mt-4">Collect</h3>
            <p className="text-gray-600 mt-2">
              Create and share testimonial forms with ease, including video and text options.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white shadow-lg rounded-lg p-6 text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-gradient-to-r from-green-400 to-teal-500 text-white rounded-full">
              <BarChart size={28} />
            </div>
            <h3 className="text-xl font-semibold mt-4">Manage & Analyze</h3>
            <p className="text-gray-600 mt-2">
              Sort testimonials by product, sentiment, or customer type to gain insights.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white shadow-lg rounded-lg p-6 text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-gradient-to-r from-pink-400 to-red-500 text-white rounded-full">
              <Share2 size={28} />
            </div>
            <h3 className="text-xl font-semibold mt-4">Share</h3>
            <p className="text-gray-600 mt-2">
              Showcase testimonials on your site, social media, or emails with ease.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
