// src/hooks/useMaintenanceMode.js
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';

/**
 * Hook to check if the app is in maintenance mode.
 * 
 * Reads from Firestore: config/maintenance
 * Document structure:
 * {
 *   enabled: boolean,
 *   message: string (optional custom message),
 *   bypassEmails: string[] (emails that can bypass maintenance mode)
 * }
 * 
 * @param {Object} db - Firestore database instance
 * @param {string|null} userEmail - Current user's email (null if not logged in)
 * @returns {Object} { isMaintenanceMode: boolean, maintenanceMessage: string, canBypass: boolean, isLoading: boolean }
 */
export function useMaintenanceMode(db, userEmail) {
  const [maintenanceData, setMaintenanceData] = useState({
    enabled: false,
    message: '',
    bypassEmails: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setIsLoading(false);
      return;
    }

    const maintenanceRef = doc(db, 'config', 'maintenance');
    
    const unsubscribe = onSnapshot(
      maintenanceRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setMaintenanceData({
            enabled: data.enabled || false,
            message: data.message || '',
            bypassEmails: data.bypassEmails || []
          });
        } else {
          // Document doesn't exist - maintenance mode is off
          setMaintenanceData({
            enabled: false,
            message: '',
            bypassEmails: []
          });
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('Error checking maintenance mode:', error);
        // On error, assume maintenance mode is off to not block users
        setMaintenanceData({
          enabled: false,
          message: '',
          bypassEmails: []
        });
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db]);

  // Check if user can bypass maintenance mode
  const normalizedUserEmail = userEmail?.toLowerCase().trim();
  const canBypass = normalizedUserEmail && maintenanceData.bypassEmails.some(
    email => email.toLowerCase().trim() === normalizedUserEmail
  );

  return {
    isMaintenanceMode: maintenanceData.enabled && !canBypass,
    maintenanceMessage: maintenanceData.message,
    canBypass,
    isLoading
  };
}

export default useMaintenanceMode;
