// src/user/pages/components/NavBar.tsx
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PAGE_PERMISSIONS, isAdminOrCoAdmin } from '../permission';
import { useUserAuth } from '../auth/UserAuthContext';
import { fetchPermissionData, clearPermissionCache } from '../permission';
import type { PermissionData } from '../permission';
import { useSignalR } from '../../context/SignalRContext';

// Connection Status Component
const ConnectionStatus = () => {
  const { connectionState } = useSignalR();

  const getStatusColor = () => {
    switch (connectionState) {
      case 'connected':
        return 'bg-green-500';
      case 'reconnecting':
        return 'bg-yellow-500 animate-pulse';
      default:
        return 'bg-red-500';
    }
  };

  const getStatusText = () => {
    switch (connectionState) {
      case 'connected':
        return 'Online';
      case 'reconnecting':
        return 'Reconnecting...';
      default:
        return 'Offline';
    }
  };

  return (
    <div className="flex items-center gap-1.5 mr-3 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700">
      <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor()}`} />
      <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300 hidden lg:inline">
        {getStatusText()}
      </span>
    </div>
  );
};

interface NavItem {
  name: string;
  href: string;
  permissionId: number | string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const getNavGroups = (role: string = '', permissions: number[] = [], groups: string[] = []): NavGroup[] => {
  const normalizedRole = role.toLowerCase();

  const GROUPS = groups || [];
  const PERMISSIONS = permissions || [];

  const allGroups: NavGroup[] = [
    {
      label: 'Student',
      items: [
        { name: 'Student List', href: '/user/student', permissionId: PAGE_PERMISSIONS.STUDENT_LIST },
        { name: 'New Student', href: '/user/student/new', permissionId: PAGE_PERMISSIONS.STUDENT_NEW },
      ],
    },
    {
      label: 'Leader',
      items: [
        { name: 'Leader List', href: '/user/leader', permissionId: PAGE_PERMISSIONS.LEADER_LIST },
        { name: 'New Leader', href: '/user/leader/new', permissionId: PAGE_PERMISSIONS.LEADER_NEW },
        ...(isAdminOrCoAdmin({ role: normalizedRole })
          ? [{ name: 'Leader Tasks', href: '/user/task', permissionId: PAGE_PERMISSIONS.TASK_DETAILS }]
          : []),
      ],
    },

    {
      label: 'Sub Grouping',
      items: GROUPS.map(group => ({
        name: `Group ${group}`,
        href: `/user/group/sub/${group}`,
        permissionId: PAGE_PERMISSIONS.SUB_GROUP
      })),
    },
    {
      label: 'Following Grouping',
      items: GROUPS.map(group => ({
        name: `Group ${group}`,
        href: `/user/group/follow/${group}`,
        permissionId: PAGE_PERMISSIONS.FOLLOWING_GROUP
      })),
    },
    {
      label: 'Room',
      items: [
        { name: 'Male', href: '/user/room/male', permissionId: PAGE_PERMISSIONS.VIEW_ROOM },
        { name: 'Female', href: '/user/room/female', permissionId: PAGE_PERMISSIONS.VIEW_ROOM },
      ],
    },
    {
      label: 'Medical',
      items: [
        { name: 'Report List', href: '/user/medical', permissionId: PAGE_PERMISSIONS.MEDICAL_REPORT_LIST },
        { name: 'New Report', href: '/user/medical/new', permissionId: PAGE_PERMISSIONS.MEDICAL_REPORT_NEW },
      ],
    },
  ];

  // Excel Import group - only for admin and co-admin
  const excelImportGroup: NavGroup = {
    label: 'Excel Import',
    items: [
      { name: 'Student Excel', href: '/user/student/excel', permissionId: 'admin-d' },
      { name: 'Leader Excel', href: '/user/leader/excel', permissionId: 'admin-e' },
    ],
  };

  // Admin-only management group (without Excel items)
  const adminGroup: NavGroup = {
    label: 'Admin',
    items: [
      { name: 'User List', href: '/admin/users', permissionId: 'admin-a' },
      { name: 'New User', href: '/admin/users/new', permissionId: 'admin-b' },
      { name: 'System Settings', href: '/admin/event/settings', permissionId: 'admin-c' },
    ],
  };

  // 👑 ADMIN: Everything + Admin panel + Excel Import
  if (normalizedRole === 'admin') {
    return [...allGroups, excelImportGroup, adminGroup];
  }

  if (normalizedRole === 'co-admin') {
    return [...allGroups, excelImportGroup];
  }

  return allGroups
    .map(group => {
      const filteredItems = group.items.filter(item =>
        PERMISSIONS.includes(item.permissionId as number)
      );

      if (filteredItems.length > 0) {
        return { ...group, items: filteredItems };
      }

      return null;
    })
    .filter((group): group is NavGroup => group !== null);
};
import { decryptData } from '../../utils/encryption';

const NavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, isAuthenticated, isLoading: authLoading } = useUserAuth();
  const [permissionData, setPermissionData] = useState<PermissionData | null>(() => {
    try {
      const encrypted = localStorage.getItem('login-data');
      const saved = decryptData<any>(encrypted);
      if (saved) {
        return {
          name: saved.name || '',
          role: saved.role || '',
          eventId: saved.eventId || 0,
          email: saved.email || '',
          groups: [],
          permissions: []
        } as PermissionData;
      }
      return null;
    } catch {
      return null;
    }
  });
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('nav-bar-data');
    return saved !== null ? saved === 'true' : true;
  });

  const profileRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchPermissionData(true);
        setPermissionData(data);
      } catch (error) {
        console.error('Failed to load permission data:', error);
      }
    };

    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);


  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    // Clear permission cache
    clearPermissionCache();
    await logout();
  };

  const navGroups = permissionData
    ? getNavGroups(permissionData.role, permissionData.permissions || [], permissionData.groups || [])
    : [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Profile dropdown check
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }

      // Sidebar check - close if clicking outside sidebar AND not on toggle button
      if (isSidebarOpen &&
        sidebarRef.current && !sidebarRef.current.contains(event.target as Node) &&
        toggleBtnRef.current && !toggleBtnRef.current.contains(event.target as Node)) {
        setIsSidebarOpen(false);
        localStorage.setItem('nav-bar-data', 'false');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSidebarOpen]);

  if (!isAuthenticated && !authLoading) return null;

  return (
    <>
      {/* Header Bar */}
      <header className="fixed top-0 left-0 w-full h-16 bg-white dark:bg-gray-800 hidden md:flex items-center justify-between px-8 z-50 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <button
            ref={toggleBtnRef}
            onClick={() => {
              const newState = !isSidebarOpen;
              setIsSidebarOpen(newState);
              localStorage.setItem('nav-bar-data', String(newState));
            }}
            className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {isSidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          <h1
            className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 select-none cursor-pointer"
            onClick={() => navigate("/user/dashboard")}
          >
            Event Management System
          </h1>
        </div>

        {/* Connection Status Indicator */}
        <div className="flex items-center">
          <ConnectionStatus />

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >

              <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-800 dark:text-indigo-200 font-bold text-sm">
                {(permissionData?.name || '')
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase() || '?'}
              </div>

              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-semibold text-gray-800 dark:text-white capitalize">{permissionData?.name || ''}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {permissionData?.role === 'co-admin' ? 'Co Admin' : permissionData?.role === 'user' ? 'User' : permissionData?.role || ''}
                </span>
              </div>
              <svg className={`w-4 h-4 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-800 dark:text-white">{permissionData?.email || 'No email'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">EVENT ID: {permissionData?.eventId || 0}</p>
                </div>
                <Link
                  to="/user/profile"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  My Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900 transition"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar - always visible, no auto-close */}
      <aside
        ref={sidebarRef}
        className={`fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] w-96 bg-white dark:bg-gray-800 shadow-md hidden md:flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {navGroups.map((group) => {
            const isOpen = openGroup === group.label;
            return (
              <div key={group.label}>
                <button
                  className="flex justify-between items-center w-full text-left px-2 py-2 font-medium text-sm text-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  onClick={() => setOpenGroup(isOpen ? null : group.label)}
                >
                  <span>{group.label}</span>
                  <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <div className={`pl-3 border-l border-gray-200 dark:border-gray-600 overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                  <ul className="mt-1 space-y-1">
                    {group.items.map((item) => (
                      <li key={item.name}>
                        <Link
                          to={item.href}
                          className={`block px-3 py-2 text-sm rounded-md transition ${isActive(item.href)
                            ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border-l-2 border-indigo-500'
                            : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600 hover:bg-gray-100'
                            }`}
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="pt-16">
        {/* Page Content Rendered Here */}
      </main>
    </>
  );
};

export default NavBar;
