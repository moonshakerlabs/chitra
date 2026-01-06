import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, Droplets, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLatestCycle, useCycleInsights } from './useCycle';
import { formatDate, getRelativeDay, formatDuration } from '@/core/utils/dateUtils';
import CycleLogModal from './CycleLogModal';

const CycleTracker = () => {
  const { cycle, loading, isOngoing, startToday, endToday, reload } = useLatestCycle();
  const { insights, reload: reloadInsights } = useCycleInsights();
  const [showLogModal, setShowLogModal] = useState(false);

  const handleQuickLog = async () => {
    if (isOngoing) {
      await endToday();
    } else {
      await startToday();
    }
    reloadInsights();
  };

  const handleLogComplete = () => {
    setShowLogModal(false);
    reload();
    reloadInsights();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse-soft text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cycle Tracking</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your menstrual cycle</p>
        </div>
        <Button
          size="icon"
          variant="outline"
          onClick={() => setShowLogModal(true)}
          className="rounded-full w-12 h-12"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Current Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="overflow-hidden">
          <div className="gradient-primary p-6">
            <div className="flex items-center gap-3 text-primary-foreground mb-4">
              <Droplets className="w-6 h-6" />
              <span className="font-medium">Current Status</span>
            </div>
            
            {isOngoing ? (
              <div className="text-primary-foreground">
                <p className="text-3xl font-bold mb-1">Period Active</p>
                <p className="opacity-90">
                  Started {cycle?.startDate && getRelativeDay(cycle.startDate)}
                </p>
              </div>
            ) : cycle ? (
              <div className="text-primary-foreground">
                <p className="text-3xl font-bold mb-1">Not on Period</p>
                {insights?.nextPredictedStart && (
                  <p className="opacity-90">
                    Next expected: {getRelativeDay(insights.nextPredictedStart)}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-primary-foreground">
                <p className="text-3xl font-bold mb-1">No Data Yet</p>
                <p className="opacity-90">Start logging your cycle</p>
              </div>
            )}
          </div>
          
          <CardContent className="p-4">
            <Button
              onClick={handleQuickLog}
              variant={isOngoing ? 'secondary' : 'default'}
              className="w-full h-12 rounded-xl text-base font-medium"
            >
              {isOngoing ? 'Log Period End' : 'Log Period Start'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Insights Cards */}
      {insights && insights.totalCyclesLogged > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4"
        >
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-medium">Avg. Cycle</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {insights.averageCycleLength ? `${insights.averageCycleLength}` : '—'}
            </p>
            <p className="text-xs text-muted-foreground">days</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">Avg. Duration</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {insights.averagePeriodDuration ? `${insights.averagePeriodDuration}` : '—'}
            </p>
            <p className="text-xs text-muted-foreground">days</p>
          </Card>
        </motion.div>
      )}

      {/* Recent History */}
      {cycle && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold text-foreground mb-3">Last Period</h2>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">
                  {formatDate(cycle.startDate, 'MMM d')}
                  {cycle.endDate && ` - ${formatDate(cycle.endDate, 'MMM d')}`}
                </p>
                {cycle.endDate && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Duration: {formatDuration(
                      Math.ceil((new Date(cycle.endDate).getTime() - new Date(cycle.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
                    )}
                  </p>
                )}
              </div>
              {cycle.mood && (
                <span className="text-2xl">
                  {cycle.mood === 'happy' && '😊'}
                  {cycle.mood === 'calm' && '😌'}
                  {cycle.mood === 'sad' && '😢'}
                  {cycle.mood === 'anxious' && '😰'}
                  {cycle.mood === 'tired' && '😴'}
                  {cycle.mood === 'neutral' && '😐'}
                </span>
              )}
            </div>
            {cycle.notes && (
              <p className="text-sm text-muted-foreground mt-3 border-t border-border pt-3">
                {cycle.notes}
              </p>
            )}
          </Card>
        </motion.div>
      )}

      {/* Note about predictions */}
      {insights?.nextPredictedStart && (
        <p className="text-xs text-muted-foreground text-center px-4">
          * Predictions are estimates based on your logged data and may vary.
        </p>
      )}

      {/* Log Modal */}
      <CycleLogModal
        open={showLogModal}
        onClose={() => setShowLogModal(false)}
        onComplete={handleLogComplete}
      />
    </div>
  );
};

export default CycleTracker;
