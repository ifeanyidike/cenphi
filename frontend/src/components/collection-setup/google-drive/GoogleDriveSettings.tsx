import React from "react";
import { observer } from "mobx-react-lite";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Cloud, Settings, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { GoogleDriveSettings as GoogleDriveSettingsType } from "@/types/setup";
import GoogleDriveTestimonialCollection from "@/components/collection/GoogleDriveTestimonialCollection";

interface GoogleDriveSettingsProps {
  settings: GoogleDriveSettingsType;
  onFormatToggle: (formatType: string) => void;
  onSettingsChange: (field: keyof GoogleDriveSettingsType, value: any) => void;
  onNestedSettingsChange: (parentField: string, field: string, value: any) => void;
  showToast: (toast: any) => void;
}

const GoogleDriveSettings: React.FC<GoogleDriveSettingsProps> = observer(({
  settings,
  onFormatToggle,
  onNestedSettingsChange,
}) => {
  const formatLabels: Record<string, string> = {
    video: "Video Files",
    audio: "Audio Files",
    document: "Documents",
    image: "Images",
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Google Drive Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Connection Status</h3>
              <p className="text-sm text-gray-500">
                {settings.connection.isConnected 
                  ? "Connected to Google Drive" 
                  : "Not connected to Google Drive"
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
          
          {settings.connection.accountEmail && (
            <div className="text-sm text-gray-600">
              Connected as: {settings.connection.accountEmail}
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Format Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            File Format Settings
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

      {/* Sync Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Sync Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Auto Sync</Label>
              <p className="text-sm text-gray-500">
                Automatically sync files from Google Drive
              </p>
            </div>
            <Switch
              checked={settings.connection.autoSync}
              onCheckedChange={(enabled) => 
                onNestedSettingsChange("connection", "autoSync", enabled)
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Sync Interval</Label>
              <p className="text-sm text-gray-500">
                How often to check for new files
              </p>
            </div>
            <select
              value={settings.connection.syncInterval}
              onChange={(e) => 
                onNestedSettingsChange("connection", "syncInterval", parseInt(e.target.value))
              }
              className="border rounded px-3 py-1"
            >
              <option value={5}>5 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={1440}>Daily</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Google Drive Integration */}
      <Card>
        <CardHeader>
          <CardTitle>Google Drive Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <GoogleDriveTestimonialCollection />
        </CardContent>
      </Card>
    </div>
  );
});

export default GoogleDriveSettings; 