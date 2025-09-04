import { Cloud, Upload, Shield, Star, ArrowRight, CheckCircle, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { connectionStatusService } from "@/services/connectionStatusService";

export const GoogleDriveCard = () => {
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkConnectionStatus();
    
    // Also check when the page becomes visible (user returns from OAuth)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setTimeout(() => {
          checkConnectionStatus();
        }, 500);
      }
    };

    const handleFocus = () => {
      setTimeout(() => {
        checkConnectionStatus();
      }, 500);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const status = await connectionStatusService.getConnectionStatus('google_drive');
      setIsConnected(status.isConnected);
    } catch (error) {
      console.error('Error checking Google Drive connection status:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleDriveAction = () => {
    if (isConnected) {
      // Navigate to Google Drive file browser for file import
      navigate('/google-drive');
    } else {
      // Navigate to settings page to connect Google Drive first
      navigate('/settings');
    }
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
          {/* Connection Status */}
          {!isLoading && (
            <div className={`p-3 rounded-lg border ${
              isConnected 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Cloud className="h-4 w-4 text-yellow-600" />
                )}
                <span className={`text-sm font-medium ${
                  isConnected ? 'text-green-700' : 'text-yellow-700'
                }`}>
                  {isConnected ? 'Connected to Google Drive' : 'Not connected to Google Drive'}
                </span>
              </div>
            </div>
          )}

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
                {isConnected ? 'Import Files from Google Drive' : 'Import Existing Testimonials'}
              </p>
              <p className="text-xs text-blue-600/70 mt-1">
                {isConnected 
                  ? 'Browse and import videos, audio, and documents from your Google Drive.'
                  : 'Connect your Google Drive to import videos, audio, and documents as testimonials.'
                }
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
            className={`w-full border ${
              isConnected
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 text-green-700 border-green-100'
                : 'bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 text-blue-700 border-blue-100'
            }`}
            onClick={handleGoogleDriveAction}
            disabled={isLoading}
          >
            {isLoading ? (
              <span>Loading...</span>
            ) : isConnected ? (
              <>
                <span>Import Files</span>
                <Eye className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                <span>Connect Google Drive</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </motion.div>
      </CardContent>
    </Card>
  );
}; 