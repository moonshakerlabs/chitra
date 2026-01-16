import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FeedingSchedule } from '@/core/types';

interface FeedingSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    feedingName: string,
    reminderType: 'time' | 'interval',
    reminderTime?: string,
    intervalHours?: number,
    startingFrom?: 'immediately' | '5min' | '10min' | '15min'
  ) => Promise<void>;
  onUpdate?: (
    id: string,
    updates: Partial<FeedingSchedule>
  ) => Promise<void>;
  editingSchedule?: FeedingSchedule | null;
}

const startingFromOptions = [
  { value: 'immediately', label: 'Immediately', minutes: 0 },
  { value: '5min', label: 'In 5 minutes', minutes: 5 },
  { value: '10min', label: 'In 10 minutes', minutes: 10 },
  { value: '15min', label: 'In 15 minutes', minutes: 15 },
];

const FeedingSetupModal = ({
  open,
  onOpenChange,
  onSave,
  onUpdate,
  editingSchedule,
}: FeedingSetupModalProps) => {
  const [feedingName, setFeedingName] = useState('');
  const [reminderType, setReminderType] = useState<'time' | 'interval'>('interval');
  const [reminderTime, setReminderTime] = useState('08:00');
  const [intervalHours, setIntervalHours] = useState('3');
  const [startingFrom, setStartingFrom] = useState<'immediately' | '5min' | '10min' | '15min'>('immediately');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingSchedule) {
      setFeedingName(editingSchedule.feedingName);
      setReminderType(editingSchedule.reminderType);
      setReminderTime(editingSchedule.reminderTime || '08:00');
      setIntervalHours(String(editingSchedule.intervalHours || 3));
    } else {
      setFeedingName('');
      setReminderType('interval');
      setReminderTime('08:00');
      setIntervalHours('3');
      setStartingFrom('immediately');
    }
  }, [editingSchedule, open]);

  const handleSave = async () => {
    if (!feedingName.trim()) return;

    const intervalHoursNum = parseInt(intervalHours) || 3;

    setSaving(true);
    try {
      if (editingSchedule && onUpdate) {
        await onUpdate(editingSchedule.id, {
          feedingName,
          reminderType,
          reminderTime: reminderType === 'time' ? reminderTime : undefined,
          intervalHours: reminderType === 'interval' ? intervalHoursNum : undefined,
        });
      } else {
        await onSave(
          feedingName,
          reminderType,
          reminderType === 'time' ? reminderTime : undefined,
          reminderType === 'interval' ? intervalHoursNum : undefined,
          startingFrom
        );
      }
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingSchedule ? 'Edit Feeding Schedule' : 'Add Feeding Schedule'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="feedingName">Feeding Name</Label>
            <Input
              id="feedingName"
              value={feedingName}
              onChange={(e) => setFeedingName(e.target.value)}
              placeholder="e.g., Breast milk, Formula, Solid food"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Reminder Type</Label>
            <RadioGroup
              value={reminderType}
              onValueChange={(v) => setReminderType(v as 'time' | 'interval')}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="interval" id="interval" />
                <Label htmlFor="interval" className="font-normal">
                  Every X hours
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="time" id="time" />
                <Label htmlFor="time" className="font-normal">
                  At specific time
                </Label>
              </div>
            </RadioGroup>
          </div>

          {reminderType === 'interval' ? (
            <div>
              <Label htmlFor="intervalHours">Interval (hours)</Label>
              <Input
                id="intervalHours"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={intervalHours}
                onChange={(e) => setIntervalHours(e.target.value.replace(/[^0-9]/g, ''))}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Remind every {parseInt(intervalHours) || 0} hour{parseInt(intervalHours) !== 1 ? 's' : ''}
              </p>
            </div>
          ) : (
            <div>
              <Label htmlFor="reminderTime">Reminder Time</Label>
              <Input
                id="reminderTime"
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="mt-1"
              />
            </div>
          )}

          {/* Starting From - Only for new schedules with interval */}
          {!editingSchedule && reminderType === 'interval' && (
            <div>
              <Label>Start First Reminder</Label>
              <Select
                value={startingFrom}
                onValueChange={(v) => setStartingFrom(v as typeof startingFrom)}
              >
                <SelectTrigger className="mt-1">
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
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!feedingName.trim() || saving}
            className="flex-1"
          >
            {saving ? 'Saving...' : editingSchedule ? 'Update' : 'Add'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeedingSetupModal;
