import React, { useState, useEffect, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiLogOut } from 'react-icons/fi';
import OwnerNavBar from './OwnerNavBar';
import MobileLayoutWrapper from '../../MobileLayout/MobileLayoutWrapper';
import BottomNav from '../../MobileLayout/BottomNav';
import MobileMenuPage from '../../MobileLayout/MobileMenuPage';
import { useAuth } from '../../context/AuthContext';

interface OwnerLayoutProps {
  children: ReactNode;
}

const MobileHeader: React.FC<{
  onBack?: () => void;
  onLogout: () => void;
}> = ({ onBack, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const getTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'DASHBOARD';
    if (path.includes('/event/new')) return 'ADD NEW EVENT';
    if (path.includes('/event/edit/')) return 'EDIT EVENT';
    if (path.match(/\/event\/\d+$/)) return 'EVENT DETAILS';
    if (path.includes('/event')) return 'EVENT LIST';
    
    if (path.includes('/admin/new')) return 'ADD NEW ADMIN';
    if (path.includes('/admin/edit/')) return 'EDIT ADMIN';
    if (path.match(/\/admin\/\d+$/)) return 'ADMIN DETAILS';
    if (path.includes('/admin')) return 'ADMIN LIST';

    return 'OWNER PANEL';
  };

  const isSubPage = location.pathname !== '/owner/dashboard';

  return (
    <div className="bg-white/95 backdrop-blur-sm fixed top-0 left-0 right-0 z-40 p-5 border-b border-slate-100 flex items-center justify-between">
      <div className="flex items-center gap-3 overflow-hidden">
        {isSubPage && (
          <button
            onClick={() => onBack ? onBack() : navigate('/owner/dashboard')}
            className="text-slate-400 hover:text-indigo-600 transition-colors p-2 -ml-2 flex-shrink-0"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-lg font-bold text-slate-800 capitalize tracking-tight">
          {getTitle()}
        </h1>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
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

export default function OwnerLayout({ children }: OwnerLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [activeMobileMenu, setActiveMobileMenu] = useState('');

  // Close menu when navigating to a different page
  useEffect(() => {
    setActiveMobileMenu('');
  }, [location.pathname]);

  const handleHeaderBack = () => {
    const path = location.pathname;
    if (path.includes('/event')) {
      if (path === '/owner/event') {
        navigate('/owner/dashboard');
      } else {
        setActiveMobileMenu('event');
      }
      return;
    }
    if (path.includes('/admin')) {
      if (path === '/owner/admin') {
        navigate('/owner/dashboard');
      } else {
        setActiveMobileMenu('admin');
      }
      return;
    }
    navigate(-1);
  };

  const desktopLayout = (
    <div className="min-h-screen bg-slate-50">
      <OwnerNavBar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );

  return (
    <MobileLayoutWrapper desktopLayout={desktopLayout}>
      {/* Mobile-only Header */}
      <MobileHeader
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
          onClose={() => setActiveMobileMenu('')}
          onLogout={logout}
        />
      )}

      <BottomNav
        activeMenu={activeMobileMenu}
        onMenuClick={(menu: string) => setActiveMobileMenu(menu)}
      />
    </MobileLayoutWrapper>
  );
}
