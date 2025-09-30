import React, { useState } from "react";
import { motion } from "framer-motion";
import IntegrationsCard from "./IntegrationsCard";
import EmailTemplatesCard from "./EmailTemplatesCard";
import CaptureWidgetCard from "./CaptureWidgetCard";
import TestimonialRequestModal from "../dashboard-landing/TestimonialRequestModal";
import BrandGuide from "../brand-guide";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

type SettingsSection =
  | "profile"
  | "integrations"
  | "brand"
  | "communications";

const SettingsPanel: React.FC = () => {
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("integrations");
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const sections = [
    {
      id: "profile" as const,
      label: "Profile",
    },
    {
      id: "integrations" as const,
      label: "Integrations",
    },
    {
      id: "brand" as const,
      label: "Brand Guide",
    },
    {
      id: "communications" as const,
      label: "Communications",
    },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return (
          <div className="bg-white border border-gray-200 rounded-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">
                Profile Settings
              </h3>
            </div>
            <div className="p-6">
              <p className="text-xs text-gray-500">
                Profile management coming soon...
              </p>
            </div>
          </div>
        );
      case "integrations":
        return <IntegrationsCard />;
      case "brand":
        return <BrandGuide />;
      case "communications":
        return (
          <div className="space-y-6">
            {/* Testimonial Requests */}
            <div className="bg-white border border-gray-200 rounded-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">
                  Testimonial Requests
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Send testimonial collection requests to your customers
                </p>
              </div>
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      Request Testimonials from Customers
                    </div>
                    <div className="text-xs text-gray-500 mb-4 sm:mb-0">
                      Send single emails or bulk requests using CSV uploads.
                      Customize with your email templates.
                    </div>
                  </div>
                  <Button
                    onClick={() => setIsRequestModalOpen(true)}
                    size="sm"
                    className="text-xs h-7 w-full sm:w-auto"
                  >
                    <Mail className="h-3 w-3 mr-2" />
                    Send Requests
                  </Button>
                </div>
              </div>
            </div>

            {/* Capture Widget */}
            <CaptureWidgetCard />

            {/* Email Templates */}
            <EmailTemplatesCard />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full min-h-screen">
      <div className="max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
          <h1 className="text-base font-medium text-gray-900">Settings</h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage your workspace configuration and integrations
          </p>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Mobile Navigation - Horizontal Tabs */}
          <div className="lg:hidden bg-white border-b border-gray-200">
            <nav className="p-4">
              <div className="flex space-x-1 overflow-x-auto">
                {sections.map((section) => {
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`flex-shrink-0 px-3 py-2 text-xs font-medium rounded-sm transition-colors whitespace-nowrap ${
                        isActive
                          ? "bg-gray-900 text-white"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      {section.label}
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>

          {/* Desktop Sidebar Navigation */}
          <div className="hidden lg:block lg:w-64 bg-white border-r border-gray-200">
            <nav className="p-4">
              <div className="space-y-1">
                {sections.map((section) => {
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left px-3 py-2 text-xs font-medium rounded-sm transition-colors ${
                        isActive
                          ? "bg-gray-900 text-white"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      {section.label}
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-4 sm:p-6">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
            >
              {renderContent()}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Testimonial Request Modal */}
      <TestimonialRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
      />
    </div>
  );
};

export default SettingsPanel;
