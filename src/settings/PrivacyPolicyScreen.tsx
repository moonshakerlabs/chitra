import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Lock, Smartphone, Heart, Database, Eye, FileText, Share2, UserX, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PrivacyPolicyScreenProps {
  onBack: () => void;
}

const policyPoints = [
  {
    icon: Smartphone,
    title: 'Local Data Storage',
    description: 'All your health data is stored locally on your device using an encrypted browser database (IndexedDB). Your data never leaves your phone unless you explicitly export it.',
    details: [
      'Cycle tracking data stays on your device',
      'Weight logs are stored locally only',
      'Vaccination records are kept on your phone',
      'Medicine schedules are stored locally',
      'Feeding logs remain on your device',
    ],
  },
  {
    icon: UserX,
    title: 'No Account Required',
    description: 'CHITRA works completely offline without requiring any account creation, email, phone number, or personal identification.',
    details: [
      'No sign-up or login required',
      'No email collection',
      'No phone number needed',
      'No social media connections',
      'Fully anonymous usage',
    ],
  },
  {
    icon: Lock,
    title: 'PIN Protection',
    description: 'Protect your private health data with a 6-digit PIN. The app locks when you switch away, keeping your information secure.',
    details: [
      'Optional 6-digit PIN lock',
      'Auto-lock when app goes to background',
      'PIN stored securely on device',
      'No biometric data collected',
    ],
  },
  {
    icon: Database,
    title: 'Data Backup & Export',
    description: 'Your CHITRA folder is used only for exports, backups, and attachments like vaccination certificates. You have full control over your data.',
    details: [
      'Export data to JSON or CSV format',
      'Backup folder is for exports only',
      'You control what gets exported',
      'Import your data back anytime',
      'Data portability is your right',
    ],
  },
  {
    icon: Eye,
    title: 'No Tracking or Analytics',
    description: 'CHITRA does not track your usage, collect analytics, or monitor your behavior. We respect your privacy completely.',
    details: [
      'No usage analytics collected',
      'No behavioral tracking',
      'No third-party trackers',
      'No advertising IDs',
      'No crash reporting to servers',
    ],
  },
  {
    icon: Share2,
    title: 'No Data Sharing',
    description: 'Your health data is never shared with any third parties, advertisers, or data brokers. Your information belongs to you alone.',
    details: [
      'No data sold to third parties',
      'No advertising partners',
      'No data broker connections',
      'No health insurance sharing',
      'No employer data access',
    ],
  },
  {
    icon: Shield,
    title: 'Secure by Design',
    description: 'CHITRA is built with privacy-first architecture. We cannot access your data even if we wanted to - it exists only on your device.',
    details: [
      'No server infrastructure',
      'No cloud storage by default',
      'Open data format (JSON)',
      'You own your data completely',
      'Delete anytime from settings',
    ],
  },
  {
    icon: AlertCircle,
    title: 'Your Responsibilities',
    description: 'While we protect your data within the app, please be aware of your responsibilities for keeping it safe.',
    details: [
      'Keep your device secure with a screen lock',
      'Enable PIN protection in CHITRA',
      'Backup your data regularly',
      'Be careful when sharing exports',
      'Uninstalling the app deletes all data',
    ],
  },
];

const PrivacyPolicyScreen = ({ onBack }: PrivacyPolicyScreenProps) => {
  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col safe-top safe-bottom">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-background/95 backdrop-blur-sm">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold text-foreground">Privacy Policy</h1>
          <p className="text-xs text-muted-foreground">Last updated: January 2026</p>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-4 py-6 space-y-6 pb-24">
          {/* Introduction */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6 bg-primary/5 border-primary/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground mb-2">Your Privacy is Our Priority</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    CHITRA is designed from the ground up to protect your privacy. We believe your intimate 
                    health data belongs to you and only you. This policy explains exactly how we handle 
                    (or rather, don't handle) your data.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Policy Points */}
          {policyPoints.map((point, index) => (
            <motion.div
              key={point.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden">
                <div className="p-4 bg-secondary/30">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <point.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{point.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{point.description}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-background">
                  <ul className="space-y-2">
                    {point.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-primary mt-1">•</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            </motion.div>
          ))}

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-6 text-center">
              <FileText className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Questions About Privacy?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                If you have any questions about how CHITRA handles your data, 
                please reach out to us.
              </p>
              <p className="text-xs text-muted-foreground">
                Moonshaker Labs • contact@moonshakerlabs.com
              </p>
            </Card>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <p className="text-xs text-muted-foreground">
              CHITRA v1.0.0 • Built with ❤️ by Moonshaker Labs
            </p>
          </motion.div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default PrivacyPolicyScreen;
