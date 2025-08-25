import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Cloud, Settings, RefreshCw, CheckCircle, AlertCircle, FileVideo, FileAudio, FileText, Image, ChevronRight } from "lucide-react";
import { connectionStatusService } from "@/services/connectionStatusService";

// Mock settings data for demo
const mockSettings = {
  connection: {
    isConnected: true,
    accountEmail: "john.doe@company.com",
    autoSync: true,
    syncInterval: 15
  },
  formats: [
    { type: "video", enabled: true },
    { type: "audio", enabled: true },
    { type: "document", enabled: false },
    { type: "image", enabled: true }
  ]
};

const GoogleDriveSettings = () => {
  const [settings, setSettings] = useState(mockSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    accountEmail: '',
  });

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const status = await connectionStatusService.getConnectionStatus('google_drive');
      setConnectionStatus({
        isConnected: status.isConnected,
        accountEmail: status.accountEmail || '',
      });
      
      // Update settings with real connection status
      setSettings(prev => ({
        ...prev,
        connection: {
          ...prev.connection,
          isConnected: status.isConnected,
          accountEmail: status.accountEmail || prev.connection.accountEmail,
        }
      }));
    } catch (error) {
      console.error('Error checking Google Drive connection status:', error);
    }
  };

  const formatLabels = {
    video: "Video Files",
    audio: "Audio Files", 
    document: "Documents",
    image: "Images",
  };

  const formatIcons = {
    video: FileVideo,
    audio: FileAudio,
    document: FileText,
    image: Image,
  };

  const syncIntervalLabels = {
    5: "5 minutes",
    15: "15 minutes",
    30: "30 minutes", 
    60: "1 hour",
    1440: "Daily"
  };

  interface ConnectionSettings {
    isConnected: boolean;
    accountEmail: string;
    autoSync: boolean;
    syncInterval: number;
  }

  type FormatType = "video" | "audio" | "document" | "image";

  interface FormatSetting {
    type: FormatType;
    enabled: boolean;
  }

  interface GoogleDriveSettingsState {
    connection: ConnectionSettings;
    formats: FormatSetting[];
  }

  const onFormatToggle = (formatType: FormatType) => {
    setIsLoading(true);
    setTimeout(() => {
      setSettings((prev: GoogleDriveSettingsState) => ({
        ...prev,
        formats: prev.formats.map((format: FormatSetting) => 
          format.type === formatType 
            ? { ...format, enabled: !format.enabled }
            : format
        )
      }));
      setIsLoading(false);
    }, 300);
  };

  const onNestedSettingsChange = (parentField, field, value) => {
    setSettings(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [field]: value
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Google Drive Integration
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Seamlessly connect and sync your Google Drive files with advanced configuration options
          </p>
        </div>

        {/* Connection Status - Premium Card */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 group">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-colors duration-300">
                <Cloud className="h-6 w-6 text-blue-600" />
              </div>
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-6 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 text-lg">
                  {settings.connection.isConnected ? "Connected" : "Disconnected"}
                </h3>
                <p className="text-gray-600">
                  {settings.connection.isConnected 
                    ? "Your Google Drive is successfully connected and synchronized" 
                    : "Google Drive connection is not established"
                  }
                </p>
                {settings.connection.accountEmail && (
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full w-fit">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    {settings.connection.accountEmail}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                {settings.connection.isConnected ? (
                  <CheckCircle className="h-8 w-8 text-emerald-500 animate-pulse" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-amber-500" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File Format Settings - Premium Grid */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-500">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors duration-300">
                <Settings className="h-6 w-6 text-purple-600" />
              </div>
              File Format Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {settings.formats.map((format, index) => {
                const Icon = formatIcons[format.type];
                return (
                  <div 
                    key={format.type} 
                    className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-500 ${
                      format.enabled 
                        ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg shadow-blue-100/50' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-xl transition-all duration-300 ${
                            format.enabled 
                              ? 'bg-blue-100 text-blue-600' 
                              : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                          }`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <Label className="font-semibold text-gray-900 text-base">
                              {formatLabels[format.type]}
                            </Label>
                            <p className={`text-sm transition-colors ${
                              format.enabled ? 'text-blue-600' : 'text-gray-500'
                            }`}>
                              {format.enabled ? "Active" : "Inactive"}
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={format.enabled}
                          onCheckedChange={() => onFormatToggle(format.type)}
                          className="data-[state=checked]:bg-blue-600"
                        />
                      </div>
                    </div>
                    {format.enabled && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-indigo-400/5 pointer-events-none" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Sync Settings - Premium Configuration */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-500">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors duration-300">
                <RefreshCw className="h-6 w-6 text-emerald-600" />
              </div>
              Synchronization Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Auto Sync Toggle */}
            <div className="flex items-center justify-between p-6 rounded-xl bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-100 hover:shadow-md transition-all duration-300">
              <div className="space-y-2">
                <Label className="font-semibold text-gray-900 text-base">Automatic Synchronization</Label>
                <p className="text-gray-600">
                  Enable real-time file synchronization from your Google Drive
                </p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    settings.connection.autoSync ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-700">
                    {settings.connection.autoSync ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <Switch
                checked={settings.connection.autoSync}
                onCheckedChange={(enabled) => 
                  onNestedSettingsChange("connection", "autoSync", enabled)
                }
                className="data-[state=checked]:bg-emerald-600"
              />
            </div>
            
            {/* Sync Interval Selector */}
            <div className="flex items-center justify-between p-6 rounded-xl bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-100 hover:shadow-md transition-all duration-300">
              <div className="space-y-2">
                <Label className="font-semibold text-gray-900 text-base">Sync Frequency</Label>
                <p className="text-gray-600">
                  Configure how often to check for new files and updates
                </p>
              </div>
              <div className="relative">
                <select
                  value={settings.connection.syncInterval}
                  onChange={(e) => 
                    onNestedSettingsChange("connection", "syncInterval", parseInt(e.target.value))
                  }
                  className="appearance-none bg-white border-2 border-gray-200 rounded-xl px-6 py-3 pr-10 font-medium text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 cursor-pointer hover:border-gray-300"
                >
                  {Object.entries(syncIntervalLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integration Panel */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm hover:shadow-2xl transition-all duration-500">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl text-gray-900">Advanced Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-8 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
                <Cloud className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Premium Google Drive Features</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Experience seamless file management with advanced synchronization, real-time updates, and intelligent file organization.
              </p>
              <div className="flex items-center justify-center gap-6 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">99.9%</div>
                  <div className="text-sm text-gray-600">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">&lt; 1s</div>
                  <div className="text-sm text-gray-600">Sync Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">256-bit</div>
                  <div className="text-sm text-gray-600">Encryption</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GoogleDriveSettings;