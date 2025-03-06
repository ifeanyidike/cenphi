import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import FigmaLog from "@/assets/figmalogo.png";
import WixLogo from "@/assets/wixlogo.png";
import WordPressLogo from "@/assets/wordpresslogo.png";
import SquareSpaceLogo from "@/assets/squarespacelogo.png";
import SkoolLogo from "@/assets/skoollogo.png";
import SkillShareLogo from "@/assets/skillsharelogo.jpg";
import PininterestLogo from "@/assets/pininterestlogo.png";
import ZappierLogo from "@/assets/zapierlogo.png";
import HubspotLogo from "@/assets/hubspotlogo.png";
import SlackLogo from "@/assets/slacklogo.png";
import TrelloLogo from "@/assets/trellologo.png";
import JumiaLogo from "@/assets/jumialogo.png";
import XLogo from "@/assets/xlogo.png";
import FacebookLogo from "@/assets/facebooklogo.png";
import LinkedInLogo from "@/assets/linkedinlogo.png";
import SalesforceLogo from "@/assets/salesforcelogo.png";

const CollectionSection: React.FC = () => {
  const companies = [
    { name: "Udemy", logo: JumiaLogo },
    { name: "Figma", logo: FigmaLog },
    { name: "Wix", logo: WixLogo },
    { name: "WordPress", logo: WordPressLogo },
    { name: "Squarespace", logo: SquareSpaceLogo },
    { name: "Skool", logo: SkoolLogo },
    { name: "Skillshare", logo: SkillShareLogo },
    { name: "Pinterest", logo: PininterestLogo },
    { name: "Zapier", logo: ZappierLogo },
    { name: "HubSpot", logo: HubspotLogo },
    { name: "Slack", logo: SlackLogo },
    { name: "Trello", logo: TrelloLogo },
    { name: "Facebook", logo: FacebookLogo },
    { name: "LinkedIn", logo: LinkedInLogo },
    { name: "Salesforce", logo: SalesforceLogo },
    { name: "X", logo: XLogo },
  ];

  return (
    <div className="lg:max-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 lg:py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-8">
              <div className="inline-block px-4 py-1.5 bg-indigo-50 rounded-full">
                <p className="text-sm font-medium text-indigo-600 flex items-center">
                  <span className="relative flex h-2 w-2 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                  </span>
                  Introducing Testimonial Management 2.0
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 tracking-tight leading-tight">
                  Change the way you collect{" "}
                  <span className="relative">
                    <span className="text-gray-900 font-playball relative z-10">
                      testimonials
                    </span>
                    <span
                      className="absolute h-3 bg-gradient-to-r from-indigo-400 to-purple-500 bottom-1 left-0 right-0 z-0 transform skew-x-3"
                      style={{ opacity: 0.3 }}
                    ></span>
                  </span>
                </h1>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-xl text-gray-600 leading-relaxed"
              >
                Your one-stop testimonial management platform. Collect, analyze,
                and showcase authentic customer feedback with our powerful
                solution.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4"
              >
                <button className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-lg font-medium transition-all hover:shadow-lg shadow-md">
                  <span className="relative z-10 flex items-center justify-center">
                    <span>Get Started</span>
                    <ArrowRight
                      size={18}
                      className="ml-2 transition-transform group-hover:translate-x-1"
                    />
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                </button>

                <button className="group relative px-8 py-4 rounded-lg font-medium border border-gray-200 hover:border-indigo-200 bg-white transition-all shadow-sm hover:shadow">
                  <span className="flex items-center">
                    <Play size={18} className="mr-2 text-indigo-600" />
                    <span className="text-gray-800">Watch Demo</span>
                  </span>
                  <span className="absolute inset-0 bg-indigo-50 opacity-0 group-hover:opacity-10 transition-opacity rounded-lg"></span>
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="pt-10"
              >
                <p className="text-gray-500 font-medium flex items-center before:content-[''] before:block before:w-12 before:h-px before:bg-gray-300 before:mr-4">
                  Seamlessly integrates with 30+ platforms
                </p>

                <div className="mt-6 space-y-6">
                  {/* Row 1 */}
                  <div className="overflow-hidden">
                    <div className="flex gap-8 animate-scroll">
                      {companies
                        .slice(0, Math.ceil(companies.length / 2))
                        .map((company) => (
                          <img
                            key={company.name}
                            src={company.logo}
                            alt={company.name}
                            className="h-10 w-auto object-contain opacity-50 hover:opacity-100 transition-opacity duration-300 filter grayscale hover:grayscale-0"
                          />
                        ))}
                      {/* Duplicate logos for seamless looping */}
                      {companies
                        .slice(0, Math.ceil(companies.length / 2))
                        .map((company) => (
                          <img
                            key={`${company.name}-dup`}
                            src={company.logo}
                            alt={company.name}
                            className="h-10 w-auto object-contain opacity-50 hover:opacity-100 transition-opacity duration-300 filter grayscale hover:grayscale-0"
                          />
                        ))}
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div className="overflow-hidden">
                    <div
                      className="flex gap-8"
                      style={{
                        animation: "scroll 25s linear infinite reverse",
                      }}
                    >
                      {companies
                        .slice(Math.ceil(companies.length / 2))
                        .map((company) => (
                          <img
                            key={company.name}
                            src={company.logo}
                            alt={company.name}
                            className="h-10 w-auto object-contain opacity-50 hover:opacity-100 transition-opacity duration-300 filter grayscale hover:grayscale-0"
                          />
                        ))}
                      {companies
                        .slice(Math.ceil(companies.length / 2))
                        .map((company) => (
                          <img
                            key={`${company.name}-dup`}
                            src={company.logo}
                            alt={company.name}
                            className="h-10 w-auto object-contain opacity-50 hover:opacity-100 transition-opacity duration-300 filter grayscale hover:grayscale-0"
                          />
                        ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="lg:col-span-6 relative">
              {/* Background decorative elements */}
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-indigo-50 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
              <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-purple-50 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="relative z-10"
              >
                <div className="relative rounded-2xl overflow-hidden bg-white shadow-2xl">
                  {/* Decorative top bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

                  {/* Browser-like top bar */}
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="mx-auto px-4 py-1 rounded-md bg-white border border-gray-200 text-xs text-gray-400 w-64 text-center">
                      testimonials.yourcompany.com
                    </div>
                  </div>

                  <video
                    autoPlay
                    muted
                    playsInline
                    onEnded={(e) => {
                      setTimeout(() => {
                        console.log("e", e);
                        (
                          (e.target || e.currentTarget) as HTMLVideoElement
                        ).play();
                      }, 30000);
                    }}
                    className="object-cover w-full"
                  >
                    <source
                      src="/media/vids/testimonial_showcase.mp4"
                      type="video/mp4"
                    />
                  </video>

                  {/* Reflection effect */}
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent"></div>
                </div>

                {/* Floating stats card */}
                <div className="absolute -bottom-6 -left-6 bg-white rounded-lg shadow-lg p-4 w-48">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-md bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 12h14M12 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        Conversion
                      </p>
                      <p className="text-lg font-bold text-indigo-600">+38%</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionSection;
