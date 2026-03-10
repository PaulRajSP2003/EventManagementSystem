// src/user/pages/RoomDetails.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  FiArrowLeft,
  FiUsers,
  FiUser,
  FiSearch,
  FiAlertTriangle,
  FiHome,
  FiKey,
  FiUserCheck,
  FiFilter,
  FiChevronDown,
  FiChevronUp,
  FiDownload,
  FiLoader,
} from 'react-icons/fi';

import { studentAPI } from '../api/StudentData';
import { leaderAPI } from '../api/LeaderData';
import type { Student, Leader, Room, StayerInfo, RoomData } from '../../../types';
import { fetchRoomData, downloadRoomCSV } from '../api/RoomData';
import RoomKeyHandler from './compounds/RoomKeyHandler';
import RoomLeaderAssign from './compounds/RoomLeaderAssign';
import { PAGE_PERMISSIONS, canAccess, isAdminOrCoAdmin, fetchPermissionData, type PermissionData } from '../permission';
import AccessAlert from '../components/AccessAlert';

// Types
type FloorKeys = keyof Omit<RoomData['male'], 'waitingList'>;
type ActiveFloorState = 'all' | 'waiting' | 'with_leader_list' | FloorKeys;

const KEY_TAB = 'key';
const LEADER_ASSIGN_TAB = 'room_leader';
const WITH_LEADER_LIST_TAB = 'with_leader_list';
const WITH_LEADER_IN_ROOM_TAB = 'with_leader_in_room';

