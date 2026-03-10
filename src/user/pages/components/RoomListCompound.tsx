import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { Room, RoomData, StayerInfo } from '../../../types';
import { fetchRoomData } from '../api/RoomData';
import {
  FaMars,
  FaVenus,
  FaFilter,
  FaBed,
  FaTriangleExclamation,
  FaRotateLeft,
  FaMagnifyingGlass,
  FaUsers,
} from 'react-icons/fa6';

import { FaSortAmountDown, FaSortAmountUp } from "react-icons/fa";
import { FaSearch } from 'react-icons/fa';

interface RoomListCompoundProps {
  onRoomSelect: (room: Room | null) => void;
  initialRoomId?: string;
  genderFilter?: 'male' | 'female';
  personType?: 'leader' | 'student';
  activeRoomId?: string | number;
}

interface FlattenedRoom extends Room {
  gender: string;
  floor: string;
}

// Virtual Waiting List room
const WAITING_LIST_ROOM: FlattenedRoom = {
  roomId: -1,
  roomCode: 'WAITING',
  roomName: 'Waiting List',
  roomCapacity: 999,
  isFull: false,
  mainLeaderId: [],
  subGroups: [],
  stayers: {
    leaderIds: [],
    studentIds: [],
  },
  gender: 'waiting',
  floor: 'waiting',
};

