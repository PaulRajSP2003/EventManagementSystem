// src/user/pages/leader/LeaderList.tsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiPlus, FiSearch, FiFilter,
  FiChevronUp, FiChevronDown,
  FiDownload,
  FiLoader,
  FiX
} from 'react-icons/fi';

import { leaderAPI } from '../api/LeaderData';
import type { Leader } from '../../../types';
import { PAGE_PERMISSIONS, isAdminOrCoAdmin, canAccess, fetchPermissionData, type PermissionData } from '../permission';
import { StickyHeader, AccessAlert } from '../components';
import SignalRService from '../../Services/signalRService';

// Permission constant for this page
const PAGE_ID = PAGE_PERMISSIONS.LEADER_LIST;

const formatLeaderType = (type: Leader['type']): string => {
  switch (type) {
    case 'leader1': return 'Leader 1';
    case 'leader2': return 'Leader 2';
    case 'guest': return 'Guest';
    case 'participant': return 'Participant';
    default: return type;
  }
};

type FilterType = {
  id: string;
  name: string;
  gender: string;
  contactNumber: string;
  place: string;
  status: string;
  type: string;
};

type SortConfig = {
  key: keyof Leader;
  direction: 'asc' | 'desc';
};

const LeaderListSkeleton = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
      <div className="max-w-6xl mx-auto px-4 mt-2 sm:mt-8 space-y-6 animate-pulse">
        <div className="h-20 bg-white rounded-xl border border-slate-200"></div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="h-12 bg-slate-50 border-b border-slate-200"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 border-b border-slate-100 mx-4"></div>
          ))}
        </div>
      </div>
    </div>
  );
};