// Skeleton Component (unchanged)
const RoomSkeleton = () => (
  <div className="max-w-6xl mx-auto px-4 mt-8 space-y-6">
    <div className="h-16 bg-white rounded-xl border border-slate-200 shadow-sm animate-pulse">
      <div className="p-4">
        <div className="flex items-center gap-4">
          <div className="h-10 flex-1 bg-slate-200 rounded-lg"></div>
          <div className="h-10 w-24 bg-slate-200 rounded-lg"></div>
        </div>
      </div>
    </div>

    <div className="h-14 bg-white rounded-xl border border-slate-200 shadow-sm animate-pulse">
      <div className="p-4">
        <div className="flex gap-2">
          <div className="h-8 w-24 bg-slate-200 rounded-lg"></div>
          <div className="h-8 w-24 bg-slate-200 rounded-lg"></div>
          <div className="h-8 w-24 bg-slate-200 rounded-lg"></div>
          <div className="h-8 w-32 bg-slate-200 rounded-lg"></div>
        </div>
      </div>
    </div>

    <div className="h-28 bg-white rounded-xl border border-slate-200 shadow-sm animate-pulse">
      <div className="p-4">
        <div className="h-4 w-32 bg-slate-200 rounded mb-3"></div>
        <div className="flex flex-wrap gap-2">
          <div className="h-10 w-16 bg-slate-200 rounded-lg"></div>
          <div className="h-10 w-16 bg-slate-200 rounded-lg"></div>
          <div className="h-10 w-16 bg-slate-200 rounded-lg"></div>
          <div className="h-10 w-16 bg-slate-200 rounded-lg"></div>
        </div>
      </div>
    </div>

    <div className="h-28 bg-white rounded-xl border border-slate-200 shadow-sm animate-pulse">
      <div className="p-4">
        <div className="h-4 w-40 bg-slate-200 rounded mb-3"></div>
        <div className="flex flex-wrap gap-2">
          <div className="h-10 w-20 bg-slate-200 rounded-lg"></div>
          <div className="h-10 w-20 bg-slate-200 rounded-lg"></div>
          <div className="h-10 w-20 bg-slate-200 rounded-lg"></div>
          <div className="h-10 w-24 bg-slate-200 rounded-lg"></div>
        </div>
      </div>
    </div>

    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-pulse">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-slate-200 rounded-lg"></div>
              <div>
                <div className="h-6 w-40 bg-slate-200 rounded mb-2"></div>
                <div className="h-4 w-32 bg-slate-200 rounded"></div>
              </div>
            </div>
            <div className="h-8 w-24 bg-slate-200 rounded"></div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-32 bg-slate-300 rounded"></div>
                  <div className="h-6 w-8 bg-slate-300 rounded-full"></div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <div className="h-4 w-40 bg-slate-300 rounded mb-2"></div>
                      <div className="h-3 w-32 bg-slate-300 rounded"></div>
                    </div>
                    <div className="h-8 w-16 bg-slate-300 rounded-lg"></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-32 bg-slate-300 rounded"></div>
                  <div className="h-6 w-8 bg-slate-300 rounded-full"></div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <div className="h-4 w-40 bg-slate-300 rounded mb-2"></div>
                      <div className="h-3 w-32 bg-slate-300 rounded"></div>
                    </div>
                    <div className="h-8 w-16 bg-slate-300 rounded-lg"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const RoomDetails: React.FC = () => {
  const [downloadingRoom, setDownloadingRoom] = useState(false);
  const handleDownloadRoom = async () => {
    setDownloadingRoom(true);
    try {
      await downloadRoomCSV();
    } catch (error: any) {
      alert(error.message || 'Failed to download room data');
    } finally {
      setDownloadingRoom(false);
    }
  };
  const [permissionData, setPermissionData] = useState<PermissionData | null>(null);
  const [permissionLoading, setPermissionLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Permission checks using ONLY permissionData
  const hasViewAccess = () => {
    if (!permissionData || accessDenied) return false;
    return canAccess(permissionData, PAGE_PERMISSIONS.VIEW_ROOM);
  };

  const canHandleKeys = () => {
    if (!permissionData || accessDenied) return false;
    return canAccess(permissionData, PAGE_PERMISSIONS.KEY_HANDING);
  };

  const canAssignLeader = () => {
    if (!permissionData || accessDenied) return false;
    return canAccess(permissionData, PAGE_PERMISSIONS.ROOM_LEADER_ASSIGN);
  };

  const isAdmin = () => {
    if (!permissionData || accessDenied) return false;
    return isAdminOrCoAdmin(permissionData);
  };

  const getLeaderById = (id: number, leaders: Leader[]) => leaders.find((l) => l.id === id);
  const getStudentById = (id: number, students: Student[]) => students.find((s) => s.id === id);

  const { gender, roomName, subGroup } = useParams<{
    gender: 'male' | 'female';
    roomName?: string;
    subGroup?: string;
  }>();

  const navigate = useNavigate();

  const [activeFloor, setActiveFloor] = useState<ActiveFloorState>('all');
  const [activeSubGroup, setActiveSubGroup] = useState<string>('all');
  const [activeRoom, setActiveRoom] = useState<string>('all');
  const [showKeyView, setShowKeyView] = useState(false);
  const [showLeaderAssignView, setShowLeaderAssignView] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [students, setStudents] = useState<Student[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  // Add this state near your other useState declarations
  const [showAllWaitingLeaders, setShowAllWaitingLeaders] = useState(false);
  const [showAllWaitingStudents, setShowAllWaitingStudents] = useState(false);

  // Fetch permission data on component mount
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        setPermissionLoading(true);
        const data = await fetchPermissionData();
        setPermissionData(data);

        // Check if user has VIEW_ROOM permission
        if (!canAccess(data, PAGE_PERMISSIONS.VIEW_ROOM)) {
          setAccessDenied(true);
          setErrorMessage("You don't have permission to view room details");
        }
      } catch (error: any) {
        console.error('Failed to load permissions:', error);
        setPermissionData(null);
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

  useEffect(() => {
    const fetchData = async () => {
      if (!hasViewAccess()) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fetch students and leaders concurrently (cookies will be used for auth)
        const [studentsData, leadersData, roomData] = await Promise.all([
          studentAPI.getStudents(),
          leaderAPI.getAll(),
          fetchRoomData(),
        ]);

        setStudents(studentsData);
        setLeaders(leadersData);
        setRoomData(roomData);
      } catch (error) {
        console.error('Failed to fetch data:', error);

        // Check if it's a permission error
        const errorMsg = error instanceof Error ? error.message : 'Failed to load data';
        if (errorMsg.toLowerCase().includes('forbidden') ||
          errorMsg.toLowerCase().includes('unauthorized')) {
          setAccessDenied(true);
          setErrorMessage(errorMsg);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [permissionData]);

  useEffect(() => {
    if (roomName) {
      setActiveRoom(decodeURIComponent(roomName));
    }
    if (subGroup) {
      const decodedSub = decodeURIComponent(subGroup);
      setActiveSubGroup(decodedSub);
      setShowKeyView(decodedSub === KEY_TAB);
      setShowLeaderAssignView(decodedSub === LEADER_ASSIGN_TAB);
    }
  }, [roomName, subGroup]);

  // Open Waiting List when route or query requests it
  const location = useLocation();
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const view = params.get('view');
      if (location.pathname.includes('/waiting_list') || view === 'waiting') {
        setActiveFloor('waiting');
        setActiveSubGroup('all');
        setActiveRoom('all');
        // clean query param if present
        if (view === 'waiting') {
          navigate(location.pathname, { replace: true });
        }
      }
    } catch (err) {
    }
  }, [location.pathname, location.search]);

  const getLeaderDetails = (id: number) => leaders.find((l) => l.id === id);
  const getStudentDetails = (id: number) => students.find((s) => s.id === id);

  const genderData = roomData && gender ? roomData[gender] : null;
  // Use parentalStyers from API data if available
  const parentalStayers: any[] = roomData?.parentalStyers || [];

  const floorKeys = genderData?.floors ? (Object.keys(genderData.floors) as FloorKeys[]) : [];

  const allFloorRooms = floorKeys.flatMap((key) => genderData?.floors[key] || []);

  useEffect(() => {
    if (genderData && activeFloor !== 'waiting' && !roomName) {
      const allRoomNames = getAllRoomNames();
      if (allRoomNames.length > 0) {
        setActiveRoom(allRoomNames[0] as string);
      }
    }
  }, [genderData, activeFloor, roomName]);

  const resetUrl = () => {
    if (roomName || subGroup) {
      navigate(`/user/room/${gender}`, { replace: true });
    }
  };

  const hasNoLeaders = (room: Room): boolean => room.stayers.leaderIds.length === 0;

  const getFilteredRooms = () => {
    if (!genderData || activeFloor === 'waiting') return [];

    let rooms: Room[] = activeFloor === 'all' ? allFloorRooms : genderData.floors[activeFloor] || [];

    return rooms.filter((room) => {
      if (activeRoom !== 'all' && room.roomName !== activeRoom) return false;
      if (
        activeSubGroup !== 'all' &&
        activeSubGroup !== KEY_TAB &&
        activeSubGroup !== LEADER_ASSIGN_TAB &&
        activeSubGroup !== WITH_LEADER_IN_ROOM_TAB &&
        !room.subGroups.includes(activeSubGroup)
      ) {
        return false;
      }
      return true;
    });
  };

  const getAllRoomNames = () => {
    if (!genderData || activeFloor === 'waiting') return [];
    const roomsToProcess = activeFloor === 'all' ? allFloorRooms : genderData.floors[activeFloor] || [];
    return [...new Set(roomsToProcess.map((r: Room) => r.roomName))];
  };

  const getAllSubGroups = () => {
    if (!genderData) return [];

    const allSubGroups = new Set<string>();

    if (activeFloor === 'waiting') {
      genderData.waitingList.leaderIds.forEach((s: { sourceSubGroup: string }) => allSubGroups.add(s.sourceSubGroup));
      genderData.waitingList.studentIds.forEach((s: { sourceSubGroup: string }) => allSubGroups.add(s.sourceSubGroup));
    } else {
      getFilteredRooms().forEach((room: Room) => room.subGroups.forEach((sg: string) => allSubGroups.add(sg)));
    }

    const sorted = Array.from(allSubGroups).sort((a, b) => {
      const wa = a === 'Participants' ? 2 : a === 'Guest' ? 1 : 0;
      const wb = b === 'Participants' ? 2 : b === 'Guest' ? 1 : 0;
      return wa !== wb ? wa - wb : a.localeCompare(b);
    });

    if (activeFloor === 'waiting') return ['all', ...sorted];

    return ['all', ...sorted, KEY_TAB, LEADER_ASSIGN_TAB, WITH_LEADER_IN_ROOM_TAB];
  };

  const getFilteredStayers = (stayers: StayerInfo[], type: 'leader' | 'student') => {
    const searchLower = searchTerm.toLowerCase();
    const getter = type === 'leader' ? getLeaderDetails : getStudentDetails;

    return stayers.filter((stayer) => {
      const person = getter(stayer.id);
      if (!person) return false;

      if (
        activeSubGroup !== 'all' &&
        activeSubGroup !== KEY_TAB &&
        activeSubGroup !== LEADER_ASSIGN_TAB &&
        activeSubGroup !== WITH_LEADER_IN_ROOM_TAB &&
        stayer.sourceSubGroup !== activeSubGroup
      ) {
        return false;
      }

      if (searchTerm) {
        return (
          person.name.toLowerCase().includes(searchLower) ||
          String(person.id || '').includes(searchTerm) ||
          (person.place && person.place.toLowerCase().includes(searchLower))
        );
      }
      return true;
    });
  };

  const capitalize = (text: string): string =>
    text.charAt(0).toUpperCase() + text.slice(1);

  // ──────────────────────────────────────────────────────────────
  //  NEW: Render students staying with leader in current room(s)
  // ──────────────────────────────────────────────────────────────
  const renderWithLeaderInRoomView = () => {
    // Get all rooms currently filtered (visible)
    const filteredRooms = getFilteredRooms();

    // Collect all leader IDs from the currently visible rooms
    const visibleLeaderIds = new Set<number>();
    filteredRooms.forEach((room) => {
      (room.stayers.leaderIds || []).forEach((l) => {
        // API may return leaderIds as array of objects with id property or just ids
        if (typeof l === 'object' && l.id !== undefined) {
          visibleLeaderIds.add(l.id);
        } else if (typeof l === 'number') {
          visibleLeaderIds.add(l);
        }
      });
    });

    // Use the correct property from API for parentalStayers: stayingWith or stayingwith
    const studentsWithLeaderHere = (parentalStayers || []).filter((ps: any) => {
      const leaderId = ps.stayingWith ?? ps.stayingwith;
      return visibleLeaderIds.has(leaderId);
    });

    if (!studentsWithLeaderHere.length) {
      return (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FiUserCheck className="mx-auto text-5xl text-slate-200 mb-4" />
          <h3 className="text-lg font-bold text-slate-700 uppercase tracking-tight">No students found</h3>
          <p className="text-slate-400 text-sm mt-1">No matching records in the currently selected rooms.</p>
        </div>
      );
    }

    return (
      <div className="w-full space-y-6 mb-10">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <FiUserCheck className="text-indigo-600 w-5 h-5" />
            <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">
              Students Staying With Leader (In Room)
            </h2>
          </div>
          <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100 shadow-sm">
            {studentsWithLeaderHere.length} TOTAL
          </span>
        </div>

        {/* Grid: 4 columns on large screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {studentsWithLeaderHere.map((item: any, idx: number) => {
            const student = getStudentById(item.studentId, students);
            // Use correct leader id property
            const leaderId = item.stayingWith ?? item.stayingwith;
            const leader = getLeaderById(leaderId, leaders);

            // Capitalize Name (First letter of each word)
            const formattedName = student?.name
              ? student.name.toLowerCase().replace(/\b\w/g, (s: string) => s.toUpperCase())
              : "UNKNOWN STUDENT";

            return (
              <div
                key={`${item.studentId}-${idx}`}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Name and ID Row */}
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <div className="font-bold text-slate-900 text-sm leading-tight">
                      {formattedName}
                    </div>
                    <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                      #{item.studentId}
                    </span>
                  </div>

                  {/* Staying With Context */}
                  <div className="mb-4 p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                      Staying With
                    </p>
                    <p className="text-xs font-bold text-indigo-700 truncate capitalize">
                      {leader ? leader.name.toLowerCase().replace(/\b\w/g, (s) => s.toUpperCase()) : `Leader #${leaderId}`}
                    </p>
                  </div>

                  {/* Tags: UPPERCASE Gender and Place */}
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${student?.gender?.toLowerCase() === "male"
                        ? "border-blue-200 text-blue-700 bg-blue-50"
                        : "border-pink-200 text-pink-700 bg-pink-50"
                        }`}
                    >
                      {student?.gender || "N/A"}
                    </span>
                    <span className="text-[9px] font-black px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded uppercase tracking-tighter truncate max-w-[100px]">
                      {student?.place || "NO PLACE"}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-4">
                  <button
                    onClick={() => navigate(`/user/student/${item.studentId}`)}
                    className="w-full py-2 text-[10px] font-bold text-slate-500 bg-white border border-slate-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 rounded-lg transition-all shadow-sm uppercase tracking-widest"
                  >
                    View Profile
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderRoom = (room: Room) => {
    // use parentalStayers directly

    const filteredLeaders = getFilteredStayers(room.stayers.leaderIds, 'leader');
    const filteredStudents = getFilteredStayers(room.stayers.studentIds, 'student');
    const isSpecialTab = activeSubGroup === 'Participants' || activeSubGroup === 'Guest';

    const currentStrength = filteredLeaders.length + (isSpecialTab ? 0 : filteredStudents.length);
    const isOverfilled = currentStrength > room.roomCapacity;

    return (
      <div key={room.roomId} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`h-12 w-12 rounded-lg flex items-center justify-center shadow-sm ${hasNoLeaders(room) ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'
                  }`}
              >
                <FiHome className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Room {room.roomName}</h2>
                  {hasNoLeaders(room) && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 uppercase">
                      <FiAlertTriangle className="mr-1 w-3 h-3" /> No Leader
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-sm mt-0.5 capitalize">Room Code: {room.roomCode}</p>
              </div>
            </div>

            <div className="text-right">
              <div className={`text-xl font-bold ${isOverfilled ? 'text-red-600' : 'text-indigo-600'}`}>
                {currentStrength} / {room.roomCapacity}
              </div>
              <div className="text-xs text-slate-500 font-medium">Capacity</div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50/30">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Leaders */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-5 py-3 bg-blue-50 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 uppercase tracking-wide">
                  <FiUser className="text-blue-600 w-4 h-4" />
                  Room Leaders
                </h3>
                <span className="bg-blue-100 text-blue-700 text-xs font-black px-2.5 py-1 rounded-full">
                  {filteredLeaders.length}
                </span>
              </div>
              <div className="p-4 space-y-3">
                {filteredLeaders.length === 0 ? (
                  <div className="text-center py-6">
                    <FiUser className="w-8 h-8 mx-auto opacity-20 mb-2" />
                    <p className="text-xs text-slate-400">No leaders assigned</p>
                  </div>
                ) : (
                  filteredLeaders.map((stayer) => {
                    const details = getLeaderDetails(stayer.id);
                    if (!details) return null;
                    return (
                      <div
                        key={`leader-${stayer.id}`}
                        className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all group"
                      >
                        <div>
                          <div className="font-bold text-slate-800 text-sm capitalize">{details.name}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="font-semibold text-blue-600 capitalize">{stayer.sourceSubGroup}</span>
                            <span>•</span>
                            <span>ID: #{details.id || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Replacement button - Only show for admin/co-admin */}
                          {isAdmin() && (
                            <button
                              onClick={() => navigate(`/user/leader/replacement/${details.id}`)}
                              className="text-[10px] font-bold bg-white border border-amber-200 text-amber-700 px-3 py-1.5 rounded-lg hover:bg-amber-600 hover:text-white hover:border-amber-600 transition-all shadow-sm"
                            >
                              Replacement
                            </button>
                          )}

                          <button
                            onClick={() => navigate(`/user/leader/${details.id}`)}
                            className="text-[10px] font-bold bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                          >
                            Profile
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Students */}
            {!isSpecialTab && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-5 py-3 bg-green-50 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 uppercase tracking-wide">
                    <FiUsers className="text-green-600 w-4 h-4" />
                    Room Students
                  </h3>
                  <span className="bg-green-100 text-green-700 text-xs font-black px-2.5 py-1 rounded-full">
                    {filteredStudents.length}
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  {filteredStudents.length === 0 ? (
                    <div className="text-center py-6">
                      <FiUsers className="w-8 h-8 mx-auto opacity-20 mb-2" />
                      <p className="text-xs text-slate-400">No students assigned</p>
                    </div>
                  ) : (
                    filteredStudents.map((stayer) => {
                      const details = getStudentDetails(stayer.id);
                      if (!details) return null;

                      return (
                        <div
                          key={`student-${stayer.id}`}
                          className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg hover:bg-white hover:border-green-200 hover:shadow-sm transition-all group"
                        >
                          <div>
                            <div className="font-bold text-slate-800 text-sm capitalize">
                              {details.name.charAt(0).toUpperCase() + details.name.slice(1).toLowerCase()}
                            </div>

                            <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                              <span className="font-semibold text-green-600">{stayer.sourceSubGroup}</span>
                              <span>•</span>
                              <span>Age: {details.age}</span>
                              <span>•</span>

                              <span
                                className={`capitalize ${details.status === "registered" || details.status === "absent"
                                  ? "text-red-600"
                                  : "text-slate-700"
                                  }`}
                              >
                                {details.status}
                              </span>
                            </div>
                          </div>

                          {/* ACTION BUTTONS */}
                          <div className="flex items-center gap-2">
                            {/* Replacement button - Only show for admin/co-admin */}
                            {isAdmin() && (
                              <button
                                onClick={() => navigate(`/user/student/replacement/${details.id}`)}
                                className="text-[10px] font-bold bg-white border border-amber-200 text-amber-700 px-3 py-1.5 rounded-lg hover:bg-amber-600 hover:text-white hover:border-amber-600 transition-all shadow-sm"
                              >
                                Replacement
                              </button>
                            )}

                            <button
                              onClick={() => navigate(`/user/student/${details.id}`)}
                              className="text-[10px] font-bold bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                            >
                              Profile
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderWaitingList = () => {
    const filteredLeaders = getFilteredStayers(genderData?.waitingList.leaderIds || [], 'leader');
    const filteredStudents = getFilteredStayers(genderData?.waitingList.studentIds || [], 'student');
    const isSpecialTab = activeSubGroup === 'Participants' || activeSubGroup === 'Guest';

    // Determine how many leaders to show
    const visibleLeaders = showAllWaitingLeaders
      ? filteredLeaders
      : filteredLeaders.slice(0, 5);

    // Determine how many students to show
    const visibleStudents = showAllWaitingStudents
      ? filteredStudents
      : filteredStudents.slice(0, 5);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Waiting List</h2>
              <p className="text-slate-500 text-sm mt-1">People waiting for room assignment</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-lg font-bold text-amber-600">
                  {filteredLeaders.length + filteredStudents.length}
                </div>
                <div className="text-xs text-slate-500">Total Waiting</div>
              </div>
              <div className="h-10 w-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                <FiAlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Leaders Column */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 bg-blue-50 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <FiUser className="text-blue-600" />
                  Waiting Leaders
                </h3>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                  {filteredLeaders.length}
                </span>
              </div>
              <div className="p-5">
                {filteredLeaders.length === 0 ? (
                  <div className="text-center py-8">
                    <FiUser className="w-10 h-10 mx-auto opacity-30" />
                    <p className="text-slate-500">No leaders in waiting list</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {visibleLeaders.map((stayer) => {
                      const details = getLeaderDetails(stayer.id);
                      if (!details) return null;
                      return (
                        <div
                          key={`leader-${stayer.id}`}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <div>
                            <div className="font-medium text-slate-800 capitalize">
                              {details.name.charAt(0).toUpperCase() + details.name.slice(1).toLowerCase()}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                              <span>ID: #{details.id}</span>
                              <span>•</span>
                              <span>{stayer.sourceSubGroup}</span>
                            </div>
                          </div>
                          {/* Assign button - Only show for admin/co-admin */}
                          {isAdmin() && (
                            <button
                              onClick={() => navigate(`/user/leader/replacement/${details.id}`)}
                              className="text-xs font-bold bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                              Assign
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {/* View All / Show Less toggle */}
                    {filteredLeaders.length > 5 && (
                      <div className="text-center pt-2">
                        <button
                          onClick={() => setShowAllWaitingLeaders(!showAllWaitingLeaders)}
                          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
                        >
                          {showAllWaitingLeaders ? (
                            <>Show less <FiChevronUp className="w-4 h-4" /></>
                          ) : (
                            <>View all {filteredLeaders.length} leaders <FiChevronDown className="w-4 h-4" /></>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Students Column */}
            {!isSpecialTab && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 bg-green-50 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <FiUsers className="text-green-600" />
                    Waiting Students
                  </h3>
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                    {filteredStudents.length}
                  </span>
                </div>
                <div className="p-5">
                  {filteredStudents.length === 0 ? (
                    <div className="text-center py-8">
                      <FiUsers className="w-10 h-10 mx-auto opacity-30" />
                      <p className="text-slate-500">No students in waiting list</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {visibleStudents.map((stayer) => {
                        const details = getStudentDetails(stayer.id);
                        if (!details) return null;
                        return (
                          <div
                            key={`student-${stayer.id}`}
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            <div>
                              <div className="font-medium text-slate-800 capitalize">
                                {details.name.charAt(0).toUpperCase() + details.name.slice(1).toLowerCase()}
                              </div>
                              <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                <span>ID: #{details.id}</span>
                                <span>•</span>
                                <span>Age: {details.age}</span>
                                <span>•</span>
                                <span>{stayer.sourceSubGroup}</span>
                              </div>
                            </div>
                            {/* Assign button - Only show for admin/co-admin */}
                            {isAdmin() && (
                              <button
                                onClick={() => navigate(`/user/student/replacement/${details.id}`)}
                                className="text-xs font-bold bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
                              >
                                Assign
                              </button>
                            )}
                          </div>
                        );
                      })}

                      {/* View All / Show Less toggle */}
                      {filteredStudents.length > 5 && (
                        <div className="text-center pt-2">
                          <button
                            onClick={() => setShowAllWaitingStudents(!showAllWaitingStudents)}
                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
                          >
                            {showAllWaitingStudents ? (
                              <>Show less <FiChevronUp className="w-4 h-4" /></>
                            ) : (
                              <>View all {filteredStudents.length} students <FiChevronDown className="w-4 h-4" /></>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderWithLeaderList = () => {
    if (!parentalStayers.length) return null;

    // Fix: Use correct property name and fallback for undefined
    const leaderMap = new Map<number, typeof parentalStayers>();
    parentalStayers.forEach((item: any) => {
      // Support both 'stayingWith' and 'stayingwith' (case-insensitive)
      const leaderId = item.stayingWith ?? item.stayingwith;
      if (leaderId === undefined || leaderId === null) return;
      if (!leaderMap.has(leaderId)) leaderMap.set(leaderId, []);
      leaderMap.get(leaderId)!.push(item);
    });

    return (
      <div className="w-full space-y-6 mb-10">
        {/* Main Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <FiUserCheck className="text-indigo-600 w-5 h-5" />
            <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">With Leader List</h2>
          </div>
          <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded">
            {parentalStayers.length} TOTAL STUDENTS
          </span>
        </div>

        {/* Grid: Leader Boxes Side-by-Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...leaderMap.entries()].map(([leaderId, items]) => {
            const leader = getLeaderById(leaderId, leaders);

            return (
              <div
                key={`leader-box-${leaderId}`}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col"
              >
                {/* Leader Header Box */}
                <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
                        {leader ? leader.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-sm capitalize">
                            {leader ? leader.name : `Leader #${leaderId}`}
                          </h3>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm capitalize ${leader?.gender === 'male' ? 'bg-blue-500 text-white' : 'bg-pink-500 text-white'}`}>
                            {leader?.gender || 'N/A'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5 uppercase tracking-wide">
                          Location: <span className="text-indigo-600">{leader?.place || 'Unknown'}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Assigned</span>
                      <span className="text-sm font-black text-slate-700">{items.length}</span>
                    </div>
                  </div>
                </div>

                {/* Student Grid (Side-by-Side Cards) */}
                <div className="p-4 bg-white grow">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {items.map((item: any, idx: number) => {
                      const student = getStudentById(item.studentId, students);
                      return (
                        <div
                          key={`${item.studentId}-${idx}`}
                          className="p-3 border border-slate-100 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all bg-white group flex flex-col justify-between"
                        >
                          <div className="mb-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="font-bold text-slate-800 text-xs truncate capitalize">
                                {student?.name || "Unknown Student"}
                              </div>
                              <span className="text-[10px] font-mono font-semibold text-slate-400">
                                #{item.studentId}
                              </span>
                            </div>
                            {/* Student Tags: Gender and Place */}
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${student?.gender?.toLowerCase() === 'male'
                                ? 'border-blue-200 text-blue-600 bg-blue-50'
                                : 'border-pink-200 text-pink-600 bg-pink-50'
                                }`}>
                                {student?.gender || 'N/A'}
                              </span>
                              <span className="text-[9px] font-medium px-1.5 py-0.5 bg-slate-50 text-slate-500 border border-slate-200 rounded truncate max-w-[80px] uppercase">
                                {student?.place || 'No Location'}
                              </span>
                            </div>
                          </div>

                          {/* View Student Button */}
                          <button
                            onClick={() => navigate(`/user/student/${item.studentId}`)}
                            className="w-full py-1.5 text-[10px] font-bold text-slate-600 bg-white border border-slate-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 rounded transition-all shadow-sm uppercase tracking-tighter mb-2"
                          >
                            View Profile
                          </button>

                          {/* Replacement Button - Only show for admin/co-admin */}
                          {isAdmin() && (
                            <button
                              onClick={() => navigate(`/user/student/replacement/${item.studentId}`)}
                              className="w-full py-1.5 text-[10px] font-bold text-slate-600 bg-white border border-slate-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 rounded transition-all shadow-sm uppercase tracking-tighter"
                            >
                              Replacement
                            </button>
                          )}
                        </div>
                      );

                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Show loading while permissions are loading
  if (permissionLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
        <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-3 border-b border-gray-100">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate('/user/dashboard')}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium"
              >
                <FiArrowLeft /> Back
              </button>
              <div className="h-4 w-[1px] bg-gray-300 hidden sm:block"></div>
              <h1 className="text-lg font-bold text-slate-800 hidden sm:block capitalize">
                {gender} Room Management
              </h1>
            </div>
          </div>
        </div>
        <RoomSkeleton />
      </div>
    );
  }

  // Show access denied if user doesn't have VIEW_ROOM permission
  if (accessDenied || !hasViewAccess()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <AccessAlert message={errorMessage || "You do not have permission to view room details."} />
      </div>
    );
  }

  if (!genderData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
        <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-3 border-b border-gray-100">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate('/user/dashboard')}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium"
              >
                <FiArrowLeft /> Back
              </button>
              <div className="h-4 w-[1px] bg-gray-300 hidden sm:block"></div>
              <h1 className="text-lg font-bold text-slate-800 hidden sm:block">Room Management</h1>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 mt-8 text-center py-12">
          <p className="text-slate-500">No data available for this gender.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-3 border-b border-gray-100">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium px-3 py-2 rounded-lg"
            >
              <FiArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="h-5 w-[1px] bg-gray-300 hidden sm:block"></div>
            <h1 className="text-lg font-bold text-slate-800 hidden sm:block capitalize">
              {gender} Room Management
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Download Room Data button for admin/coadmin only */}
            {isAdminOrCoAdmin(permissionData) && (
              <button
                onClick={handleDownloadRoom}
                disabled={downloadingRoom}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium shadow-sm ${downloadingRoom
                    ? 'bg-green-400 text-white cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 hover:shadow'
                  }`}
                title="Download room data as CSV"
              >
                {downloadingRoom ? (
                  <>
                    <FiLoader className="animate-spin w-4 h-4" /> Downloading...
                  </>
                ) : (
                  <>
                    <FiDownload className="w-4 h-4" /> Export Room Data
                  </>
                )}
              </button>
            )}

            {/* Key Management and Room Leader buttons - only show when conditions are met */}
            {!showKeyView && !showLeaderAssignView && activeFloor !== 'waiting' && activeFloor !== WITH_LEADER_LIST_TAB && (
              <div className="flex items-center gap-2">
                {/* Key Management button - only show if user has KEY_HANDING permission */}
                {canHandleKeys() && (
                  <button
                    onClick={() => {
                      navigate(`/user/room/${gender}/${encodeURIComponent(activeRoom)}/${KEY_TAB}`);
                      setActiveSubGroup(KEY_TAB);
                      setShowKeyView(true);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all border ${activeSubGroup === KEY_TAB
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400"
                      }`}
                  >
                    <FiKey className={`w-4 h-4 ${activeSubGroup === KEY_TAB ? 'text-indigo-600' : 'text-slate-500'}`} />
                    Key Management
                  </button>
                )}

                {/* Room Leader button - only show if user has ROOM_LEADER_ASSIGN permission */}
                {canAssignLeader() && (
                  <button
                    onClick={() => {
                      navigate(`/user/room/${gender}/${encodeURIComponent(activeRoom)}/${LEADER_ASSIGN_TAB}`);
                      setActiveSubGroup(LEADER_ASSIGN_TAB);
                      setShowLeaderAssignView(true);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all border ${activeSubGroup === LEADER_ASSIGN_TAB
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400"
                      }`}
                  >
                    <FiUserCheck className={`w-4 h-4 ${activeSubGroup === LEADER_ASSIGN_TAB ? 'text-indigo-600' : 'text-slate-500'}`} />
                    Room Leader
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8 space-y-6">
        {/* Single Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-50 bg-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by name, ID, or place..."
                  className="pl-10 pr-4 py-2 w-full border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${showFilters
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
              >
                <FiFilter /> Filters {showFilters ? <FiChevronUp /> : <FiChevronDown />}
              </button>
            </div>
          </div>
        </div>

        {/* Floor Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4">
            <div className="flex overflow-x-auto gap-2">
              <button
                onClick={() => {
                  setActiveFloor('all');
                  setActiveSubGroup('all');
                  setShowKeyView(false);
                  setShowLeaderAssignView(false);
                  navigate(`/user/room/${gender}`);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeFloor === 'all'
                  ? 'bg-slate-100 text-black border border-slate-200'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                  }`}
              >
                All Floors
              </button>

              {floorKeys.map((floor) => (
                <button
                  key={floor}
                  onClick={() => {
                    setActiveFloor(floor);
                    setActiveSubGroup('all');
                    setShowKeyView(false);
                    setShowLeaderAssignView(false);
                    navigate(`/user/room/${gender}`);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeFloor === floor
                    ? 'bg-slate-100 text-black border border-slate-200'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                    }`}
                >
                  Floor {floor.replace('floor', 'Floor ')}
                </button>
              ))}

              <button
                onClick={() => {
                  setActiveFloor('waiting');
                  setActiveSubGroup('all');
                  setActiveRoom('all');
                  setShowKeyView(false);
                  setShowLeaderAssignView(false);
                  navigate(`/user/room/${gender}`);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeFloor === 'waiting'
                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                  }`}
              >
                Waiting List ({genderData.waitingList.waitingCount})
              </button>

              <button
                onClick={() => {
                  setActiveFloor(WITH_LEADER_LIST_TAB);
                  setActiveSubGroup('all');
                  setActiveRoom('all');
                  setShowKeyView(false);
                  setShowLeaderAssignView(false);
                  navigate(`/user/room/${gender}`);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeFloor === WITH_LEADER_LIST_TAB
                  ? 'bg-slate-100 text-black border border-slate-200'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                  }`}
              >
                With Leader List ({parentalStayers.length})
              </button>
            </div>
          </div>
        </div>

        {/* Room Selection */}
        {activeFloor !== 'waiting' && activeFloor !== WITH_LEADER_LIST_TAB && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4">
              <h2 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Select Room</h2>
              <div className="flex flex-wrap gap-2">
                {getAllRoomNames().map((roomNameTab) => {
                  // Find all rooms with this roomNameTab
                  const roomsWithName = allFloorRooms.filter((r: Room) => r.roomName === (roomNameTab as string));
                  return roomsWithName.map((room) => {
                    const noLeaders = hasNoLeaders(room);
                    return (
                      <button
                        key={`${room.roomName}-${room.roomId}`}
                        onClick={() => {
                          setActiveRoom(room.roomName);
                          setActiveSubGroup('all');
                          setShowKeyView(false);
                          setShowLeaderAssignView(false);
                          navigate(`/user/room/${gender}/${encodeURIComponent(room.roomName)}`);
                        }}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeRoom === room.roomName
                          ? noLeaders
                            ? "bg-red-100 text-red-600 border border-red-200"
                            : "bg-slate-100 text-black border border-slate-200"
                          : noLeaders
                            ? "bg-white text-red-600 hover:bg-red-50 border border-red-200"
                            : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                          }`}
                      >
                        <FiHome className="w-4 h-4" />
                        {room.roomName.replace('Room ', '')}
                        {noLeaders && <FiAlertTriangle className="w-3 h-3" />}
                      </button>
                    );
                  });
                })}
              </div>
            </div>
          </div>
        )}

        {/* Sub Group / Special Filters */}
        {activeFloor !== WITH_LEADER_LIST_TAB && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4">
              <h2 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">
                Filter by Sub Group / View
              </h2>

              <div className="flex flex-wrap gap-2">
                {getAllSubGroups().map((subGroupTab) => {
                  const isActive = activeSubGroup === subGroupTab;

                  // Determine label
                  let label = "";
                  if (subGroupTab === "all") label = "All Groups";
                  else if (subGroupTab === KEY_TAB) label = "Key Management";
                  else if (subGroupTab === LEADER_ASSIGN_TAB) label = "Room Leader";
                  else if (subGroupTab === WITH_LEADER_IN_ROOM_TAB) label = "With Leader";
                  else label = capitalize(subGroupTab);

                  return (
                    <button
                      key={subGroupTab}
                      onClick={() => {
                        setActiveSubGroup(subGroupTab);
                        setShowKeyView(subGroupTab === KEY_TAB);
                        setShowLeaderAssignView(subGroupTab === LEADER_ASSIGN_TAB);
                        if (activeRoom && subGroupTab !== 'all') {
                          navigate(`/user/room/${gender}/${encodeURIComponent(activeRoom)}/${subGroupTab}`);
                        } else if (activeRoom) {
                          navigate(`/user/room/${gender}/${encodeURIComponent(activeRoom)}`);
                        } else {
                          navigate(`/user/room/${gender}`);
                        }
                      }}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${isActive
                        ? "bg-slate-100 text-black border border-slate-200"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                        }`}
                    >
                      {/* Optional icons */}
                      {subGroupTab === KEY_TAB && <FiKey className="w-4 h-4" />}
                      {subGroupTab === LEADER_ASSIGN_TAB && <FiUserCheck className="w-4 h-4" />}
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div>
          {showKeyView ? (
            <RoomKeyHandler
              roomName={activeRoom}
              roomId={(() => {
                // Find the room object by activeRoom
                const foundRoom = allFloorRooms.find((r) => r.roomName === activeRoom);
                return foundRoom && foundRoom.roomId !== undefined ? String(foundRoom.roomId) : undefined;
              })()}
            />
          ) : showLeaderAssignView ? (
            <RoomLeaderAssign activeRoomName={activeRoom} gender={gender as 'male' | 'female'} />
          ) : activeFloor === 'waiting' ? (
            renderWaitingList()
          ) : activeFloor === WITH_LEADER_LIST_TAB ? (
            renderWithLeaderList()
          ) : activeSubGroup === WITH_LEADER_IN_ROOM_TAB ? (
            renderWithLeaderInRoomView()
          ) : (
            <>
              {getFilteredRooms().length > 0 ? (
                getFilteredRooms().map(renderRoom)
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                  <div className="text-slate-300 mb-4">
                    <FiHome className="w-16 h-16 mx-auto opacity-30" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">No Rooms Found</h3>
                  <p className="text-slate-500 mb-6">Try adjusting your filters or select a different floor.</p>
                  <button
                    onClick={resetUrl}
                    className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomDetails;