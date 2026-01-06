import { motion } from 'framer-motion';
import { Check, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LanguageCode } from '@/core/types';

interface LanguageSelectProps {
  selected: LanguageCode;
  onSelect: (language: LanguageCode) => void;
  onNext: () => void;
  onBack: () => void;
}

const languages: Array<{ code: LanguageCode; name: string; native: string }> = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'de', name: 'German', native: 'Deutsch' },
];

const LanguageSelect = ({ selected, onSelect, onNext, onBack }: LanguageSelectProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full px-6 py-8"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Languages className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Choose your language</h2>
        <p className="text-muted-foreground mt-2">
          Select your preferred language for the app.
        </p>
      </div>

      {/* Language List */}
      <div className="flex-1 space-y-3 overflow-auto">
        {languages.map((language, index) => (
          <motion.button
            key={language.code}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelect(language.code)}
            className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
              selected === language.code
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:border-primary/50'
            }`}
          >
            <div className="flex flex-col items-start">
              <span className="font-medium text-foreground">{language.name}</span>
              <span className="text-sm text-muted-foreground">{language.native}</span>
            </div>
            {selected === language.code && (
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Buttons */}
      <div className="pt-6 space-y-3">
        <Button
          onClick={onNext}
          size="lg"
          className="w-full h-14 text-lg font-medium rounded-xl"
        >
          Continue
        </Button>
        <Button
          onClick={onBack}
          variant="ghost"
          size="lg"
          className="w-full h-12 text-base"
        >
          Back
        </Button>
      </div>
    </motion.div>
  );
};

export default LanguageSelect;
