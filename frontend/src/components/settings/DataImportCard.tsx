import React, { useState, useEffect } from "react";
import { Download, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import GoogleDriveImportModal from "./GoogleDriveImportModal";
import GoogleDriveIcon from "./GoogleDriveIcon";
import { workspaceHub } from "@/repo/workspace_hub";
import { authStore } from "@/stores/authStore";
import { observer } from "mobx-react-lite";
import SimpleModalPortal from "@/utils/SimpleModalPortal";

interface ImportSource {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  supportedFormats: string[];
  requiresConnection: boolean;
  connectionProvider?: "google";
}

const importSources: ImportSource[] = [
  {
    id: "google-drive",
    name: "Google Drive",
    description: "Import testimonials from Google Drive documents and videos",
    icon: GoogleDriveIcon,
    supportedFormats: ["Google Docs", "PDF", "MP4", "MOV", "TXT"],
    requiresConnection: true,
    connectionProvider: "google",
  },
];

const DataImportCard: React.FC = observer(() => {
  const [importModal, setImportModal] = useState<{
    open: boolean;
    source?: ImportSource;
  }>({ open: false });
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);
  const [connectionWarning, setConnectionWarning] = useState<{
    show: boolean;
    providerName: string;
  }>({ show: false, providerName: "" });

  useEffect(() => {
    loadConnectedAccounts();
  }, []);

  const loadConnectedAccounts = async () => {
    if (!workspaceHub.workspace?.id) return;

    const tokenInfo = await authStore.getToken();

    try {
      const allAccounts: any[] = [];

      // Fetch LinkedIn accounts
      const socialResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/social/workspaces/${workspaceHub.workspace.id}/social/accounts`,
        {
          headers: {
            Authorization: `Bearer ${tokenInfo.token}`,
          },
        }
      );

      if (socialResponse.ok) {
        const socialData = await socialResponse.json();
        const socialAccounts = (socialData.accounts || []).map(
          (account: any) => ({
            ...account,
            platform: "linkedin",
          })
        );
        allAccounts.push(...socialAccounts);
      }

      // Fetch Google Drive accounts
      const googleResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/google/workspaces/${workspaceHub.workspace.id}/drive/accounts`,
        {
          headers: {
            Authorization: `Bearer ${tokenInfo.token}`,
          },
        }
      );

      if (googleResponse.ok) {
        const googleData = await googleResponse.json();
        const googleAccounts = (googleData.accounts || []).map(
          (account: any) => ({
            ...account,
            platform: "google",
          })
        );
        allAccounts.push(...googleAccounts);
      }

      setConnectedAccounts(allAccounts);
    } catch (error) {
      console.error("Failed to load connected accounts:", error);
    }
  };

  const isConnected = (provider?: string) => {
    if (provider === "google") {
      return connectedAccounts.some(
        (account) =>
          account.platform === "google" || account.platform === "google-drive"
      );
    }
    return false;
  };

  const handleImportClick = (source: ImportSource) => {
    if (source.requiresConnection && !isConnected(source.connectionProvider)) {
      const providerName =
        source.connectionProvider === "google"
          ? "Google Drive"
          : source.connectionProvider || "";
      setConnectionWarning({ show: true, providerName });
      return;
    }

    setImportModal({ open: true, source });
  };

  return (
    <div className="space-y-6">
      {/* Main Card */}
      <div className="bg-white border border-gray-200 rounded-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">Data Import</h3>
          <p className="text-xs text-gray-500 mt-1">
            Import testimonials from external sources and documents
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {importSources.map((source) => {
            const Icon = source.icon;
            const connected =
              !source.requiresConnection ||
              isConnected(source.connectionProvider);

            return (
              <div key={source.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gray-50 rounded border border-gray-200 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {source.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {source.description}
                      </div>
                      <div className="flex items-center space-x-1 mt-2">
                        <span className="text-xs text-gray-400">Supports:</span>
                        {source.supportedFormats
                          .slice(0, 3)
                          .map((format, index) => (
                            <span
                              key={index}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                            >
                              {format}
                            </span>
                          ))}
                        {source.supportedFormats.length > 3 && (
                          <span className="text-xs text-gray-400">
                            +{source.supportedFormats.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {source.requiresConnection && (
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-gray-400"}`}
                        ></div>
                        <span className="text-xs text-gray-500">
                          {connected ? "Connected" : "Not connected"}
                        </span>
                      </div>
                    )}
                    <Button
                      onClick={() => handleImportClick(source)}
                      disabled={!connected}
                      size="sm"
                      className="text-xs h-7 px-3"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Import
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Import Guidelines */}
      <div className="bg-white border border-gray-200 rounded-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">
            Import Guidelines
          </h3>
        </div>
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6 text-xs text-gray-600">
            <div>
              <div className="font-medium text-gray-900 mb-2">
                Document Processing
              </div>
              <ul className="space-y-1">
                <li>• Automatic text extraction from PDFs and docs</li>
                <li>• Smart testimonial content detection</li>
                <li>• Preserves original formatting context</li>
              </ul>
            </div>
            <div>
              <div className="font-medium text-gray-900 mb-2">
                Video Processing
              </div>
              <ul className="space-y-1">
                <li>• AI-powered speech-to-text conversion</li>
                <li>• Automatic sentiment analysis</li>
                <li>• Timestamps for key testimonial moments</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started */}
      <div className="bg-white border border-gray-200 rounded-sm">
        <div className="p-6 text-center">
          <div className="text-sm font-medium text-gray-900 mb-2">
            Ready to Import?
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Connect your Google Drive in the Integrations section to start
            importing testimonials.
          </p>
          <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
            <span>Secure</span>
            <span>•</span>
            <span>Fast</span>
            <span>•</span>
            <span>Smart</span>
          </div>
        </div>
      </div>

      {/* Google Drive Import Modal */}
      <GoogleDriveImportModal
        open={importModal.open}
        onClose={() => setImportModal({ open: false })}
        source={importModal.source}
      />

      {/* Connection Warning Modal */}
      <SimpleModalPortal
        isOpen={connectionWarning.show}
        onClose={() => setConnectionWarning({ show: false, providerName: "" })}
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-base font-semibold text-gray-900">
                Connection Required
              </h2>
            </div>
            <button
              onClick={() =>
                setConnectionWarning({ show: false, providerName: "" })
              }
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5">
            <p className="text-sm text-gray-600 leading-relaxed">
              To import data, you need to connect your{" "}
              <span className="font-medium text-gray-900">
                {connectionWarning.providerName}
              </span>{" "}
              account first.
            </p>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">
                💡 You can connect your account in the{" "}
                <span className="font-medium">Integrations</span> section.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 bg-gray-50">
            <Button
              variant="outline"
              onClick={() =>
                setConnectionWarning({ show: false, providerName: "" })
              }
              className="text-gray-700 border-gray-300 hover:bg-gray-100 h-9 px-4 text-sm"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setConnectionWarning({ show: false, providerName: "" });
                // Navigate to integrations section
                window.location.hash = "integrations";
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 text-sm"
            >
              Go to Integrations
            </Button>
          </div>
        </div>
      </SimpleModalPortal>
    </div>
  );
});

export default DataImportCard;
