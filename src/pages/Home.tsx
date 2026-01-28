import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Heart, Droplets, Weight, Smile, TrendingUp, Baby, Syringe, Pill, Utensils, Smartphone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useLatestCycle, useCycleInsights } from '@/modules/cycle';
import { useLatestWeight, useWeightTrend } from '@/modules/weight';
import { useProfile } from '@/core/context/ProfileContext';
import { getGreeting } from '@/core/utils/helpers';
import { formatDate, getRelativeDay, daysBetween } from '@/core/utils/dateUtils';
import { formatWeight } from '@/core/utils/helpers';
import { updateProfile } from '@/core/storage/profileService';
import ProfileSelector from '@/shared/components/ProfileSelector';
import ProfileEditModal from '@/profiles/ProfileEditModal';
import { useToast } from '@/hooks/use-toast';
import { differenceInYears } from 'date-fns';
import type { Profile } from '@/core/types';
import { useScreenTime, useScreenTimeTracking } from '@/modules/screentime';
import { formatScreenTime, getCurrentWeekInfo } from '@/modules/screentime/screenTimeService';
import { formatDynamicScreenTime } from '@/modules/screentime/screenTimeSessionService';

const Home = () => {
  const navigate = useNavigate();
  const { activeProfile, profiles, reload } = useProfile();
  const { cycle, isOngoing, reload: reloadCycle } = useLatestCycle();
  const { insights, reload: reloadInsights } = useCycleInsights();
  const { weight: latestWeight } = useLatestWeight();
  const { trend: weightTrend } = useWeightTrend(30);
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | undefined>(undefined);
  const { toast } = useToast();
  const { currentWeekEntry } = useScreenTime();
  const { isTracking, elapsedSeconds, aggregates, startTracking, stopTracking } = useScreenTimeTracking();
  const { weekNumber: currentWeek } = getCurrentWeekInfo();

  // Check if this is the primary/main profile
  const isPrimaryUser = activeProfile?.type === 'main';

  // Refresh cycle data when profile mode changes
  const refreshCycleData = useCallback(() => {
    reloadCycle();
    reloadInsights();
  }, [reloadCycle, reloadInsights]);

  // Listen for profile changes and refresh cycle data
  useEffect(() => {
    if (activeProfile) {
      refreshCycleData();
    }
  }, [activeProfile?.mode, activeProfile?.id, refreshCycleData]);

  const isPregnantMode = activeProfile?.mode === 'pregnant';
  const isPostpartumMode = activeProfile?.mode === 'postpartum';
  const isChildcareMode = activeProfile?.mode === 'childcare';
  const isNoMenstrualMode = activeProfile?.mode === 'no_menstrual';
  
  // Check if this is a dependent profile (under 18)
  const isDependent = activeProfile?.type === 'dependent';
  
  // Check if feeding should be shown (for dependents under 5, or childcare mode for adults)
  const shouldShowFeeding = () => {
    if (!activeProfile) return false;
    
    // Adults in childcare mode
    if (activeProfile.type === 'main' && isChildcareMode) return true;
    
    // Dependents under 5 years (regardless of gender)
    if (isDependent && activeProfile.dateOfBirth) {
      const age = differenceInYears(new Date(), new Date(activeProfile.dateOfBirth));
      return age < 5;
    }
    
    return false;
  };

  // Check if cycle tracking should be hidden for this profile
  const shouldHideCycle = () => {
    if (!activeProfile) return false;
    
    // Hide for male profiles
    if (activeProfile.gender === 'male') return true;
    
    // Hide for "no_menstrual" mode (menopause, hysterectomy)
    if (activeProfile.mode === 'no_menstrual') return true;
    
    // Hide for childcare mode
    if (activeProfile.mode === 'childcare') return true;
    
    // For main profiles (adults), show cycle normally
    if (activeProfile.type === 'main') return false;
    
    // For female dependents, check age (show if 10 or above)
    if (activeProfile.dateOfBirth && activeProfile.gender === 'female') {
      const age = differenceInYears(new Date(), new Date(activeProfile.dateOfBirth));
      if (age < 10) return true;
    }
    
    return false;
  };

  const handleSwitchToPostpartum = async () => {
    if (!activeProfile) return;
    await updateProfile(activeProfile.id, { 
      mode: 'postpartum', 
      pregnancyStartDate: undefined, 
      expectedDueDate: undefined 
    });
    toast({
      title: 'Mode Updated',
      description: 'Switched to post partum mode.',
    });
    await reload();
    refreshCycleData();
  };

  const handleFirstPeriodAfterBirth = async () => {
    if (!activeProfile) return;
    
    // First switch to normal mode
    await updateProfile(activeProfile.id, { mode: 'normal' });
    
    toast({
      title: 'Mode Updated',
      description: 'Switched to normal mode. You can now log your cycle.',
    });
    
    await reload();
    refreshCycleData();
    
    // Then navigate to cycle tracker to log first period
    navigate('/cycle');
  };

  const getPregnancyWeeks = (): number | null => {
    if (!activeProfile?.pregnancyStartDate) return null;
    const days = daysBetween(activeProfile.pregnancyStartDate, new Date().toISOString().split('T')[0]);
    return Math.floor(days / 7);
  };

  const hideCycle = shouldHideCycle();
  const showFeeding = shouldShowFeeding();

  return (
    <div className="px-4 py-6 space-y-6 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {activeProfile ? `${getGreeting()}, ${activeProfile.name}` : 'CHITRA Welcomes You'}
          </h1>
        </div>
        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
          <Heart className="w-6 h-6 text-primary-foreground fill-primary-foreground" />
        </div>
      </motion.div>

      {/* Profile Selector with Edit */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <ProfileSelector 
          onAddClick={() => setShowAddProfile(true)} 
          onEditClick={(profile) => setEditingProfile(profile)}
          showEditButton
        />
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <div className="grid grid-cols-2 gap-3">
          {/* Log Cycle - shown for females 10+ not in special modes */}
          {!hideCycle && (
            <Button
              variant="outline"
              className="h-20 flex-col gap-2 rounded-2xl border-2 hover:border-primary hover:bg-primary/5"
              onClick={() => navigate('/cycle')}
            >
              <Droplets className="w-6 h-6 text-primary" />
              <span className="text-xs font-medium">Log Cycle</span>
            </Button>
          )}
          
          {/* Log Weight - always shown */}
          <Button
            variant="outline"
            className="h-20 flex-col gap-2 rounded-2xl border-2 hover:border-primary hover:bg-primary/5"
            onClick={() => navigate('/weight')}
          >
            <Weight className="w-6 h-6 text-primary" />
            <span className="text-xs font-medium">Log Weight</span>
          </Button>
          
          {/* Log Feeding - shown for dependents under 5 or adults in childcare mode */}
          {showFeeding && (
            <Button
              variant="outline"
              className="h-20 flex-col gap-2 rounded-2xl border-2 hover:border-primary hover:bg-primary/5"
              onClick={() => navigate('/feeding')}
            >
              <Utensils className="w-6 h-6 text-primary" />
              <span className="text-xs font-medium">Log Feeding</span>
            </Button>
          )}
          
          {/* Log Vaccination - shown when cycle is hidden or as second row item */}
          {hideCycle && !showFeeding && (
            <Button
              variant="outline"
              className="h-20 flex-col gap-2 rounded-2xl border-2 hover:border-primary hover:bg-primary/5"
              onClick={() => navigate('/vaccination')}
            >
              <Syringe className="w-6 h-6 text-primary" />
              <span className="text-xs font-medium">Log Vaccination</span>
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {/* Log Vaccination - shown in second row for profiles that show cycle */}
          {!hideCycle && (
            <Button
              variant="outline"
              className="h-20 flex-col gap-2 rounded-2xl border-2 hover:border-primary hover:bg-primary/5"
              onClick={() => navigate('/vaccination')}
            >
              <Syringe className="w-6 h-6 text-primary" />
              <span className="text-xs font-medium">Log Vaccination</span>
            </Button>
          )}
          
          {/* Show vaccination if cycle hidden and we haven't shown it yet */}
          {hideCycle && showFeeding && (
            <Button
              variant="outline"
              className="h-20 flex-col gap-2 rounded-2xl border-2 hover:border-primary hover:bg-primary/5"
              onClick={() => navigate('/vaccination')}
            >
              <Syringe className="w-6 h-6 text-primary" />
              <span className="text-xs font-medium">Log Vaccination</span>
            </Button>
          )}
          
          <Button
            variant="outline"
            className="h-20 flex-col gap-2 rounded-2xl border-2 hover:border-primary hover:bg-primary/5"
            onClick={() => navigate('/medicine')}
          >
            <Pill className="w-6 h-6 text-primary" />
            <span className="text-xs font-medium">Log Medicine</span>
          </Button>
          
          {/* Log Screen Time - only for primary user */}
          {isPrimaryUser && (
            <Button
              variant="outline"
              className="h-20 flex-col gap-2 rounded-2xl border-2 hover:border-primary hover:bg-primary/5"
              onClick={() => navigate('/screentime')}
            >
              <Smartphone className="w-6 h-6 text-primary" />
              <span className="text-xs font-medium">Screen Time</span>
            </Button>
          )}
        </div>
      </motion.div>

      {/* Cycle Status Card - Hidden in childcare mode and for male/young profiles */}
      {!isChildcareMode && !hideCycle && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card 
            className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => !isPregnantMode && !isPostpartumMode && navigate('/cycle')}
          >
            <div className="gradient-primary p-5">
              <div className="flex items-center gap-3 text-primary-foreground">
                {isPregnantMode || isPostpartumMode ? (
                  <Baby className="w-5 h-5" />
                ) : (
                  <Droplets className="w-5 h-5" />
                )}
                <span className="font-medium">
                  {isPregnantMode ? 'Pregnancy Mode' : isPostpartumMode ? 'Post Partum' : 'Cycle Status'}
                </span>
              </div>
            </div>
            <CardContent className="p-4">
              {isPregnantMode ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-lg font-semibold text-foreground">Pregnancy Active</p>
                    {getPregnancyWeeks() !== null && (
                      <p className="text-sm text-muted-foreground">
                        Week {getPregnancyWeeks()} of pregnancy
                      </p>
                    )}
                    {activeProfile?.expectedDueDate && (
                      <p className="text-sm text-primary mt-1">
                        Expected: {formatDate(activeProfile.expectedDueDate)}
                      </p>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-wrap leading-tight py-3 h-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSwitchToPostpartum();
                    }}
                  >
                    Child born? Switch to Post Partum
                  </Button>
                </div>
              ) : isPostpartumMode ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-lg font-semibold text-foreground">Post Partum Mode</p>
                    <p className="text-sm text-muted-foreground">
                      Tracking recovery period
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-wrap leading-tight py-3 h-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFirstPeriodAfterBirth();
                    }}
                  >
                    First period after child birth? Log & switch to Normal
                  </Button>
                </div>
              ) : isOngoing ? (
                <div>
                  <p className="text-lg font-semibold text-foreground">Period Active</p>
                  <p className="text-sm text-muted-foreground">
                    Started {cycle?.startDate && getRelativeDay(cycle.startDate)}
                  </p>
                </div>
              ) : cycle ? (
                <div>
                  <p className="text-lg font-semibold text-foreground">Not on Period</p>
                  {insights?.nextPredictedStart && (
                    <p className="text-sm text-muted-foreground">
                      Next expected: {getRelativeDay(insights.nextPredictedStart)} *
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-lg font-semibold text-foreground">Start Tracking</p>
                  <p className="text-sm text-muted-foreground">
                    Log your first cycle to get insights
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Childcare Quick Access - for adults in childcare mode */}
      {isChildcareMode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card 
            className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/feeding')}
          >
            <div className="gradient-primary p-5">
              <div className="flex items-center gap-3 text-primary-foreground">
                <Baby className="w-5 h-5" />
                <span className="font-medium">Child Care Mode</span>
              </div>
            </div>
            <CardContent className="p-4">
              <p className="text-lg font-semibold text-foreground">Feeding & Care Tracking</p>
              <p className="text-sm text-muted-foreground">
                Manage feeding schedules, vaccinations, and medicines
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Feeding Card - for dependent profiles under 5 */}
      {showFeeding && !isChildcareMode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card 
            className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/feeding')}
          >
            <div className="gradient-primary p-5">
              <div className="flex items-center gap-3 text-primary-foreground">
                <Utensils className="w-5 h-5" />
                <span className="font-medium">Feeding Tracker</span>
              </div>
            </div>
            <CardContent className="p-4">
              <p className="text-lg font-semibold text-foreground">
                {activeProfile?.name}'s Feeding
              </p>
              <p className="text-sm text-muted-foreground">
                Track feeding times, types, and quantities
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Weight Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/weight')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Weight className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Weight</p>
                  {latestWeight ? (
                    <p className="text-xl font-bold text-foreground">
                      {formatWeight(latestWeight.weight, latestWeight.unit)}
                    </p>
                  ) : (
                    <p className="text-lg font-semibold text-foreground">Not logged</p>
                  )}
                </div>
              </div>
              {weightTrend && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm capitalize">{weightTrend.direction}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Screen Time Card - only for primary user */}
      {isPrimaryUser && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card 
            className={`cursor-pointer hover:shadow-md transition-shadow ${isTracking ? 'border-primary border-2' : ''}`}
            onClick={() => navigate('/screentime')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isTracking ? 'bg-primary' : 'bg-secondary'}`}>
                    <Smartphone className={`w-5 h-5 ${isTracking ? 'text-primary-foreground' : 'text-primary'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        {isTracking ? 'Tracking Active' : 'Screen Time Today'}
                      </p>
                      {isTracking && (
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      )}
                    </div>
                    {isTracking ? (
                      <p className="text-xl font-bold text-foreground font-mono">
                        {formatDynamicScreenTime(elapsedSeconds)}
                      </p>
                    ) : aggregates && aggregates.daily > 0 ? (
                      <p className="text-xl font-bold text-foreground">
                        {formatDynamicScreenTime(aggregates.daily)}
                      </p>
                    ) : (
                      <p className="text-lg font-semibold text-foreground">Tap to track</p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={isTracking ? 'destructive' : 'default'}
                  onClick={(e) => {
                    e.stopPropagation();
                    isTracking ? stopTracking() : startTracking();
                  }}
                >
                  {isTracking ? 'Stop' : 'Start'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Daily Check-in Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-4 border-dashed">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <Smile className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Daily Check-in</p>
              <p className="text-sm text-muted-foreground">Coming soon!</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Care Points Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-4 border-dashed opacity-60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Care Points</p>
              <p className="text-sm text-muted-foreground">Coming in future update</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Add Profile Modal */}
      <ProfileEditModal
        open={showAddProfile}
        onOpenChange={setShowAddProfile}
      />

      {/* Edit Profile Modal */}
      <ProfileEditModal
        open={!!editingProfile}
        onOpenChange={(open) => !open && setEditingProfile(undefined)}
        profile={editingProfile}
      />
    </div>
  );
};

export default Home;
