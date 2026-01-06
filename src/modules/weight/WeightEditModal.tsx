import { useState, useEffect } from 'react';
import { X, Calendar, Scale, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { updateWeight, deleteWeight } from './weightService';
import type { WeightEntry, WeightUnit } from '@/core/types';

interface WeightEditModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  entry: WeightEntry;
}

const WeightEditModal = ({ open, onClose, onComplete, entry }: WeightEditModalProps) => {
  const [date, setDate] = useState(entry.date);
  const [weight, setWeight] = useState(entry.weight.toString());
  const [unit, setUnit] = useState<WeightUnit>(entry.unit);
  const [notes, setNotes] = useState(entry.notes || '');
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setDate(entry.date);
    setWeight(entry.weight.toString());
    setUnit(entry.unit);
    setNotes(entry.notes || '');
  }, [entry]);

  const handleSave = async () => {
    const weightValue = parseFloat(weight);
    if (isNaN(weightValue) || weightValue <= 0) return;

    setSaving(true);
    try {
      await updateWeight(entry.id, {
        date,
        weight: weightValue,
        unit,
        notes: notes.trim() || undefined,
      });
      onComplete();
    } catch (err) {
      console.error('Failed to update weight:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteWeight(entry.id);
      onComplete();
    } catch (err) {
      console.error('Failed to delete weight:', err);
    } finally {
      setSaving(false);
      setShowDeleteConfirm(false);
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
              <h2 className="text-xl font-bold text-foreground">Edit Weight</h2>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
              <div className="mx-6 mt-4 p-4 bg-destructive/10 rounded-xl border border-destructive/20">
                <p className="text-sm text-foreground mb-3">
                  Are you sure you want to delete this entry?
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={saving}
                    className="flex-1"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Weight */}
              <div className="space-y-2">
                <Label htmlFor="weight">Weight</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      min="0"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="0.0"
                      className="pl-10 text-lg"
                    />
                  </div>
                  <div className="flex rounded-xl border border-border overflow-hidden">
                    <button
                      onClick={() => setUnit('kg')}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        unit === 'kg'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background text-muted-foreground hover:bg-secondary'
                      }`}
                    >
                      kg
                    </button>
                    <button
                      onClick={() => setUnit('lb')}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        unit === 'lb'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background text-muted-foreground hover:bg-secondary'
                      }`}
                    >
                      lb
                    </button>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Bloating, after workout, morning weight..."
                  rows={3}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 pt-0 safe-bottom">
              <Button
                onClick={handleSave}
                disabled={!weight || parseFloat(weight) <= 0 || saving}
                className="w-full h-14 text-lg font-medium rounded-xl"
              >
                {saving ? 'Saving...' : 'Update Entry'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WeightEditModal;
