import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

const PricingSection = () => {
  const features = [
    {
      title: "Video & Text Collection",
      description:
        "Collect 15 video and text testimonials more than anywhere else",
      category: "Collection",
    },
    {
      title: "Smart Collection Form",
      description: "Create a stunning collection form in 60 seconds",
      category: "Collection",
    },
    {
      title: "Easy Sharing",
      description: "Share and embed your form everywhere",
      category: "Sharing",
    },
    {
      title: "Smart Invites",
      description:
        "Invite happy customers individually or in bulk with automated follow-ups",
      category: "Management",
    },
    {
      title: "Social Import",
      description: "Import your social proof from 15+ platforms",
      category: "Collection",
    },
    {
      title: "Advanced Search",
      description: "Find the perfect testimonial with powerful tagging",
      category: "Management",
    },
    {
      title: "Unlimited Widgets",
      description: "Create and embed beautiful testimonial displays",
      category: "Display",
    },
    {
      title: "Analytics Dashboard",
      description: "Track performance and engagement metrics",
      category: "Analytics",
    },
    {
      title: "Video Hosting",
      description: "Unlimited video testimonial hosting included",
      category: "Infrastructure",
    },
  ];

  return (
    <div className=" max-w-7xl mx-auto bg-gradient-to-b from-[#E5DCC5] to-white">
      <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-[#2D2D2A] mb-6">
            Plans & Pricing
          </h1>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-[#C14953] mb-4">
              $0<span className="text-2xl">/month</span>
            </h2>
            <p className="text-[#4C4C47] text-lg">
              Free, forever. Start collecting and sharing authentic testimonials
              today. Upgrade anytime for unlimited features.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="p-6 bg-white hover:shadow-xl transition-all duration-300 border border-[#848FA5]/20 hover:border-[#C14953]/30"
            >
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <CheckCircle2 className="w-5 h-5 text-[#C14953]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#2D2D2A] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-[#848FA5] text-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button className="px-8 py-3 bg-[#C14953] text-white rounded-lg font-semibold hover:bg-[#C14953]/90 transition-colors duration-300">
            Sign up for free
          </button>
          <p className="mt-4 text-[#848FA5] text-sm">No credit card required</p>
        </div>
      </div>
    </div>
  );
};

export default PricingSection;
