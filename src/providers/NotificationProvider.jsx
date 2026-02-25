// src/providers/NotificationProvider.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { notificationService } from '../services/notificationService';
import { useAppServices } from '../services/useAppServices';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { getTimeInTimezone, getDateKeyInTimezone, DEFAULT_TIMEZONE } from '../services/dateUtils';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

const DEFAULT_REMINDERS = {
  amBookend: { 
    id: 'amBookend',
    enabled: true, 
    time: "11:30", 
    label: "AM Bookend Reminder",
    body: "Don't forget to complete your AM Bookend routine!",
    checkCondition: (data) => !data?.amWinCompleted // Send if NOT completed
  },
  seizeTheDay: { 
    id: 'seizeTheDay',
    enabled: true, 
    time: "16:00", 
    label: "Seize the Day",
    body: "It's 4 PM. Time to finish strong and seize the day!",
    checkCondition: () => true // Always send
  },
  pmBookend: { 
    id: 'pmBookend',
    enabled: true, 
    time: "19:00", 
    label: "PM Bookend Reminder",
    body: "Time for your evening reflection. Close the day with intention.",
    checkCondition: (data) => !data?.eveningBookend?.completed // Send if NOT completed
  }
};

export const NotificationProvider = ({ children }) => {
  const { user, db, dailyPracticeData, isAuthReady } = useAppServices();
  const [permission, setPermission] = useState(notificationService.getPermission());
  const [reminders, setReminders] = useState(DEFAULT_REMINDERS);
  const [sentLog, setSentLog] = useState({}); // { date_reminderId: timestamp }
  const [isLoaded, setIsLoaded] = useState(false);
  const [userTimezone, setUserTimezone] = useState(DEFAULT_TIMEZONE);

  // Load settings from Firestore
  useEffect(() => {
    // Wait for auth to be ready before making Firestore calls
    if (!isAuthReady || !user || !db || !user.uid) return;

    const loadSettings = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data.notificationSettings) {
            // Merge defaults with saved settings to ensure new reminders appear
            setReminders(prev => ({
              ...prev,
              ...data.notificationSettings.reminders
            }));
            if (data.notificationSettings.sentLog) {
              setSentLog(data.notificationSettings.sentLog);
            }
            // Load user's preferred timezone for reminder scheduling
            if (data.notificationSettings.timezone) {
              setUserTimezone(data.notificationSettings.timezone);
            }
          }
        }
        setIsLoaded(true);
      } catch (e) {
        console.error("Error loading notification settings:", e);
      }
    };

    loadSettings();
  }, [user, db, isAuthReady]);

  // Save settings to Firestore
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saveSettings = async (newReminders, newSentLog) => {
    if (!user || !db || !user.uid) return;
    try {
      const remindersToSave = newReminders || reminders;
      const sanitizedReminders = {};
      
      // Strip functions before saving to avoid Firestore errors
      Object.keys(remindersToSave).forEach(key => {
        // eslint-disable-next-line no-unused-vars
        const { checkCondition, ...rest } = remindersToSave[key];
        sanitizedReminders[key] = rest;
      });

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        'notificationSettings.reminders': sanitizedReminders,
        'notificationSettings.sentLog': newSentLog || sentLog,
        'notificationSettings.updatedAt': new Date().toISOString()
      });
    } catch (e) {
      console.error("Error saving notification settings:", e);
    }
  };

  // Update a specific reminder
  const updateReminder = (id, updates) => {
    setReminders(prev => {
      const next = {
        ...prev,
        [id]: { ...prev[id], ...updates }
      };
      saveSettings(next, sentLog);
      return next;
    });
  };

  // Request Permission Wrapper
  const requestPermission = async () => {
    const result = await notificationService.requestPermission();
    setPermission(result);
    return result;
  };

  // Send Test Notification
  const sendTestNotification = () => {
    notificationService.sendNotification("Test Notification", {
      body: "This is a test from the LeaderReps Platform."
    });
  };

  // Check Loop
  useEffect(() => {
    if (!isLoaded || permission !== 'granted') return;

    const checkReminders = () => {
      const now = new Date();
      // Use user's timezone for time checks - ensures reminders fire at correct local time
      // regardless of where the user's browser is physically located
      const { hours: currentHours, minutes: currentMinutes } = getTimeInTimezone(now, userTimezone);
      const todayStr = getDateKeyInTimezone(now, userTimezone); // e.g., "2025-01-15"

      Object.values(reminders).forEach(reminder => {
        if (!reminder.enabled) return;

        // Parse time string "HH:MM"
        const [rHours, rMinutes] = reminder.time.split(':').map(Number);
        
        // Check if it's time (or past time within the last 15 mins to catch missed intervals)
        // Simple check: Is current time >= reminder time?
        // AND have we NOT sent it today?
        
        const logKey = `${todayStr}_${reminder.id}`;
        
        if (sentLog[logKey]) return; // Already sent today

        const isTime = (currentHours > rHours) || (currentHours === rHours && currentMinutes >= rMinutes);

        if (isTime) {
          // Check specific condition (e.g., is bookend done?)
          // We need to map the reminder ID to the condition logic
          // Re-using the logic defined in DEFAULT_REMINDERS, but we need to access the function
          // Since we might have overwritten the object from Firestore (which won't have functions),
          // we need to look up the logic from DEFAULT_REMINDERS based on ID.
          
          const defaultDef = DEFAULT_REMINDERS[reminder.id];
          const shouldSend = defaultDef ? defaultDef.checkCondition(dailyPracticeData) : true;

          if (shouldSend) {
            console.log(`🔔 Sending Reminder: ${reminder.label}`);
            notificationService.sendNotification(reminder.label, {
              body: reminder.body
            });

            // Update Log
            const newLog = { ...sentLog, [logKey]: new Date().toISOString() };
            
            // Cleanup old logs (optional, keep only last 7 days to save space)
            // For now, just set state
            setSentLog(newLog);
            saveSettings(reminders, newLog);
          }
        }
      });
    };

    // Run check every minute
    const interval = setInterval(checkReminders, 60000);
    
    // Run immediately on mount/update
    checkReminders();

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, permission, reminders, sentLog, dailyPracticeData, userTimezone]);

  const value = {
    permission,
    requestPermission,
    reminders,
    updateReminder,
    sendTestNotification,
    isSupported: notificationService.isSupported()
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
