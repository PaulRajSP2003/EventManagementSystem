// src/user/pages/room/compounds/RoomLeaderAssign.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { FiUserCheck, FiShield, FiClock, FiAlertCircle, FiInfo, FiSave, FiCheckCircle, FiLock, FiXCircle } from 'react-icons/fi';
import { fetchRoomData } from '../../api/RoomData';
import type { RoomData } from '../../../../types';
import LeaderListCompound from '../../components/LeaderListCompound';
import type { Leader } from '../../../../types';
import type { mainLeaderData } from '../../../../types';
import { leaderAPI } from '../../api/LeaderData';
import { PAGE_PERMISSIONS, fetchPermissionData, canAccess, isAdminOrCoAdmin, type PermissionData } from '../../permission';

interface RoomLeaderAssignProps {
  activeRoomName: string;
  gender: 'male' | 'female';
}

// API Response interface
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const SkeletonLoader = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 animate-pulse">
      {/* Header Skeleton */}
      <div className="px-8 py-6 bg-indigo-50/50 dark:bg-indigo-900/10 border-b dark:border-gray-700">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="w-full md:w-[400px]">
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-[42px] w-full bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
          <div className="w-full md:w-auto">
            <div className="h-[42px] w-[160px] bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </div>

      {/* Title Skeleton */}
      <div className="px-8 py-5 border-b dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div>
            <div className="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="p-6 border-2 border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                <div className="flex-1">
                  <div className="h-6 w-32 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
            <div className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div>
                      <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </div>
                  <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const RoomLeaderAssign: React.FC<RoomLeaderAssignProps> = ({ activeRoomName, gender }) => {
  const [permissionData, setPermissionData] = useState<PermissionData | null>(null);
  const [permissionLoading, setPermissionLoading] = useState(true);

  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [allLeaders, setAllLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State for save operation
  const [selectedLeaderId, setSelectedLeaderId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Fetch permission data
  useEffect(() => {
    const loadPermissions = async () => {
      setPermissionLoading(true);
      try {
        const data = await fetchPermissionData();
        setPermissionData(data);
      } catch (err) {
        console.error('Failed to load permissions:', err);
        setPermissionData(null);
      } finally {
        setPermissionLoading(false);
      }
    };

    loadPermissions();
  }, []);

  // Check if user has access based on permission data
  const hasActionAccess = useMemo(() => {
    if (!permissionData) return false;
    // Admin and co-admin have access
    if (isAdminOrCoAdmin(permissionData)) return true;
    // Check for specific permission
    return canAccess(permissionData, PAGE_PERMISSIONS.ROOM_LEADER_ASSIGN);
  }, [permissionData]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const fetchAll = async () => {
      try {
        // Fetch room data
        const room = await fetchRoomData().catch(err => {
          throw new Error('Failed to fetch room data: ' + (err.message || err));
        });

        // Fetch leader data
        const leaders = await leaderAPI.getAll().catch(err => {
          throw new Error('Failed to fetch leader data: ' + (err.message || err));
        });

        if (isMounted) {
          setRoomData(room);
          setAllLeaders(leaders);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'An unexpected error occurred');
          setLoading(false);
        }
      }
    };

    if (!permissionLoading) {
      fetchAll();
    }

    return () => { isMounted = false; };
  }, [permissionLoading]);

  const currentRoom = useMemo(() => {
    if (!roomData || !gender || !roomData[gender]) return undefined;
    const genderSpecificData = roomData[gender] as Exclude<RoomData[typeof gender], undefined>;
    if (genderSpecificData.floors) {
      for (const key in genderSpecificData.floors) {
        const room = genderSpecificData.floors[key].find(
          (r: any) => r.roomName === activeRoomName
        );
        if (room) return room;
      }
    }
    return undefined;
  }, [roomData, activeRoomName, gender]);

  // Get room ID from currentRoom
  const roomId = useMemo(() => {
    return currentRoom?.roomId ? parseInt(currentRoom.roomId.toString()) : null;
  }, [currentRoom]);

  // Map leaderIds in currentRoom to full Leader objects from allLeaders
  const availableLeaders = useMemo(() => {
    if (!currentRoom) return [];
    const leaderIds = currentRoom.stayers.leaderIds.map((s: any) => s.id ?? s.leaderId ?? s);
    return allLeaders.filter((l) => leaderIds.includes(l.id));
  }, [currentRoom, allLeaders]);

  const getLeaderDetails = (id: number) => allLeaders.find((l) => l.id === id);

  // mainLeaderId is now mainLeaderData[]
  const mainLeaderArr: mainLeaderData[] = currentRoom?.mainLeaderId || [];
  const currentLeaderObj = mainLeaderArr.length > 0 ? mainLeaderArr[mainLeaderArr.length - 1] : null;
  const currentLeaderId = currentLeaderObj ? currentLeaderObj.leaderId : null;
  const pastLeaderObjs = mainLeaderArr.slice(0, -1);
  const currentLeader = currentLeaderId ? getLeaderDetails(currentLeaderId) : null;

  useEffect(() => {
    setSelectedLeaderId(currentLeaderId);
    setSaveSuccess(false);
    setSaveError(null);
  }, [currentLeaderId]);

  // API function to save main leader
  const saveMainLeader = async (roomId: number, leaderId: number): Promise<ApiResponse<any>> => {
    const url = `https://localhost:7135/api/mainLeader/${roomId}/${leaderId}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to save main leader');
    }

    return await response.json();
  };

  const handleSave = async () => {
    // Permission check inside handler as a safeguard
    if (!hasActionAccess) {
      setSaveError('You do not have permission to change room leaders');
      return;
    }

    if (!selectedLeaderId) {
      setSaveError('Please select a leader first');
      return;
    }

    if (selectedLeaderId === currentLeaderId) {
      setSaveError('This leader is already assigned to this room');
      return;
    }

    if (!roomId) {
      setSaveError('Room ID not found');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const result = await saveMainLeader(roomId, selectedLeaderId);

      if (result.success) {
        setSaveSuccess(true);
        // Refresh room data to show updated leader
        const updatedRoom = await fetchRoomData();
        setRoomData(updatedRoom);

        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError(result.message || 'Failed to save changes');
      }
    } catch (err: any) {
      setSaveError(err.message || 'An error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };

  // Show skeleton while loading
  if (permissionLoading || loading) {
    return <SkeletonLoader />;
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700">
        <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Error Loading Data</h2>
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  if (!currentRoom || activeRoomName === 'all') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700">
        <FiAlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">No Room Selected</h2>
        <p className="text-gray-500">Please select a specific room number to manage leadership.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">

      {/* Header Section with Permissions Control */}
      <div className="px-8 py-6 bg-indigo-50/50 dark:bg-indigo-900/10 border-b dark:border-gray-700">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

          <div className="w-full md:w-[400px]">
            <label className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-2 tracking-widest">
              <FiUserCheck className="w-4 h-4" /> Change Room Leader
            </label>

            <div className="relative w-full h-[42px] group">
              {!hasActionAccess && (
                <div className="pointer-events-none absolute -top-10 left-0 bg-slate-800 text-white text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                  You don't have permission to change room leaders
                  <div className="absolute -bottom-1 left-4 w-2 h-2 bg-slate-800 rotate-45"></div>
                </div>
              )}
              <div className={`transition-all duration-200 ${!hasActionAccess ? "opacity-50 cursor-not-allowed pointer-events-none filter grayscale-[0.5]" : ""}`}>
                <LeaderListCompound
                  initialLeaderId={selectedLeaderId || undefined}
                  availableLeaders={availableLeaders}
                  onLeaderSelect={(leader) => {
                    if (!leader) return;
                    setSelectedLeaderId(leader.id);
                    setSaveSuccess(false);
                    setSaveError(null);
                  }}
                />
              </div>
            </div>
          </div>

          <div className="w-full md:w-auto flex flex-col items-end">
            {/* Error Message Display */}
            {saveError && (
              <div className="mb-2 flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg text-sm">
                <FiXCircle className="w-4 h-4 flex-shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            <button
              onClick={handleSave}
              // Button is disabled if: saving OR same leader selected OR user doesn't have access
              disabled={isSaving || selectedLeaderId === currentLeaderId || !hasActionAccess}
              style={{ minWidth: '160px' }}
              className={`h-[42px] flex items-center justify-center gap-2 px-6 rounded-lg font-bold text-sm transition-all ${saveSuccess
                  ? 'bg-green-500 text-white'
                  : hasActionAccess
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-400'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700'
                }`}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <FiCheckCircle className="w-5 h-5" />
                  <span>Saved</span>
                </>
              ) : !hasActionAccess ? (
                <>
                  <FiLock className="w-5 h-5" />
                  <span>Locked</span>
                </>
              ) : (
                <>
                  <FiSave className="w-5 h-5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>

      <div className="px-8 py-5 border-b dark:border-gray-700 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Room {currentRoom.roomName} Leadership
          </h2>
          <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
            <FiInfo className="w-3 h-3" /> Historical tracking and assignment
          </p>
        </div>
        {roomId && (
          <div className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            Room ID: {roomId}
          </div>
        )}
      </div>

      <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div>
            <h3 className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-widest mb-4">
              <FiShield /> Current Main Leader
            </h3>

            {currentLeader ? (
              <div className="relative p-6 border-2 border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-2xl overflow-hidden">
                <div className="absolute top-0 right-0 p-2">
                  <span className="px-2 py-1 bg-green-500 text-white text-[9px] font-black rounded-bl-lg uppercase">Active</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-200 font-bold text-xl">
                    {currentLeader.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xl font-extrabold text-gray-900 dark:text-white leading-tight capitalize">
                      {currentLeader.name}
                    </p>
                    <p className="text-sm text-gray-500 font-medium capitalize">
                      ID: {currentLeader.id} • {currentLeader.place}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-center">
                <p className="text-gray-400 text-sm italic">No main leader assigned yet</p>
              </div>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
            <p className="text-[11px] text-gray-400 leading-relaxed">
              <strong className="text-gray-500">Control Policy:</strong> You can only assign leaders currently staying in this room. To assign a leader from another room, please re-allocate them via the Floor Plan first.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="flex items-center gap-2 text-gray-500 font-bold text-xs uppercase tracking-widest">
            <FiClock /> Leadership History
          </h3>

          <div className="border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
              <thead className="bg-gray-50/50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-tighter">ID</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Name</th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
                {pastLeaderObjs.length > 0 ? (
                  [...pastLeaderObjs].reverse().map((obj, index) => {
                    const leader = getLeaderDetails(obj.leaderId);
                    return (
                      <tr key={`${obj.leaderId}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group">
                        <td className="px-6 py-4 text-sm text-gray-400 font-mono">#{obj.leaderId}</td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 capitalize">
                            {leader ? leader.name : 'Unknown Leader'}
                          </p>
                          <span className="block text-[10px] text-gray-400">
                            {obj.createdAt ? new Date(obj.createdAt).toLocaleString() : ''}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-[9px] font-black text-gray-300 dark:text-gray-600 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded uppercase">
                            Former
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center">
                      <p className="text-sm text-gray-400 italic">No previous changes found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomLeaderAssign;