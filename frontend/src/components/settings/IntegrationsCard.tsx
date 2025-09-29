import React, { useState, useEffect } from "react";
import { Linkedin, Calendar, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import GoogleDriveIcon from "./GoogleDriveIcon";
import DisconnectConfirmModal from "./DisconnectConfirmModal";
import GoogleDriveImport from "./GoogleDriveImport";
import { workspaceHub } from "@/repo/workspace_hub";
import { observer } from "mobx-react-lite";
import { authStore } from "@/stores/authStore";

interface ConnectedAccount {
  provider: "linkedin" | "google";
  email: string;
  name: string;
  connectedAt: string;
  status: "active" | "inactive";
}

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const integrations: Integration[] = [
  {
    id: "linkedin",
    name: "LinkedIn",
    description: "Share testimonials and build your professional presence",
    icon: Linkedin,
  },
  {
    id: "google",
    name: "Google Drive",
    description: "Import and sync testimonials from your drive",
    icon: GoogleDriveIcon,
  },
];

const IntegrationsCard: React.FC = observer(() => {
  const [connectedAccounts, setConnectedAccounts] = useState<
    ConnectedAccount[]
  >([]);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [disconnectModal, setDisconnectModal] = useState<{
    open: boolean;
    integration?: Integration;
    account?: ConnectedAccount;
  }>({ open: false });
  const { toast } = useToast();

  useEffect(() => {
    loadConnectedAccounts();

    // Check if we need to refresh after OAuth callback
    if (localStorage.getItem('refreshAccounts') === 'true') {
      localStorage.removeItem('refreshAccounts');
      // Wait a moment for the backend to process the connection
      setTimeout(() => {
        loadConnectedAccounts();
      }, 1000);
    }
  }, []);

  const loadConnectedAccounts = async () => {
    if (!workspaceHub.workspace?.id) return;
    const tokenInfo = await authStore.getToken();

    try {
      const allAccounts: ConnectedAccount[] = [];

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
        const socialAccounts = socialData.accounts || [];

        const linkedInAccounts: ConnectedAccount[] = socialAccounts.map(
          (account: any) => ({
            provider: "linkedin" as const,
            email: account.email || account.username,
            name: account.name || account.display_name,
            connectedAt: account.connected_at || new Date().toISOString(),
            status: account.active ? "active" : "inactive",
          })
        );

        allAccounts.push(...linkedInAccounts);
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
        const googleAccounts = googleData.accounts || [];

        const driveAccounts: ConnectedAccount[] = googleAccounts.map(
          (account: any) => ({
            provider: "google" as const,
            email: account.email || account.account_email,
            name: account.name || account.account_name,
            connectedAt: account.connected_at || account.created_at || new Date().toISOString(),
            status: account.status === "connected" ? "active" : "inactive",
          })
        );

        allAccounts.push(...driveAccounts);
      }

      setConnectedAccounts(allAccounts);
    } catch (error) {
      console.error("Failed to load connected accounts:", error);
    }
  };

  const handleConnect = async (integration: Integration) => {
    const tokenInfo = await authStore.getToken();
    if (!workspaceHub.workspace?.id) {
      toast({
        title: "Workspace required",
        description: "Please ensure you have a valid workspace.",
        variant: "destructive",
      });
      return;
    }

    setLoading({ ...loading, [integration.id]: true });

    try {
      let authUrl: string;

      if (integration.id === "linkedin") {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/social/workspaces/${workspaceHub.workspace.id}/social/auth/linkedin`,
          {
            headers: {
              Authorization: `Bearer ${tokenInfo.token}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to get LinkedIn auth URL");
        const data = await response.json();
        authUrl = data.data.auth_url;
      } else if (integration.id === "google") {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/google/workspaces/${workspaceHub.workspace.id}/drive/auth`,
          {
            headers: {
              Authorization: `Bearer ${tokenInfo.token}`,
            },
          }
        );

        if (!response.ok)
          throw new Error("Failed to get Google Drive auth URL");
        const data = await response.json();
        authUrl = data.auth_url;
      } else {
        throw new Error("Unsupported integration");
      }

      if (authUrl) {
        // Store a callback to refresh accounts after connection
        localStorage.setItem('refreshAccounts', 'true');
        window.location.href = authUrl;
      } else {
        throw new Error("No auth URL received");
      }
    } catch (error) {
      console.error(`Failed to connect to ${integration.name}:`, error);
      toast({
        title: "Connection failed",
        description: `Unable to connect to ${integration.name}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setLoading({ ...loading, [integration.id]: false });
    }
  };

  const handleDisconnect = async (provider: string) => {
    if (!workspaceHub.workspace?.id) return;

    try {
      setConnectedAccounts(
        connectedAccounts.filter((account) => account.provider !== provider)
      );
      toast({
        title: "Disconnected",
        description: `Successfully disconnected from ${disconnectModal.integration?.name}`,
      });
    } catch (error) {
      console.error(`Failed to disconnect from ${provider}:`, error);
      toast({
        title: "Disconnection failed",
        description: `Failed to disconnect from ${disconnectModal.integration?.name}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setDisconnectModal({ open: false });
    }
  };

  const isConnected = (integrationId: string) => {
    return connectedAccounts.some(
      (account) => account.provider === integrationId
    );
  };

  const getConnectedAccount = (integrationId: string) => {
    return connectedAccounts.find(
      (account) => account.provider === integrationId
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Main Card */}
      <div className="bg-white border border-gray-200 rounded-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">
            Platform Integrations
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Connect external services to enhance your workflow
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {integrations.map((integration) => {
            const Icon = integration.icon;
            const connected = isConnected(integration.id);
            const account = getConnectedAccount(integration.id);
            const isLoading = loading[integration.id];

            return (
              <div key={integration.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gray-50 rounded border border-gray-200 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {integration.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {integration.description}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {connected ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-gray-600">Connected</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setDisconnectModal({
                              open: true,
                              integration,
                              account,
                            })
                          }
                          className="text-xs h-7 px-2"
                        >
                          Disconnect
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleConnect(integration)}
                        disabled={isLoading}
                        size="sm"
                        className="text-xs h-7 px-3"
                      >
                        {isLoading ? "Connecting..." : "Connect"}
                      </Button>
                    )}
                  </div>
                </div>

                {connected && account && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>{account.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Mail className="w-3 h-3" />
                        <span>{account.email}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>Connected {formatDate(account.connectedAt)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Connected Accounts Summary */}
      {connectedAccounts.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">
              Connected Accounts
            </h3>
          </div>
          <div className="p-6">
            <div className="text-xs text-gray-500">
              {connectedAccounts.length} account
              {connectedAccounts.length !== 1 ? "s" : ""} connected
            </div>
          </div>
        </div>
      )}

      {/* Google Drive Import */}
      {isConnected("google") && <GoogleDriveImport />}

      {/* Disconnect Confirmation Modal */}
      <DisconnectConfirmModal
        open={disconnectModal.open}
        onClose={() => setDisconnectModal({ open: false })}
        onConfirm={() => {
          if (disconnectModal.account) {
            handleDisconnect(disconnectModal.account.provider);
          }
        }}
        integrationName={disconnectModal.integration?.name || ""}
        accountEmail={disconnectModal.account?.email || ""}
      />
    </div>
  );
});

export default IntegrationsCard;
