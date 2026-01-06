import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [showTagline, setShowTagline] = useState(false);
  const [showBranding, setShowBranding] = useState(false);

  useEffect(() => {
    const taglineTimer = setTimeout(() => setShowTagline(true), 800);
    const brandingTimer = setTimeout(() => setShowBranding(true), 1400);
    const completeTimer = setTimeout(() => onComplete(), 2800);

    return () => {
      clearTimeout(taglineTimer);
      clearTimeout(brandingTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-chitra-pink-light to-background flex flex-col items-center justify-center px-6">
      {/* Logo and Name */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="flex flex-col items-center"
      >
        {/* Heart Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
          className="mb-6"
        >
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg">
            <Heart className="w-10 h-10 text-primary-foreground fill-primary-foreground" />
          </div>
        </motion.div>

        {/* App Name */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-5xl font-bold text-primary tracking-wider"
        >
          CHITRA
        </motion.h1>

        {/* Tagline */}
        {showTagline && (
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="mt-3 text-muted-foreground text-center text-lg"
          >
            Complete Health Input & Tracking
          </motion.p>
        )}
      </motion.div>

      {/* Branding Footer */}
      {showBranding && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="absolute bottom-12 text-center"
        >
          <p className="text-sm text-muted-foreground">
            Built with <Heart className="inline w-3 h-3 text-primary fill-primary mx-1" /> by
          </p>
          <p className="text-sm font-medium text-foreground mt-1">
            Moonshaker Labs
          </p>
        </motion.div>
      )}

      {/* Loading indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-32"
      >
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-primary"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default SplashScreen;
