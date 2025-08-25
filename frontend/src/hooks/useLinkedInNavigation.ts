import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { connectionStatusService } from '@/services/connectionStatusService';

export const useLinkedInNavigation = () => {
  const [isLinkedInConnected, setIsLinkedInConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkLinkedInStatus = async () => {
      try {
        setIsChecking(true);
        const status = await connectionStatusService.getConnectionStatus('linkedin');
        setIsLinkedInConnected(status.isConnected);
      } catch (error) {
        console.error('Error checking LinkedIn status:', error);
        setIsLinkedInConnected(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkLinkedInStatus();
  }, []);

  const handleLinkedInNavigation = () => {
    if (isLinkedInConnected) {
      // If LinkedIn is connected, go to LinkedIn Ready page
      navigate('/linkedin-ready');
    } else {
      // If LinkedIn is not connected, go to Settings page
      navigate('/settings');
    }
  };

  return {
    isLinkedInConnected,
    isChecking,
    handleLinkedInNavigation
  };
};
