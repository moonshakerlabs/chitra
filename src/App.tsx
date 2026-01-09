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
import Settings from "./settings/Settings";
import BottomNav from "./shared/components/BottomNav";
import NotFound from "./pages/NotFound";
import { isOnboardingCompleted, getPreferences, isPinEnabled } from "./core/storage";
import { ProfileProvider } from "./core/context/ProfileContext";
import { PinLockScreen } from "./security";
import type { ThemeMode } from "./core/types";

const queryClient = new QueryClient();

const AppContent = () => {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [isLocked, setIsLocked] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboarding();
    applyTheme();
  }, []);

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
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
