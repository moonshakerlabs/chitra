import { useState } from 'react';
import { Pill, Clock, Check, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { MedicineSchedule, MedicineLog } from '@/core/types';
import { useToast } from '@/hooks/use-toast';
import { MAX_SNOOZE_COUNT, MAX_SNOOZE_MINUTES } from './medicineService';

interface MedicineReminderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: MedicineSchedule;
  log: MedicineLog;
  snoozeCount: number;
  onTaken: () => Promise<void>;
  onSnooze: (minutes: number) => Promise<{ markedAsMissed: boolean }>;
}

const snoozeOptions = [
  { minutes: 5, label: '5 min' },
  { minutes: 10, label: '10 min' },
  { minutes: 15, label: '15 min' },
  { minutes: 30, label: '30 min' },
];

const MedicineReminderModal = ({
  open,
  onOpenChange,
  schedule,
  log,
  snoozeCount,
  onTaken,
  onSnooze,
}: MedicineReminderModalProps) => {
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const remainingSnoozes = MAX_SNOOZE_COUNT - snoozeCount;
  const canSnooze = remainingSnoozes > 0;

  const handleTaken = async () => {
    setProcessing(true);
    try {
      await onTaken();
      toast({
        title: 'Medicine Taken',
        description: `${schedule.medicineName} marked as taken`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark as taken',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleSnooze = async (minutes: number) => {
    setProcessing(true);
    try {
      const result = await onSnooze(minutes);
      if (result.markedAsMissed) {
        toast({
          title: 'Marked as Missed',
          description: `${schedule.medicineName} has been marked as missed after ${MAX_SNOOZE_COUNT} snoozes`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Reminder Snoozed',
          description: `Will remind again in ${minutes} minutes`,
        });
      }
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to snooze reminder',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-primary" />
            Medicine Reminder
          </DialogTitle>
          <DialogDescription>
            Time for your medicine: <strong>{schedule.medicineName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Main Action */}
          <Button
            onClick={handleTaken}
            disabled={processing}
            className="w-full h-14 text-lg gap-2"
          >
            <Check className="w-6 h-6" />
            Yes, I took it
          </Button>

          {/* Snooze Options */}
          {canSnooze ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Snooze for:
                </span>
                <span className="text-xs">
                  {remainingSnoozes} snooze{remainingSnoozes !== 1 ? 's' : ''} left
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {snoozeOptions.map((option) => (
                  <Button
                    key={option.minutes}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSnooze(option.minutes)}
                    disabled={processing}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Max {MAX_SNOOZE_MINUTES} min per snooze. After {MAX_SNOOZE_COUNT} snoozes, it will be marked as missed.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p>No more snoozes available. Please take your medicine or it will be marked as missed.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MedicineReminderModal;
