import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { Profile } from '@/core/types';
import { 
  getAllProfiles, 
  getActiveProfile, 
  setActiveProfile as setActiveProfileService 
} from '@/core/storage/profileService';

interface ProfileContextType {
  activeProfile: Profile | null;
  profiles: Profile[];
  loading: boolean;
  setActiveProfile: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

interface ProfileProviderProps {
  children: ReactNode;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children }) => {
  const [activeProfile, setActiveProfileState] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const allProfiles = await getAllProfiles();
      setProfiles(allProfiles);
      
      const active = await getActiveProfile();
      setActiveProfileState(active);
    } catch (error) {
      console.error('Failed to load profiles:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const setActiveProfile = async (id: string) => {
    await setActiveProfileService(id);
    const profile = profiles.find(p => p.id === id) || null;
    setActiveProfileState(profile);
  };

  return (
    <ProfileContext.Provider
      value={{
        activeProfile,
        profiles,
        loading,
        setActiveProfile,
        reload: loadProfiles,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = (): ProfileContextType => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
