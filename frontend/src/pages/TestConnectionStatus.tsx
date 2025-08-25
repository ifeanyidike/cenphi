import React, { useState, useEffect } from 'react';
import { connectionStatusService } from '@/services/connectionStatusService';

const TestConnectionStatus: React.FC = () => {
  const [linkedInStatus, setLinkedInStatus] = useState<any>(null);
  const [googleDriveStatus, setGoogleDriveStatus] = useState<any>(null);

  const checkStatus = async () => {
    console.log('Testing connection status...');
    
    const linkedIn = await connectionStatusService.getConnectionStatus('linkedin');
    const googleDrive = await connectionStatusService.getConnectionStatus('google_drive');
    
    setLinkedInStatus(linkedIn);
    setGoogleDriveStatus(googleDrive);
    
    console.log('LinkedIn status:', linkedIn);
    console.log('Google Drive status:', googleDrive);
  };

  const simulateLinkedInConnection = () => {
    console.log('Simulating LinkedIn connection...');
    connectionStatusService.updateConnectionStatus('linkedin', {
      isConnected: true,
      provider: 'linkedin',
      accountEmail: 'test@linkedin.com',
      lastSync: new Date(),
    });
    checkStatus();
  };

  const simulateLinkedInDisconnection = () => {
    console.log('Simulating LinkedIn disconnection...');
    connectionStatusService.disconnectProvider('linkedin');
    checkStatus();
  };

  const clearCache = () => {
    console.log('Clearing cache...');
    connectionStatusService.clearCache();
    checkStatus();
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Connection Status Test</h1>
      
      <div className="space-y-4 mb-6">
        <button 
          onClick={checkStatus}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Check Status
        </button>
        
        <button 
          onClick={simulateLinkedInConnection}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 ml-2"
        >
          Simulate LinkedIn Connect
        </button>
        
        <button 
          onClick={simulateLinkedInDisconnection}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 ml-2"
        >
          Simulate LinkedIn Disconnect
        </button>
        
        <button 
          onClick={clearCache}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 ml-2"
        >
          Clear Cache
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">LinkedIn Status</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify(linkedInStatus, null, 2)}
          </pre>
        </div>
        
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Google Drive Status</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify(googleDriveStatus, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default TestConnectionStatus;
