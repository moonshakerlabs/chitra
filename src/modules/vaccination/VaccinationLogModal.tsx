import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Paperclip, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import type { VaccinationEntry } from '@/core/types';
import { useToast } from '@/hooks/use-toast';

interface VaccinationLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vaccination?: VaccinationEntry;
  onSave: (data: {
    vaccineName: string;
    dateAdministered: string;
    notes?: string;
    attachmentPath?: string;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
}

const VaccinationLogModal = ({
  open,
  onOpenChange,
  vaccination,
  onSave,
  onDelete,
}: VaccinationLogModalProps) => {
  const [vaccineName, setVaccineName] = useState(vaccination?.vaccineName || '');
  const [dateAdministered, setDateAdministered] = useState<Date | undefined>(
    vaccination?.dateAdministered ? new Date(vaccination.dateAdministered) : new Date()
  );
  const [notes, setNotes] = useState(vaccination?.notes || '');
  const [attachmentPath, setAttachmentPath] = useState(vaccination?.attachmentPath || '');
  const [saving, setSaving] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { toast } = useToast();

  const isEditMode = !!vaccination;

  const handleSave = async () => {
    if (!vaccineName.trim()) {
      toast({
        title: 'Vaccine Name Required',
        description: 'Please enter the vaccine name',
        variant: 'destructive',
      });
      return;
    }

    if (!dateAdministered) {
      toast({
        title: 'Date Required',
        description: 'Please select the vaccination date',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await onSave({
        vaccineName: vaccineName.trim(),
        dateAdministered: dateAdministered.toISOString(),
        notes: notes.trim() || undefined,
        attachmentPath: attachmentPath || undefined,
      });
      toast({
        title: isEditMode ? 'Vaccination Updated' : 'Vaccination Added',
        description: `${vaccineName} has been ${isEditMode ? 'updated' : 'recorded'}`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save vaccination',
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
        title: 'Vaccination Deleted',
        description: 'The vaccination record has been removed',
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete vaccination',
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
          <DialogTitle>{isEditMode ? 'Edit Vaccination' : 'Add Vaccination'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Vaccine Name */}
          <div>
            <Label htmlFor="vaccineName" className="text-sm font-medium mb-2 block">
              Vaccine Name
            </Label>
            <Input
              id="vaccineName"
              value={vaccineName}
              onChange={(e) => setVaccineName(e.target.value)}
              placeholder="e.g., COVID-19, Flu Shot, MMR"
              maxLength={100}
            />
          </div>

          {/* Date Administered */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Date Administered</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateAdministered ? format(dateAdministered, 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateAdministered}
                  onSelect={(date) => {
                    setDateAdministered(date);
                    setCalendarOpen(false);
                  }}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-sm font-medium mb-2 block">
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              maxLength={500}
              rows={3}
            />
          </div>

          {/* Attachment */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Attachment (Optional)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                value={attachmentPath}
                onChange={(e) => setAttachmentPath(e.target.value)}
                placeholder="File path or URL"
                className="flex-1"
              />
              {attachmentPath && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setAttachmentPath('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <Paperclip className="inline h-3 w-3 mr-1" />
              Enter path to vaccination card image
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
              Delete
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

export default VaccinationLogModal;
