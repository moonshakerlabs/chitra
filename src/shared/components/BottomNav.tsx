import { NavLink } from 'react-router-dom';
import { Home, Droplets, Weight, Syringe, Pill, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/cycle', icon: Droplets, label: 'Cycle' },
  { to: '/weight', icon: Weight, label: 'Weight' },
  { to: '/vaccination', icon: Syringe, label: 'Vaccine' },
  { to: '/medicine', icon: Pill, label: 'Medicine' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-nav glass border-t border-border safe-bottom z-40">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all
              ${isActive ? 'text-nav-active' : 'text-nav-foreground hover:text-nav-active/70'}
            `}
          >
            {({ isActive }) => (
              <>
                <motion.div
                  initial={false}
                  animate={{ scale: isActive ? 1.1 : 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  <item.icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
                </motion.div>
                <span className="text-xs font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-1 w-1 h-1 rounded-full bg-nav-active"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
