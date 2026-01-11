import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

/**
 * Custom hook to handle Android back button behavior
 * - On home screen: minimize app
 * - On other screens: navigate back
 */
export const useBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const handleBackButton = async () => {
      // If on home page, minimize the app
      if (location.pathname === '/') {
        await App.minimizeApp();
      } else {
        // Otherwise, navigate back
        navigate(-1);
      }
    };

    // Add listener for hardware back button
    const backButtonListener = App.addListener('backButton', handleBackButton);

    return () => {
      backButtonListener.then(listener => listener.remove());
    };
  }, [navigate, location.pathname]);
};

export default useBackButton;