const RoomListCompound: React.FC<RoomListCompoundProps> = ({
  onRoomSelect,
  initialRoomId,
  genderFilter,
  personType = 'leader',
  activeRoomId,
}) => {
  const [selectedRoom, setSelectedRoom] = useState<FlattenedRoom | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [floorFilter, setFloorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [viewGender, setViewGender] = useState<'male' | 'female' | null>(
    personType === 'leader' && genderFilter ? genderFilter : null
  );
  const [showWaitingList, setShowWaitingList] = useState(true);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // --- Calculations ---
  const getOccupancy = (room: Room) => {
    const leaders = room.stayers?.leaderIds?.length || 0;
    const students = room.stayers?.studentIds?.length || 0;
    return { leaders, students, total: leaders + students };
  };

  const getRoomStats = (room: Room) => {
    const { total } = getOccupancy(room);
    const diff = room.roomCapacity - total;
    return {
      availableCount: diff > 0 ? diff : 0,
      overfilledCount: diff < 0 ? Math.abs(diff) : 0,
      isFull: diff === 0,
      isAvailable: diff > 0,
      isOverfilled: diff < 0,
      percent: (total / room.roomCapacity) * 100
    };
  };

  // --- Reset Function ---
  const handleReset = () => {
    setSearchTerm('');
    setFloorFilter('');
    setStatusFilter('');
    setSortOrder(null);
    if (personType === 'student') {
      setViewGender(null);
    }
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // --- Click Outside Effect ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Room Data State ---
  const [roomData, setRoomData] = useState<RoomData | null>(null);

  useEffect(() => {
    fetchRoomData()
      .then(setRoomData)
      .catch(() => setRoomData(null));
  }, []);

  // --- Data Flattening ---
  const allRooms = useMemo(() => {
    const flattened: FlattenedRoom[] = [];
    
    // Add virtual waiting list room at the beginning
    if (showWaitingList) {
      flattened.push(WAITING_LIST_ROOM);
    }
    
    // Add real rooms if data exists
    if (roomData) {
      (Object.keys(roomData) as Array<keyof RoomData>).forEach((gender) => {
        const genderData = roomData[gender];
        if (genderData && typeof genderData === 'object' && 'floors' in genderData && genderData.floors) {
          Object.keys(genderData.floors).forEach((key) => {
            const rooms = genderData.floors[key];
            (rooms as Room[]).forEach((room: Room) => {
              flattened.push({ ...room, gender, floor: key });
            });
          });
        }
      });
    }
    return flattened;
  }, [roomData, showWaitingList]);

  // --- Available Floors based on Gender ---
  const availableFloors = useMemo(() => {
    if (!roomData || !viewGender || !roomData[viewGender]) return [];
    const genderData = roomData[viewGender];
    const floors = genderData.floors ? Object.keys(genderData.floors) : [];
    return floors.sort((a, b) => parseInt(a) - parseInt(b));
  }, [roomData, viewGender]);

  useEffect(() => {
    if (initialRoomId) {
      const room = allRooms.find(r => r.roomId === Number(initialRoomId));
      if (room) {
        setSelectedRoom(room);
        if (room.gender !== 'waiting') {
          setViewGender(room.gender as 'male' | 'female');
        }
      }
    }
  }, [initialRoomId, allRooms]);

  // --- Filtering & Sorting Logic ---
  const filteredAndSortedRooms = useMemo(() => {
    let result = allRooms.filter(room => {
      if (room.roomId === -1) return true;
      
      if (personType === 'leader' && genderFilter && room.gender !== genderFilter) return false;
      if (viewGender && room.gender !== viewGender) return false;

      const stats = getRoomStats(room);
      const matchesName = room.roomName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFloor = floorFilter === '' || room.floor === floorFilter;

      let matchesStatus = true;
      if (statusFilter === 'available') matchesStatus = stats.isAvailable;
      if (statusFilter === 'full') matchesStatus = stats.isFull;
      if (statusFilter === 'overfilled') matchesStatus = stats.isOverfilled;

      return matchesName && matchesFloor && matchesStatus;
    });

    if (sortOrder) {
      result.sort((a, b) => {
        if (a.roomId === -1) return -1;
        if (b.roomId === -1) return 1;

        const vacancyA =
          a.roomCapacity -
          ((a.stayers?.leaderIds?.length || 0) +
            (a.stayers?.studentIds?.length || 0));

        const vacancyB =
          b.roomCapacity -
          ((b.stayers?.leaderIds?.length || 0) +
            (b.stayers?.studentIds?.length || 0));

        return sortOrder === 'asc'
          ? vacancyA - vacancyB
          : vacancyB - vacancyA;
      });
    }

    return result;
  }, [allRooms, searchTerm, floorFilter, statusFilter, sortOrder, viewGender, personType, genderFilter]);

  const isFilterEnabled = personType === 'student' || !!viewGender;

  const isWaitingListSelected = selectedRoom?.roomId === -1;

  // Create a proper Room object for waiting list
  const getWaitingListRoomObject = (): Room => ({
    roomId: -1,
    roomCode: 'WAITING',
    roomName: 'Waiting List',
    roomCapacity: 999,
    isFull: false,
    mainLeaderId: [],
    subGroups: [],
    stayers: {
      leaderIds: [],
      studentIds: [],
    }
  });

  return (
    <div className="relative w-full max-w-md" ref={dropdownRef}>
      {/* Trigger Button */}
      <div
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all shadow-sm bg-white ${isDropdownOpen ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
      >
        <div className="flex items-center gap-3">
          {selectedRoom ? (
            <div className={`p-2 rounded-lg ${
              isWaitingListSelected 
                ? 'bg-amber-100 text-amber-600' 
                : selectedRoom.gender === 'male' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-pink-100 text-pink-600'
            }`}>
              {isWaitingListSelected ? <FaUsers /> : selectedRoom.gender === 'male' ? <FaMars /> : <FaVenus />}
            </div>
          ) : (
            <div className="p-2 bg-slate-100 text-slate-400 rounded-lg">
              <FaFilter className="text-sm" />
            </div>
          )}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Target Room</p>
            <p className={`text-sm font-semibold ${selectedRoom ? 'text-slate-700' : 'text-slate-400'}`}>
              {selectedRoom ? selectedRoom.roomName : 'Select room...'}
            </p>
          </div>
        </div>
        <svg className={`h-5 w-5 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>

      {/* Dropdown Panel */}
      {isDropdownOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden min-w-[340px]">
          {/* GENDER SELECTION */}
          {personType === 'student' && (
            <div className="p-4 bg-slate-50/80 border-b border-slate-100">
              <div className="flex gap-2">
                <button
                  onClick={() => setViewGender('male')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${viewGender === 'male' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border border-slate-200 text-slate-600'}`}
                >
                  <FaMars /> MALE
                </button>
                <button
                  onClick={() => setViewGender('female')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${viewGender === 'female' ? 'bg-pink-600 text-white shadow-lg shadow-pink-200' : 'bg-white border border-slate-200 text-slate-600'}`}
                >
                  <FaVenus /> FEMALE
                </button>
              </div>
            </div>
          )}

          {/* FILTERS & SORTING */}
          <div className={`p-4 space-y-4 ${!isFilterEnabled ? 'opacity-30 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  type="text"
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                  placeholder="Search rooms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className={`p-2.5 rounded-xl transition-all border ${sortOrder ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                title={sortOrder === 'asc' ? "Sorting Ascending" : "Sorting Descending"}
              >
                {sortOrder === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />}
              </button>

              <button
                onClick={handleReset}
                className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-rose-100 hover:text-rose-600 transition-colors"
                title="Reset All"
              >
                <FaRotateLeft className="text-sm" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                className="px-3 py-2 text-xs font-bold border border-slate-200 rounded-lg bg-white outline-none capitalize cursor-pointer"
                value={floorFilter}
                onChange={e => setFloorFilter(e.target.value)}
              >
                <option value="">All Floors</option>
                {availableFloors.map((floorKey) => (
                  <option key={floorKey} value={floorKey}>{floorKey.replace(/(\d+)/g, ' $1')}</option>
                ))}
              </select>
              <select
                className="px-3 py-2 text-xs font-bold border border-slate-200 rounded-lg bg-white outline-none cursor-pointer"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="">Any Status</option>
                <option value="available">Available</option>
                <option value="full">Full</option>
                <option value="overfilled">Overfilled</option>
              </select>
            </div>
          </div>

          {/* ROOM LIST */}
          <div
            ref={scrollContainerRef}
            className="max-h-80 overflow-y-auto border-t border-slate-100 scroll-smooth bg-slate-50/30"
          >
            {isFilterEnabled ? (
              filteredAndSortedRooms.length > 0 ? (
                filteredAndSortedRooms.map((room) => {
                  // Special rendering for waiting list room
                  if (room.roomId === -1) {
                    const isActive = activeRoomId !== undefined && String(room.roomId) === String(activeRoomId);
                    return (
                      <div
                        key="waiting-list"
                        className={`px-4 py-4 bg-white hover:bg-amber-50/30 cursor-pointer border-b border-slate-100 last:border-0 transition-all ${isActive ? ' bg-amber-50/60' : ''}`}
                        onClick={() => { 
                          setSelectedRoom(room); 
                          onRoomSelect(getWaitingListRoomObject()); 
                          setIsDropdownOpen(false); 
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg">
                              <FaUsers className="text-sm" />
                            </div>
                            <h4 className="text-sm font-bold text-amber-700">{room.roomName}</h4>
                            {isActive && (
                              <span className="ml-2 px-2 py-0.5 bg-green-500 text-white text-[9px] font-black rounded-bl-lg uppercase">Active now</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Regular room rendering
                  const { leaders, students } = getOccupancy(room);
                  const stats = getRoomStats(room);
                  const isActive = activeRoomId !== undefined && String(room.roomId) === String(activeRoomId);
                  return (
                    <div
                      key={room.roomId}
                      className={`px-4 py-4 bg-white hover:bg-indigo-50/30 cursor-pointer border-b border-slate-100 last:border-0 transition-all ${isActive ? ' bg-indigo-50/60' : ''}`}
                      onClick={() => { setSelectedRoom(room); onRoomSelect(room); setIsDropdownOpen(false); }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`text-sm font-bold ${stats.isFull ? 'text-slate-500' : 'text-slate-700'}`}>{room.roomName}</h4>
                            {isActive && (
                              <span className="ml-2 px-2 py-0.5 bg-green-500 text-white text-[9px] font-black rounded-bl-lg uppercase">Active now</span>
                            )}
                            {stats.isOverfilled && (
                              <span className="flex items-center gap-1 text-[8px] font-black bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded uppercase">
                                <FaTriangleExclamation className="text-[7px]" /> Overfilled
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 text-slate-400 items-center flex-wrap">
                            <span className="text-[9px] font-bold bg-slate-100 px-1.5 py-0.5 rounded">{leaders} L</span>
                            <span className="text-[9px] font-bold bg-slate-100 px-1.5 py-0.5 rounded">{students} S</span>
                            {Array.isArray(room.subGroups) && room.subGroups.length > 0 && (
                              <>
                                {room.subGroups.map((sg: any, idx: number) => {
                                  // Get group name
                                  const label = (sg.groupName || sg.name || sg || '').toString();
                                  // Always count from room.stayers arrays by matching sourceSubGroup/groupName
                                  let leaderCount = 0;
                                  let studentCount = 0;
                                  if (room.stayers && Array.isArray(room.stayers.leaderIds)) {
                                    leaderCount = room.stayers.leaderIds.filter((l: any) => {
                                      const sub = (l.sourceSubGroup || l.groupName || '').toString();
                                      return sub.toUpperCase() === label.toUpperCase();
                                    }).length;
                                  }
                                  if (room.stayers && Array.isArray(room.stayers.studentIds)) {
                                    studentCount = room.stayers.studentIds.filter((s: any) => {
                                      const sub = (s.sourceSubGroup || s.groupName || '').toString();
                                      return sub.toUpperCase() === label.toUpperCase();
                                    }).length;
                                  }
                                  return (
                                    <span
                                      key={label + idx}
                                      className="text-[9px] font-semibold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded ml-1"
                                    >
                                      {label.toUpperCase()} ({leaderCount}L, {studentCount}S)
                                    </span>
                                  );
                                })}
                              </>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          {stats.isOverfilled ? (
                            <div className="text-[11px] font-black text-purple-600">+{stats.overfilledCount} EXCESS</div>
                          ) : (
                            <div className={`text-[11px] font-black flex items-center justify-end gap-1 ${stats.availableCount === 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                              <FaBed className="text-xs" /> {stats.availableCount} VACANT
                            </div>
                          )}
                          <p className="text-[9px] text-slate-300 font-bold uppercase">Cap: {room.roomCapacity}</p>
                        </div>
                      </div>

                      <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-700 ${stats.isOverfilled ? 'bg-purple-500' : stats.availableCount === 0 ? 'bg-rose-500' : stats.percent > 80 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(stats.percent, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                    <FaMagnifyingGlass className="text-slate-300 text-xl" />
                  </div>
                  <p className="text-sm font-bold text-slate-600">No rooms found</p>
                  <button onClick={handleReset} className="mt-4 text-[10px] font-black text-indigo-600 uppercase tracking-wider hover:underline">Clear all filters</button>
                </div>
              )
            ) : (
              <div className="p-10 text-center text-slate-400 uppercase text-[10px] font-bold tracking-widest">
                {personType === 'leader' ? `Only ${genderFilter?.toUpperCase()} rooms available` : "Select gender side to begin"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomListCompound;