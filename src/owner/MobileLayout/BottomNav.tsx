import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiCalendar,
  FiShield
} from 'react-icons/fi';

interface BottomNavProps {
  onMenuClick: (menu: string) => void;
  activeMenu: string;
}

const BottomNav: React.FC<BottomNavProps> = ({ onMenuClick, activeMenu }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: FiHome, path: '/owner/dashboard' },
    { id: 'event', label: 'Events', icon: FiCalendar },
    { id: 'admin', label: 'Admins', icon: FiShield },
  ];

  const handleNavClick = (item: any) => {
    if (item.path) {
      if (location.pathname !== item.path) {
        navigate(item.path);
      }
      onMenuClick(''); // Clear sub-menu if navigating to a direct page
    } else {
      if (activeMenu === item.id) {
        onMenuClick('');
      } else {
        onMenuClick(item.id);
      }
    }
  };

  const isActive = (item: any) => {
    if (activeMenu) {
      return activeMenu === item.id;
    }

    const path = location.pathname;
    if (item.id === 'dashboard' && path === '/owner/dashboard') return true;
    if (item.id === 'event' && path.includes('/owner/event')) return true;
    if (item.id === 'admin' && path.includes('/owner/admin')) return true;

    return item.path ? path === item.path : false;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-2 py-2 z-50">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {navItems.map((item) => {
          const Active = isActive(item);
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={`flex flex-col items-center justify-center min-w-[3rem] transition-all duration-300 ${Active
                ? 'text-indigo-600 dark:text-indigo-400 scale-110'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
            >
              <div className={`p-1.5 rounded-xl ${Active ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}`}>
                <Icon className={`w-5 h-5 ${Active ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
              </div>
              <span className={`text-[10px] mt-0.5 font-semibold ${Active ? 'opacity-100' : 'opacity-70'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
