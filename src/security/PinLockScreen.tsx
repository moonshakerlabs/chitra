import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Delete, Heart } from 'lucide-react';
import { verifyPin } from '@/core/storage/securityService';

interface PinLockScreenProps {
  onUnlock: () => void;
}

const PinLockScreen: React.FC<PinLockScreenProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleDigitPress = (digit: string) => {
    if (pin.length >= 6) return;
    setError(false);
    setPin((prev) => prev + digit);
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  useEffect(() => {
    if (pin.length === 6) {
      verifyPinCode();
    }
  }, [pin]);

  const verifyPinCode = async () => {
    const isValid = await verifyPin(pin);
    if (isValid) {
      onUnlock();
    } else {
      setError(true);
      setAttempts((prev) => prev + 1);
      setTimeout(() => setPin(''), 500);
    }
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-primary fill-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">CHITRA</h1>
        <p className="text-muted-foreground">Enter your 6-digit PIN</p>
      </motion.div>

      {/* PIN Dots */}
      <motion.div
        className="flex gap-3 mb-8"
        animate={error ? { x: [0, -10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <div
            key={index}
            className={`w-4 h-4 rounded-full transition-all ${
              index < pin.length
                ? error
                  ? 'bg-destructive'
                  : 'bg-primary'
                : 'bg-muted'
            }`}
          />
        ))}
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-destructive text-sm mb-4"
          >
            Incorrect PIN. {attempts >= 3 ? 'Please try again carefully.' : 'Try again.'}
          </motion.p>
        )}
      </AnimatePresence>

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
  );
};

export default PinLockScreen;
