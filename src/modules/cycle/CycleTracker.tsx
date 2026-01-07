import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Plus, Droplets, Clock, ArrowLeft, Pencil, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLatestCycle, useCycleInsights, useCycles } from './useCycle';
import { useProfile } from '@/core/context/ProfileContext';
import { formatDate, formatDuration } from '@/core/utils/dateUtils';
import CycleLogModal from './CycleLogModal';
import CycleEditModal from './CycleEditModal';
import type { CycleEntry } from '@/core/types';
import { addDays, differenceInDays, format } from 'date-fns';

const CycleTracker = () => {
  const navigate = useNavigate();
  const { activeProfile } = useProfile();
  const { cycle, loading, isOngoing, startToday, endToday, reload } = useLatestCycle();
  const { insights, reload: reloadInsights } = useCycleInsights();
  const { cycles, reload: reloadCycles } = useCycles();
  const [showLogModal, setShowLogModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CycleEntry | null>(null);

  const handleQuickLog = async () => {
    if (!activeProfile) return;
    if (isOngoing) {
      await endToday();
    } else {
      await startToday(activeProfile.id);
    }
    reloadInsights();
    reloadCycles();
  };

  const handleLogComplete = () => {
    setShowLogModal(false);
    reload();
    reloadInsights();
    reloadCycles();
  };

  const handleEditComplete = () => {
    setShowEditModal(false);
    setEditingEntry(null);
    reload();
    reloadInsights();
    reloadCycles();
  };

  const openEditModal = (entry: CycleEntry) => {
    setEditingEntry(entry);
    setShowEditModal(true);
  };

  // Calculate cycle gaps and durations for history display
  const getCycleWithDetails = () => {
    if (!cycles || cycles.length === 0) return [];
    
    // Sort by start date descending (newest first)
    const sortedCycles = [...cycles].sort((a, b) => 
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );

    return sortedCycles.map((cycle, index) => {
      // Duration of the period
      const duration = cycle.endDate 
        ? differenceInDays(new Date(cycle.endDate), new Date(cycle.startDate)) + 1
        : null;

      // Cycle length (gap to next cycle - which is the previous one in the sorted array)
      // For the newest cycle, there's no "next" cycle yet
      let cycleLength: number | null = null;
      
      if (index < sortedCycles.length - 1) {
        // There's a previous cycle (older), calculate cycle length from older to current
        const olderCycle = sortedCycles[index + 1];
        cycleLength = differenceInDays(new Date(cycle.startDate), new Date(olderCycle.startDate));
      }

      return {
        ...cycle,
        duration,
        cycleLength,
      };
    });
  };

  const cyclesWithDetails = getCycleWithDetails();

  // Calculate predicted next cycle date
  const getNextPredictedDate = () => {
    if (!cycles || cycles.length === 0) return null;
    if (!insights?.averageCycleLength) return null;

    const latestCycle = [...cycles].sort((a, b) => 
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    )[0];

    const nextDate = addDays(new Date(latestCycle.startDate), insights.averageCycleLength);
    return nextDate;
  };

  const nextPredictedDate = getNextPredictedDate();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse-soft text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cycle Tracking</h1>
            <p className="text-muted-foreground text-sm mt-1">Track your menstrual cycle</p>
          </div>
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
                  Started {cycle?.startDate && format(new Date(cycle.startDate), 'MMM d, yyyy')}
                </p>
              </div>
            ) : cycle ? (
              <div className="text-primary-foreground">
                <p className="text-3xl font-bold mb-1">Not on Period</p>
                {nextPredictedDate && (
                  <p className="opacity-90">
                    Next expected: {format(nextPredictedDate, 'MMM d, yyyy')}
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
          
          <CardContent className="p-4 space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              {isOngoing 
                ? 'Tap the button below when your period ends to log the end date.'
                : 'Tap the button below when your period starts to begin tracking a new cycle.'}
            </p>
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

      {/* Next Cycle Prediction */}
      {nextPredictedDate && insights && insights.totalCyclesLogged >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4 border-primary/20 bg-primary/5">
            <div className="flex items-center gap-3 mb-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">Next Cycle Prediction</span>
            </div>
            <p className="text-lg font-semibold text-foreground">
              Tentatively expected on {format(nextPredictedDate, 'MMMM d, yyyy')}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              * This is an estimate based on your average cycle length of {insights.averageCycleLength} days
            </p>
          </Card>
        </motion.div>
      )}

      {/* Insights Cards */}
      {insights && insights.totalCyclesLogged > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
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

      {/* Cycle History */}
      {cyclesWithDetails.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold text-foreground mb-3">Cycle History</h2>
          <div className="space-y-3">
            {cyclesWithDetails.map((entry, index) => (
              <Card 
                key={entry.id} 
                className="p-4 cursor-pointer hover:bg-secondary/50 transition-colors"
                onClick={() => openEditModal(entry)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-foreground">
                        {formatDate(entry.startDate, 'MMM d, yyyy')}
                        {entry.endDate ? ` - ${formatDate(entry.endDate, 'MMM d, yyyy')}` : ' (Ongoing)'}
                      </p>
                      {entry.mood && (
                        <span className="text-lg">
                          {entry.mood === 'happy' && '😊'}
                          {entry.mood === 'calm' && '😌'}
                          {entry.mood === 'sad' && '😢'}
                          {entry.mood === 'anxious' && '😰'}
                          {entry.mood === 'tired' && '😴'}
                          {entry.mood === 'neutral' && '😐'}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {entry.duration && (
                        <span>Duration: {formatDuration(entry.duration)}</span>
                      )}
                      {entry.cycleLength !== null && (
                        <span>Cycle length: {entry.cycleLength} days</span>
                      )}
                      {index === cyclesWithDetails.length - 1 && !entry.cycleLength && (
                        <span className="text-muted-foreground/60">First logged entry</span>
                      )}
                    </div>
                    {entry.notes && (
                      <p className="text-sm text-muted-foreground mt-2 truncate max-w-[250px]">
                        {entry.notes}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
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

      {/* Edit Modal */}
      {editingEntry && (
        <CycleEditModal
          open={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingEntry(null);
          }}
          onComplete={handleEditComplete}
          entry={editingEntry}
        />
      )}
    </div>
  );
};

export default CycleTracker;
