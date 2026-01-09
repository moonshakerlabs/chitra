import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface NameInputProps {
  onNext: (name: string) => void;
  onBack: () => void;
}

const NameInput = ({ onNext, onBack }: NameInputProps) => {
  const [name, setName] = useState('');

  const handleContinue = () => {
    if (name.trim()) {
      onNext(name.trim());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex flex-col h-full px-6 py-12"
    >
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <User className="w-8 h-8 text-primary" />
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-2 text-center">
          What's your name?
        </h1>
        <p className="text-muted-foreground text-center mb-8">
          This will be your display name in CHITRA
        </p>
        
        <div className="w-full max-w-xs">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            maxLength={20}
            className="text-center text-lg h-12"
            autoFocus
          />
          <p className="text-xs text-muted-foreground text-center mt-2">
            You can change this later in profile settings
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!name.trim()}
          className="flex-1"
        >
          Continue
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </motion.div>
  );
};

export default NameInput;
