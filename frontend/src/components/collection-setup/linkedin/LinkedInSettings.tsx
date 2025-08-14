import React from "react";
import { observer } from "mobx-react-lite";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Linkedin, Settings, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { LinkedInSettings as LinkedInSettingsType } from "@/types/setup";
import { FormatOption } from "@/types/setup";
import LinkedInTestimonialCollection from "@/components/dashboard-landing/LinkedInTestimonialCollection";

interface LinkedInSettingsProps {
  settings: LinkedInSettingsType;
  onFormatToggle: (formatType: string) => void;
  onSettingsChange: (field: keyof LinkedInSettingsType, value: any) => void;
  onNestedSettingsChange: (parentField: string, field: string, value: any) => void;
  showToast: (toast: any) => void;
}

const LinkedInSettings: React.FC<LinkedInSettingsProps> = observer(({
  settings,
  onFormatToggle,
  onSettingsChange,
  onNestedSettingsChange,
  showToast,
}) => {
  const formatLabels: Record<string, string> = {
    text: "Text Recommendations",
    video: "Video Testimonials",
    audio: "Audio Messages",
    image: "Image Posts",
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Linkedin className="h-5 w-5" />
            LinkedIn Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Connection Status</h3>
              <p className="text-sm text-gray-500">
                {settings.connection.isConnected 
                  ? "Connected to LinkedIn" 
                  : "Not connected to LinkedIn"
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              {settings.connection.isConnected ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
            </div>
          </div>
          
          {settings.connection.accountName && (
            <div className="text-sm text-gray-600">
              Connected as: {settings.connection.accountName}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Type Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Content Type Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settings.formats.map((format) => (
              <div key={format.type} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label className="font-medium">
                    {formatLabels[format.type] || format.type}
                  </Label>
                  <p className="text-sm text-gray-500">
                    {format.enabled ? "Enabled" : "Disabled"}
                  </p>
                </div>
                <Switch
                  checked={format.enabled}
                  onCheckedChange={() => onFormatToggle(format.type)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Collection Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Collection Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Include Recommendations</Label>
              <p className="text-sm text-gray-500">
                Collect LinkedIn recommendations
              </p>
            </div>
            <Switch
              checked={settings.collection.includeRecommendations}
              onCheckedChange={(enabled) => 
                onNestedSettingsChange("collection", "includeRecommendations", enabled)
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Include Endorsements</Label>
              <p className="text-sm text-gray-500">
                Collect skill endorsements
              </p>
            </div>
            <Switch
              checked={settings.collection.includeEndorsements}
              onCheckedChange={(enabled) => 
                onNestedSettingsChange("collection", "includeEndorsements", enabled)
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Include Posts</Label>
              <p className="text-sm text-gray-500">
                Collect relevant LinkedIn posts
              </p>
            </div>
            <Switch
              checked={settings.collection.includePosts}
              onCheckedChange={(enabled) => 
                onNestedSettingsChange("collection", "includePosts", enabled)
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Auto Sync</Label>
              <p className="text-sm text-gray-500">
                Automatically sync from LinkedIn
              </p>
            </div>
            <Switch
              checked={settings.connection.autoSync}
              onCheckedChange={(enabled) => 
                onNestedSettingsChange("connection", "autoSync", enabled)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* LinkedIn Integration */}
      <Card>
        <CardHeader>
          <CardTitle>LinkedIn Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <LinkedInTestimonialCollection />
        </CardContent>
      </Card>
    </div>
  );
});

export default LinkedInSettings; 