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
import Settings from "./settings/Settings";
import BottomNav from "./shared/components/BottomNav";
import NotFound from "./pages/NotFound";
import { isOnboardingCompleted, getPreferences } from "./core/storage";
import type { ThemeMode } from "./core/types";

const queryClient = new QueryClient();

const AppContent = () => {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboarding();
    applyTheme();
  }, []);

  const checkOnboarding = async () => {
    const completed = await isOnboardingCompleted();
    setShowOnboarding(!completed);
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

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cycle" element={<CycleTracker />} />
          <Route path="/weight" element={<WeightTracker />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
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
