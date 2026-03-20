import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiUsers,
  FiUserCheck,
  FiGrid,
  FiBox,
  FiActivity,
  FiUser,
  FiShield
} from 'react-icons/fi';
import { useUserAuth } from '../pages/auth/UserAuthContext';
import { canAccess, PAGE_PERMISSIONS } from '../pages/permission';

interface BottomNavProps {
  onMenuClick: (menu: string) => void;
  activeMenu: string;
}

const BottomNav: React.FC<BottomNavProps> = ({ onMenuClick, activeMenu }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUserAuth();

  const navItems = [
    { id: 'home', label: 'Home', icon: FiHome, path: '/user/dashboard' },
    {
      id: 'student',
      label: 'Student',
      icon: FiUsers,
      permissionId: [PAGE_PERMISSIONS.STUDENT_LIST, PAGE_PERMISSIONS.STUDENT_NEW]
    },
    {
      id: 'leader',
      label: 'Leader',
      icon: FiUserCheck,
      permissionId: [PAGE_PERMISSIONS.LEADER_LIST, PAGE_PERMISSIONS.LEADER_NEW]
    },
    { id: 'group', label: 'Group', icon: FiGrid, permissionId: PAGE_PERMISSIONS.SUB_GROUP },
    { id: 'room', label: 'Room', icon: FiBox, permissionId: PAGE_PERMISSIONS.VIEW_ROOM },
    {
      id: 'medical',
      label: 'Medical',
      icon: FiActivity,
      permissionId: [PAGE_PERMISSIONS.MEDICAL_REPORT_LIST, PAGE_PERMISSIONS.MEDICAL_REPORT_NEW]
    },
    ...(user?.role === 'admin' ? [{ id: 'admin', label: 'Users', icon: FiShield }] : []),
    { id: 'profile', label: 'Profile', icon: FiUser, path: '/user/profile' },
  ].filter(item => !item.permissionId || canAccess(user, item.permissionId));

  const handleNavClick = (item: any) => {
    if (item.path) {
      navigate(item.path);
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
    if (item.id === 'home' && path.includes('/user/dashboard')) return true;
    if (item.id === 'student' && path.includes('/student')) return true;
    if (item.id === 'leader' && path.includes('/leader')) return true;
    if (item.id === 'medical' && path.includes('/medical')) return true;
    if (item.id === 'group' && path.includes('/group')) return true;
    if (item.id === 'room' && path.includes('/room')) return true;
    if (item.id === 'admin' && path.includes('/admin')) return true;
    if (item.id === 'profile' && path.includes('/profile')) return true;

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
              className={`flex flex-col items-center justify-center flex-1 max-w-[4rem] transition-all duration-300 ${Active
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