import { useState, useEffect } from 'react';
import { Pill, Clock, Calendar, Hash, Timer } from 'lucide-react';
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
    startingFrom?: 'immediately' | '5min' | '10min' | '15min';
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
}

const startingFromOptions = [
  { value: 'immediately', label: 'Immediately', minutes: 0 },
  { value: '5min', label: 'In 5 minutes', minutes: 5 },
  { value: '10min', label: 'In 10 minutes', minutes: 10 },
  { value: '15min', label: 'In 15 minutes', minutes: 15 },
];

const MedicineSetupModal = ({
  open,
  onOpenChange,
  schedule,
  onSave,
  onDelete,
}: MedicineSetupModalProps) => {
  const [medicineName, setMedicineName] = useState('');
  const [timesPerDay, setTimesPerDay] = useState('3');
  const [intervalHours, setIntervalHours] = useState('8');
  const [endType, setEndType] = useState<'days' | 'reminders'>('days');
  const [totalDays, setTotalDays] = useState('7');
  const [totalReminders, setTotalReminders] = useState('21');
  const [startingFrom, setStartingFrom] = useState<'immediately' | '5min' | '10min' | '15min'>('immediately');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const isEditMode = !!schedule;

  useEffect(() => {
    if (schedule) {
      setMedicineName(schedule.medicineName);
      setTimesPerDay(String(schedule.timesPerDay));
      setIntervalHours(String(schedule.intervalHours));
      if (schedule.totalDays) {
        setEndType('days');
        setTotalDays(String(schedule.totalDays));
      } else if (schedule.totalReminders) {
        setEndType('reminders');
        setTotalReminders(String(schedule.totalReminders));
      }
    } else {
      setMedicineName('');
      setTimesPerDay('3');
      setIntervalHours('8');
      setEndType('days');
      setTotalDays('7');
      setTotalReminders('21');
      setStartingFrom('immediately');
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

    const timesPerDayNum = parseInt(timesPerDay) || 1;
    const intervalHoursNum = parseInt(intervalHours) || 1;
    const totalDaysNum = parseInt(totalDays) || 0;
    const totalRemindersNum = parseInt(totalReminders) || 0;

    if (timesPerDayNum < 1) {
      toast({
        title: 'Invalid Times Per Day',
        description: 'Please enter a value of 1 or more',
        variant: 'destructive',
      });
      return;
    }

    if (intervalHoursNum < 1) {
      toast({
        title: 'Invalid Interval',
        description: 'Please enter an interval of 1 hour or more',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await onSave({
        medicineName: medicineName.trim(),
        timesPerDay: timesPerDayNum,
        intervalHours: intervalHoursNum,
        totalDays: endType === 'days' && totalDaysNum > 0 ? totalDaysNum : undefined,
        totalReminders: endType === 'reminders' && totalRemindersNum > 0 ? totalRemindersNum : undefined,
        startingFrom: isEditMode ? undefined : startingFrom,
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
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={timesPerDay}
              onChange={(e) => setTimesPerDay(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="e.g., 3"
            />
          </div>

          {/* Interval Hours */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              <Clock className="inline w-4 h-4 mr-1" />
              Time Gap Between Reminders (hours)
            </Label>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={intervalHours}
              onChange={(e) => setIntervalHours(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="e.g., 8"
            />
          </div>

          {/* Starting From - Only for new schedules */}
          {!isEditMode && (
            <div>
              <Label className="text-sm font-medium mb-2 block">
                <Timer className="inline w-4 h-4 mr-1" />
                Start First Reminder
              </Label>
              <Select
                value={startingFrom}
                onValueChange={(v) => setStartingFrom(v as typeof startingFrom)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {startingFromOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                When should the first reminder be sent?
              </p>
            </div>
          )}

          {/* End Condition */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              <Calendar className="inline w-4 h-4 mr-1" />
              Stop After (Optional)
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
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={endType === 'days' ? totalDays : totalReminders}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  if (endType === 'days') {
                    setTotalDays(val);
                  } else {
                    setTotalReminders(val);
                  }
                }}
                className="flex-1"
                placeholder="No limit if empty"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty or set 0 for unlimited reminders
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
