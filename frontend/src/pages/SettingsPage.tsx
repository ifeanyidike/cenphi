import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

import IntegrationsSettings from '@/components/collection/IntegrationsSettings';
import { oauthService } from '@/services/oauthService';
import { connectionStatusService } from '@/services/connectionStatusService';

const SettingsPage: React.FC = () => {
  const [googleDriveConnected, setGoogleDriveConnected] = useState(false);
  const [linkedInConnected, setLinkedInConnected] = useState(false);
  // const [isLoading, setIsLoading] = useState(true);
  const [isGoogleDriveConnecting, setIsGoogleDriveConnecting] = useState(false);
  const [isLinkedInConnecting, setIsLinkedInConnecting] = useState(false);
  const [disconnectMessage, setDisconnectMessage] = useState<string | null>(null);

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  // Check connection status on component mount and when page becomes visible
  useEffect(() => {
    const checkConnectionStatus = async () => {
      try {
        // setIsLoading(true);
        
        // Check Google Drive connection status using connectionStatusService
        const googleDriveStatus = await connectionStatusService.getConnectionStatus('google_drive');
        const googleStatus = await connectionStatusService.getConnectionStatus('google');
        
        // Use either google_drive or google status
        const isConnected = googleDriveStatus.isConnected || googleStatus.isConnected;
        console.log('SettingsPage: Google Drive connection status:', { googleDriveStatus, googleStatus, isConnected });
        setGoogleDriveConnected(isConnected);
        
        // Check LinkedIn connection status
        const linkedInStatus = await connectionStatusService.getConnectionStatus('linkedin');
        console.log('SettingsPage: LinkedIn connection status:', linkedInStatus);
        setLinkedInConnected(linkedInStatus.isConnected);
        
      } catch (error) {
        console.error('Error checking connection status:', error);
        // If there's an error, assume not connected
        setGoogleDriveConnected(false);
        setLinkedInConnected(false);
      } finally {
        // setIsLoading(false);
      }
    };

    checkConnectionStatus();

    // Also check when the page becomes visible (user returns from OAuth)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Add a small delay to ensure OAuth callback has completed
        setTimeout(() => {
          checkConnectionStatus();
        }, 1000); // Increased delay for LinkedIn OAuth
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also check when the page gains focus (user returns from OAuth)
    const handleFocus = () => {
      setTimeout(() => {
        checkConnectionStatus();
      }, 1000); // Increased delay for LinkedIn OAuth
    };

    window.addEventListener('focus', handleFocus);
    
    // Also check when the page loads (in case user navigates directly to settings)
    const handleLoad = () => {
      setTimeout(() => {
        checkConnectionStatus();
      }, 500);
    };

    window.addEventListener('load', handleLoad);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  const handleGoogleDriveConnect = React.useCallback(async () => {
    console.log('SettingsPage: handleGoogleDriveConnect called');
    try {
      setIsGoogleDriveConnecting(true);
      // Use the connectProvider method which handles the redirect flow
      await oauthService.connectProvider('google-drive');
    } catch (error) {
      console.error('Error connecting to Google Drive:', error);
    } finally {
      setIsGoogleDriveConnecting(false);
    }
  }, []);

  const handleGoogleDriveDisconnect = React.useCallback(async () => {
    console.log('SettingsPage: handleGoogleDriveDisconnect called');
    try {
      setIsGoogleDriveConnecting(true);
      
      // Call the oauthService disconnect method
      await oauthService.disconnectProvider('google-drive');
      
      // Clear the connection status from connectionStatusService
      connectionStatusService.disconnectProvider('google_drive');
      
      // Update the local state
      setGoogleDriveConnected(false);
      
      // Show success message
      setDisconnectMessage('Google Drive disconnected successfully!');
      setTimeout(() => setDisconnectMessage(null), 3000);
      
      console.log('SettingsPage: Google Drive disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting Google Drive:', error);
    } finally {
      setIsGoogleDriveConnecting(false);
    }
  }, []);

  const handleLinkedInConnect = React.useCallback(async () => {
    console.log('SettingsPage: handleLinkedInConnect called');
    try {
      setIsLinkedInConnecting(true);
      // Use the connectProvider method which handles the redirect flow (like Google Drive)
      await oauthService.connectProvider('linkedin');
    } catch (error) {
      console.error('Error connecting to LinkedIn:', error);
    } finally {
      setIsLinkedInConnecting(false);
    }
  }, []);

  const handleLinkedInDisconnect = React.useCallback(async () => {
    console.log('SettingsPage: handleLinkedInDisconnect called');
    try {
      setIsLinkedInConnecting(true);
      
      // Call the oauthService disconnect method
      await oauthService.disconnectProvider('linkedin');
      
      // Clear the connection status from connectionStatusService
      connectionStatusService.disconnectProvider('linkedin');
      
      // Update the local state
      setLinkedInConnected(false);
      
      // Show success message
      setDisconnectMessage('LinkedIn disconnected successfully!');
      setTimeout(() => setDisconnectMessage(null), 3000);
      
      console.log('SettingsPage: LinkedIn disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting LinkedIn:', error);
    } finally {
      setIsLinkedInConnecting(false);
    }
  }, []);

  // Debug function to manually refresh connection status
  const handleRefreshStatus = React.useCallback(async () => {
    console.log('SettingsPage: Manually refreshing connection status');
    connectionStatusService.forceRefresh('google_drive');
    connectionStatusService.forceRefresh('google');
    connectionStatusService.forceRefresh('linkedin');
    
    // Re-check status
    const googleDriveStatus = await connectionStatusService.getConnectionStatus('google_drive');
    const googleStatus = await connectionStatusService.getConnectionStatus('google');
    const linkedInStatus = await connectionStatusService.getConnectionStatus('linkedin');
    
    const isGoogleConnected = googleDriveStatus.isConnected || googleStatus.isConnected;
    setGoogleDriveConnected(isGoogleConnected);
    setLinkedInConnected(linkedInStatus.isConnected);
  }, []);

  // Debug function to clear all connection data
  const handleClearAllData = React.useCallback(() => {
    console.log('SettingsPage: Clearing all connection data');
    localStorage.removeItem('connectionStatus');
    connectionStatusService.clearCache();
    setGoogleDriveConnected(false);
    setLinkedInConnected(false);
    setDisconnectMessage('All connection data cleared!');
    setTimeout(() => setDisconnectMessage(null), 3000);
  }, []);

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          variants={itemVariants}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefreshStatus}
              className="text-xs"
            >
              🔄 Refresh Status
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearAllData}
              className="text-xs text-red-600 hover:text-red-700"
            >
              🗑️ Clear Data
            </Button>
            <div className="text-xs text-gray-500 space-x-4">
              <span>Google Drive: {googleDriveConnected ? '✅ Connected' : '❌ Disconnected'}</span>
              <span>LinkedIn: {linkedInConnected ? '✅ Connected' : '❌ Disconnected'}</span>
            </div>
          </div>
        </motion.div>

         {/* Success Message */}
         {disconnectMessage && (
           <motion.div
             initial={{ opacity: 0, y: -10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -10 }}
             className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg"
           >
             <div className="flex items-center">
               <div className="flex-shrink-0">
                 <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                 </svg>
               </div>
               <div className="ml-3">
                 <p className="text-sm font-medium text-green-800">
                   {disconnectMessage}
                 </p>
               </div>
             </div>
           </motion.div>
         )}

         {/* Settings Content */}
         <motion.div 
           variants={itemVariants}
           initial="hidden"
           animate="visible"
         >
          <IntegrationsSettings 
            googleDriveConnected={googleDriveConnected}
            linkedInConnected={linkedInConnected}
            isGoogleDriveConnecting={isGoogleDriveConnecting}
            isLinkedInConnecting={isLinkedInConnecting}
            onGoogleDriveConnect={handleGoogleDriveConnect}
            onGoogleDriveDisconnect={handleGoogleDriveDisconnect}
            onLinkedInConnect={handleLinkedInConnect}
            onLinkedInDisconnect={handleLinkedInDisconnect}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;
