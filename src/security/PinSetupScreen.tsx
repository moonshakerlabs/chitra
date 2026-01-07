import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Delete, ArrowLeft, Check, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { setPin } from '@/core/storage/securityService';
import { useToast } from '@/hooks/use-toast';

interface PinSetupScreenProps {
  onComplete: () => void;
  onCancel: () => void;
  isChanging?: boolean;
}

type Step = 'enter' | 'confirm';

const PinSetupScreen: React.FC<PinSetupScreenProps> = ({ 
  onComplete, 
  onCancel,
  isChanging = false 
}) => {
  const [step, setStep] = useState<Step>('enter');
  const [pin, setCurrentPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState(false);
  const { toast } = useToast();

  const currentPin = step === 'enter' ? pin : confirmPin;
  const setActivePin = step === 'enter' ? setCurrentPin : setConfirmPin;

  const handleDigitPress = (digit: string) => {
    if (currentPin.length >= 6) return;
    setError(false);
    setActivePin((prev) => prev + digit);
  };

  const handleBackspace = () => {
    setActivePin((prev) => prev.slice(0, -1));
    setError(false);
  };

  useEffect(() => {
    if (step === 'enter' && pin.length === 6) {
      // Move to confirm step
      setTimeout(() => setStep('confirm'), 300);
    } else if (step === 'confirm' && confirmPin.length === 6) {
      // Verify PINs match
      if (pin === confirmPin) {
        handleSavePin();
      } else {
        setError(true);
        setTimeout(() => {
          setConfirmPin('');
        }, 500);
      }
    }
  }, [pin, confirmPin, step]);

  const handleSavePin = async () => {
    try {
      await setPin(pin);
      toast({
        title: 'PIN Set Successfully',
        description: 'Your app is now protected with a PIN',
      });
      onComplete();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to set PIN',
        variant: 'destructive',
      });
    }
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('enter');
      setConfirmPin('');
    } else {
      onCancel();
    }
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center p-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold ml-2">
          {isChanging ? 'Change PIN' : 'Set Up PIN'}
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {step === 'enter' ? 'Enter New PIN' : 'Confirm Your PIN'}
          </h2>
          <p className="text-muted-foreground text-sm">
            {step === 'enter' 
              ? 'Choose a 6-digit PIN to protect your app' 
              : 'Enter the same PIN again to confirm'}
          </p>
        </motion.div>

        {/* PIN Dots */}
        <motion.div
          className="flex gap-3 mb-8"
          animate={error ? { x: [0, -10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <motion.div
              key={index}
              initial={false}
              animate={{
                scale: index < currentPin.length ? 1.2 : 1,
              }}
              className={`w-4 h-4 rounded-full transition-colors ${
                index < currentPin.length
                  ? error
                    ? 'bg-destructive'
                    : 'bg-primary'
                  : 'bg-muted'
              }`}
            />
          ))}
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-destructive text-sm mb-4"
          >
            PINs don't match. Try again.
          </motion.p>
        )}

        {/* Step indicator */}
        <div className="flex gap-2 mb-6">
          <div className={`w-2 h-2 rounded-full ${step === 'enter' ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`w-2 h-2 rounded-full ${step === 'confirm' ? 'bg-primary' : 'bg-muted'}`} />
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-4 max-w-[280px]">
          {digits.map((digit, index) => (
            <React.Fragment key={index}>
              {digit === '' ? (
                <div />
              ) : digit === 'del' ? (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBackspace}
                  className="w-20 h-16 rounded-2xl bg-secondary flex items-center justify-center"
                >
                  <Delete className="w-6 h-6 text-foreground" />
                </motion.button>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDigitPress(digit)}
                  className="w-20 h-16 rounded-2xl bg-secondary hover:bg-secondary/80 flex items-center justify-center text-2xl font-medium text-foreground transition-colors"
                >
                  {digit}
                </motion.button>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PinSetupScreen;
