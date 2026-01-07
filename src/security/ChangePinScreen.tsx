import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Delete, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { changePin } from '@/core/storage/securityService';
import { useToast } from '@/hooks/use-toast';

interface ChangePinScreenProps {
  onComplete: () => void;
  onCancel: () => void;
}

type Step = 'current' | 'new' | 'confirm';

const ChangePinScreen = ({ onComplete, onCancel }: ChangePinScreenProps) => {
  const [step, setStep] = useState<Step>('current');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();

  const getActivePin = () => {
    if (step === 'current') return currentPin;
    if (step === 'new') return newPin;
    return confirmPin;
  };

  const setActivePin = (value: string) => {
    if (step === 'current') setCurrentPin(value);
    else if (step === 'new') setNewPin(value);
    else setConfirmPin(value);
  };

  const handleNumberPress = (num: string) => {
    const pin = getActivePin();
    if (pin.length < 6) {
      const newValue = pin + num;
      setActivePin(newValue);
      setError('');
      
      if (newValue.length === 6) {
        handlePinComplete(newValue);
      }
    }
  };

  const handleDelete = () => {
    const pin = getActivePin();
    if (pin.length > 0) {
      setActivePin(pin.slice(0, -1));
      setError('');
    }
  };

  const handlePinComplete = async (pin: string) => {
    if (step === 'current') {
      // Move to new PIN step
      setTimeout(() => setStep('new'), 300);
    } else if (step === 'new') {
      // Move to confirm step
      setTimeout(() => setStep('confirm'), 300);
    } else {
      // Confirm step - validate and save
      if (pin !== newPin) {
        setError('PINs do not match');
        setConfirmPin('');
        return;
      }
      
      const result = await changePin(currentPin, newPin);
      if (result.success) {
        toast({
          title: "PIN Changed",
          description: "Your security PIN has been updated successfully",
        });
        onComplete();
      } else {
        setError(result.error || 'Failed to change PIN');
        // Reset to current PIN step
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
        setStep('current');
      }
    }
  };

  const getTitle = () => {
    if (step === 'current') return 'Enter Current PIN';
    if (step === 'new') return 'Enter New PIN';
    return 'Confirm New PIN';
  };

  const getSubtitle = () => {
    if (step === 'current') return 'Enter your current 6-digit PIN';
    if (step === 'new') return 'Choose a new 6-digit PIN';
    return 'Re-enter your new PIN to confirm';
  };

  const pin = getActivePin();

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="p-4">
        <Button
          variant="ghost"
          onClick={onCancel}
          className="text-muted-foreground"
        >
          Cancel
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-primary" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">{getTitle()}</h1>
          <p className="text-muted-foreground text-center mb-8">{getSubtitle()}</p>

          {/* Step indicators */}
          <div className="flex gap-2 mb-6">
            {(['current', 'new', 'confirm'] as Step[]).map((s, i) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full transition-colors ${
                  step === s ? 'bg-primary' : 
                  (['current', 'new', 'confirm'].indexOf(step) > i ? 'bg-primary/50' : 'bg-muted')
                }`}
              />
            ))}
          </div>

          {/* PIN Display */}
          <div className="flex gap-3 mb-8">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                className={`w-4 h-4 rounded-full transition-colors ${
                  i < pin.length ? 'bg-primary' : 'bg-muted'
                }`}
                animate={i < pin.length ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.2 }}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-destructive text-sm mb-4"
            >
              {error}
            </motion.p>
          )}
        </motion.div>
      </div>

      {/* Number Pad */}
      <div className="p-8 pb-12">
        <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <Button
              key={num}
              variant="ghost"
              className="w-16 h-16 rounded-full text-2xl font-medium"
              onClick={() => handleNumberPress(num.toString())}
            >
              {num}
            </Button>
          ))}
          <div /> {/* Empty space */}
          <Button
            variant="ghost"
            className="w-16 h-16 rounded-full text-2xl font-medium"
            onClick={() => handleNumberPress('0')}
          >
            0
          </Button>
          <Button
            variant="ghost"
            className="w-16 h-16 rounded-full"
            onClick={handleDelete}
          >
            <Delete className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChangePinScreen;
