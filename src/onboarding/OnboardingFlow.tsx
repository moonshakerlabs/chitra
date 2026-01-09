import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import SplashScreen from './SplashScreen';
import CountrySelect from './CountrySelect';
import LanguageSelect from './LanguageSelect';
import PrivacyMessage from './PrivacyMessage';
import FolderSelect from './FolderSelect';
import { savePreferences, completeOnboarding, acceptPrivacy } from '@/core/storage';
import type { CountryCode, LanguageCode } from '@/core/types';

type OnboardingStep = 'splash' | 'country' | 'language' | 'privacy' | 'folder';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [step, setStep] = useState<OnboardingStep>('splash');
  const [country, setCountry] = useState<CountryCode>('OTHER');
  const [language, setLanguage] = useState<LanguageCode>('en');

  const handleSplashComplete = () => {
    setStep('country');
  };

  const handleCountryNext = () => {
    setStep('language');
  };

  const handleLanguageNext = () => {
    setStep('privacy');
  };

  const handleLanguageBack = () => {
    setStep('country');
  };

  const handlePrivacyBack = () => {
    setStep('language');
  };

  const handlePrivacyAccept = async () => {
    // Save all preferences
    await savePreferences({
      country,
      language,
      weightUnit: country === 'USA' || country === 'UK' ? 'lb' : 'kg',
    });
    await acceptPrivacy();
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
    const steps = ['country', 'language', 'privacy', 'folder'];
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
          {['country', 'language', 'privacy', 'folder'].map((s, i) => (
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
