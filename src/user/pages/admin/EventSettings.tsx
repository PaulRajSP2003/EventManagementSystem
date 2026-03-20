import React, { useState, useMemo, useEffect } from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import RoomSettingsCompound from './components/RoomSettingsCompound';
import FloorTabCompound from './components/FloorTabCompound';
import SectionGroupCompound from './components/SectionGroupCompound';
import MentorGroupCompound from './components/MentorGroupCompound';
import { fetchRoomData } from '../api/RoomData';
import { fetchGroupData } from './api/GroupData';
import { fetchEventStayConfig } from '../api/RoomData';
import { fetchPermissionData, isAdmin } from '../permission';
import AccessAlert from '../components/AccessAlert';

interface SectionGroup {
  groupName: string;
  initialAge: number;
  finalAge: number;
  tagColor: string;
}

interface MentorGroup {
  groupName: string;
  initialAge: number;
  finalAge: number;
  capacity: number;
}

interface Room {
  roomId: number;
  roomCode: string;
  roomName: string;
  roomCapacity: number;
  isFull: boolean;
  subGroups: string[];
  stayers: {
    leaderIds: Array<{ id: number; sourceSubGroup: string }>;
    studentIds: Array<{ id: number; sourceSubGroup: string }>;
  };
}

type WaitingList = {
  waitingCount: number;
  leaderIds: Array<{ id: number; sourceSubGroup: string }>;
  studentIds: Array<{ id: number; sourceSubGroup: string }>;
};

interface RoomData {
  male: {
    floors: { [floor: string]: Room[] };
    waitingList: WaitingList;
  };
  female: {
    floors: { [floor: string]: Room[] };
    waitingList: WaitingList;
  };
}

// Skeleton Component
const EventSettingsSkeleton = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8 animate-pulse">
        <div className="mb-6">
          <div className="h-10 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="border-b border-gray-200">
            <div className="flex space-x-8">
              <div className="h-8 bg-gray-200 rounded w-24"></div>
              <div className="h-8 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 space-y-6">
          <div className="h-40 bg-gray-200 rounded-xl"></div>
          <div className="h-60 bg-gray-200 rounded-xl"></div>
          <div className="h-40 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
};

