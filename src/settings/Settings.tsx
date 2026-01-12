import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
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
  Check,
  FileJson,
  FileSpreadsheet,
  Users,
  Shield,
  Lock,
  Folder,
  AlertTriangle,
  Baby,
  Calendar,
  Bell,
  ExternalLink,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { 
  getPreferences, 
  savePreferences, 
  clearAllData,
  clearAllDataIncludingPreferences,
  resetPreferences,
  isPinEnabled,
  disablePin
} from '@/core/storage';
import { exportDataMobile, isNativePlatform } from '@/core/export/mobileExport';
import { importFromJSON, importFromCSV } from '@/core/export';
import { useProfile } from '@/core/context/ProfileContext';
import { getStorageFolderPath, clearStorageFolderConfig, createChitraFolder } from '@/core/storage/folderService';
import { checkNotificationPermission, requestNotificationPermission } from '@/core/notifications/permissionService';
import type { UserPreferences, ThemeMode, ColorTheme, CountryCode, LanguageCode, ExportFormat, ProfileMode } from '@/core/types';
import type { ExportDataTypeExtended } from '@/core/export/mobileExport';
import { updateProfile } from '@/core/storage/profileService';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProfileEditModal from '@/profiles/ProfileEditModal';
import { PinSetupScreen, ChangePinScreen } from '@/security';
import { Capacitor } from '@capacitor/core';
import PrivacyPolicyScreen from './PrivacyPolicyScreen';
import FolderSelectSAF from '@/onboarding/FolderSelectSAF';

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

const colorThemes: Array<{ id: ColorTheme; name: string; hsl: string }> = [
  { id: 'pink', name: 'Pink', hsl: '330 81% 60%' },
  { id: 'purple', name: 'Purple', hsl: '270 65% 55%' },
  { id: 'blue', name: 'Blue', hsl: '210 80% 55%' },
  { id: 'green', name: 'Green', hsl: '145 60% 45%' },
  { id: 'orange', name: 'Orange', hsl: '25 90% 55%' },
];

