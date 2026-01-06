import { motion } from 'framer-motion';
import { Shield, Lock, Smartphone, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PrivacyMessageProps {
  onAccept: () => void;
  onBack: () => void;
}

const privacyPoints = [
  {
    icon: Smartphone,
    title: 'Your Data Stays on Your Device',
    description: 'All your health data is stored locally on your phone. We never upload it to any server.',
  },
  {
    icon: Lock,
    title: 'No Account Required',
    description: 'Use CHITRA without creating an account or sharing any personal information.',
  },
  {
    icon: Shield,
    title: 'Private & Secure',
    description: 'Your intimate health details are protected and never shared with anyone.',
  },
];

const PrivacyMessage = ({ onAccept, onBack }: PrivacyMessageProps) => {
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
          <Heart className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Your Privacy Matters</h2>
        <p className="text-muted-foreground mt-2">
          CHITRA is designed with your privacy as the top priority.
        </p>
      </div>

      {/* Privacy Points */}
      <div className="flex-1 space-y-6">
        {privacyPoints.map((point, index) => (
          <motion.div
            key={point.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
              <point.icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{point.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{point.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-secondary/50 rounded-xl p-4 mb-6"
      >
        <p className="text-sm text-muted-foreground text-center">
          By continuing, you acknowledge that you understand how CHITRA protects your privacy.
        </p>
      </motion.div>

      {/* Buttons */}
      <div className="space-y-3">
        <Button
          onClick={onAccept}
          size="lg"
          className="w-full h-14 text-lg font-medium rounded-xl"
        >
          I Understand, Let's Start
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

export default PrivacyMessage;