const EventSettings: React.FC = () => {
  const navigate = useNavigate();
  
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'floor' | 'group'>('floor');
  const [activeGroupTab, setActiveGroupTab] = useState<'section' | 'mentor'>('section');
  const [sectionGroups, setSectionGroups] = useState<SectionGroup[]>([]);
  const [mentorGroups, setMentorGroups] = useState<MentorGroup[]>([]);
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [namingOption, setNamingOption] = useState<'manual' | 'auto'>('manual');
  const [eventStayConfigUnsaved, setEventStayConfigUnsaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const eventId = parseInt(localStorage.getItem('evenId') || '0', 10);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const permissionData = await fetchPermissionData();
        setUserRole(permissionData?.role || 'user');
      } catch (err) {
        console.error('Error fetching permission data:', err);
        setUserRole('user');
      } finally {
        setCheckingAccess(false);
      }
    };
    
    checkAccess();
  }, []);

  useEffect(() => {
    const fetchAllData = async () => {
      if (checkingAccess) return;
      
      setIsLoading(true);
      try {
        try {
          const data = await fetchRoomData();
          setRoomData(data);
        } catch (e) {
          console.error('Error fetching room data:', e);
          setRoomData(null);
        }

        try {
          const result = await fetchGroupData();
          if (result) {
            setSectionGroups(result.sectionGroups);
            setMentorGroups(result.mentorGroups);
          }
        } catch (e) {
          console.error('Error fetching group data:', e);
        }

        try {
          const configResult = await fetchEventStayConfig();
          if (configResult && configResult.namingOption) {
            setNamingOption(configResult.namingOption);
          }
        } catch (e) {
          console.error('Error fetching event stay config:', e);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [checkingAccess]);

  const handleSaveSuccess = () => {
  };

  const floorDataJson = useMemo(
    () => ({
      male: {
        floorCount: roomData
          ? Object.keys(roomData.male.floors).map(k => parseInt(k)).sort((a, b) => a - b)
          : [],
      },
      female: {
        floorCount: roomData
          ? Object.keys(roomData.female.floors).map(k => parseInt(k)).sort((a, b) => a - b)
          : [],
      },
    }),
    [roomData]
  );

  if (!checkingAccess && !isAdmin(userRole)) {
    return <AccessAlert message="You don't have access to view this page. Admin privileges required." />;
  }

  // Show loading skeleton while checking access or loading data
  if (checkingAccess || isLoading) {
    return (
      <>
        {/* Sticky Header Skeleton */}
        <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-4 border-b border-gray-100">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium"
              >
                <FiArrowLeft />
                Back
              </button>
              <div className="h-4 w-[1px] bg-gray-300 hidden sm:block" />
              <h1 className="text-lg font-bold text-slate-800 hidden sm:block">
                Event Settings
              </h1>
            </div>
          </div>
        </div>
        <EventSettingsSkeleton />
      </>
    );
  }

  return (
    <>
      {/* Sticky Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-4 border-b border-gray-100">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium"
            >
              <FiArrowLeft />
              Back
            </button>
            <div className="h-4 w-[1px] bg-gray-300 hidden sm:block" />
            <h1 className="text-lg font-bold text-slate-800 hidden sm:block">
              Event Settings
            </h1>
          </div>

          {/* Future: Save / Actions button can go here */}
        </div>
      </div>

      {/* Main content */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8" aria-label="Main Tabs">
                <button
                  onClick={() => setActiveTab('floor')}
                  className={`${
                    activeTab === 'floor'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
                >
                  Floor Settings
                </button>
                <button
                  onClick={() => setActiveTab('group')}
                  className={`${
                    activeTab === 'group'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
                >
                  Group Settings
                </button>
              </nav>
            </div>
          </div>

          <div className="mt-8">
            {activeTab === 'floor' && (
              <>
                <RoomSettingsCompound />
                <div className="mt-8">
                  <FloorTabCompound
                    floorDataJson={floorDataJson}
                    roomData={roomData || { 
                      male: { floors: {}, waitingList: { waitingCount: 0, leaderIds: [], studentIds: [] } }, 
                      female: { floors: {}, waitingList: { waitingCount: 0, leaderIds: [], studentIds: [] } } 
                    }}
                    namingOption={namingOption}
                    onRoomDataChange={setRoomData}
                    eventId={eventId}
                    onNamingChange={setNamingOption}
                    onSaveSuccess={handleSaveSuccess}
                    hasEventStayConfigUnsaved={eventStayConfigUnsaved}
                    onEventStayConfigUnsaved={setEventStayConfigUnsaved}
                  />
                </div>
              </>
            )}

            {activeTab === 'group' && (
              <>
                <div className="flex flex-col gap-4 p-4 bg-gray-50/50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800">
                  <div className="flex flex-wrap items-center justify-between gap-4">

                    {/* Segmented Control Tabs */}
                    <nav
                      className="inline-flex p-1 bg-gray-200/50 dark:bg-gray-800/50 rounded-xl"
                      aria-label="Group Tabs"
                    >
                      {(['section', 'mentor'] as const).map((g) => {
                        const isActive = activeGroupTab === g;
                        const count =
                          g === 'section'
                            ? sectionGroups.length
                            : mentorGroups.length;

                        return (
                          <button
                            key={g}
                            onClick={() => setActiveGroupTab(g)}
                            className={`
                            relative flex items-center gap-2 px-6 py-2 text-sm font-semibold
                            transition-all duration-300 rounded-lg
                            ${
                              isActive
                                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }
                        `}
                          >
                            <span>
                              {g === 'section'
                                ? 'Section Groups'
                                : 'Mentor Groups'}
                            </span>

                            {/* Count Badge */}
                            <span
                              className={`
                                ml-1 px-1.5 py-0.5 text-[10px] rounded-md
                                ${
                                  isActive
                                    ? 'bg-indigo-50 text-indigo-600'
                                    : 'bg-gray-300/30 text-gray-500'
                                }
                            `}
                            >
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </nav>

                  </div>
                </div>

                <div className="mt-8">
                  {activeGroupTab === 'section' && (
                    <SectionGroupCompound
                      sectionGroupStructureJSON={sectionGroups}
                      onSectionGroupChange={setSectionGroups}
                    />
                  )}

                  {activeGroupTab === 'mentor' && (
                    <MentorGroupCompound
                      mentorGroupStructureJSON={mentorGroups}
                      onMentorGroupChange={setMentorGroups}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default EventSettings;
