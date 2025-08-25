import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { 
  Cloud, 
  Linkedin, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  ArrowUpRight,
  Shield,
  Zap,
  Users
} from 'lucide-react';

interface IntegrationsSettingsProps {
  googleDriveConnected: boolean;
  linkedInConnected: boolean;
  isLoading: boolean;
  isGoogleDriveConnecting: boolean;
  isLinkedInConnecting: boolean;
  onGoogleDriveConnect: () => void;
  onGoogleDriveDisconnect: () => void;
  onLinkedInConnect: () => void;
  onLinkedInDisconnect: () => void;
}

const IntegrationsSettings: React.FC<IntegrationsSettingsProps> = ({
  googleDriveConnected,
  linkedInConnected,
  isLoading,
  isGoogleDriveConnecting,
  isLinkedInConnecting,
  onGoogleDriveConnect,
  onGoogleDriveDisconnect,
  onLinkedInConnect,
  onLinkedInDisconnect
}) => {
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);

  const handleGoogleDriveAction = React.useCallback(() => {
    console.log('Google Drive action triggered, connected:', googleDriveConnected);
    if (googleDriveConnected) {
      console.log('Calling onGoogleDriveDisconnect');
      onGoogleDriveDisconnect();
    } else {
      console.log('Calling onGoogleDriveConnect');
      onGoogleDriveConnect();
    }
  }, [googleDriveConnected, onGoogleDriveConnect, onGoogleDriveDisconnect]);

  const handleLinkedInAction = React.useCallback(() => {
    console.log('LinkedIn action triggered, connected:', linkedInConnected);
    if (linkedInConnected) {
      console.log('Calling onLinkedInDisconnect');
      onLinkedInDisconnect();
    } else {
      console.log('Calling onLinkedInConnect');
      onLinkedInConnect();
    }
  }, [linkedInConnected, onLinkedInConnect, onLinkedInDisconnect]);

  const integrations = React.useMemo(() => [
    {
      name: "Google Drive",
      description: "Seamlessly import testimonials, documents, and media files from your Google Drive workspace",
      icon: <Cloud className="h-6 w-6" />,
      status: googleDriveConnected ? "connected" : "disconnected",
      action: handleGoogleDriveAction,
      actionText: googleDriveConnected ? "Disconnect" : "Connect",
      isConnecting: isGoogleDriveConnecting,
      features: ["Auto-sync files", "Real-time updates", "Secure encryption"],
      stats: { files: "1,247", lastSync: "2 mins ago" },
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50",
      borderColor: "border-blue-200"
    },
    {
      name: "LinkedIn",
      description: "Import professional recommendations, endorsements, and networking data from LinkedIn",
      icon: <Linkedin className="h-6 w-6" />,
      status: linkedInConnected ? "connected" : "disconnected", 
      action: handleLinkedInAction,
      actionText: linkedInConnected ? "Disconnect" : "Connect",
      isConnecting: isLinkedInConnecting,
      features: ["Import recommendations", "Sync endorsements", "Profile data"],
      stats: { connections: "542", recommendations: "23" },
      gradient: "from-blue-600 to-indigo-600",
      bgGradient: "from-blue-50 to-indigo-50",
      borderColor: "border-indigo-200"
    }
  ], [googleDriveConnected, linkedInConnected, isGoogleDriveConnecting, isLinkedInConnecting, handleGoogleDriveAction, handleLinkedInAction]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Premium Header Section */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 border border-purple-200/50 mb-6">
            <ExternalLink className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">Platform Integrations</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent">
            Connect Your Ecosystem
          </h1>
          <p className="text-sm text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Unlock the power of seamless data integration with enterprise-grade security and real-time synchronization
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-emerald-100">
                <Shield className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="font-semibold text-gray-900">Security</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">256-bit</div>
            <div className="text-sm text-gray-600">End-to-end encryption</div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-blue-100">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <span className="font-semibold text-gray-900">Performance</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">&lt; 2s</div>
            <div className="text-sm text-gray-600">Average sync time</div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-purple-100">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <span className="font-semibold text-gray-900">Trusted</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">10k+</div>
            <div className="text-sm text-gray-600">Active integrations</div>
          </div>
        </div>

        {/* Premium Integration Cards */}
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
                <ExternalLink className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-900 mb-2">
                  Platform Integrations
                </CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  Connect and synchronize your favorite platforms with advanced configuration options
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {integrations.map((integration, index) => (
              <div key={integration.name} className="group">
                <div 
                  className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-500 hover:shadow-2xl ${
                    integration.status === 'connected' 
                      ? `${integration.borderColor} bg-gradient-to-br ${integration.bgGradient} shadow-lg` 
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-xl'
                  }`}
                  onMouseEnter={() => setHoveredItem(integration.name)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  {/* Background Decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-5 transform rotate-12 translate-x-8 -translate-y-8">
                    {integration.icon}
                  </div>
                  
                  <div className="relative p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-start gap-5">
                        <div className={`p-4 rounded-2xl transition-all duration-300 ${
                          integration.status === 'connected'
                            ? `bg-gradient-to-r ${integration.gradient} text-white shadow-lg`
                            : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                        }`}>
                          {integration.icon}
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold text-gray-900">
                              {integration.name}
                            </h3>
                            {integration.status === 'connected' && (
                              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                <span className="text-xs font-medium text-emerald-700">Live</span>
                              </div>
                            )}
                          </div>
                          
                          <p className="text-gray-600 text-base leading-relaxed max-w-lg">
                            {integration.description}
                          </p>
                          
                          {/* Features List */}
                          <div className="flex flex-wrap gap-2">
                            {integration.features.map((feature, idx) => (
                              <span 
                                key={idx}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                  integration.status === 'connected'
                                    ? 'bg-white/60 text-gray-700 border border-white/40'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                          
                          {/* Stats */}
                          {integration.status === 'connected' && (
                            <div className="flex gap-6 pt-2">
                              {Object.entries(integration.stats).map(([key, value]) => (
                                <div key={key} className="text-sm">
                                  <div className="font-semibold text-gray-900">{value}</div>
                                  <div className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Area */}
                      <div className="flex flex-col items-end gap-4">
                        <Badge 
                          variant={integration.status === "connected" ? "default" : "secondary"}
                          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${
                            integration.status === "connected" 
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200" 
                              : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {integration.status === "connected" ? (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              <span>Connected</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4" />
                              <span>Disconnected</span>
                            </>
                          )}
                        </Badge>
                        
                        <Button 
                          variant={integration.status === "connected" ? "outline" : "default"}
                          size="lg"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log(`Button clicked for: ${integration.name}`);
                            integration.action();
                          }}
                          disabled={integration.isConnecting}
                          className={`min-w-[140px] h-12 transition-all duration-300 group ${
                            integration.status !== "connected" 
                              ? `bg-gradient-to-r ${integration.gradient} hover:shadow-xl transform hover:-translate-y-0.5 text-white font-semibold`
                              : "border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                          }`}
                        >
                          {integration.isConnecting ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                              <span>Connecting...</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span>{integration.actionText}</span>
                              {integration.status !== "connected" && (
                                <ArrowUpRight className="h-4 w-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                              )}
                            </div>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Hover Effect Overlay */}
                  {hoveredItem === integration.name && integration.status !== 'connected' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 pointer-events-none" />
                  )}
                </div>
                
                {/* Separator */}
                {index < integrations.length - 1 && (
                  <div className="relative py-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <div className="px-4 bg-gradient-to-r from-slate-50 via-white to-gray-50">
                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
        
        {/* Footer Message */}
        <div className="text-center py-8">
          <p className="text-gray-600 max-w-2xl mx-auto">
            Need help with integration setup? Our support team is available 24/7 to assist you with connecting your platforms securely and efficiently.
          </p>
        </div>
      </div>
    </div>
  );
};

export default IntegrationsSettings;