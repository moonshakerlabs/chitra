import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Baby, Clock, Edit2, Trash2, Check, Pause, Play } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFeedingSchedules, useFeedingLogs } from './useFeeding';
import FeedingSetupModal from './FeedingSetupModal';
import type { FeedingSchedule } from '@/core/types';
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
} from '@/components/ui/alert-dialog';

const FeedingTracker = () => {
  const { schedules, loading, add, update, remove, toggle } = useFeedingSchedules();
  const { todaysLogs, markCompleted } = useFeedingLogs();
  const { toast } = useToast();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<FeedingSchedule | null>(null);
  const [deleteScheduleId, setDeleteScheduleId] = useState<string | null>(null);

  const handleAdd = async (
    feedingName: string,
    reminderType: 'time' | 'interval',
    reminderTime?: string,
    intervalHours?: number
  ) => {
    await add(feedingName, reminderType, reminderTime, intervalHours);
    toast({
      title: 'Schedule Added',
      description: `${feedingName} feeding schedule created`,
    });
  };

  const handleUpdate = async (id: string, updates: Partial<FeedingSchedule>) => {
    await update(id, updates);
    setEditingSchedule(null);
    toast({
      title: 'Schedule Updated',
      description: 'Feeding schedule has been updated',
    });
  };

  const handleDelete = async () => {
    if (!deleteScheduleId) return;
    
    await remove(deleteScheduleId);
    setDeleteScheduleId(null);
    toast({
      title: 'Schedule Deleted',
      description: 'Feeding schedule has been removed',
    });
  };

  const handleMarkComplete = async (scheduleId: string, feedingName: string) => {
    await markCompleted(scheduleId);
    toast({
      title: 'Feeding Logged',
      description: `${feedingName} marked as completed`,
    });
  };

  const formatScheduleInfo = (schedule: FeedingSchedule): string => {
    if (schedule.reminderType === 'time' && schedule.reminderTime) {
      return `Daily at ${schedule.reminderTime}`;
    } else if (schedule.reminderType === 'interval' && schedule.intervalHours) {
      return `Every ${schedule.intervalHours} hour${schedule.intervalHours !== 1 ? 's' : ''}`;
    }
    return '';
  };

  const getTodaysFeedCount = (scheduleId: string): number => {
    return todaysLogs.filter(l => l.scheduleId === scheduleId && !l.snoozed).length;
  };

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
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Feeding Tracker</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage feeding schedules for your little one
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} size="icon" className="rounded-full">
          <Plus className="w-5 h-5" />
        </Button>
      </motion.div>

      {/* Today's Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Baby className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Today's Feedings</p>
              <p className="text-sm text-muted-foreground">
                {todaysLogs.filter(l => !l.snoozed).length} completed
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Feeding Schedules */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Schedules
        </h2>

        {schedules.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <Baby className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No feeding schedules yet</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Schedule
            </Button>
          </Card>
        ) : (
          schedules.map((schedule, index) => (
            <motion.div
              key={schedule.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Card className={`p-4 ${!schedule.isActive ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">
                        {schedule.feedingName}
                      </p>
                      {!schedule.isActive && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">
                          Paused
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatScheduleInfo(schedule)}</span>
                    </div>
                    <p className="text-xs text-primary mt-2">
                      Today: {getTodaysFeedCount(schedule.id)} feeding(s)
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMarkComplete(schedule.id, schedule.feedingName)}
                      disabled={!schedule.isActive}
                      className="h-8 w-8"
                    >
                      <Check className="w-4 h-4 text-green-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggle(schedule.id)}
                      className="h-8 w-8"
                    >
                      {schedule.isActive ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingSchedule(schedule)}
                      className="h-8 w-8"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteScheduleId(schedule.id)}
                      className="h-8 w-8 text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Add Modal */}
      <FeedingSetupModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSave={handleAdd}
      />

      {/* Edit Modal */}
      <FeedingSetupModal
        open={!!editingSchedule}
        onOpenChange={(open) => !open && setEditingSchedule(null)}
        onSave={handleAdd}
        onUpdate={handleUpdate}
        editingSchedule={editingSchedule}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteScheduleId} onOpenChange={() => setDeleteScheduleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Feeding Schedule?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this feeding schedule and all its logs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FeedingTracker;
