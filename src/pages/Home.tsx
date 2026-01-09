import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Droplets, Weight, Smile, TrendingUp, Baby, Calendar, Syringe, Pill } from 'lucide-react';
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

const Home = () => {
  const navigate = useNavigate();
  const { activeProfile, reload } = useProfile();
  const { cycle, isOngoing } = useLatestCycle();
  const { insights } = useCycleInsights();
  const { weight: latestWeight } = useLatestWeight();
  const { trend: weightTrend } = useWeightTrend(30);
  const [showAddProfile, setShowAddProfile] = useState(false);
  const { toast } = useToast();

  const isPregnantMode = activeProfile?.mode === 'pregnant';
  const isChildcareMode = activeProfile?.mode === 'childcare';

  const handleSwitchToNormal = async () => {
    if (!activeProfile) return;
    await updateProfile(activeProfile.id, { 
      mode: 'normal', 
      pregnancyStartDate: undefined, 
      expectedDueDate: undefined 
    });
    toast({
      title: 'Mode Updated',
      description: 'Switched to normal mode. You can now track your cycles.',
    });
    reload();
  };

  const getPregnancyWeeks = (): number | null => {
    if (!activeProfile?.pregnancyStartDate) return null;
    const days = daysBetween(activeProfile.pregnancyStartDate, new Date().toISOString().split('T')[0]);
    return Math.floor(days / 7);
  };

  return (
    <div className="px-4 py-6 space-y-6 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <p className="text-muted-foreground">{getGreeting()}</p>
          <h1 className="text-2xl font-bold text-foreground">
            {activeProfile ? `Hi, ${activeProfile.name}` : 'CHITRA Welcomes You'}
          </h1>
        </div>
        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
          <Heart className="w-6 h-6 text-primary-foreground fill-primary-foreground" />
        </div>
      </motion.div>

      {/* Profile Selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <ProfileSelector onAddClick={() => setShowAddProfile(true)} />
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-20 flex-col gap-2 rounded-2xl border-2 hover:border-primary hover:bg-primary/5"
            onClick={() => navigate('/cycle')}
          >
            <Droplets className="w-6 h-6 text-primary" />
            <span className="text-xs font-medium">Log Cycle</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex-col gap-2 rounded-2xl border-2 hover:border-primary hover:bg-primary/5"
            onClick={() => navigate('/weight')}
          >
            <Weight className="w-6 h-6 text-primary" />
            <span className="text-xs font-medium">Log Weight</span>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-20 flex-col gap-2 rounded-2xl border-2 hover:border-primary hover:bg-primary/5"
            onClick={() => navigate('/vaccination')}
          >
            <Syringe className="w-6 h-6 text-primary" />
            <span className="text-xs font-medium">Log Vaccination</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex-col gap-2 rounded-2xl border-2 hover:border-primary hover:bg-primary/5"
            onClick={() => navigate('/medicine')}
          >
            <Pill className="w-6 h-6 text-primary" />
            <span className="text-xs font-medium">Log Medicine</span>
          </Button>
        </div>
      </motion.div>

      {/* Cycle Status Card - Hidden in childcare mode */}
      {!isChildcareMode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card 
            className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => !isPregnantMode && navigate('/cycle')}
          >
            <div className="gradient-primary p-5">
              <div className="flex items-center gap-3 text-primary-foreground">
                {isPregnantMode ? (
                  <Baby className="w-5 h-5" />
                ) : (
                  <Droplets className="w-5 h-5" />
                )}
                <span className="font-medium">
                  {isPregnantMode ? 'Pregnancy Mode' : 'Cycle Status'}
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
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSwitchToNormal();
                    }}
                  >
                    First period after pregnancy? Switch to Normal
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

      {/* Childcare Quick Access */}
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
    </div>
  );
};

export default Home;
