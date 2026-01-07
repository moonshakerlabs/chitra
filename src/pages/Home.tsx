import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Droplets, Weight, Smile, TrendingUp, Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useLatestCycle, useCycleInsights } from '@/modules/cycle';
import { useLatestWeight, useWeightTrend } from '@/modules/weight';
import { useProfile } from '@/core/context/ProfileContext';
import { getGreeting } from '@/core/utils/helpers';
import { formatDate, getRelativeDay } from '@/core/utils/dateUtils';
import { formatWeight } from '@/core/utils/helpers';
import ProfileSelector from '@/shared/components/ProfileSelector';
import ProfileEditModal from '@/profiles/ProfileEditModal';

const Home = () => {
  const navigate = useNavigate();
  const { activeProfile } = useProfile();
  const { cycle, isOngoing } = useLatestCycle();
  const { insights } = useCycleInsights();
  const { weight: latestWeight } = useLatestWeight();
  const { trend: weightTrend } = useWeightTrend(30);
  const [showAddProfile, setShowAddProfile] = useState(false);

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
        className="grid grid-cols-2 gap-4"
      >
        <Button
          variant="outline"
          className="h-24 flex-col gap-2 rounded-2xl border-2 hover:border-primary hover:bg-primary/5"
          onClick={() => navigate('/cycle')}
        >
          <Droplets className="w-8 h-8 text-primary" />
          <span className="text-sm font-medium">Log Cycle</span>
        </Button>
        <Button
          variant="outline"
          className="h-24 flex-col gap-2 rounded-2xl border-2 hover:border-primary hover:bg-primary/5"
          onClick={() => navigate('/weight')}
        >
          <Weight className="w-8 h-8 text-primary" />
          <span className="text-sm font-medium">Log Weight</span>
        </Button>
      </motion.div>

      {/* Cycle Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card 
          className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/cycle')}
        >
          <div className="gradient-primary p-5">
            <div className="flex items-center gap-3 text-primary-foreground">
              <Droplets className="w-5 h-5" />
              <span className="font-medium">Cycle Status</span>
            </div>
          </div>
          <CardContent className="p-4">
            {isOngoing ? (
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
