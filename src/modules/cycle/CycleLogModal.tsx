import { useState } from 'react';
import { format } from 'date-fns';
import { X, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { addCycle } from './cycleService';
import type { MoodType, PainLevel } from '@/core/types';

interface CycleLogModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const moods: Array<{ value: MoodType; emoji: string; label: string }> = [
  { value: 'happy', emoji: '😊', label: 'Happy' },
  { value: 'calm', emoji: '😌', label: 'Calm' },
  { value: 'neutral', emoji: '😐', label: 'Neutral' },
  { value: 'sad', emoji: '😢', label: 'Sad' },
  { value: 'anxious', emoji: '😰', label: 'Anxious' },
  { value: 'tired', emoji: '😴', label: 'Tired' },
];

const painLevels: Array<{ value: PainLevel; label: string; color: string }> = [
  { value: 'none', label: 'None', color: 'bg-pain-none' },
  { value: 'mild', label: 'Mild', color: 'bg-pain-mild' },
  { value: 'moderate', label: 'Moderate', color: 'bg-pain-moderate' },
  { value: 'severe', label: 'Severe', color: 'bg-pain-severe' },
  { value: 'extreme', label: 'Extreme', color: 'bg-pain-extreme' },
];

const CycleLogModal = ({ open, onClose, onComplete }: CycleLogModalProps) => {
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState('');
  const [mood, setMood] = useState<MoodType | undefined>();
  const [painLevel, setPainLevel] = useState<PainLevel | undefined>();
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await addCycle({
        startDate,
        endDate: endDate || undefined,
        mood,
        painLevel,
        notes: notes.trim() || undefined,
      });
      onComplete();
      // Reset form
      setStartDate(format(new Date(), 'yyyy-MM-dd'));
      setEndDate('');
      setMood(undefined);
      setPainLevel(undefined);
      setNotes('');
    } catch (err) {
      console.error('Failed to save cycle:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-3xl max-h-[90vh] overflow-auto"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">Log Period</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="pl-10"
                      min={startDate}
                    />
                  </div>
                </div>
              </div>

              {/* Mood */}
              <div className="space-y-3">
                <Label>How are you feeling?</Label>
                <div className="grid grid-cols-3 gap-2">
                  {moods.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setMood(mood === m.value ? undefined : m.value)}
                      className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                        mood === m.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span className="text-2xl mb-1">{m.emoji}</span>
                      <span className="text-xs text-muted-foreground">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pain Level */}
              <div className="space-y-3">
                <Label>Pain Level</Label>
                <div className="flex gap-2">
                  {painLevels.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setPainLevel(painLevel === p.value ? undefined : p.value)}
                      className={`flex-1 flex flex-col items-center p-2 rounded-xl border-2 transition-all ${
                        painLevel === p.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full ${p.color} mb-1`} />
                      <span className="text-xs text-muted-foreground">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any observations or notes..."
                  rows={3}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 pt-0 safe-bottom">
              <Button
                onClick={handleSave}
                disabled={!startDate || saving}
                className="w-full h-14 text-lg font-medium rounded-xl"
              >
                {saving ? 'Saving...' : 'Save Entry'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CycleLogModal;
