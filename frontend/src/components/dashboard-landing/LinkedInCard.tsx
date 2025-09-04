
import { Linkedin, Users, Shield, ArrowRight, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const LinkedInCard = () => {
  const navigate = useNavigate();

  const handleLinkedInConnect = () => {
    // Navigate to the LinkedIn integration page
    navigate('/dashboard?tab=linkedin');
  };

  return (
    <Card className="border-0 shadow-xl overflow-hidden bg-white">
      <CardHeader className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="text-lg font-semibold flex items-center">
          <Linkedin className="h-5 w-5 text-blue-600 mr-2" />
          LinkedIn Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Users className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="font-medium text-gray-800 block text-sm">Professional Network</span>
              <span className="text-xs text-gray-500">Import testimonials from LinkedIn</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="font-medium text-gray-800 block text-sm">Secure OAuth</span>
              <span className="text-xs text-gray-500">GDPR compliant connection</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50 border border-green-100">
            <div className="p-2 bg-green-600 rounded-lg">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="font-medium text-gray-800 block text-sm">Premium Feature</span>
              <span className="text-xs text-gray-500">Advanced analytics & insights</span>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Linkedin className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-700">
                Import Professional Testimonials
              </p>
              <p className="text-xs text-blue-600/70 mt-1">
                Connect your LinkedIn to import recommendations, endorsements, and professional testimonials.
              </p>
            </div>
          </div>
        </div>
        
        {/* Stats Preview */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-800">247</div>
            <div className="text-xs text-gray-500">Testimonials</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-800">4.9</div>
            <div className="text-xs text-gray-500">Avg Rating</div>
          </div>
        </div>
        
        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-5 text-center"
        >
          <Button
            variant="ghost"
            size="sm"
            className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 border border-blue-100"
            onClick={handleLinkedInConnect}
          >
            <span>Connect LinkedIn</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      </CardContent>
    </Card>
  );
}; 