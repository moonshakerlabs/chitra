import { Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const AppHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on settings page
  if (location.pathname === '/settings') {
    return null;
  }

  return (
    <div className="fixed top-0 right-0 z-50 p-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate('/settings')}
        className="rounded-full bg-background/80 backdrop-blur shadow-md"
      >
        <Settings className="w-5 h-5" />
      </Button>
    </div>
  );
};

export default AppHeader;
