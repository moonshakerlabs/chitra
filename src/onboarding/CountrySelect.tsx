import { motion } from 'framer-motion';
import { Check, Globe2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CountryCode } from '@/core/types';

interface CountrySelectProps {
  selected: CountryCode;
  onSelect: (country: CountryCode) => void;
  onNext: () => void;
}

const countries: Array<{ code: CountryCode; name: string; flag: string }> = [
  { code: 'USA', name: 'United States', flag: '🇺🇸' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'EU', name: 'Europe', flag: '🇪🇺' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'OTHER', name: 'Other', flag: '🌍' },
];

const CountrySelect = ({ selected, onSelect, onNext }: CountrySelectProps) => {
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
          <Globe2 className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Where are you located?</h2>
        <p className="text-muted-foreground mt-2">
          This helps us provide relevant features and pricing for your region.
        </p>
      </div>

      {/* Country List */}
      <div className="flex-1 space-y-3 overflow-auto">
        {countries.map((country, index) => (
          <motion.button
            key={country.code}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelect(country.code)}
            className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
              selected === country.code
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:border-primary/50'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">{country.flag}</span>
              <span className="font-medium text-foreground">{country.name}</span>
            </div>
            {selected === country.code && (
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Continue Button */}
      <div className="pt-6">
        <Button
          onClick={onNext}
          size="lg"
          className="w-full h-14 text-lg font-medium rounded-xl"
        >
          Continue
        </Button>
      </div>
    </motion.div>
  );
};

export default CountrySelect;
