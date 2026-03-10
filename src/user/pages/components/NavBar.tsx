// src/user/pages/components/NavBar.tsx
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PAGE_PERMISSIONS } from '../permission';
import { useUserAuth } from '../auth/UserAuthContext';
import { fetchPermissionData, clearPermissionCache } from '../permission';
import type { PermissionData } from '../permission';
import signalRService from '../../Services/signalRService';

// Connection Status Component
const ConnectionStatus = () => {
  const [connectionState, setConnectionState] = useState<string>('disconnected');

  useEffect(() => {
    // Initial state
    setConnectionState(signalRService.getConnectionState());

    // Subscribe to connection state changes
    const unsubscribe = signalRService.onConnectionStateChange((state) => {
      setConnectionState(state);
    });

    return unsubscribe;
  }, []);

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
        return 'Live';
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

  // 🧑‍💼 CO-ADMIN: Everything + Excel Import (but not Admin panel)
  if (normalizedRole === 'co-admin') {
    return [...allGroups, excelImportGroup];
  }

  // 👤 REGULAR USER: Only what permissions allow (Excel Import not included)
  return allGroups
    .map(group => {
      // Filter individual items by checking if their permissionId is in PERMISSIONS array
      const filteredItems = group.items.filter(item =>
        PERMISSIONS.includes(item.permissionId as number)
      );

      // Only return the group if it has at least one visible item
      if (filteredItems.length > 0) {
        return { ...group, items: filteredItems };
      }

      return null;
    })
    .filter((group): group is NavGroup => group !== null);
};

const NavBar = () => {
  const location = useLocation();
  const { logout, isAuthenticated } = useUserAuth();
  const [permissionData, setPermissionData] = useState<PermissionData | null>(null);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  const profileRef = useRef<HTMLDivElement>(null);

  // ALWAYS FETCH FRESH DATA FROM API - NO CACHE, NO LOCALSTORAGE
  useEffect(() => {
    const loadPermissionData = async () => {
      try {
        setLoading(true);
        // Clear any cached data first
        clearPermissionCache();
        // Fetch fresh data from API
        const data = await fetchPermissionData();
        setPermissionData(data);
      } catch (error) {
        console.error('Failed to load permission data:', error);
        setPermissionData(null);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      loadPermissionData();
    } else {
      setPermissionData(null);
      setLoading(false);
    }
  }, [isAuthenticated]);

  // SignalR Connection Management
  useEffect(() => {
    if (permissionData?.eventId && isAuthenticated) {
      
      signalRService.startConnection(permissionData.eventId.toString());
    }

    return () => {
      // No cleanup - connection persists
    };
  }, [permissionData?.eventId, isAuthenticated]);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    // Stop connection on logout
    await signalRService.stopConnection();
    // Clear permission cache
    clearPermissionCache();
    await logout();
  };

  const navGroups = permissionData
    ? getNavGroups(permissionData.role, permissionData.permissions || [], permissionData.groups || [])
    : [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show nothing while loading - no skeleton
  if (loading) {
    return null;
  }

  if (!isAuthenticated) return null;

  if (!permissionData) {
    return null;
  }

  return (
    <>

      {/* Header Bar */}
      <header className="fixed top-0 left-0 w-full h-16 bg-white dark:bg-gray-800 flex items-center justify-between px-8 z-50 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
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
          <h1 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">Event Management System</h1>
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
                {permissionData.name
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase() || 'U'}
              </div>

              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-semibold text-gray-800 dark:text-white capitalize">{permissionData.name || 'User'}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {permissionData.role === 'co-admin' ? 'Co Admin' : permissionData.role === 'user' ? 'User' : permissionData.role}
                </span>
              </div>
              <svg className={`w-4 h-4 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-800 dark:text-white">{permissionData.email || 'No email'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">EVENT ID: {permissionData.eventId || 0}</p>
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
        className={`fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] w-96 bg-white dark:bg-gray-800 shadow-md flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
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