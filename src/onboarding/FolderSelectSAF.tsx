import { useState } from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, HardDrive, Database, AlertTriangle, Check, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  getAvailableStorageLocations, 
  createChitraFolderInLocation,
  type StorageLocation 
} from '@/core/storage/safFolderService';
import { useToast } from '@/hooks/use-toast';

interface FolderSelectSAFProps {
  onComplete: () => void;
  isChangingLocation?: boolean;
}

const locationIcons: Record<string, React.ReactNode> = {
  documents: <FolderOpen className="w-6 h-6" />,
  external: <HardDrive className="w-6 h-6" />,
  external_storage: <Database className="w-6 h-6" />,
  browser: <FolderOpen className="w-6 h-6" />,
};

const FolderSelectSAF = ({ onComplete, isChangingLocation = false }: FolderSelectSAFProps) => {
  const { toast } = useToast();
  const [selectedLocation, setSelectedLocation] = useState<StorageLocation | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const locations = getAvailableStorageLocations();

  const handleSelectLocation = async () => {
    if (!selectedLocation) return;

    setIsCreating(true);
    setError(null);
    setPermissionDenied(false);

    const result = await createChitraFolderInLocation(selectedLocation);

    setIsCreating(false);

    if (result.success) {
      toast({
        title: 'CHITRA Folder Created',
        description: `Folder created at ${result.path}`,
      });
      onComplete();
    } else {
      setError(result.error || 'Failed to create folder');
      setPermissionDenied(result.permissionDenied || false);
      
      toast({
        title: 'Failed to Create Folder',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const openAppSettings = () => {
    // On Android, we can't directly open app settings from web
    // User needs to do this manually
    toast({
      title: 'Open Device Settings',
      description: 'Go to Settings > Apps > CHITRA > Permissions > Storage and enable it.',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background flex flex-col"
    >
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6"
        >
          <FolderOpen className="w-10 h-10 text-primary" />
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-bold text-foreground text-center mb-2"
        >
          {isChangingLocation ? 'Change Storage Location' : 'Choose Storage Location'}
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground text-center mb-8 max-w-sm"
        >
          Select where to create your CHITRA folder for exports, backups, and attachments.
        </motion.p>

        {/* Location Options */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-md space-y-3"
        >
          {locations.map((location) => (
            <Card
              key={location.id}
              className={`p-4 cursor-pointer transition-all ${
                selectedLocation?.id === location.id
                  ? 'border-primary bg-primary/5 ring-2 ring-primary'
                  : 'hover:border-primary/50'
              }`}
              onClick={() => setSelectedLocation(location)}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  selectedLocation?.id === location.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}>
                  {locationIcons[location.id] || <FolderOpen className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{location.name}</p>
                    {selectedLocation?.id === location.id && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {location.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 w-full max-w-md"
          >
            <Card className="p-4 bg-destructive/10 border-destructive/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-destructive font-medium">
                    {error}
                  </p>
                  {permissionDenied && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={openAppSettings}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Settings
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Info Note */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 w-full max-w-md"
        >
          <Card className="p-4 bg-secondary/50 border-secondary">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Note:</strong> Your health data is stored securely 
              within the app. The CHITRA folder is only used for exports, backups, and 
              vaccination certificates that you can access with any file manager.
            </p>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Button */}
      <div className="p-6 bg-background border-t border-border">
        <Button
          onClick={handleSelectLocation}
          disabled={!selectedLocation || isCreating}
          className="w-full h-12 text-base"
        >
          {isCreating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Creating Folder...
            </>
          ) : (
            <>
              <FolderOpen className="w-5 h-5 mr-2" />
              {isChangingLocation ? 'Update Location' : 'Create CHITRA Folder'}
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};

export default FolderSelectSAF;
