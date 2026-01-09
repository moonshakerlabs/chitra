import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pill, Clock, Pause, Play, StopCircle, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProfile } from '@/core/context/ProfileContext';
import { useMedicineSchedules, useMedicineLogs } from './useMedicine';
import MedicineSetupModal from './MedicineSetupModal';
import MedicineReminderModal from './MedicineReminderModal';
import type { MedicineSchedule, MedicineLog } from '@/core/types';
import ProfileSelector from '@/shared/components/ProfileSelector';

const MedicineTracker = () => {
  const { activeProfile } = useProfile();
  const { schedules, loading, add, update, remove, togglePause, stop } = useMedicineSchedules();
  const { logs, markTaken, snooze, stats } = useMedicineLogs();
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<MedicineSchedule | undefined>();
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [activeReminder, setActiveReminder] = useState<{
    schedule: MedicineSchedule;
    log: MedicineLog;
    snoozeCount: number;
  } | null>(null);

  const handleAddNew = () => {
    setSelectedSchedule(undefined);
    setShowSetupModal(true);
  };

  const handleEdit = (schedule: MedicineSchedule) => {
    setSelectedSchedule(schedule);
    setShowSetupModal(true);
  };

  const handleSave = async (data: {
    medicineName: string;
    timesPerDay: number;
    intervalHours: number;
    totalDays?: number;
    totalReminders?: number;
  }) => {
    if (selectedSchedule) {
      await update(selectedSchedule.id, data);
    } else {
      await add(
        data.medicineName,
        data.timesPerDay,
        data.intervalHours,
        data.totalDays,
        data.totalReminders
      );
    }
  };

  const handleDelete = async () => {
    if (selectedSchedule) {
      await remove(selectedSchedule.id);
    }
  };

  const handleTaken = async () => {
    if (activeReminder) {
      await markTaken(activeReminder.log.id);
    }
  };

  const handleSnooze = async (minutes: number) => {
    if (activeReminder) {
      return await snooze(activeReminder.log.id, minutes);
    }
    return { markedAsMissed: false };
  };

  const getScheduleStatus = (schedule: MedicineSchedule) => {
    if (!schedule.isActive) return { label: 'Completed', variant: 'secondary' as const };
    if (schedule.isPaused) return { label: 'Paused', variant: 'outline' as const };
    return { label: 'Active', variant: 'default' as const };
  };

  const getScheduleLogs = (scheduleId: string) => {
    return logs.filter(l => l.scheduleId === scheduleId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse-soft text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6 pb-24 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Medicine</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track medicine intake for {activeProfile?.name}
          </p>
        </div>
        <ProfileSelector showAddButton={false} compact />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-lg font-bold">{stats.taken}</span>
          </div>
          <p className="text-xs text-muted-foreground">Taken</p>
        </Card>
        <Card className="p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
            <XCircle className="w-4 h-4" />
            <span className="text-lg font-bold">{stats.missed}</span>
          </div>
          <p className="text-xs text-muted-foreground">Missed</p>
        </Card>
        <Card className="p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-yellow-600 mb-1">
            <AlertCircle className="w-4 h-4" />
            <span className="text-lg font-bold">{stats.pending}</span>
          </div>
          <p className="text-xs text-muted-foreground">Pending</p>
        </Card>
      </div>

      {/* Add Button */}
      <Button onClick={handleAddNew} className="w-full gap-2">
        <Plus className="w-5 h-5" />
        Add Medicine
      </Button>

      {/* Medicine List */}
      {schedules.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Pill className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-medium text-foreground mb-2">No Medicines Added</h3>
          <p className="text-sm text-muted-foreground">
            Start tracking medicine intake by adding your first medicine schedule.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {schedules.map((schedule, index) => {
            const status = getScheduleStatus(schedule);
            const scheduleLogs = getScheduleLogs(schedule.id);
            const takenToday = scheduleLogs.filter(l => {
              const today = new Date();
              const logDate = new Date(l.createdAt);
              return l.status === 'taken' && 
                logDate.toDateString() === today.toDateString();
            }).length;

            return (
              <motion.div
                key={schedule.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Pill className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-foreground truncate">
                          {schedule.medicineName}
                        </h3>
                        <Badge variant={status.variant} className="text-xs">
                          {status.label}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {schedule.timesPerDay}x daily, every {schedule.intervalHours}h
                          </span>
                        </div>
                        <div>
                          Today: {takenToday}/{schedule.timesPerDay} taken
                        </div>
                        {schedule.totalDays && (
                          <div>
                            Duration: {schedule.totalDays} days
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {schedule.isActive && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePause(schedule.id)}
                        className="flex-1 gap-1"
                      >
                        {schedule.isPaused ? (
                          <>
                            <Play className="w-4 h-4" />
                            Resume
                          </>
                        ) : (
                          <>
                            <Pause className="w-4 h-4" />
                            Pause
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(schedule)}
                        className="flex-1"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => stop(schedule.id)}
                        className="gap-1 text-destructive"
                      >
                        <StopCircle className="w-4 h-4" />
                        Stop
                      </Button>
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Setup Modal */}
      <MedicineSetupModal
        open={showSetupModal}
        onOpenChange={setShowSetupModal}
        schedule={selectedSchedule}
        onSave={handleSave}
        onDelete={selectedSchedule ? handleDelete : undefined}
      />

      {/* Reminder Modal */}
      {activeReminder && (
        <MedicineReminderModal
          open={showReminderModal}
          onOpenChange={setShowReminderModal}
          schedule={activeReminder.schedule}
          log={activeReminder.log}
          snoozeCount={activeReminder.snoozeCount}
          onTaken={handleTaken}
          onSnooze={handleSnooze}
        />
      )}
    </div>
  );
};

export default MedicineTracker;
