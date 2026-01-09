import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import SplashScreen from './SplashScreen';
import CountrySelect from './CountrySelect';
import LanguageSelect from './LanguageSelect';
import PrivacyMessage from './PrivacyMessage';
import FolderSelect from './FolderSelect';
import NameInput from './NameInput';
import { savePreferences, completeOnboarding, acceptPrivacy } from '@/core/storage';
import { addProfile, setActiveProfile } from '@/core/storage/profileService';
import type { CountryCode, LanguageCode } from '@/core/types';

type OnboardingStep = 'splash' | 'country' | 'language' | 'name' | 'privacy' | 'folder';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [step, setStep] = useState<OnboardingStep>('splash');
  const [country, setCountry] = useState<CountryCode>('OTHER');
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [userName, setUserName] = useState('');

  const handleSplashComplete = () => {
    setStep('country');
  };

  const handleCountryNext = () => {
    setStep('language');
  };

  const handleLanguageNext = () => {
    setStep('name');
  };

  const handleLanguageBack = () => {
    setStep('country');
  };

  const handleNameNext = (name: string) => {
    setUserName(name);
    setStep('privacy');
  };

  const handleNameBack = () => {
    setStep('language');
  };

  const handlePrivacyBack = () => {
    setStep('name');
  };

  const handlePrivacyAccept = async () => {
    // Save all preferences
    await savePreferences({
      country,
      language,
      weightUnit: country === 'USA' || country === 'UK' ? 'lb' : 'kg',
    });
    await acceptPrivacy();
    
    // Create the main profile with the user's name
    const result = await addProfile(userName || 'Me', 'main');
    if (result.success && result.profile) {
      await setActiveProfile(result.profile.id);
    }
    
    setStep('folder');
  };

  const handleFolderBack = () => {
    setStep('privacy');
  };

  const handleFolderComplete = async () => {
    await completeOnboarding();
    onComplete();
  };

  const getStepIndex = (s: OnboardingStep): number => {
    const steps = ['country', 'language', 'name', 'privacy', 'folder'];
    return steps.indexOf(s);
  };

  return (
    <div className="fixed inset-0 bg-background safe-top safe-bottom">
      <AnimatePresence mode="wait">
        {step === 'splash' && (
          <SplashScreen key="splash" onComplete={handleSplashComplete} />
        )}
        {step === 'country' && (
          <CountrySelect
            key="country"
            selected={country}
            onSelect={setCountry}
            onNext={handleCountryNext}
          />
        )}
        {step === 'language' && (
          <LanguageSelect
            key="language"
            selected={language}
            onSelect={setLanguage}
            onNext={handleLanguageNext}
            onBack={handleLanguageBack}
          />
        )}
        {step === 'name' && (
          <NameInput
            key="name"
            onNext={handleNameNext}
            onBack={handleNameBack}
          />
        )}
        {step === 'privacy' && (
          <PrivacyMessage
            key="privacy"
            onAccept={handlePrivacyAccept}
            onBack={handlePrivacyBack}
          />
        )}
        {step === 'folder' && (
          <FolderSelect
            key="folder"
            onComplete={handleFolderComplete}
            onBack={handleFolderBack}
          />
        )}
      </AnimatePresence>

      {/* Progress Indicator */}
      {step !== 'splash' && (
        <div className="absolute top-4 left-0 right-0 flex justify-center gap-2 px-6">
          {['country', 'language', 'name', 'privacy', 'folder'].map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                getStepIndex(step) >= i
                  ? 'bg-primary'
                  : 'bg-border'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default OnboardingFlow;
