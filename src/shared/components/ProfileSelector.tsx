import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Check } from 'lucide-react';
import { useProfile } from '@/core/context/ProfileContext';
import { cn } from '@/lib/utils';

interface ProfileSelectorProps {
  onAddClick?: () => void;
  showAddButton?: boolean;
  compact?: boolean; // For use in header areas
}

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({ 
  onAddClick, 
  showAddButton = true,
  compact = false,
}) => {
  const { profiles, activeProfile, setActiveProfile, loading } = useProfile();

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="flex-shrink-0 w-16 h-20 rounded-xl bg-secondary animate-pulse"
          />
        ))}
      </div>
    );
  }

  const canAddMore = profiles.length < 5;

  // Compact mode for header usage - just show avatar dropdown
  if (compact) {
    return (
      <div className="flex gap-2 items-center">
        {profiles.map((profile) => (
          <motion.button
            key={profile.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveProfile(profile.id)}
            className={cn(
              "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all",
              activeProfile?.id === profile.id
                ? "bg-primary/20 ring-2 ring-primary"
                : "bg-secondary hover:bg-secondary/80"
            )}
            title={profile.name}
          >
            {profile.avatar}
          </motion.button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {profiles.map((profile) => (
        <motion.button
          key={profile.id}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveProfile(profile.id)}
          className={cn(
            "flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl transition-all min-w-[64px]",
            activeProfile?.id === profile.id
              ? "bg-primary/10 border-2 border-primary"
              : "bg-secondary hover:bg-secondary/80 border-2 border-transparent"
          )}
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-xl">
              {profile.avatar}
            </div>
            {activeProfile?.id === profile.id && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-3 h-3 text-primary-foreground" />
              </div>
            )}
          </div>
          <span className="text-xs font-medium text-foreground truncate max-w-[60px]">
            {profile.name}
          </span>
          <span className="text-[10px] text-muted-foreground capitalize">
            {profile.type === 'main' ? '18+' : 'Under 18'}
          </span>
        </motion.button>
      ))}
      
      {showAddButton && canAddMore && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onAddClick}
          className="flex-shrink-0 flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-secondary/50 hover:bg-secondary border-2 border-dashed border-muted-foreground/30 min-w-[64px] min-h-[76px]"
        >
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Plus className="w-5 h-5 text-muted-foreground" />
          </div>
          <span className="text-xs text-muted-foreground">Add</span>
        </motion.button>
      )}
    </div>
  );
};

export default ProfileSelector;