const LeaderList = () => {
  const navigate = useNavigate();
  const [accessDenied, setAccessDenied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [permissionData, setPermissionData] = useState<PermissionData | null>(null);
  const [permissionLoading, setPermissionLoading] = useState(true);
  const [permissionError, setPermissionError] = useState<boolean>(false);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [filteredLeaders, setFilteredLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  // Open filter bar if gender filter is set from localStorage
  const [showFilters, setShowFilters] = useState(() => {
    try {
      const localData = localStorage.getItem('leaderList');
      if (localData) {
        const parsed = JSON.parse(localData);
        return !!(parsed.gender || parsed.status);
      }
      const sessionData = sessionStorage.getItem('leaderList');
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        return !!(parsed.gender || parsed.status || parsed.place);
      }
      return false;
    } catch {
      return false;
    }
  });

  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'id', direction: 'desc' });
  const [filters, setFilters] = useState<FilterType>(() => {
    let gender = '';
    let status = '';
    let place = '';
    try {
      const localData = localStorage.getItem('leaderList');
      if (localData) {
        const parsed = JSON.parse(localData);
        gender = parsed.gender || '';
        status = parsed.status || '';
      }
      const sessionData = sessionStorage.getItem('leaderList');
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        if (parsed.gender) gender = parsed.gender;
        if (parsed.status) status = parsed.status;
        place = parsed.place || '';
      }
    } catch { }
    return { id: '', name: '', gender, contactNumber: '', place, status, type: '' };
  });


  // Download CSV for leaders
  const downloadCSV = async () => {
    setDownloading(true);
    try {
      await leaderAPI.downloadCSV();
    } catch (error: any) {
      alert(error.message || 'Failed to download CSV');
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    const notificationHandler = async (notification: any) => {
      switch (notification.messageType) {
        case 'leader_added':
          // New leader added - fetch the new leader and add to list
          try {
            const newLeader = await leaderAPI.getById(notification.leader.leaderId);
            setLeaders(prevLeaders => {
              if (prevLeaders.some(l => l.id === newLeader.id)) return prevLeaders;
              const transformedLeader = {
                ...newLeader,
                registered_mode: newLeader.registered_mode || 'offline',
                status: newLeader.status || 'registered',
                staying: newLeader.staying || '',
                isFollowing: newLeader.isFollowing || '',
                remark: newLeader.remark || '',
                churchName: newLeader.churchName || '',
                whatsappNumber: newLeader.whatsappNumber || newLeader.contactNumber || '',
              };
              return [transformedLeader, ...prevLeaders];
            });
          } catch (err) {
            console.error('Failed to fetch new leader:', err);
            // If can't fetch individual, refresh entire list
            const apiLeaders = await leaderAPI.getAll();
            const transformedLeaders = apiLeaders.map(leader => ({
              ...leader,
              registered_mode: leader.registered_mode || 'offline',
              status: leader.status || 'registered',
              staying: leader.staying || '',
              isFollowing: leader.isFollowing || '',
              remark: leader.remark || '',
              churchName: leader.churchName || '',
              whatsappNumber: leader.whatsappNumber || leader.contactNumber || '',
            }));
            setLeaders(transformedLeaders);
          }
          break;

        case 'leader_status_changed':
          // Leader status changed - update that specific leader
          try {
            const updatedLeader = await leaderAPI.getById(notification.leader.leaderId);
            setLeaders(prevLeaders => {
              const transformedLeader = {
                ...updatedLeader,
                registered_mode: updatedLeader.registered_mode || 'offline',
                status: updatedLeader.status || 'registered',
                staying: updatedLeader.staying || '',
                isFollowing: updatedLeader.isFollowing || '',
                remark: updatedLeader.remark || '',
                churchName: updatedLeader.churchName || '',
                whatsappNumber: updatedLeader.whatsappNumber || updatedLeader.contactNumber || '',
              };
              const filtered = prevLeaders.filter(l => l.id !== transformedLeader.id);
              return [transformedLeader, ...filtered];
            });
          } catch (err) {
            console.error('Failed to fetch updated leader:', err);
            // If can't fetch individual, refresh entire list
            const apiLeaders = await leaderAPI.getAll();
            const transformedLeaders = apiLeaders.map(leader => ({
              ...leader,
              registered_mode: leader.registered_mode || 'offline',
              status: leader.status || 'registered',
              staying: leader.staying || '',
              isFollowing: leader.isFollowing || '',
              remark: leader.remark || '',
              churchName: leader.churchName || '',
              whatsappNumber: leader.whatsappNumber || leader.contactNumber || '',
            }));
            setLeaders(transformedLeaders);
          }
          break;

        case 'student_added':
        case 'student_status_changed':
          break;

        default:
      }
    };

    SignalRService.onNotification(notificationHandler);
    return () => {
      SignalRService.removeNotificationCallback(notificationHandler);
    };
  }, []);

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        setPermissionLoading(true);
        setPermissionError(false);
        const data = await fetchPermissionData();
        setPermissionData(data);

        // Check access using canAccess directly with permission data
        const hasAccess = canAccess(data, PAGE_ID);
        setAccessDenied(!hasAccess);

        if (!hasAccess) {
          setErrorMessage("You don't have permission to view leaders");
        }
      } catch (error: any) {
        console.error('Failed to load permissions:', error);
        setPermissionData(null);
        setPermissionError(true);
        setAccessDenied(true);

        // Check for 403 Forbidden error
        if (error.message === 'Forbidden' || error.message?.includes('403')) {
          setErrorMessage("Access Forbidden: You don't have permission to access this resource");
        } else if (error.message === 'Unauthorized' || error.message?.includes('401')) {
          setErrorMessage("Unauthorized: Please log in to access this page");
        } else {
          setErrorMessage(error.message || 'Failed to load permissions');
        }
      } finally {
        setPermissionLoading(false);
      }
    };

    loadPermissions();
  }, []);

  // Fetch leaders only if user has access
  useEffect(() => {
    if (!permissionData || accessDenied || permissionError) {
      setLoading(false);
      return;
    }

    const fetchLeaders = async () => {
      try {
        setLoading(true);
        const apiLeaders = await leaderAPI.getAll();

        const transformedLeaders = apiLeaders.map(leader => ({
          ...leader,
          registered_mode: leader.registered_mode || 'offline',
          status: leader.status || 'registered',
          staying: leader.staying || '',
          isFollowing: leader.isFollowing || '',
          remark: leader.remark || '',
          churchName: leader.churchName || '',
          whatsappNumber: leader.whatsappNumber || leader.contactNumber || '',
        }));

        // Remove duplicates if any
        const uniqueLeaders = Array.from(new Map(transformedLeaders.map(l => [l.id, l])).values());
        setLeaders(uniqueLeaders);
        setErrorMessage(null);
      } catch (err: any) {
        console.error('Failed to fetch leaders:', err);

        // Handle 403 Forbidden for leader API
        if (err.message === 'Forbidden' || err.message?.includes('403')) {
          setAccessDenied(true);
          setErrorMessage("Access Forbidden: You don't have permission to view leaders");
        } else if (err.message === 'Unauthorized' || err.message?.includes('401')) {
          setAccessDenied(true);
          setErrorMessage("Unauthorized: Please log in to access this page");
        } else {
          setErrorMessage(err.message || 'Failed to fetch leaders');
        }

        setLeaders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaders();
  }, [permissionData, accessDenied, permissionError]);

  // Filter and sort leaders
  useEffect(() => {
    if (!permissionData || accessDenied || permissionError || !leaders.length) {
      setFilteredLeaders([]);
      return;
    }

    let results = [...leaders];

    // Global search with Google-like functionality
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase().trim();
      const searchTerms = searchLower.split(/\s+/).filter(term => term.length > 0);

      results = results.filter(leader => {
        const searchableText = [
          String(leader.id || ''),
          leader.name || '',
          leader.place || '',
          leader.contactNumber || '',
          leader.churchName || '',
          leader.type || '',
          leader.gender || '',
          leader.status || ''
        ].join(' ').toLowerCase();

        return searchTerms.every(term => searchableText.includes(term));
      });

      // Sort by relevance - exact matches first
      results.sort((a, b) => {
        const aExactId = String(a.id) === searchTerm.trim();
        const bExactId = String(b.id) === searchTerm.trim();
        const aExactName = a.name?.toLowerCase() === searchLower;
        const bExactName = b.name?.toLowerCase() === searchLower;
        const aExactPlace = a.place?.toLowerCase() === searchLower;
        const bExactPlace = b.place?.toLowerCase() === searchLower;

        // Priority: exact ID > exact name > exact place > partial matches
        if (aExactId && !bExactId) return -1;
        if (!aExactId && bExactId) return 1;
        if (aExactName && !bExactName) return -1;
        if (!aExactName && bExactName) return 1;
        if (aExactPlace && !bExactPlace) return -1;
        if (!aExactPlace && bExactPlace) return 1;

        return 0;
      });
    }

    // Apply individual filters
    if (filters.id) {
      const idFilter = filters.id.trim();
      results = results.filter(l => String(l.id) === idFilter);
    }

    if (filters.name) {
      const nameSearchLower = filters.name.toLowerCase().trim();
      const nameTerms = nameSearchLower.split(/\s+/).filter(term => term.length > 0);
      results = results.filter(l => {
        const leaderName = l.name.toLowerCase();
        return nameTerms.every(term => leaderName.includes(term));
      });
    }

    if (filters.gender) {
      results = results.filter(l => l.gender === filters.gender);
    }

    if (filters.contactNumber) {
      const contactLower = filters.contactNumber.toLowerCase().trim();
      results = results.filter(l => l.contactNumber?.toLowerCase().includes(contactLower));
    }

    if (filters.place) {
      const placeSearchLower = filters.place.toLowerCase().trim();
      const placeTerms = placeSearchLower.split(/\s+/).filter(term => term.length > 0);
      results = results.filter(l => {
        const leaderPlace = l.place.toLowerCase();
        return placeTerms.every(term => leaderPlace.includes(term));
      });
    }

    if (filters.status) {
      results = results.filter(l => l.status === filters.status);
    }

    if (filters.type) {
      results = results.filter(l => l.type === filters.type);
    }

    // Apply sorting
    results.sort((a, b) => {
      if (sortConfig.key === 'id') {
        const aValue = a[sortConfig.key] ?? -Infinity;
        const bValue = b[sortConfig.key] ?? -Infinity;

        if (aValue === bValue) return 0;
        return sortConfig.direction === 'asc'
          ? (Number(aValue) - Number(bValue))
          : (Number(bValue) - Number(aValue));
      } else {
        const aValue = a[sortConfig.key] ?? '';
        const bValue = b[sortConfig.key] ?? '';

        if (aValue === bValue) return 0;

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        return sortConfig.direction === 'asc'
          ? (aValue < bValue ? -1 : 1)
          : (aValue > bValue ? -1 : 1);
      }
    });

    setFilteredLeaders(results);
  }, [searchTerm, filters, leaders, sortConfig, permissionData, accessDenied, permissionError]);

  const handleSort = (key: keyof Leader) => {
    if (accessDenied || !permissionData || permissionError) return;
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const clearFilters = () => {
    if (accessDenied || !permissionData || permissionError) return;
    setFilters({ id: '', name: '', gender: '', contactNumber: '', place: '', status: '', type: '' });
    setSearchTerm('');
    setSortConfig({ key: 'id', direction: 'desc' });
    try {
      localStorage.removeItem('leaderList');
      sessionStorage.removeItem('leaderList');
    } catch { }
  };

  const SortIcon = ({ column }: { column: keyof Leader }) => {
    if (sortConfig.key !== column) return <FiChevronUp className="opacity-20 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' ? <FiChevronUp className="text-indigo-600" /> : <FiChevronDown className="text-indigo-600" />;
  };

  // Check if user has permission to create new leader
  const canCreateLeader = () => {
    if (!permissionData || accessDenied || permissionError) return false;
    return canAccess(permissionData, PAGE_PERMISSIONS.LEADER_NEW);
  };

  // Show loading state while permissions are loading
  if (permissionLoading) {
    return <LeaderListSkeleton />;
  }

  // Show access denied page for permission errors or access denied
  if (permissionError || accessDenied || !permissionData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AccessAlert message={errorMessage || "You do not have access to this page."} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 sm:via-white via-slate-50 to-slate-50 pb-12">
      <StickyHeader title="Leader Management" onBack={() => navigate('/user/dashboard')}>
        <div className="flex items-center gap-3">
          {/* Download CSV Button */}
          {isAdminOrCoAdmin(permissionData) && (
            <button
              onClick={downloadCSV}
              disabled={downloading || leaders.length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${downloading
                ? 'bg-green-400 text-white cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              title={leaders.length === 0 ? "No data to export" : "Download as CSV"}
            >
              {downloading ? (
                <>
                  <FiLoader className="animate-spin" /> Downloading...
                </>
              ) : (
                <>
                  <FiDownload /> Export CSV
                </>
              )}
            </button>
          )}

          {/* New Leader button */}
          <Link
            to={canCreateLeader() ? "/user/leader/new" : "#"}
            onClick={(e) => {
              if (!canCreateLeader()) {
                e.preventDefault();
                alert("You don't have permission to create new leaders");
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${canCreateLeader()
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer'
              : 'bg-slate-300 text-white cursor-not-allowed opacity-50'
              }`}
          >
            <FiPlus /> New Leader
          </Link>
        </div>
      </StickyHeader>

      {loading ? (
        <LeaderListSkeleton />
      ) : (
        <div className="max-w-6xl mx-auto px-4 mt-2 sm:mt-8 space-y-6">
          {/* Search & Filter Bar */}
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white dark:bg-slate-800">
            <div className="p-4 border-b border-slate-50">
              <div className="flex flex-row items-center justify-between gap-2 sm:gap-4">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search..."
                    className="pl-10 pr-4 py-2 w-full border border-slate-200 rounded-lg sm:bg-slate-50 bg-transparent text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <FiX className="text-slate-400 hover:text-slate-600" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all border ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'sm:bg-white bg-transparent border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                  >
                    <FiFilter /> <span className="hidden xs:inline">Filters</span>
                  </button>
                  {(searchTerm || Object.values(filters).some(v => v) || sortConfig.key !== 'id' || sortConfig.direction !== 'desc') && (
                    <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-red-600 font-semibold px-1 sm:px-2 transition-colors">
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>

            {showFilters && (
              <div className="p-3 border-b border-slate-100">
                {/* Desktop View: Grid */}
                <div className="hidden sm:grid grid-cols-4 lg:grid-cols-7 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">ID</label>
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                      value={filters.id}
                      onChange={(e) => setFilters(p => ({ ...p, id: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                      value={filters.name}
                      onChange={(e) => setFilters(p => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Gender</label>
                    <select
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                      value={filters.gender}
                      onChange={(e) => {
                        const newGender = e.target.value;
                        setFilters(p => {
                          const newFilters = { ...p, gender: newGender };
                          try {
                            localStorage.setItem('leaderList', JSON.stringify({ gender: newGender, status: newFilters.status }));
                            sessionStorage.setItem('leaderList', JSON.stringify({ gender: newGender, status: newFilters.status, place: newFilters.place }));
                          } catch { }
                          return newFilters;
                        });
                      }}
                    >
                      <option value="">All</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Contact</label>
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                      value={filters.contactNumber}
                      onChange={(e) => setFilters(p => ({ ...p, contactNumber: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Place</label>
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                      value={filters.place}
                      onChange={(e) => {
                        const newPlace = e.target.value;
                        setFilters(p => {
                          const newFilters = { ...p, place: newPlace };
                          try {
                            sessionStorage.setItem('leaderList', JSON.stringify({ gender: newFilters.gender, status: newFilters.status, place: newPlace }));
                          } catch { }
                          return newFilters;
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Status</label>
                    <select
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                      value={filters.status}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        setFilters(p => {
                          const newFilters = { ...p, status: newStatus };
                          try {
                            localStorage.setItem('leaderList', JSON.stringify({ gender: newFilters.gender, status: newStatus }));
                            sessionStorage.setItem('leaderList', JSON.stringify({ gender: newFilters.gender, status: newStatus, place: newFilters.place }));
                          } catch { }
                          return newFilters;
                        });
                      }}
                    >
                      <option value="">All</option>
                      <option value="registered">Registered</option>
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Type</label>
                    <select
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                      value={filters.type}
                      onChange={(e) => setFilters(p => ({ ...p, type: e.target.value }))}
                    >
                      <option value="">All</option>
                      <option value="leader1">Leader 1</option>
                      <option value="leader2">Leader 2</option>
                      <option value="participant">Participant</option>
                      <option value="guest">Guest</option>
                    </select>
                  </div>
                </div>

                {/* Mobile View: Rows */}
                <div className="sm:hidden space-y-3">
                  {/* Line One: ID, Gender */}
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">ID</label>
                      <input
                        type="text"
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-transparent"
                        value={filters.id}
                        onChange={(e) => setFilters(p => ({ ...p, id: e.target.value }))}
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Gender</label>
                      <select
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-transparent"
                        value={filters.gender}
                        onChange={(e) => {
                          const newGender = e.target.value;
                          setFilters(p => {
                            const newFilters = { ...p, gender: newGender };
                            try {
                              localStorage.setItem('leaderList', JSON.stringify({ gender: newGender, status: newFilters.status }));
                              sessionStorage.setItem('leaderList', JSON.stringify({ gender: newGender, status: newFilters.status, place: newFilters.place }));
                            } catch { }
                            return newFilters;
                          });
                        }}
                      >
                        <option value="">All</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                  </div>
                  {/* Line Two: Status, Type */}
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Status</label>
                      <select
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-transparent"
                        value={filters.status}
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          setFilters(p => {
                            const newFilters = { ...p, status: newStatus };
                            try {
                              localStorage.setItem('leaderList', JSON.stringify({ gender: newFilters.gender, status: newStatus }));
                              sessionStorage.setItem('leaderList', JSON.stringify({ gender: newFilters.gender, status: newStatus, place: newFilters.place }));
                            } catch { }
                            return newFilters;
                          });
                        }}
                      >
                        <option value="">All</option>
                        <option value="registered">Registered</option>
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                      </select>
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Type</label>
                      <select
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-transparent"
                        value={filters.type}
                        onChange={(e) => setFilters(p => ({ ...p, type: e.target.value }))}
                      >
                        <option value="">All</option>
                        <option value="leader1">Leader 1</option>
                        <option value="leader2">Leader 2</option>
                        <option value="guest">Guest</option>
                        <option value="participant">Participant</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Table Container - Desktop View */}
          <div className="hidden sm:block bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    <th onClick={() => handleSort('id')} className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider cursor-pointer group select-none">
                      <div className="flex items-center gap-1">ID <SortIcon column="id" /></div>
                    </th>
                    <th onClick={() => handleSort('name')} className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider cursor-pointer group select-none">
                      <div className="flex items-center gap-1">Leader Name <SortIcon column="name" /></div>
                    </th>
                    <th onClick={() => handleSort('gender')} className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider text-left cursor-pointer group select-none">
                      <div className="flex items-center gap-1">Gender <SortIcon column="gender" /></div>
                    </th>
                    <th onClick={() => handleSort('contactNumber')} className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider cursor-pointer group select-none">
                      <div className="flex items-center gap-1">Contact <SortIcon column="contactNumber" /></div>
                    </th>
                    <th onClick={() => handleSort('type')} className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider text-center cursor-pointer group select-none">
                      <div className="flex items-center justify-center gap-1">Type <SortIcon column="type" /></div>
                    </th>
                    <th onClick={() => handleSort('place')} className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider cursor-pointer group select-none">
                      <div className="flex items-center gap-1">Place <SortIcon column="place" /></div>
                    </th>
                    <th onClick={() => handleSort('status')} className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider text-center cursor-pointer group select-none">
                      <div className="flex items-center justify-center gap-1">Status <SortIcon column="status" /></div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeaders.map((leader) => (
                    <tr
                      key={leader.id || `leader-${Math.random()}`}
                      onClick={() => navigate(`/user/leader/${leader.id}`)}
                      className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-slate-400">
                        #{leader.id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-slate-100 rounded-lg flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 text-sm">
                            {leader.gender?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors capitalize">
                              {leader.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-left">
                        <span className="text-xs font-medium text-slate-500 uppercase">{leader.gender?.toUpperCase()}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{leader.contactNumber}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center justify-center w-28 py-1 text-[10px] uppercase font-bold rounded-full border ${leader.type === 'guest'
                          ? 'bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-800 border-indigo-200'
                          : leader.type === 'leader1' || leader.type === 'leader2'
                            ? 'bg-gradient-to-r from-teal-100 to-teal-200 text-teal-800 border-teal-200'
                            : leader.type === 'participant'
                              ? 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                          {formatLeaderType(leader.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 capitalize">{leader.place}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center justify-center w-24 py-1 text-[10px] uppercase font-bold rounded-full border ${leader.status === 'present'
                          ? 'bg-green-50 text-green-700 border-green-100'
                          : leader.status === 'registered'
                            ? 'bg-amber-50 text-amber-700 border-amber-100'
                            : 'bg-red-50 text-red-700 border-red-100'
                          }`}>
                          {leader.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredLeaders.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-sm">
                  No leaders found matching your criteria.
                </div>
              )}
            </div>
          </div>

          {/* Card View - Mobile View */}
          <div className="sm:hidden space-y-4">
            {filteredLeaders.map((leader) => (
              <div
                key={leader.id || `leader-mobile-${Math.random()}`}
                onClick={() => navigate(`/user/leader/${leader.id}`)}
                className="rounded-xl border border-slate-200 overflow-hidden p-4 shadow-sm bg-white dark:bg-slate-800"
              >
                <div className="flex gap-4">
                  {/* Details Cell */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase">Details</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${leader.status === 'present'
                        ? 'bg-green-50 text-green-700 border-green-100'
                        : leader.status === 'registered'
                          ? 'bg-amber-50 text-amber-700 border-amber-100'
                          : 'bg-red-50 text-red-700 border-red-100'
                        }`}>
                        {leader.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-1">
                      <div className="flex gap-2">
                        <span className="text-xs font-semibold text-slate-500 w-16">Name:</span>
                        <span className="text-xs font-bold text-slate-800 capitalize">{leader.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-xs font-semibold text-slate-500 w-16">Gender:</span>
                        <span className="text-xs text-slate-700 capitalize">{leader.gender}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-xs font-semibold text-slate-500 w-16">Place:</span>
                        <span className="text-xs text-slate-700 capitalize">{leader.place}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-xs font-semibold text-slate-500 w-16">Type:</span>
                        <span className="text-xs text-indigo-600 font-bold capitalize">{leader.type}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-xs font-semibold text-slate-500 w-16">Status:</span>
                        <span className="text-xs text-slate-700 capitalize">{leader.status}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ))}
            {filteredLeaders.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-sm bg-white rounded-xl border border-dashed border-slate-300">
                No leaders found matching your criteria.
              </div>
            )}
          </div>
          <div className="text-xs text-slate-400 px-2">
            Showing {filteredLeaders.length} of {leaders.length} total leaders
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderList;