const Settings = () => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showCountryDialog, setShowCountryDialog] = useState(false);
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showChangePin, setShowChangePin] = useState(false);
  const [showChangeFolderDialog, setShowChangeFolderDialog] = useState(false);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [storageFolderPath, setStorageFolderPath] = useState<string | null>(null);
  const [exportDataType, setExportDataType] = useState<ExportDataTypeExtended>('all');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [exportProfileOption, setExportProfileOption] = useState<'current' | 'all'>('current');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importType, setImportType] = useState<'json' | 'csv'>('json');
  
  // Notification permission state
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState(false);
  const [notificationPermissionDenied, setNotificationPermissionDenied] = useState(false);
  
  const { toast } = useToast();
  const { profiles, activeProfile } = useProfile();

  useEffect(() => {
    loadPreferences();
    checkPinStatus();
    loadStorageFolder();
    checkNotificationStatus();
  }, []);

  const loadPreferences = async () => {
    const prefs = await getPreferences();
    setPreferences(prefs);
    setLoading(false);
  };

  const checkPinStatus = async () => {
    const enabled = await isPinEnabled();
    setPinEnabled(enabled);
  };

  const loadStorageFolder = async () => {
    const path = await getStorageFolderPath();
    setStorageFolderPath(path);
  };

  // Check notification status - this needs to be a callback that re-checks
  const checkNotificationStatus = useCallback(async () => {
    const status = await checkNotificationPermission();
    setNotificationPermissionGranted(status.granted);
    setNotificationPermissionDenied(status.deniedPermanently);
  }, []);

  // Re-check notification status when component mounts and when it becomes visible
  useEffect(() => {
    checkNotificationStatus();
    
    // Also check when app becomes visible (user might have enabled notifications in settings)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkNotificationStatus();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [checkNotificationStatus]);

  const handleRequestNotificationPermission = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setNotificationPermissionGranted(true);
      setNotificationPermissionDenied(false);
      toast({
        title: 'Notifications Enabled',
        description: 'You will now receive reminders.',
      });
    } else {
      toast({
        title: 'Permission Denied',
        description: 'Please enable notifications in your device settings.',
        variant: 'destructive',
      });
    }
  };

  const handleChangeFolder = async () => {
    setShowChangeFolderDialog(false);
    // Show the folder picker instead of just clearing config
    setShowFolderPicker(true);
  };

  const handleFolderPickerComplete = async () => {
    setShowFolderPicker(false);
    // Reload the storage folder path
    await loadStorageFolder();
    toast({
      title: 'Folder Updated',
      description: 'Your backup folder location has been changed.',
    });
  };

  const updatePreference = async <K extends keyof UserPreferences>(
    key: K, 
    value: UserPreferences[K]
  ) => {
    if (!preferences) return;
    const updated = await savePreferences({ [key]: value });
    setPreferences(updated);
    
    // Handle theme mode changes
    if (key === 'theme') {
      applyThemeMode(value as ThemeMode);
    }
    
    // Handle color theme changes
    if (key === 'colorTheme') {
      applyColorTheme(value as ColorTheme);
    }
  };

  const applyThemeMode = (theme: ThemeMode) => {
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

  const applyColorTheme = (colorTheme: ColorTheme) => {
    const root = document.documentElement;
    const theme = colorThemes.find(t => t.id === colorTheme);
    if (theme) {
      // Update CSS variables for the color theme
      root.style.setProperty('--primary', theme.hsl);
      root.style.setProperty('--ring', theme.hsl);
      root.style.setProperty('--chitra-pink', theme.hsl);
      root.style.setProperty('--nav-active', theme.hsl);
      root.style.setProperty('--chart-1', theme.hsl);
      
      // Also update accent to be slightly different
      const [h, s, l] = theme.hsl.split(' ').map(v => parseFloat(v));
      root.style.setProperty('--accent', `${h + 5} ${Math.min(parseInt(s.toString()), 80)}% ${Math.max(parseInt(l.toString()) - 5, 40)}%`);
    }
    
    toast({
      title: "Theme Updated",
      description: `Color theme changed to ${colorTheme}`,
    });
  };

  const handleExport = async () => {
    try {
      const profileIdToExport = exportProfileOption === 'current' 
        ? activeProfile?.id 
        : undefined;
      
      const result = await exportDataMobile(
        { dataType: exportDataType, format: exportFormat },
        profileIdToExport
      );
      
      if (result.success) {
        toast({
          title: "Export Successful",
          description: result.filePath 
            ? `Saved to: ${result.filePath.split('/').pop()}`
            : "Your data has been exported.",
        });
        setShowExportDialog(false);
      } else {
        toast({
          title: "Export Failed",
          description: result.error || "Failed to export data.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImportClick = (type: 'json' | 'csv') => {
    setImportType(type);
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (importType === 'json') {
        const result = await importFromJSON(file);
        if (result.success) {
          toast({
            title: "Import Successful",
            description: result.counts 
              ? `Imported ${result.counts.cycles} cycles, ${result.counts.weights} weights, ${result.counts.checkIns} check-ins.`
              : result.message,
          });
          setShowImportDialog(false);
        } else {
          toast({
            title: "Import Failed",
            description: result.message,
            variant: "destructive",
          });
        }
      } else {
        // For CSV, we need to determine the type based on filename
        let dataType: 'cycles' | 'weights' | 'checkIns' = 'cycles';
        if (file.name.toLowerCase().includes('weight')) {
          dataType = 'weights';
        } else if (file.name.toLowerCase().includes('checkin')) {
          dataType = 'checkIns';
        }
        
        const result = await importFromCSV(file, dataType);
        toast({
          title: result.success ? "Import Successful" : "Import Failed",
          description: result.message,
          variant: result.success ? "default" : "destructive",
        });
        if (result.success) {
          setShowImportDialog(false);
        }
      }
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to import data. Please check the file format.",
        variant: "destructive",
      });
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePinToggle = async (enabled: boolean) => {
    if (enabled) {
      setShowPinSetup(true);
    } else {
      await disablePin();
      setPinEnabled(false);
      toast({
        title: "PIN Disabled",
        description: "App protection has been turned off",
      });
    }
  };

  const handlePinSetupComplete = () => {
    setShowPinSetup(false);
    setPinEnabled(true);
  };

  const handleChangePinComplete = () => {
    setShowChangePin(false);
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
    await clearAllDataIncludingPreferences();
    await resetPreferences();
    toast({
      title: "App Reset",
      description: "CHITRA has been reset to default settings.",
    });
    setShowResetDialog(false);
    window.location.reload();
  };

  if (showPinSetup) {
    return (
      <PinSetupScreen 
        onComplete={handlePinSetupComplete} 
        onCancel={() => setShowPinSetup(false)} 
      />
    );
  }

  if (showChangePin) {
    return (
      <ChangePinScreen 
        onComplete={handleChangePinComplete} 
        onCancel={() => setShowChangePin(false)} 
      />
    );
  }

  if (showFolderPicker) {
    return (
      <FolderSelectSAF 
        onComplete={handleFolderPickerComplete}
        isChangingLocation={true}
      />
    );
  }

  if (showPrivacyPolicy) {
    return (
      <PrivacyPolicyScreen 
        onBack={() => setShowPrivacyPolicy(false)} 
      />
    );
  }

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
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={importType === 'json' ? '.json' : '.csv'}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Customize your experience</p>
      </div>



      {/* Security Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Security</h2>
        <Card className="divide-y divide-border">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">PIN Protection</p>
                <p className="text-sm text-muted-foreground">Protect app with 6-digit PIN</p>
              </div>
            </div>
            <Switch
              checked={pinEnabled}
              onCheckedChange={handlePinToggle}
            />
          </div>
          
          {/* Change PIN option - only shown when PIN is enabled */}
          {pinEnabled && (
            <button 
              onClick={() => setShowChangePin(true)}
              className="flex items-center justify-between p-4 w-full text-left hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Change PIN</p>
                  <p className="text-sm text-muted-foreground">Update your security PIN</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </Card>
      </motion.div>

      {/* Storage Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.07 }}
      >
        <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Storage</h2>
        <Card className="divide-y divide-border">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Folder className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">Backup Folder</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    For exports, vaccinations, and backups only
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowChangeFolderDialog(true)}>
                Change
              </Button>
            </div>
            {storageFolderPath && (
              <div className="mt-3 p-2 bg-secondary/50 rounded-lg">
                <p className="text-xs font-mono text-muted-foreground break-all">
                  📁 {storageFolderPath}
                </p>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-3 flex items-start gap-1">
              <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
              <span>App data is stored in the browser database. This folder is only for file backups and exports.</span>
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Notifications Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Notifications</h2>
        <Card className="divide-y divide-border">
          {/* Permission Warning */}
          {notificationPermissionDenied && (
            <div className="p-4 bg-destructive/10 border-b border-destructive/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">Notifications Disabled</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Notifications are disabled at system level. Please enable notifications in your device Settings.
                  </p>
                  {Capacitor.isNativePlatform() && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={handleRequestNotificationPermission}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Request Permission
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Enable Notifications - shown when permission not granted */}
          {!notificationPermissionGranted && !notificationPermissionDenied && (
            <button
              onClick={handleRequestNotificationPermission}
              className="flex items-center justify-between p-4 w-full text-left hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Enable Notifications</p>
                  <p className="text-sm text-muted-foreground">Tap to enable reminders</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
          
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Vaccination Reminders</p>
                <p className="text-sm text-muted-foreground">Due date notifications</p>
              </div>
            </div>
            <Switch
              checked={notificationPermissionGranted && (preferences?.vaccinationRemindersEnabled ?? true)}
              onCheckedChange={async (checked) => {
                if (!notificationPermissionGranted) {
                  const granted = await requestNotificationPermission();
                  if (granted) {
                    setNotificationPermissionGranted(true);
                    updatePreference('vaccinationRemindersEnabled', checked);
                  }
                } else {
                  updatePreference('vaccinationRemindersEnabled', checked);
                }
              }}
            />
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Medicine Reminders</p>
                <p className="text-sm text-muted-foreground">Intake notifications</p>
              </div>
            </div>
            <Switch
              checked={notificationPermissionGranted && (preferences?.medicineRemindersEnabled ?? true)}
              onCheckedChange={async (checked) => {
                if (!notificationPermissionGranted) {
                  const granted = await requestNotificationPermission();
                  if (granted) {
                    setNotificationPermissionGranted(true);
                    updatePreference('medicineRemindersEnabled', checked);
                  }
                } else {
                  updatePreference('medicineRemindersEnabled', checked);
                }
              }}
            />
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Feeding Reminders</p>
                <p className="text-sm text-muted-foreground">Feeding time notifications</p>
              </div>
            </div>
            <Switch
              checked={notificationPermissionGranted && (preferences?.feedingRemindersEnabled ?? true)}
              onCheckedChange={async (checked) => {
                if (!notificationPermissionGranted) {
                  const granted = await requestNotificationPermission();
                  if (granted) {
                    setNotificationPermissionGranted(true);
                    updatePreference('feedingRemindersEnabled', checked);
                  }
                } else {
                  updatePreference('feedingRemindersEnabled', checked);
                }
              }}
            />
          </div>
        </Card>
      </motion.div>


      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">General</h2>
        <Card className="divide-y divide-border">
          {/* Country */}
          <button 
            onClick={() => setShowCountryDialog(true)}
            className="flex items-center justify-between p-4 w-full text-left hover:bg-secondary/50 transition-colors"
          >
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
          </button>

          {/* Language */}
          <button 
            onClick={() => setShowLanguageDialog(true)}
            className="flex items-center justify-between p-4 w-full text-left hover:bg-secondary/50 transition-colors"
          >
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
          </button>
        </Card>
      </motion.div>

      {/* Appearance */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
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
                  className={`w-10 h-10 rounded-full transition-transform relative ${
                    preferences.colorTheme === theme.id
                      ? 'ring-2 ring-offset-2 ring-foreground scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: `hsl(${theme.hsl})` }}
                  title={theme.name}
                >
                  {preferences.colorTheme === theme.id && (
                    <Check className="w-5 h-5 text-white absolute inset-0 m-auto" />
                  )}
                </button>
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
            onClick={() => setShowExportDialog(true)}
            className="flex items-center justify-between p-4 w-full text-left hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <Download className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Export Data</p>
                <p className="text-sm text-muted-foreground">Save your data as CSV or JSON</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <button 
            onClick={() => setShowImportDialog(true)}
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
        <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">About</h2>
        <Card className="divide-y divide-border">
          <div className="p-6 text-center">
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
          </div>
          
          {/* Privacy Policy Link */}
          <button 
            onClick={() => setShowPrivacyPolicy(true)}
            className="flex items-center justify-between p-4 w-full text-left hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Privacy Policy</p>
                <p className="text-sm text-muted-foreground">How we protect your data</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </Card>
      </motion.div>

      {/* Profile Edit Modal */}
      <ProfileEditModal
        open={showProfileDialog}
        onOpenChange={setShowProfileDialog}
      />

      {/* Country Selection Dialog */}
      <Dialog open={showCountryDialog} onOpenChange={setShowCountryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Country</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {countries.map((country) => (
              <button
                key={country.code}
                onClick={() => {
                  updatePreference('country', country.code);
                  setShowCountryDialog(false);
                  toast({
                    title: "Country Updated",
                    description: `Country changed to ${country.name}`,
                  });
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  preferences.country === country.code
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
              >
                <span className="text-2xl">{country.flag}</span>
                <span className="font-medium">{country.name}</span>
                {preferences.country === country.code && (
                  <Check className="w-5 h-5 ml-auto" />
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Language Selection Dialog */}
      <Dialog open={showLanguageDialog} onOpenChange={setShowLanguageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Language</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  updatePreference('language', lang.code);
                  setShowLanguageDialog(false);
                  toast({
                    title: "Language Updated",
                    description: `Language changed to ${lang.name}`,
                  });
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  preferences.language === lang.code
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
              >
                <span className="font-medium">{lang.name}</span>
                {preferences.language === lang.code && (
                  <Check className="w-5 h-5 ml-auto" />
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Profile Selection */}
            <div>
              <p className="text-sm font-medium mb-2">Export from</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setExportProfileOption('current')}
                  className={`p-2 rounded-xl text-sm font-medium transition-all ${
                    exportProfileOption === 'current'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  {activeProfile?.name || 'Current Profile'}
                </button>
                <button
                  onClick={() => setExportProfileOption('all')}
                  className={`p-2 rounded-xl text-sm font-medium transition-all ${
                    exportProfileOption === 'all'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  All Profiles
                </button>
              </div>
            </div>

            {/* Data Type Selection */}
            <div>
              <p className="text-sm font-medium mb-2">What to export?</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'all', label: 'All Data' },
                  { value: 'cycles', label: 'Cycles' },
                  { value: 'weights', label: 'Weights' },
                  { value: 'vaccinations', label: 'Vaccinations' },
                  { value: 'medicine', label: 'Medicine' },
                ] as { value: ExportDataTypeExtended; label: string }[]).map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setExportDataType(type.value)}
                    className={`p-2 rounded-xl text-sm font-medium transition-all ${
                      exportDataType === type.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Format Selection */}
            <div>
              <p className="text-sm font-medium mb-2">Format</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setExportFormat('json')}
                  className={`flex items-center gap-2 p-3 rounded-xl transition-colors ${
                    exportFormat === 'json'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  <FileJson className="w-5 h-5" />
                  <span className="font-medium">JSON</span>
                </button>
                <button
                  onClick={() => setExportFormat('csv')}
                  className={`flex items-center gap-2 p-3 rounded-xl transition-colors ${
                    exportFormat === 'csv'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  <span className="font-medium">CSV</span>
                </button>
              </div>
            </div>

            <Button onClick={handleExport} className="w-full">
              Export
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <button
              onClick={() => handleImportClick('json')}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <FileJson className="w-6 h-6 text-primary" />
              <div className="text-left">
                <p className="font-medium text-foreground">Import from JSON</p>
                <p className="text-sm text-muted-foreground">Restore from CHITRA backup</p>
              </div>
            </button>
            <button
              onClick={() => handleImportClick('csv')}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <FileSpreadsheet className="w-6 h-6 text-primary" />
              <div className="text-left">
                <p className="font-medium text-foreground">Import from CSV</p>
                <p className="text-sm text-muted-foreground">Name file as cycles, weights, or checkins</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

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

      {/* Change Folder Dialog */}
      <AlertDialog open={showChangeFolderDialog} onOpenChange={setShowChangeFolderDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Folder className="w-5 h-5 text-primary" />
              Change Backup Folder?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You can select a new location for your CHITRA backup folder. Your app data will NOT be affected - this folder is only used for exports and file backups.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleChangeFolder}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Choose New Location
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
