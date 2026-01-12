import { useState, useEffect, useCallback } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import OnboardingFlow from "./onboarding/OnboardingFlow";
import Home from "./pages/Home";
import { CycleTracker } from "./modules/cycle";
import { WeightTracker } from "./modules/weight";
import { VaccinationTracker } from "./modules/vaccination";
import { MedicineTracker } from "./modules/medicine";
import { FeedingTracker } from "./modules/feeding";
import Settings from "./settings/Settings";
import BottomNav from "./shared/components/BottomNav";
import NotFound from "./pages/NotFound";
import { isOnboardingCompleted, getPreferences, isPinEnabled } from "./core/storage";
import { ProfileProvider } from "./core/context/ProfileContext";
import { PinLockScreen } from "./security";
import { 
  initializeNotifications, 
  registerNotificationActions,
  addNotificationActionListener,
  scheduleVaccinationFollowUp,
  scheduleMedicineFollowUp,
} from "./core/notifications";
import { addVaccination } from "./modules/vaccination/vaccinationService";
import { markMedicineTaken, snoozeMedicineReminder } from "./modules/medicine/medicineService";
import { createFeedingLog, snoozeFeedingReminder } from "./modules/feeding/feedingService";
import type { ThemeMode, ColorTheme } from "./core/types";

const queryClient = new QueryClient();

// Color theme HSL values for dynamic application
const colorThemeValues: Record<ColorTheme, string> = {
  pink: '330 81% 60%',
  purple: '270 65% 55%',
  blue: '210 80% 55%',
  green: '145 60% 45%',
  orange: '25 90% 55%',
};

const AppContent = () => {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [isLocked, setIsLocked] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const setupNotifications = useCallback(async () => {
    const granted = await initializeNotifications();
    if (granted) {
      await registerNotificationActions();
      
      // Handle notification actions
      addNotificationActionListener(async (action) => {
        const { actionId, notification } = action;
        const extra = notification.extra || {};
        
        if (extra.type === 'vaccination' || extra.type === 'vaccination_followup') {
          if (actionId === 'yes') {
            // Auto-log vaccination
            await addVaccination(
              extra.profileId || 'default-profile',
              extra.vaccineName,
              new Date().toISOString().split('T')[0],
              undefined, // notes
              undefined, // attachmentPath
              undefined, // attachmentType
              extra.hospitalName,
              extra.doctorName
            );
          } else if (actionId === 'snooze') {
            // Snooze for 6 hours
            await scheduleVaccinationFollowUp(
              extra.vaccinationId,
              extra.vaccineName,
              6,
              extra.hospitalName,
              extra.doctorName
            );
          }
        } else if (extra.type === 'medicine' || extra.type === 'medicine_followup') {
          if (actionId === 'taken') {
            await markMedicineTaken(extra.logId);
          } else if (actionId === 'snooze_10' || actionId === 'snooze_30') {
            const minutes = actionId === 'snooze_10' ? 10 : 30;
            await snoozeMedicineReminder(extra.logId, minutes);
          }
        } else if (extra.type === 'feeding' || extra.type === 'feeding_followup') {
          if (actionId === 'done') {
            await createFeedingLog(extra.scheduleId, extra.profileId);
          } else if (actionId === 'snooze') {
            await snoozeFeedingReminder(extra.scheduleId, extra.profileId, 30);
          }
        }
      });
    }
  }, []);

  const checkOnboarding = useCallback(async () => {
    const completed = await isOnboardingCompleted();
    setShowOnboarding(!completed);
    
    // Check if PIN is enabled
    const pinEnabled = await isPinEnabled();
    setIsLocked(pinEnabled);
    
    setLoading(false);
  }, []);

  const applyTheme = useCallback(async () => {
    const prefs = await getPreferences();
    const root = document.documentElement;
    
    // Apply dark/light mode
    if (prefs.theme === 'dark') {
      root.classList.add('dark');
    } else if (prefs.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }

    // Apply color theme - ensure it persists across app restarts
    if (prefs.colorTheme && colorThemeValues[prefs.colorTheme]) {
      const hsl = colorThemeValues[prefs.colorTheme];
      root.style.setProperty('--primary', hsl);
      root.style.setProperty('--ring', hsl);
      root.style.setProperty('--chitra-pink', hsl);
      root.style.setProperty('--nav-active', hsl);
      root.style.setProperty('--chart-1', hsl);
      
      // Update accent to be slightly different
      const [h, s, l] = hsl.split(' ').map(v => parseFloat(v));
      root.style.setProperty('--accent', `${h + 5} ${Math.min(parseInt(s.toString()), 80)}% ${Math.max(parseInt(l.toString()) - 5, 40)}%`);
    }
  }, []);

  // Initial setup effects
  useEffect(() => {
    checkOnboarding();
    applyTheme();
    setupNotifications();
  }, [checkOnboarding, applyTheme, setupNotifications]);

  // Lock app when it goes to background
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        const pinEnabled = await isPinEnabled();
        if (pinEnabled) {
          setIsLocked(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Handle Android back button - MUST be before any conditional returns
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const setupBackButton = async () => {
      await CapacitorApp.addListener('backButton', () => {
        // Get current path from window.location since we can't use hooks here directly
        const currentPath = window.location.pathname;
        
        if (currentPath === '/' || currentPath === '') {
          // On home screen, minimize the app
          CapacitorApp.minimizeApp();
        } else {
          // Navigate back using browser history
          window.history.back();
        }
      });
    };

    setupBackButton();

    return () => {
      CapacitorApp.removeAllListeners();
    };
  }, []);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  const handleUnlock = () => {
    setIsLocked(false);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  // Show onboarding if not completed
  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  // Show lock screen if PIN is enabled and app is locked
  if (isLocked) {
    return <PinLockScreen onUnlock={handleUnlock} />;
  }

  return (
    <ProfileProvider>
      <div className="min-h-screen bg-background">
        <main className="pb-20">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cycle" element={<CycleTracker />} />
            <Route path="/weight" element={<WeightTracker />} />
            <Route path="/vaccination" element={<VaccinationTracker />} />
            <Route path="/medicine" element={<MedicineTracker />} />
            <Route path="/feeding" element={<FeedingTracker />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </ProfileProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider delayDuration={2000}>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
