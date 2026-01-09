import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import OnboardingFlow from "./onboarding/OnboardingFlow";
import Home from "./pages/Home";
import { CycleTracker } from "./modules/cycle";
import { WeightTracker } from "./modules/weight";
import { VaccinationTracker } from "./modules/vaccination";
import { MedicineTracker } from "./modules/medicine";
import { FeedingTracker } from "./modules/feeding";
import Settings from "./settings/Settings";
import BottomNav from "./shared/components/BottomNav";
// AppHeader removed - settings now in bottom nav only
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
import type { ThemeMode } from "./core/types";

const queryClient = new QueryClient();

const AppContent = () => {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [isLocked, setIsLocked] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboarding();
    applyTheme();
    setupNotifications();
  }, []);

  const setupNotifications = async () => {
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
  };

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

  const checkOnboarding = async () => {
    const completed = await isOnboardingCompleted();
    setShowOnboarding(!completed);
    
    // Check if PIN is enabled
    const pinEnabled = await isPinEnabled();
    setIsLocked(pinEnabled);
    
    setLoading(false);
  };

  const applyTheme = async () => {
    const prefs = await getPreferences();
    const root = document.documentElement;
    
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
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  const handleUnlock = () => {
    setIsLocked(false);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="animate-pulse-soft text-primary text-xl font-semibold">CHITRA</div>
      </div>
    );
  }

  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

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
