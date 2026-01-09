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
import type { FeedingSchedule } from '@/core/types';

interface FeedingSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    feedingName: string,
    reminderType: 'time' | 'interval',
    reminderTime?: string,
    intervalHours?: number
  ) => Promise<void>;
  onUpdate?: (
    id: string,
    updates: Partial<FeedingSchedule>
  ) => Promise<void>;
  editingSchedule?: FeedingSchedule | null;
}

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
  const [intervalHours, setIntervalHours] = useState(3);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingSchedule) {
      setFeedingName(editingSchedule.feedingName);
      setReminderType(editingSchedule.reminderType);
      setReminderTime(editingSchedule.reminderTime || '08:00');
      setIntervalHours(editingSchedule.intervalHours || 3);
    } else {
      setFeedingName('');
      setReminderType('interval');
      setReminderTime('08:00');
      setIntervalHours(3);
    }
  }, [editingSchedule, open]);

  const handleSave = async () => {
    if (!feedingName.trim()) return;

    setSaving(true);
    try {
      if (editingSchedule && onUpdate) {
        await onUpdate(editingSchedule.id, {
          feedingName,
          reminderType,
          reminderTime: reminderType === 'time' ? reminderTime : undefined,
          intervalHours: reminderType === 'interval' ? intervalHours : undefined,
        });
      } else {
        await onSave(
          feedingName,
          reminderType,
          reminderType === 'time' ? reminderTime : undefined,
          reminderType === 'interval' ? intervalHours : undefined
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
                type="number"
                min={1}
                max={12}
                value={intervalHours}
                onChange={(e) => setIntervalHours(Number(e.target.value))}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Remind every {intervalHours} hour{intervalHours !== 1 ? 's' : ''}
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
