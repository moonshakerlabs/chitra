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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FeedingType, QuantityUnit, FeedingLog } from '@/core/types';
import { getFeedingTypeName, getFeedingTypeEmoji } from './feedingService';

interface FeedingLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    feedingType: FeedingType;
    quantity?: number;
    quantityUnit?: QuantityUnit;
    durationMinutes?: number;
    notes?: string;
  }) => Promise<void>;
  editingLog?: FeedingLog | null;
  onUpdate?: (id: string, data: Partial<FeedingLog>) => Promise<void>;
}

const feedingTypes: FeedingType[] = ['breast_milk', 'formula', 'solid_food', 'water', 'other'];
const quantityUnits: QuantityUnit[] = ['ml', 'oz', 'cups', 'tbsp', 'minutes'];

const FeedingLogModal = ({
  open,
  onOpenChange,
  onSave,
  editingLog,
  onUpdate,
}: FeedingLogModalProps) => {
  const [feedingType, setFeedingType] = useState<FeedingType>('breast_milk');
  const [quantity, setQuantity] = useState<string>('');
  const [quantityUnit, setQuantityUnit] = useState<QuantityUnit>('ml');
  const [durationMinutes, setDurationMinutes] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingLog) {
      setFeedingType(editingLog.feedingType || 'breast_milk');
      setQuantity(editingLog.quantity?.toString() || '');
      setQuantityUnit(editingLog.quantityUnit || 'ml');
      setDurationMinutes(editingLog.durationMinutes?.toString() || '');
      setNotes(editingLog.notes || '');
    } else {
      setFeedingType('breast_milk');
      setQuantity('');
      setQuantityUnit('ml');
      setDurationMinutes('');
      setNotes('');
    }
  }, [editingLog, open]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        feedingType,
        quantity: quantity ? parseFloat(quantity) : undefined,
        quantityUnit: quantity ? quantityUnit : undefined,
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
        notes: notes.trim() || undefined,
      };

      if (editingLog && onUpdate) {
        await onUpdate(editingLog.id, data);
      } else {
        await onSave(data);
      }
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const showQuantity = feedingType !== 'breast_milk';
  const showDuration = feedingType === 'breast_milk';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingLog ? 'Edit Feeding Log' : 'Log Feeding'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Feeding Type Selection */}
          <div>
            <Label>Feeding Type</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {feedingTypes.map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={feedingType === type ? 'default' : 'outline'}
                  className="flex flex-col gap-1 h-auto py-3"
                  onClick={() => setFeedingType(type)}
                >
                  <span className="text-xl">{getFeedingTypeEmoji(type)}</span>
                  <span className="text-xs">{getFeedingTypeName(type)}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Duration (for breastfeeding) */}
          {showDuration && (
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="e.g., 15"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                How long did the feeding last?
              </p>
            </div>
          )}

          {/* Quantity (for other types) */}
          {showQuantity && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={0}
                  step={0.1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Amount"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="unit">Unit</Label>
                <Select value={quantityUnit} onValueChange={(v) => setQuantityUnit(v as QuantityUnit)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {quantityUnits.filter(u => u !== 'minutes').map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any observations..."
              className="mt-1 resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1"
          >
            {saving ? 'Saving...' : editingLog ? 'Update' : 'Log Feeding'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeedingLogModal;
