import { useState, useEffect } from 'react';
import { Pill, Clock, Calendar, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { MedicineSchedule } from '@/core/types';
import { useToast } from '@/hooks/use-toast';

interface MedicineSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule?: MedicineSchedule;
  onSave: (data: {
    medicineName: string;
    timesPerDay: number;
    intervalHours: number;
    totalDays?: number;
    totalReminders?: number;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
}

const MedicineSetupModal = ({
  open,
  onOpenChange,
  schedule,
  onSave,
  onDelete,
}: MedicineSetupModalProps) => {
  const [medicineName, setMedicineName] = useState('');
  const [timesPerDay, setTimesPerDay] = useState(3);
  const [intervalHours, setIntervalHours] = useState(8);
  const [endType, setEndType] = useState<'days' | 'reminders'>('days');
  const [totalDays, setTotalDays] = useState(7);
  const [totalReminders, setTotalReminders] = useState(21);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const isEditMode = !!schedule;

  useEffect(() => {
    if (schedule) {
      setMedicineName(schedule.medicineName);
      setTimesPerDay(schedule.timesPerDay);
      setIntervalHours(schedule.intervalHours);
      if (schedule.totalDays) {
        setEndType('days');
        setTotalDays(schedule.totalDays);
      } else if (schedule.totalReminders) {
        setEndType('reminders');
        setTotalReminders(schedule.totalReminders);
      }
    } else {
      setMedicineName('');
      setTimesPerDay(3);
      setIntervalHours(8);
      setEndType('days');
      setTotalDays(7);
      setTotalReminders(21);
    }
  }, [schedule, open]);

  const handleSave = async () => {
    if (!medicineName.trim()) {
      toast({
        title: 'Medicine Name Required',
        description: 'Please enter the medicine name',
        variant: 'destructive',
      });
      return;
    }

    if (timesPerDay < 1 || timesPerDay > 12) {
      toast({
        title: 'Invalid Times Per Day',
        description: 'Please enter a value between 1 and 12',
        variant: 'destructive',
      });
      return;
    }

    if (intervalHours < 1 || intervalHours > 24) {
      toast({
        title: 'Invalid Interval',
        description: 'Please enter an interval between 1 and 24 hours',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await onSave({
        medicineName: medicineName.trim(),
        timesPerDay,
        intervalHours,
        totalDays: endType === 'days' ? totalDays : undefined,
        totalReminders: endType === 'reminders' ? totalReminders : undefined,
      });
      toast({
        title: isEditMode ? 'Medicine Updated' : 'Medicine Added',
        description: `${medicineName} schedule has been ${isEditMode ? 'updated' : 'created'}`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save medicine schedule',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setSaving(true);
    try {
      await onDelete();
      toast({
        title: 'Medicine Removed',
        description: 'The medicine schedule has been removed',
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove medicine',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Medicine' : 'Add Medicine'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Medicine Name */}
          <div>
            <Label htmlFor="medicineName" className="text-sm font-medium mb-2 block">
              <Pill className="inline w-4 h-4 mr-1" />
              Medicine Name
            </Label>
            <Input
              id="medicineName"
              value={medicineName}
              onChange={(e) => setMedicineName(e.target.value)}
              placeholder="e.g., Paracetamol, Vitamin D"
              maxLength={100}
            />
          </div>

          {/* Times Per Day */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              <Hash className="inline w-4 h-4 mr-1" />
              Times Per Day
            </Label>
            <Select
              value={timesPerDay.toString()}
              onValueChange={(v) => setTimesPerDay(parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <SelectItem key={n} value={n.toString()}>
                    {n} time{n > 1 ? 's' : ''} per day
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Interval Hours */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              <Clock className="inline w-4 h-4 mr-1" />
              Time Gap Between Reminders
            </Label>
            <Select
              value={intervalHours.toString()}
              onValueChange={(v) => setIntervalHours(parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2, 3, 4, 6, 8, 12, 24].map((n) => (
                  <SelectItem key={n} value={n.toString()}>
                    Every {n} hour{n > 1 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* End Condition */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              <Calendar className="inline w-4 h-4 mr-1" />
              Stop After
            </Label>
            <div className="flex gap-2">
              <Select
                value={endType}
                onValueChange={(v) => setEndType(v as 'days' | 'reminders')}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days">Days</SelectItem>
                  <SelectItem value="reminders">Reminders</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                min={1}
                max={endType === 'days' ? 365 : 999}
                value={endType === 'days' ? totalDays : totalReminders}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  if (endType === 'days') {
                    setTotalDays(val);
                  } else {
                    setTotalReminders(val);
                  }
                }}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Reminders will stop automatically after this
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {isEditMode && onDelete && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
              className="flex-shrink-0"
            >
              Remove
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? 'Saving...' : isEditMode ? 'Update' : 'Add'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MedicineSetupModal;
