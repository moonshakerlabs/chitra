import { useState } from 'react';
import { motion } from 'framer-motion';
import { Folder, FolderPlus, AlertTriangle, Check, HardDrive, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { 
  createChitraFolderInDirectory, 
  validateChitraFolder, 
  setStorageFolderPath,
  getAvailableStorageLocations,
  requestFilePermissions
} from '@/core/storage/folderService';
import { Directory } from '@capacitor/filesystem';
import { useToast } from '@/hooks/use-toast';

interface FolderSelectProps {
  onComplete: () => void;
  onBack: () => void;
}

const FolderSelect = ({ onComplete, onBack }: FolderSelectProps) => {
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'new' | 'existing' | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>('documents');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const { toast } = useToast();

  const storageLocations = getAvailableStorageLocations();

  const handleCreateNewFolder = async () => {
    if (!acknowledged) {
      toast({
        title: 'Acknowledgment Required',
        description: 'Please acknowledge the data storage warning before continuing.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    // Request permissions first
    const hasPermission = await requestFilePermissions();
    if (!hasPermission) {
      setLoading(false);
      toast({
        title: 'Permission Required',
        description: 'Please grant storage permission in device settings and try again.',
        variant: 'destructive',
      });
      return;
    }

    const location = storageLocations.find(l => l.id === selectedLocation);
    const directory = location?.directory || Directory.Documents;
    
    const result = await createChitraFolderInDirectory(directory);
    setLoading(false);

    if (result.success) {
      toast({
        title: 'CHITRA Folder Created',
        description: `Your data will be stored in ${result.path}`,
      });
      onComplete();
    } else {
      toast({
        title: 'Failed to Create Folder',
        description: result.error || 'Please try again or select a different location.',
        variant: 'destructive',
      });
    }
  };

  const handleUseExistingFolder = async () => {
    if (!acknowledged) {
      toast({
        title: 'Acknowledgment Required',
        description: 'Please acknowledge the data storage warning before continuing.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    // Request permissions first
    const hasPermission = await requestFilePermissions();
    if (!hasPermission) {
      setLoading(false);
      toast({
        title: 'Permission Required',
        description: 'Please grant storage permission in device settings and try again.',
        variant: 'destructive',
      });
      return;
    }
    
    // Check both Documents and External for existing CHITRA folder
    let isValid = await validateChitraFolder('Documents/CHITRA');
    let folderPath = 'Documents/CHITRA';
    
    if (!isValid) {
      isValid = await validateChitraFolder('External/CHITRA');
      folderPath = 'External/CHITRA';
    }
    
    if (isValid) {
      await setStorageFolderPath(folderPath);
      toast({
        title: 'CHITRA Folder Found',
        description: `Using existing folder at ${folderPath}`,
      });
      onComplete();
    } else {
      toast({
        title: 'No CHITRA Folder Found',
        description: 'Please create a new CHITRA folder instead.',
        variant: 'destructive',
      });
    }
    
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex flex-col h-full px-6 py-12"
    >
      <div className="flex-1 overflow-y-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Folder className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Storage Folder</h1>
          <p className="text-muted-foreground">
            Choose where CHITRA should store your exports and backups
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <Card
            className={`p-4 cursor-pointer transition-all ${
              selectedOption === 'new'
                ? 'border-primary bg-primary/5'
                : 'hover:bg-secondary/50'
            }`}
            onClick={() => {
              setSelectedOption('new');
              setShowLocationPicker(true);
            }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FolderPlus className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Create new CHITRA folder</p>
                <p className="text-sm text-muted-foreground">
                  Choose location for exports & vaccinations
                </p>
              </div>
              {selectedOption === 'new' && (
                <Check className="w-5 h-5 text-primary" />
              )}
            </div>
          </Card>

          {/* Location picker - shown when creating new folder */}
          {selectedOption === 'new' && showLocationPicker && (
            <div className="ml-4 space-y-2">
              {storageLocations.map((location) => (
                <Card
                  key={location.id}
                  className={`p-3 cursor-pointer transition-all ${
                    selectedLocation === location.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-secondary/50'
                  }`}
                  onClick={() => setSelectedLocation(location.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      {location.id === 'external' ? (
                        <HardDrive className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <FileText className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-sm">{location.name}</p>
                      <p className="text-xs text-muted-foreground">{location.description}</p>
                    </div>
                    {selectedLocation === location.id && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          <Card
            className={`p-4 cursor-pointer transition-all ${
              selectedOption === 'existing'
                ? 'border-primary bg-primary/5'
                : 'hover:bg-secondary/50'
            }`}
            onClick={() => {
              setSelectedOption('existing');
              setShowLocationPicker(false);
            }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                <Folder className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Use existing CHITRA folder</p>
                <p className="text-sm text-muted-foreground">
                  Connect to a previously created folder
                </p>
              </div>
              {selectedOption === 'existing' && (
                <Check className="w-5 h-5 text-primary" />
              )}
            </div>
          </Card>
        </div>

        {/* Warning */}
        <Card className="p-4 bg-warning/10 border-warning/30 mb-6">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="text-sm text-foreground">
              <p className="font-medium mb-1">Important</p>
              <p className="text-muted-foreground">
                All data is stored only on this device. If CHITRA is uninstalled, you must select this folder again during reinstall. If the device or folder is lost, data cannot be recovered.
              </p>
            </div>
          </div>
        </Card>

        {/* Acknowledgment */}
        <div className="flex items-start gap-3 mb-6">
          <Checkbox
            id="acknowledge"
            checked={acknowledged}
            onCheckedChange={(checked) => setAcknowledged(checked === true)}
          />
          <label htmlFor="acknowledge" className="text-sm text-muted-foreground cursor-pointer">
            I understand that my data is stored locally and I am responsible for keeping it safe.
          </label>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          onClick={selectedOption === 'existing' ? handleUseExistingFolder : handleCreateNewFolder}
          disabled={!selectedOption || !acknowledged || loading}
          className="flex-1"
        >
          {loading ? 'Setting up...' : 'Continue'}
        </Button>
      </div>
    </motion.div>
  );
};

export default FolderSelect;
