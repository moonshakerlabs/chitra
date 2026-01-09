import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Paperclip, X, Camera, Upload, Bell, BellOff, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import type { VaccinationEntry, AttachmentType } from '@/core/types';
import { useToast } from '@/hooks/use-toast';
import { capturePhoto, pickFile, isCameraAvailable } from '@/core/storage/cameraService';
import { generateId } from '@/core/utils/helpers';

interface VaccinationLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vaccination?: VaccinationEntry;
  onSave: (data: {
    vaccineName: string;
    dateAdministered: string;
    notes?: string;
    attachmentPath?: string;
    attachmentType?: AttachmentType;
    hospitalName?: string;
    doctorName?: string;
    nextDueDate?: string;
    reminderEnabled?: boolean;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
  profileId?: string;
}

const VaccinationLogModal = ({
  open,
  onOpenChange,
  vaccination,
  onSave,
  onDelete,
  profileId,
}: VaccinationLogModalProps) => {
  const [vaccineName, setVaccineName] = useState('');
  const [dateAdministered, setDateAdministered] = useState<Date | undefined>(new Date());
  const [notes, setNotes] = useState('');
  const [attachmentPath, setAttachmentPath] = useState('');
  const [attachmentType, setAttachmentType] = useState<AttachmentType | undefined>();
  const [hospitalName, setHospitalName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [nextDueDate, setNextDueDate] = useState<Date | undefined>();
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dueDateCalendarOpen, setDueDateCalendarOpen] = useState(false);
  const [capturingPhoto, setCapturingPhoto] = useState(false);
  const { toast } = useToast();

  const isEditMode = !!vaccination;

  useEffect(() => {
    if (vaccination) {
      setVaccineName(vaccination.vaccineName || '');
      setDateAdministered(vaccination.dateAdministered ? new Date(vaccination.dateAdministered) : new Date());
      setNotes(vaccination.notes || '');
      setAttachmentPath(vaccination.attachmentPath || '');
      setAttachmentType(vaccination.attachmentType);
      setHospitalName(vaccination.hospitalName || '');
      setDoctorName(vaccination.doctorName || '');
      setNextDueDate(vaccination.nextDueDate ? new Date(vaccination.nextDueDate) : undefined);
      setReminderEnabled(vaccination.reminderEnabled ?? true);
    } else {
      // Reset form for new entry
      setVaccineName('');
      setDateAdministered(new Date());
      setNotes('');
      setAttachmentPath('');
      setAttachmentType(undefined);
      setHospitalName('');
      setDoctorName('');
      setNextDueDate(undefined);
      setReminderEnabled(true);
    }
  }, [vaccination, open]);

  const handleCapturePhoto = async () => {
    if (!isCameraAvailable()) {
      toast({
        title: 'Camera Not Available',
        description: 'Camera is only available on mobile devices',
        variant: 'destructive',
      });
      return;
    }

    setCapturingPhoto(true);
    try {
      const fileName = `${vaccineName || 'vaccine'}_${profileId || 'unknown'}_${Date.now()}`;
      const result = await capturePhoto('vaccinations', fileName);
      
      if (result.success && result.path) {
        setAttachmentPath(result.path);
        setAttachmentType('image');
        toast({
          title: 'Photo Captured',
          description: 'Vaccination certificate saved',
        });
      } else {
        toast({
          title: 'Capture Failed',
          description: result.error || 'Failed to capture photo',
          variant: 'destructive',
        });
      }
    } finally {
      setCapturingPhoto(false);
    }
  };

  const handlePickFile = async () => {
    try {
      const fileName = `${vaccineName || 'vaccine'}_${profileId || 'unknown'}_${Date.now()}`;
      const result = await pickFile('vaccinations', fileName, ['image/jpeg', 'image/png', 'application/pdf']);
      
      if (result.success && result.path) {
        setAttachmentPath(result.path);
        setAttachmentType(result.format === 'pdf' ? 'pdf' : 'image');
        toast({
          title: 'File Uploaded',
          description: 'Vaccination certificate saved',
        });
      } else if (result.error) {
        toast({
          title: 'Upload Failed',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('File pick error:', error);
    }
  };

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
        attachmentType: attachmentType,
        hospitalName: hospitalName.trim() || undefined,
        doctorName: doctorName.trim() || undefined,
        nextDueDate: nextDueDate?.toISOString(),
        reminderEnabled: nextDueDate ? reminderEnabled : undefined,
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
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>{isEditMode ? 'Edit Vaccination' : 'Add Vaccination'}</DialogTitle>
          {isEditMode && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={saving}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Vaccine Name */}
          <div>
            <Label htmlFor="vaccineName" className="text-sm font-medium mb-2 block">
              Vaccine Name *
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
            <Label className="text-sm font-medium mb-2 block">Date Administered *</Label>
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

          {/* Hospital/Clinic Name */}
          <div>
            <Label htmlFor="hospitalName" className="text-sm font-medium mb-2 block">
              Hospital / Clinic Name
            </Label>
            <Input
              id="hospitalName"
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
              placeholder="e.g., City Hospital, Health Clinic"
              maxLength={100}
            />
          </div>

          {/* Doctor Name */}
          <div>
            <Label htmlFor="doctorName" className="text-sm font-medium mb-2 block">
              Doctor Name (Optional)
            </Label>
            <Input
              id="doctorName"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              placeholder="e.g., Dr. Smith"
              maxLength={100}
            />
          </div>

          {/* Next Due Date */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Next Vaccination Due Date (Optional)</Label>
            <Popover open={dueDateCalendarOpen} onOpenChange={setDueDateCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {nextDueDate ? format(nextDueDate, 'PPP') : 'Select next due date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={nextDueDate}
                  onSelect={(date) => {
                    setNextDueDate(date);
                    setDueDateCalendarOpen(false);
                  }}
                  disabled={(date) => date <= new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {nextDueDate && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 text-xs text-muted-foreground"
                onClick={() => setNextDueDate(undefined)}
              >
                Clear due date
              </Button>
            )}
          </div>

          {/* Reminder Toggle */}
          {nextDueDate && (
            <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
              <div className="flex items-center gap-2">
                {reminderEnabled ? (
                  <Bell className="w-4 h-4 text-primary" />
                ) : (
                  <BellOff className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-sm">Remind on due date</span>
              </div>
              <Switch
                checked={reminderEnabled}
                onCheckedChange={setReminderEnabled}
              />
            </div>
          )}

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
              rows={2}
            />
          </div>

          {/* Attachment */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Vaccination Certificate (Optional)
            </Label>
            
            {attachmentPath ? (
              <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
                <Paperclip className="w-4 h-4 text-primary" />
                <span className="text-sm flex-1 truncate">
                  {attachmentType === 'pdf' ? 'PDF Document' : 'Image'} attached
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setAttachmentPath('');
                    setAttachmentType(undefined);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleCapturePhoto}
                  disabled={capturingPhoto}
                >
                  <Camera className="w-4 h-4" />
                  {capturingPhoto ? 'Capturing...' : 'Take Photo'}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handlePickFile}
                >
                  <Upload className="w-4 h-4" />
                  Upload File
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Supports JPG, PNG, and PDF files
            </p>
          </div>
        </div>

        <div className="flex gap-2">
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
