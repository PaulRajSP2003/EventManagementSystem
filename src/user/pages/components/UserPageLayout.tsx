import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiBell, FiArrowLeft, FiLogOut } from 'react-icons/fi';
import SideDashboard from './SideDashboard';
import MobileLayoutWrapper from '../../MobileLayout/MobileLayoutWrapper';
import BottomNav from '../../MobileLayout/BottomNav';
import MobileMenuPage from '../../MobileLayout/MobileMenuPage';
import NotificationDrawer from '../../MobileLayout/NotificationDrawer';
import type { Notification } from '../../../types/Notification/types';
import { useNotification } from '../../hooks/useNotification';
import { fetchPermissionData } from '../permission';
import { useUserAuth } from '../auth/UserAuthContext';

const MobileHeader: React.FC<{
  onNotificationClick: () => void;
  unreadCount: number;
  onBack?: () => void;
  onLogout: () => void;
}> = ({ onNotificationClick, unreadCount, onBack, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const getTitle = () => {
    const path = location.pathname;
    const followMatch = path.match(/\/group\/follow\/([^\/]+)(?:\/([^\/]+))?/);
    if (followMatch) {
      return followMatch[2] ? `FOLLOWING GROUP ${followMatch[2]}` : `FOLLOWING GROUP ${followMatch[1]}`;
    }

    const subMatch = path.match(/\/group\/sub\/([^\/]+)(?:\/([^\/]+))?/);
    if (subMatch) {
      return subMatch[2] ? `SUBGROUP ${subMatch[2]}` : `SUB GROUP ${subMatch[1]}`;
    }

    if (path.includes('/dashboard')) return 'DASHBOARD';

    // Student Management
    if (path.includes('/student/new')) return 'ADD NEW STUDENT';
    if (path.includes('/student/edit/')) return 'EDIT STUDENT';
    if (path.match(/\/student\/[^\/]+$/) && !path.includes('/new')) return 'STUDENT DETAILS';
    if (path.includes('/student')) return 'STUDENT LIST';

    // Leader Management
    if (path.includes('/leader/new')) return 'ADD NEW LEADER';
    if (path.includes('/leader/edit/')) return 'EDIT LEADER';
    if (path.match(/\/leader\/[^\/]+$/) && !path.includes('/new')) return 'LEADER DETAILS';
    if (path.includes('/leader')) return 'LEADER LIST';

    // Medical Management
    if (path.includes('/medical/new')) return 'ADD MEDICAL REPORT';
    if (path.includes('/medical/edit/')) return 'EDIT MEDICAL REPORT';
    if (path.match(/\/medical\/[^\/]+$/) && !path.includes('/new')) return 'MEDICAL REPORT DETAILS';
    if (path.includes('/medical')) return 'MEDICAL LIST';

    if (path.includes('/group')) return 'GROUP NAVIGATION';
    if (path.includes('/room')) return 'ROOM NAVIGATION';

    // Admin & Management
    if (path.includes('/admin/users')) return 'USER MANAGEMENT';

    if (path.includes('/profile')) return 'MY PROFILE';
    return 'EVENT MANAGEMENT';
  };

  const isSubPage = location.pathname !== '/user/dashboard' && location.pathname !== '/user/profile';

  return (
    <div className="bg-white/95 backdrop-blur-sm fixed top-0 left-0 right-0 z-40 p-5 border-b border-slate-100 flex items-center justify-between">
      <div className="flex items-center gap-3 overflow-hidden">
        {isSubPage && (
          <button
            onClick={() => onBack ? onBack() : navigate('/user/dashboard')}
            className="text-slate-400 hover:text-indigo-600 transition-colors p-2 -ml-2 flex-shrink-0"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-lg font-bold text-slate-800 capitalize tracking-tight">
          {getTitle()}
          {location.pathname.startsWith('/admin') && (
            <span className="ml-2 px-2 py-0.5 bg-rose-50 border border-rose-100 rounded-full text-[10px] font-bold text-rose-600 uppercase tracking-tight inline-flex items-center align-middle h-5">
              Admin
            </span>
          )}
        </h1>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onNotificationClick}
          className="relative p-2 rounded-full bg-slate-50 text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <FiBell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          )}
        </button>
        <button
          onClick={onLogout}
          className="p-2 rounded-full bg-slate-50 text-slate-500 hover:text-red-600 transition-colors"
          title="Logout"
        >
          <FiLogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

const UserPageLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useUserAuth();
  const [activeMobileMenu, setActiveMobileMenu] = useState('');
  const [menuContextPath, setMenuContextPath] = useState<string | null>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [eventId, setEventId] = useState<number>();

  const {
    notifications,
    unreadCount,
    markAllAsRead,
    clearNotifications,
    markPersonNotificationsAsRead
  } = useNotification(eventId);

  useEffect(() => {
    const loadEventId = async () => {
      try {
        const permissionData = await fetchPermissionData();
        if (permissionData) {
          setEventId(permissionData.eventId);
        }
      } catch (error) {
        console.error('Failed to load permission data:', error);
      }
    };
    loadEventId();
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    // Clear any open mobile menu first to prevent UI overlap
    setActiveMobileMenu('');

    if ('student' in notification && notification.student) {
      markPersonNotificationsAsRead('student', notification.student.studentId);
      navigate(`/user/student/${notification.student.studentId}`);
    } else if ('leader' in notification && notification.leader) {
      markPersonNotificationsAsRead('leader', notification.leader.leaderId);
      navigate(`/user/leader/${notification.leader.leaderId}`);
    }
    // Close the drawer after navigation
    setIsNotificationOpen(false);
  };

  // Close menu when navigating to a different page (safety net)
  useEffect(() => {
    setActiveMobileMenu('');
  }, [location.pathname]);

  const handleHeaderBack = () => {
    const path = location.pathname;

    // Handle specific back navigation for Leader/Student details and edit pages
    if (path.match(/\/leader\/(?:\d+|edit\/\d+)$/)) {
      navigate('/user/leader');
      return;
    }
    if (path.match(/\/student\/(?:\d+|edit\/\d+)$/)) {
      navigate('/user/student');
      return;
    }

    // Set appropriate menu state based on current section for Group/Room/Medical/etc.
    if (path.includes('/group/')) {
      setMenuContextPath(path);
      setActiveMobileMenu('group');
    } else if (path.includes('/room/')) {
      setMenuContextPath(path);
      setActiveMobileMenu('room');
    } else if (path.includes('/student')) {
      setActiveMobileMenu('student');
      return;
    } else if (path.includes('/leader')) {
      setActiveMobileMenu('leader');
      return;
    } else if (path.includes('/medical')) {
      setActiveMobileMenu('medical');
      return;
    } else if (path.includes('/admin')) {
      setActiveMobileMenu('admin');
      return;
    } else if (path.includes('/profile')) {
      setActiveMobileMenu('profile');
      return;
    }

    // Default back behavior
    navigate(-1);
  };

  const desktopLayout = (
    <div className="flex min-h-screen">
      <div className="flex-1">{children}</div>
      <SideDashboard />
    </div>
  );

  return (
    <MobileLayoutWrapper desktopLayout={desktopLayout}>
      {/* Mobile-only Header */}
      <MobileHeader
        onNotificationClick={() => setIsNotificationOpen(true)}
        unreadCount={unreadCount}
        onBack={handleHeaderBack}
        onLogout={logout}
      />

      {/* Mobile-only content */}
      <div className="p-4 pt-20">
        {children}
      </div>

      {activeMobileMenu && (
        <MobileMenuPage
          activeMenu={activeMobileMenu}
          onClose={() => {
            setActiveMobileMenu('');
            setMenuContextPath(null);
          }}
          onNotificationClick={() => setIsNotificationOpen(true)}
          contextPath={menuContextPath || undefined}
        />
      )}

      <BottomNav
        activeMenu={activeMobileMenu}
        onMenuClick={(menu: string) => setActiveMobileMenu(menu)}
      />

      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={markAllAsRead}
        onClearAll={clearNotifications}
        onNotificationClick={handleNotificationClick}
      />
    </MobileLayoutWrapper>
  );
};

export default UserPageLayout;
