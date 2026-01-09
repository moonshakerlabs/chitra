import React, { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, Calendar, X } from 'lucide-react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import type { Profile, ProfileType, Gender } from '@/core/types';
import { 
  addProfile, 
  updateProfile, 
  deleteProfile,
  getAvailableAvatars,
  validateProfileAdd 
} from '@/core/storage/profileService';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/core/context/ProfileContext';
import { format, differenceInYears, subYears } from 'date-fns';

interface ProfileEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile?: Profile; // If provided, edit mode; otherwise add mode
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  open,
  onOpenChange,
  profile,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<ProfileType>('dependent');
  const [avatar, setAvatar] = useState('👤');
  const [gender, setGender] = useState<Gender>('female');
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [canAddMain, setCanAddMain] = useState(true);
  const [canAddDependent, setCanAddDependent] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { toast } = useToast();
  const { reload, profiles } = useProfile();

  const isEditMode = !!profile;
  const avatars = getAvailableAvatars();

  // Calculate age from date of birth
  const calculateAge = (dob: Date): number => {
    return differenceInYears(new Date(), dob);
  };

  // Get minimum date based on gender for dependent profiles
  const getMinDate = () => {
    if (type === 'dependent' && gender === 'male') {
      // Male dependents must be under 5 years old
      return subYears(new Date(), 5);
    }
    return new Date('1900-01-01');
  };

  // Get maximum age for dependent based on gender
  const getMaxAgeForDependent = () => {
    return gender === 'male' ? 5 : 18;
  };

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setType(profile.type);
      setAvatar(profile.avatar);
      setGender(profile.gender || 'female');
      setDateOfBirth(profile.dateOfBirth ? new Date(profile.dateOfBirth) : undefined);
    } else {
      setName('');
      setType('dependent');
      setAvatar(avatars[Math.floor(Math.random() * avatars.length)]);
      setGender('female');
      setDateOfBirth(undefined);
    }
    
    // Check what can be added
    checkLimits();
  }, [profile, open]);

  const checkLimits = async () => {
    const mainValidation = await validateProfileAdd('main');
    const dependentValidation = await validateProfileAdd('dependent');
    setCanAddMain(mainValidation.valid);
    setCanAddDependent(dependentValidation.valid);
    
    // If can't add main but can add dependent, default to dependent
    if (!mainValidation.valid && dependentValidation.valid && !profile) {
      setType('dependent');
    } else if (mainValidation.valid && !profile) {
      // If no main profile exists yet, default to main for first profile
      const hasMain = profiles.some(p => p.type === 'main');
      if (!hasMain) {
        setType('main');
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter a name for the profile',
        variant: 'destructive',
      });
      return;
    }

    // Validate DOB for dependent profiles
    if (type === 'dependent' && !dateOfBirth) {
      toast({
        title: 'Date of Birth Required',
        description: 'Please enter the date of birth for dependent profiles',
        variant: 'destructive',
      });
      return;
    }

    // Validate age matches profile type and gender
    if (dateOfBirth) {
      const age = calculateAge(dateOfBirth);
      const maxAge = getMaxAgeForDependent();
      
      if (type === 'dependent' && age >= maxAge) {
        toast({
          title: 'Invalid Date of Birth',
          description: gender === 'male' 
            ? 'Male dependents must be under 5 years old'
            : 'Dependent profiles must be under 18 years old',
          variant: 'destructive',
        });
        return;
      }
    }

    setSaving(true);

    try {
      const dobString = dateOfBirth ? dateOfBirth.toISOString() : undefined;
      
      if (isEditMode && profile) {
        const updated = await updateProfile(profile.id, { 
          name: name.trim(), 
          type, 
          avatar,
          gender: type === 'dependent' ? gender : undefined,
          dateOfBirth: dobString,
        });
        if (updated) {
          toast({ title: 'Profile Updated', description: `${name} has been updated` });
          await reload();
          onOpenChange(false);
        } else {
          toast({
            title: 'Update Failed',
            description: 'Could not update profile. Check limits.',
            variant: 'destructive',
          });
        }
      } else {
        const result = await addProfile(name.trim(), type, avatar, dobString, type === 'dependent' ? gender : undefined);
        if (result.success) {
          toast({ title: 'Profile Added', description: `${name} has been added` });
          await reload();
          onOpenChange(false);
        } else {
          toast({
            title: 'Add Failed',
            description: result.error || 'Could not add profile',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!profile) return;

    const result = await deleteProfile(profile.id);
    if (result.success) {
      toast({ title: 'Profile Deleted', description: `${profile.name} has been removed` });
      await reload();
      setShowDeleteDialog(false);
      onOpenChange(false);
    } else {
      toast({
        title: 'Delete Failed',
        description: result.error || 'Could not delete profile',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle>{isEditMode ? 'Edit Profile' : 'Add Profile'}</DialogTitle>
            {isEditMode && profiles.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            )}
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Avatar Selection */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Avatar</Label>
              <div className="flex flex-wrap gap-2">
                {avatars.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAvatar(a)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${
                      avatar === a
                        ? 'bg-primary ring-2 ring-primary ring-offset-2'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <Label htmlFor="name" className="text-sm font-medium mb-2 block">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
                maxLength={20}
              />
            </div>

            {/* Profile Type */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Profile Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setType('main')}
                  disabled={!canAddMain && (!isEditMode || profile?.type !== 'main')}
                  className={`p-3 rounded-xl text-center transition-all ${
                    type === 'main'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary hover:bg-secondary/80'
                  } ${!canAddMain && (!isEditMode || profile?.type !== 'main') ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="font-medium">Main (18+)</div>
                  <div className="text-xs opacity-80">Adult/Guardian</div>
                </button>
                <button
                  onClick={() => setType('dependent')}
                  disabled={!canAddDependent && (!isEditMode || profile?.type !== 'dependent')}
                  className={`p-3 rounded-xl text-center transition-all ${
                    type === 'dependent'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary hover:bg-secondary/80'
                  } ${!canAddDependent && (!isEditMode || profile?.type !== 'dependent') ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="font-medium">Dependent</div>
                  <div className="text-xs opacity-80">Under 18</div>
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Max: 1 main profile, 4 dependent profiles
              </p>
            </div>

            {/* Gender - for dependent profiles */}
            {type === 'dependent' && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Gender</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setGender('female');
                      // Reset DOB if switching from male to female
                      if (dateOfBirth && calculateAge(dateOfBirth) >= 5) {
                        setDateOfBirth(undefined);
                      }
                    }}
                    className={`p-3 rounded-xl text-center transition-all ${
                      gender === 'female'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    <div className="font-medium">Female</div>
                    <div className="text-xs opacity-80">Under 18</div>
                  </button>
                  <button
                    onClick={() => {
                      setGender('male');
                      // Reset DOB if age is 5+ when switching to male
                      if (dateOfBirth && calculateAge(dateOfBirth) >= 5) {
                        setDateOfBirth(undefined);
                      }
                    }}
                    className={`p-3 rounded-xl text-center transition-all ${
                      gender === 'male'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    <div className="font-medium">Male</div>
                    <div className="text-xs opacity-80">Under 5</div>
                  </button>
                </div>
                {gender === 'male' && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Male dependents must be under 5 years old
                  </p>
                )}
              </div>
            )}

            {/* Date of Birth - for dependent profiles */}
            {type === 'dependent' && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Date of Birth</Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateOfBirth ? (
                        <span>
                          {format(dateOfBirth, 'PPP')} ({calculateAge(dateOfBirth)} years old)
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Select date of birth</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateOfBirth}
                      onSelect={(date) => {
                        setDateOfBirth(date);
                        setCalendarOpen(false);
                      }}
                      disabled={(date) => date > new Date() || date < getMinDate()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {dateOfBirth && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Age: {calculateAge(dateOfBirth)} years old
                  </p>
                )}
              </div>
            )}
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

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Profile?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{profile?.name}" and all their cycle and weight data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Profile
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProfileEditModal;
