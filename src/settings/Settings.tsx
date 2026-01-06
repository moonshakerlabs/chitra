import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  Globe, 
  Languages, 
  Palette, 
  Moon, 
  Sun, 
  Download, 
  Upload, 
  Trash2, 
  RotateCcw,
  ChevronRight,
  Heart,
  Info,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { 
  getPreferences, 
  savePreferences, 
  clearAllData,
  resetPreferences 
} from '@/core/storage';
import type { UserPreferences, ThemeMode, ColorTheme, CountryCode, LanguageCode } from '@/core/types';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const countries: Array<{ code: CountryCode; name: string; flag: string }> = [
  { code: 'USA', name: 'United States', flag: '🇺🇸' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'EU', name: 'Europe', flag: '🇪🇺' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'OTHER', name: 'Other', flag: '🌍' },
];

const languages: Array<{ code: LanguageCode; name: string }> = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
];

const colorThemes: Array<{ id: ColorTheme; name: string; color: string }> = [
  { id: 'pink', name: 'Pink', color: 'bg-pink-500' },
  { id: 'purple', name: 'Purple', color: 'bg-purple-500' },
  { id: 'blue', name: 'Blue', color: 'bg-blue-500' },
  { id: 'green', name: 'Green', color: 'bg-green-500' },
  { id: 'orange', name: 'Orange', color: 'bg-orange-500' },
];

const Settings = () => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const prefs = await getPreferences();
    setPreferences(prefs);
    setLoading(false);
  };

  const updatePreference = async <K extends keyof UserPreferences>(
    key: K, 
    value: UserPreferences[K]
  ) => {
    if (!preferences) return;
    const updated = await savePreferences({ [key]: value });
    setPreferences(updated);
    
    // Handle theme changes
    if (key === 'theme') {
      applyTheme(value as ThemeMode);
    }
  };

  const applyTheme = (theme: ThemeMode) => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
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

  const handleExportData = () => {
    toast({
      title: "Export Coming Soon",
      description: "Data export feature will be available in the next update.",
    });
  };

  const handleImportData = () => {
    toast({
      title: "Import Coming Soon",
      description: "Data import feature will be available in the next update.",
    });
  };

  const handleDeleteAllData = async () => {
    await clearAllData();
    toast({
      title: "All Data Deleted",
      description: "Your data has been permanently deleted.",
      variant: "destructive",
    });
    setShowDeleteDialog(false);
    window.location.reload();
  };

  const handleResetApp = async () => {
    await clearAllData();
    await resetPreferences();
    toast({
      title: "App Reset",
      description: "CHITRA has been reset to default settings.",
    });
    setShowResetDialog(false);
    window.location.reload();
  };

  if (loading || !preferences) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse-soft text-primary">Loading...</div>
      </div>
    );
  }

  const currentCountry = countries.find(c => c.code === preferences.country);
  const currentLanguage = languages.find(l => l.code === preferences.language);

  return (
    <div className="px-4 py-6 space-y-6 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Customize your experience</p>
      </div>

      {/* General Settings */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">General</h2>
        <Card className="divide-y divide-border">
          {/* Country */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Country</p>
                <p className="text-sm text-muted-foreground">{currentCountry?.flag} {currentCountry?.name}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>

          {/* Language */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <Languages className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Language</p>
                <p className="text-sm text-muted-foreground">{currentLanguage?.name}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </Card>
      </motion.div>

      {/* Appearance */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Appearance</h2>
        <Card className="divide-y divide-border">
          {/* Theme Mode */}
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                {preferences.theme === 'dark' ? (
                  <Moon className="w-5 h-5 text-primary" />
                ) : (
                  <Sun className="w-5 h-5 text-primary" />
                )}
              </div>
              <div>
                <p className="font-medium text-foreground">Theme Mode</p>
                <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
              </div>
            </div>
            <div className="flex gap-2">
              {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => updatePreference('theme', mode)}
                  className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium capitalize transition-all ${
                    preferences.theme === mode
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Color Theme */}
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <Palette className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Color Theme</p>
                <p className="text-sm text-muted-foreground">Pick your favorite color</p>
              </div>
            </div>
            <div className="flex gap-3">
              {colorThemes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => updatePreference('colorTheme', theme.id)}
                  className={`w-10 h-10 rounded-full ${theme.color} transition-transform ${
                    preferences.colorTheme === theme.id
                      ? 'ring-2 ring-offset-2 ring-foreground scale-110'
                      : 'hover:scale-105'
                  }`}
                  title={theme.name}
                />
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Data Management */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Data</h2>
        <Card className="divide-y divide-border">
          <button 
            onClick={handleExportData}
            className="flex items-center justify-between p-4 w-full text-left hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <Download className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Export Data</p>
                <p className="text-sm text-muted-foreground">Save your data as CSV, JSON, or Excel</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <button 
            onClick={handleImportData}
            className="flex items-center justify-between p-4 w-full text-left hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <Upload className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Import Data</p>
                <p className="text-sm text-muted-foreground">Restore from a backup file</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </Card>
      </motion.div>

      {/* Subscription (Placeholder) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Subscription</h2>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Free Plan</p>
                <p className="text-sm text-muted-foreground">Currently using the free version</p>
              </div>
            </div>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
              FREE
            </span>
          </div>
        </Card>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-sm font-medium text-destructive mb-3 uppercase tracking-wide">Danger Zone</h2>
        <Card className="divide-y divide-border border-destructive/30">
          <button 
            onClick={() => setShowDeleteDialog(true)}
            className="flex items-center justify-between p-4 w-full text-left hover:bg-destructive/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="font-medium text-destructive">Delete All Data</p>
                <p className="text-sm text-muted-foreground">Permanently delete all your data</p>
              </div>
            </div>
          </button>

          <button 
            onClick={() => setShowResetDialog(true)}
            className="flex items-center justify-between p-4 w-full text-left hover:bg-destructive/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="font-medium text-destructive">Reset App</p>
                <p className="text-sm text-muted-foreground">Reset to default settings</p>
              </div>
            </div>
          </button>
        </Card>
      </motion.div>

      {/* About */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-primary fill-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-1">CHITRA</h3>
          <p className="text-sm text-muted-foreground mb-4">Version 1.0.0</p>
          <p className="text-sm text-muted-foreground">
            Built with <Heart className="inline w-3 h-3 text-primary fill-primary mx-1" /> by
          </p>
          <p className="text-sm font-medium text-foreground mt-1">
            Moonshaker Labs
          </p>
        </Card>
      </motion.div>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your cycle data, weight logs, and check-ins. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAllData}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset App?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all your data and reset the app to its initial state. You will need to go through onboarding again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleResetApp}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reset App
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
