import React, { useState, useRef, useEffect } from 'react';
import type { Leader } from '../../../types';
import { leaderAPI } from '../api/LeaderData';
import { useAuth } from '../../../owner/context/AuthContext';
import { fetchPermissionData, type PermissionData } from '../permission';

interface LeaderListCompoundProps {
  onLeaderSelect: (leader: Leader | null) => void;
  initialLeaderId?: number;
  availableLeaders?: Leader[];
  excludeIds?: number[];
}

const LeaderListCompound: React.FC<LeaderListCompoundProps> = ({
  onLeaderSelect,
  initialLeaderId,
  availableLeaders,
  excludeIds,
}) => {
  // --- Get auth context ---
  const { ownerEmail } = useAuth();

  // --- State ---
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(false);
  const [permissionData, setPermissionData] = useState<PermissionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedLeader, setSelectedLeader] = useState<Leader | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [idFilter, setIdFilter] = useState('');
  const [placeFilter, setPlaceFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isFollowingFilter, setIsFollowingFilter] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // --- Helpers ---
  const typeLabels: Record<string, string> = {
    leader1: 'Leader 1',
    leader2: 'Leader 2',
    guest: 'Guest',
    participant: 'Participant',
    participants: 'Participant',
  };

  const formatType = (type: string) => typeLabels[type?.toLowerCase()] || type;
  const formatFollow = (follow: string) => {
    if (!follow || follow === 'no') return 'No';
    return follow.charAt(0).toUpperCase() + follow.slice(1);
  };

  // --- Fetch Leaders ---
  useEffect(() => {
    const fetchLeaders = async () => {
      // If availableLeaders is provided, use it instead of fetching
      if (availableLeaders) {
        setLeaders(availableLeaders);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await leaderAPI.getAll();
        setLeaders(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch leaders');
        console.error('Error fetching leaders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaders();
  }, [ownerEmail, availableLeaders]);

  // Fetch Permissions
  useEffect(() => {
    const getPermissions = async () => {
      try {
        const data = await fetchPermissionData();
        setPermissionData(data);
      } catch (err) {
        console.error('Error fetching permissions in LeaderListCompound:', err);
      }
    };
    getPermissions();
  }, []);

  // --- Effects ---
  useEffect(() => {
    if (initialLeaderId !== undefined && leaders.length > 0) {
      const initialLeader = leaders.find(l => l.id === initialLeaderId) || null;
      setSelectedLeader(initialLeader);
    }
  }, [initialLeaderId, leaders]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isDropdownOpen]);

  // --- Logic ---
  const filteredLeaders = leaders.filter(leader => {
    const matchesName = (leader.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlace = placeFilter === '' || (leader.place || '').toLowerCase().includes(placeFilter.toLowerCase());
    const matchesType = typeFilter === '' || leader.type?.toLowerCase() === typeFilter.toLowerCase();
    const matchesId = idFilter === '' || leader.id?.toString().includes(idFilter);
    const matchesFollowing = isFollowingFilter === '' ||
      (isFollowingFilter === 'no' ? leader.isFollowing === 'no' : leader.isFollowing?.toUpperCase() === isFollowingFilter.toUpperCase());
    const isExcluded = excludeIds?.includes(leader.id);

    return matchesName && matchesPlace && matchesType && matchesId && matchesFollowing && !isExcluded;
  });

  const handleLeaderSelect = (leader: Leader) => {
    setSelectedLeader(leader);
    onLeaderSelect(leader);
    setIsDropdownOpen(false);
    resetFilters();
  };

  const resetFilters = () => {
    setSearchTerm('');
    setIdFilter('');
    setPlaceFilter('');
    setTypeFilter('');
    setIsFollowingFilter('');
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLeader(null);
    onLeaderSelect(null);
    resetFilters();
  };

  const formatName = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="relative w-80" ref={dropdownRef}>
      {/* Selected View */}
      {selectedLeader ? (
        <div className="flex items-center justify-between p-2 bg-indigo-50 border border-indigo-200 rounded-md shadow-sm dark:bg-gray-700 dark:border-indigo-900">
          <div className="flex items-center">
            <div className="bg-indigo-600 text-white rounded-full p-1.5 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3.005 3.005 0 013.75-2.906z" />
              </svg>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-tight">
                {formatType(selectedLeader.type)}
              </span>
              <span className="font-medium text-gray-800 dark:text-gray-200 text-sm truncate">
                {formatName(selectedLeader.name)} (ID: {selectedLeader.id})
              </span>
            </div>
          </div>
          <button onClick={clearSelection} className="text-gray-400 hover:text-red-500 transition-colors ml-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      ) : (
        <div
          className="p-2 bg-white border border-gray-300 rounded-md shadow-sm cursor-pointer hover:border-indigo-400 transition-colors dark:bg-gray-800 dark:border-gray-600 flex justify-between items-center"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <span className="text-gray-500 text-sm">Select a Leader</span>
          <svg className={`h-4 w-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg overflow-hidden dark:bg-gray-800 dark:border-gray-600">
          <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <input
              ref={searchInputRef}
              type="text"
              className="block w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Advanced Filters */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase">ID</label>
              <input
                type="text"
                className="mt-1 block w-full px-2 py-1 text-xs border rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="ID"
                value={idFilter}
                onChange={(e) => setIdFilter(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase">Following</label>
              <select
                className="mt-1 block w-full px-2 py-1 text-xs border rounded-md dark:bg-gray-700 dark:text-white"
                value={isFollowingFilter}
                onChange={(e) => setIsFollowingFilter(e.target.value)}
                disabled={loading}
              >
                <option value="">All</option>
                {permissionData?.groups?.map((group) => (
                  <option key={group} value={group.toLowerCase()}>
                    {group}
                  </option>
                ))}
                <option value="no">No</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase">Type</label>
              <select
                className="mt-1 block w-full px-2 py-1 text-xs border rounded-md dark:bg-gray-700 dark:text-white"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                disabled={loading}
              >
                <option value="">All</option>
                <option value="leader1">Leader 1</option>
                <option value="leader2">Leader 2</option>
                <option value="guest">Guest</option>
                <option value="participants">Participant</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase">Place</label>
              <input
                type="text"
                className="mt-1 block w-full px-2 py-1 text-xs border rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="City"
                value={placeFilter}
                onChange={(e) => setPlaceFilter(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Results List */}
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="px-3 py-4 text-gray-400 text-center text-sm">
                Loading leaders...
              </div>
            ) : error ? (
              <div className="px-3 py-4 text-red-400 text-center text-sm">
                {error}
              </div>
            ) : filteredLeaders.length > 0 ? (
              filteredLeaders.map((leader) => (
                <div
                  key={leader.id}
                  className="px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900 cursor-pointer transition-colors flex items-center border-b last:border-0 dark:border-gray-700"
                  onClick={() => handleLeaderSelect(leader)}
                >
                  <div className="bg-indigo-100 text-indigo-700 rounded-full p-1 mr-2 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                    </svg>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-800 font-medium dark:text-gray-200 text-sm truncate">
                      {formatName(leader.name)}
                    </span>
                    <span className="text-gray-500 text-[11px] dark:text-gray-400">
                      ID: {leader.id} | {formatType(leader.type)} | Follow: {formatFollow(leader.isFollowing)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-3 py-4 text-gray-400 text-center text-sm italic">
                No matching leaders found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderListCompound;
