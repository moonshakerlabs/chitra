import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useScreenTime } from './useScreenTime';
import { getCurrentWeekInfo, getWeekRangeString } from './screenTimeService';
import { useToast } from '@/hooks/use-toast';
import { getISOWeek, getYear, startOfWeek, endOfWeek, format, addWeeks, subWeeks } from 'date-fns';

interface ScreenTimeLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ScreenTimeLogModal = ({ open, onOpenChange }: ScreenTimeLogModalProps) => {
  const { addEntry, entries } = useScreenTime();
  const { toast } = useToast();
  
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('current');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate week options (current and past 8 weeks)
  const getWeekOptions = () => {
    const options: { value: string; label: string; weekNumber: number; year: number }[] = [];
    const now = new Date();
    
    for (let i = 0; i < 9; i++) {
      const weekDate = subWeeks(now, i);
      const weekStart = startOfWeek(weekDate, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(weekDate, { weekStartsOn: 0 });
      const weekNumber = getISOWeek(weekDate);
      const year = getYear(weekDate);
      
      const label = i === 0 
        ? `Current Week (Week ${weekNumber})`
        : `Week ${weekNumber} (${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')})`;
      
      options.push({
        value: i === 0 ? 'current' : `${year}-${weekNumber}`,
        label,
        weekNumber,
        year,
      });
    }
    
    return options;
  };

  const weekOptions = getWeekOptions();

  useEffect(() => {
    if (open) {
      setHours('');
      setMinutes('');
      setSelectedWeek('current');
      setNotes('');
    }
  }, [open]);

  // Check if selected week already has an entry
  const getExistingEntry = () => {
    const selected = weekOptions.find(w => w.value === selectedWeek);
    if (!selected) return null;
    
    return entries.find(
      e => e.weekNumber === selected.weekNumber && e.year === selected.year
    );
  };

  const existingEntry = getExistingEntry();

  // Pre-fill if existing entry
  useEffect(() => {
    if (existingEntry) {
      const hrs = Math.floor(existingEntry.totalMinutes / 60);
      const mins = existingEntry.totalMinutes % 60;
      setHours(hrs > 0 ? hrs.toString() : '');
      setMinutes(mins > 0 ? mins.toString() : '');
      setNotes(existingEntry.notes || '');
    } else {
      setHours('');
      setMinutes('');
      setNotes('');
    }
  }, [existingEntry?.id, selectedWeek]);

  const handleSubmit = async () => {
    const totalMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
    
    if (totalMinutes <= 0) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter a valid screen time.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const selected = weekOptions.find(w => w.value === selectedWeek);
    if (!selected) return;

    const result = await addEntry(totalMinutes, selected.weekNumber, selected.year, notes || undefined);

    setIsSubmitting(false);

    if (result) {
      toast({
        title: existingEntry ? 'Screen Time Updated' : 'Screen Time Logged',
        description: `Week ${selected.weekNumber}: ${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
      });
      onOpenChange(false);
    } else {
      toast({
        title: 'Error',
        description: 'Failed to save screen time.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log Weekly Screen Time</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Week Selection */}
          <div className="space-y-2">
            <Label>Select Week</Label>
            <Select value={selectedWeek} onValueChange={setSelectedWeek}>
              <SelectTrigger>
                <SelectValue placeholder="Select week" />
              </SelectTrigger>
              <SelectContent>
                {weekOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {existingEntry && (
              <p className="text-xs text-muted-foreground">
                This week already has an entry. Saving will update it.
              </p>
            )}
          </div>

          {/* Screen Time Input */}
          <div className="space-y-2">
            <Label>Total Screen Time</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Hours"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  min="0"
                  max="168"
                />
                <span className="text-xs text-muted-foreground">Hours</span>
              </div>
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Minutes"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  min="0"
                  max="59"
                />
                <span className="text-xs text-muted-foreground">Minutes</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Any observations about your phone usage..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Saving...' : existingEntry ? 'Update Entry' : 'Log Screen Time'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
