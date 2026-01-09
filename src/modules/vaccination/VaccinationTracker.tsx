import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Syringe, Calendar, FileText, Paperclip, Bell, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProfile } from '@/core/context/ProfileContext';
import { useVaccinations } from './useVaccination';
import VaccinationLogModal from './VaccinationLogModal';
import type { VaccinationEntry } from '@/core/types';
import ProfileSelector from '@/shared/components/ProfileSelector';
import { scheduleVaccinationReminder, cancelNotificationByEntityId } from '@/core/notifications/notificationService';

const VaccinationTracker = () => {
  const { activeProfile } = useProfile();
  const { vaccinations, loading, add, update, remove } = useVaccinations();
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedVaccination, setSelectedVaccination] = useState<VaccinationEntry | undefined>();

  const handleAddNew = () => {
    setSelectedVaccination(undefined);
    setShowLogModal(true);
  };

  const handleEdit = (vaccination: VaccinationEntry) => {
    setSelectedVaccination(vaccination);
    setShowLogModal(true);
  };

  const handleSave = async (data: {
    vaccineName: string;
    dateAdministered: string;
    notes?: string;
    attachmentPath?: string;
    attachmentType?: 'image' | 'pdf';
    hospitalName?: string;
    doctorName?: string;
    nextDueDate?: string;
    reminderEnabled?: boolean;
  }) => {
    let savedVaccination: VaccinationEntry | undefined;
    
    if (selectedVaccination) {
      savedVaccination = await update(selectedVaccination.id, data) || undefined;
    } else {
      savedVaccination = await add(
        data.vaccineName, 
        data.dateAdministered, 
        data.notes, 
        data.attachmentPath,
        data.attachmentType,
        data.hospitalName,
        data.doctorName,
        data.nextDueDate,
        data.reminderEnabled
      );
    }

    // Schedule reminder if next due date is set and reminders are enabled
    if (savedVaccination && data.nextDueDate && data.reminderEnabled) {
      await scheduleVaccinationReminder(
        savedVaccination.id,
        data.vaccineName,
        data.nextDueDate,
        data.hospitalName,
        data.doctorName
      );
    } else if (savedVaccination && !data.reminderEnabled) {
      // Cancel any existing reminder
      await cancelNotificationByEntityId(savedVaccination.id);
    }
  };

  const handleDelete = async () => {
    if (selectedVaccination) {
      await cancelNotificationByEntityId(selectedVaccination.id);
      await remove(selectedVaccination.id);
    }
  };

  // Separate vaccinations into completed and upcoming
  const upcomingVaccinations = vaccinations.filter(v => v.nextDueDate && new Date(v.nextDueDate) > new Date());
  const completedVaccinations = vaccinations;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse-soft text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6 pb-24 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vaccinations</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track vaccination records for {activeProfile?.name}
          </p>
        </div>
        <ProfileSelector showAddButton={false} compact />
      </div>

      {/* Add Button */}
      <Button onClick={handleAddNew} className="w-full gap-2">
        <Plus className="w-5 h-5" />
        Add Vaccination
      </Button>

      {/* Upcoming Vaccinations */}
      {upcomingVaccinations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Upcoming Due Dates
          </h2>
          {upcomingVaccinations.map((vaccination, index) => (
            <motion.div
              key={`upcoming-${vaccination.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className="p-4 cursor-pointer hover:bg-secondary/50 transition-colors border-primary/30"
                onClick={() => handleEdit(vaccination)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground truncate">
                        {vaccination.vaccineName}
                      </h3>
                      <Badge variant="outline" className="text-xs">Upcoming</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-primary mt-1">
                      <Calendar className="w-4 h-4" />
                      <span>Due: {format(new Date(vaccination.nextDueDate!), 'PPP')}</span>
                    </div>
                    {vaccination.hospitalName && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Building2 className="w-4 h-4" />
                        <span className="truncate">{vaccination.hospitalName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Vaccination History */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Vaccination History
        </h2>
        
        {completedVaccinations.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Syringe className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-medium text-foreground mb-2">No Vaccinations Recorded</h3>
            <p className="text-sm text-muted-foreground">
              Start tracking vaccinations by adding your first record.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {completedVaccinations.map((vaccination, index) => (
              <motion.div
                key={vaccination.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="p-4 cursor-pointer hover:bg-secondary/50 transition-colors"
                  onClick={() => handleEdit(vaccination)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Syringe className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">
                        {vaccination.vaccineName}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(vaccination.dateAdministered), 'PPP')}</span>
                      </div>
                      {vaccination.hospitalName && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Building2 className="w-4 h-4" />
                          <span className="truncate">
                            {vaccination.hospitalName}
                            {vaccination.doctorName && ` • Dr. ${vaccination.doctorName}`}
                          </span>
                        </div>
                      )}
                      {vaccination.notes && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <FileText className="w-4 h-4" />
                          <span className="truncate">{vaccination.notes}</span>
                        </div>
                      )}
                      {vaccination.attachmentPath && (
                        <div className="flex items-center gap-2 text-sm text-primary mt-1">
                          <Paperclip className="w-4 h-4" />
                          <span>{vaccination.attachmentType === 'pdf' ? 'PDF attached' : 'Image attached'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Vaccination Log Modal */}
      <VaccinationLogModal
        open={showLogModal}
        onOpenChange={setShowLogModal}
        vaccination={selectedVaccination}
        onSave={handleSave}
        onDelete={selectedVaccination ? handleDelete : undefined}
        profileId={activeProfile?.id}
      />
    </div>
  );
};

export default VaccinationTracker;
