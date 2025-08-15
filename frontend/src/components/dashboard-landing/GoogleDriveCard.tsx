import { Cloud, Upload, Shield, Star, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const GoogleDriveCard = () => {
  const navigate = useNavigate();

  const handleGoogleDriveConnect = () => {
    console.log('Google Drive card button clicked!');
    // Navigate to the Google Drive integration page
    navigate('/dashboard?tab=google-drive');
  };

  return (
    <Card className="border-0 shadow-xl overflow-hidden bg-white">
      <CardHeader className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <CardTitle className="text-lg font-semibold flex items-center">
          <Cloud className="h-5 w-5 text-blue-600 mr-2" />
          Google Drive Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Upload className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="font-medium text-gray-800 block text-sm">Import Files</span>
              <span className="text-xs text-gray-500">Connect and import testimonials</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-purple-50 border border-purple-100">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="font-medium text-gray-800 block text-sm">Secure Access</span>
              <span className="text-xs text-gray-500">OAuth 2.0 protected connection</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50 border border-green-100">
            <div className="p-2 bg-green-600 rounded-lg">
              <Star className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="font-medium text-gray-800 block text-sm">Premium Feature</span>
              <span className="text-xs text-gray-500">AI-powered processing</span>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Cloud className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-700">
                Import Existing Testimonials
              </p>
              <p className="text-xs text-blue-600/70 mt-1">
                Connect your Google Drive to import videos, audio, and documents as testimonials.
              </p>
            </div>
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
            className="w-full bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 text-blue-700 border border-blue-100"
            onClick={handleGoogleDriveConnect}
          >
            <span>Connect Google Drive</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      </CardContent>
    </Card>
  );
}; 