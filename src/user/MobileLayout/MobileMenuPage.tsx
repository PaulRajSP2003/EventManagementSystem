import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPlus,
  FiList,
  FiChevronRight,
  FiArrowLeft,
  FiActivity,
  FiBell,
  FiGrid,
  FiUser,
  FiUserCheck,
  FiUsers,
  FiKey,
  FiShield
} from 'react-icons/fi';
import { useUserAuth } from '../pages/auth/UserAuthContext';
import { canAccess, PAGE_PERMISSIONS, isAdminOrCoAdmin } from '../pages/permission';
import { subGroupAPI } from '../pages/api/SubGroupDataAPI';
import { fetchRoomData } from '../pages/api/RoomData';
import type { RoomData, Room } from '../../types';

interface MobileMenuPageProps {
  activeMenu: string;
  onClose: () => void;
  onNotificationClick: () => void;
  contextPath?: string;
}

const MobileMenuPage: React.FC<MobileMenuPageProps> = ({ activeMenu, onClose, onNotificationClick, contextPath }) => {
  const navigate = useNavigate();
  const { user } = useUserAuth();

  // Navigation states
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<'sub' | 'follow' | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [subGroups, setSubGroups] = useState<string[]>([]);
  const [isLoadingSubGroups, setIsLoadingSubGroups] = useState(false);

  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  // Group Navigation Flow
  const handleGroupCategorySelect = (category: 'sub' | 'follow') => {
    setSelectedCategory(category);
    setStep(2);
  };

  const handleGroupAlphabetSelect = async (alphabet: string) => {
    setSelectedGroup(alphabet);
    try {
      setIsLoadingSubGroups(true);
      const names = await subGroupAPI.getSubGroupNames(alphabet);

      // Sort subgroups: MA1, MA2... then FA1, FA2...
      const sortedNames = [...names].sort((a, b) => {
        // Extract prefix (letters) and number
        const aMatch = a.match(/^([A-Za-z]+)(\d+)$/);
        const bMatch = b.match(/^([A-Za-z]+)(\d+)$/);

        if (aMatch && bMatch) {
          const [, aPrefix, aNum] = aMatch;
          const [, bPrefix, bNum] = bMatch;

          // Compare prefixes (e.g., MA vs FA)
          // We want MA (starting with M) before FA (starting with F)? 
          // Actually, let's just use localeCompare for prefixes
          if (aPrefix.toUpperCase() !== bPrefix.toUpperCase()) {
            // Special rule: M before F
            if (aPrefix.toUpperCase().startsWith('M') && bPrefix.toUpperCase().startsWith('F')) return -1;
            if (aPrefix.toUpperCase().startsWith('F') && bPrefix.toUpperCase().startsWith('M')) return 1;
            return aPrefix.localeCompare(bPrefix);
          }

          // If prefixes are same, compare numbers
          return parseInt(aNum) - parseInt(bNum);
        }

        return a.localeCompare(b);
      });

      setSubGroups(sortedNames);
      setStep(3);
    } catch (error) {
      console.error('Error fetching subgroups:', error);
      // Fallback or error message could go here
    } finally {
      setIsLoadingSubGroups(false);
    }
  };

  const handleSubGroupSelect = (sg: string) => {
    if (selectedCategory === 'sub') {
      navigate(`/user/group/sub/${selectedGroup}/${sg}`);
    } else {
      navigate(`/user/group/follow/${selectedGroup}/${sg}`);
    }
    onClose();
  };

  const handleRoomGenderSelect = async (gender: 'male' | 'female') => {
    setSelectedGender(gender);
    setStep(2);

    // Fetch room data if not already fetched
    if (!roomData) {
      try {
        setIsLoadingRooms(true);
        const rData = await fetchRoomData();
        setRoomData(rData);
      } catch (error) {
        console.error('Error fetching room data:', error);
      } finally {
        setIsLoadingRooms(false);
      }
    }
  };

  const handleFloorSelect = (floor: string) => {
    setSelectedFloor(floor);
    if (floor === 'waiting') {
      navigate(`/user/room/${selectedGender}?view=waiting`);
      onClose();
    } else {
      setStep(3);
    }
  };

  const handleRoomSelect = (room: Room) => {
    setSelectedRoom(room.roomName);
    setStep(4);
  };

  const handleRoomActionSelect = (action: 'all' | 'key' | 'room_leader') => {
    navigate(`/user/room/${selectedGender}/${selectedRoom}/${action}`);
    onClose();
  };

  const resetNav = () => {
    setStep(1);
    setSelectedCategory(null);
    setSelectedGroup(null);
    setSelectedGender(null);
    setSelectedRoom(null);
    setSubGroups([]);
  };

  useEffect(() => {
    // If we have a contextPath (from back navigation), try to restore state
    if (contextPath && activeMenu === 'group') {
      const subMatch = contextPath.match(/group\/sub\/([^/]+)/);
      const followMatch = contextPath.match(/group\/follow\/([^/]+)/);

      const groupMatch = subMatch || followMatch;
      if (groupMatch) {
        const category = subMatch ? 'sub' : 'follow';
        const groupId = groupMatch[1];

        // Skip restoration if we've already set this group (prevents loops)
        if (selectedGroup === groupId && selectedCategory === category) return;

        setSelectedCategory(category);
        setSelectedGroup(groupId);
        handleGroupAlphabetSelect(groupId);
        return;
      }
    }

    if (contextPath && activeMenu === 'room') {
      const roomMatch = contextPath.match(/room\/(male|female)\/([^/]+)/);
      if (roomMatch) {
        const gender = roomMatch[1] as 'male' | 'female';
        const roomNum = roomMatch[2];
        if (selectedGender === gender && selectedRoom === roomNum) return;

        setSelectedGender(gender);
        setSelectedRoom(roomNum);
        setSelectedFloor('all');
        setStep(4);

        if (!roomData) {
          setIsLoadingRooms(true);
          fetchRoomData()
            .then(rData => setRoomData(rData))
            .catch(err => console.error('Error fetching room data:', err))
            .finally(() => setIsLoadingRooms(false));
        }
        return;
      }
    }

    // Default: reset if opening a new menu or context is invalid
    if (step === 1 && !contextPath) {
      resetNav();
    }
  }, [activeMenu, contextPath]);

  if (!activeMenu) return null;

  const renderHeader = (title: string) => (
    <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        {step > 1 && (
          <button onClick={() => setStep(step - 1)} className="p-2 -ml-2 text-slate-400 hover:text-indigo-600 transition-colors">
            <FiArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight truncate">{title}</h2>
      </div>
      <button
        onClick={onNotificationClick}
        className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 relative"
      >
        <FiBell className="w-5 h-5" />
        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
      </button>
    </div>
  );

  const Button = ({ onClick, icon: Icon, label, color = "indigo" }: any) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl hover:border-${color}-200 dark:hover:border-${color}-900 transition-all group`}
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600 dark:text-${color}-400 group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
        <span className="font-bold text-slate-700 dark:text-slate-200 text-lg">{label}</span>
      </div>
      <FiChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
    </button>
  );

  const GridButton = ({ onClick, label, active = false }: any) => (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border font-bold text-lg transition-all ${active
        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-200'
        }`}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-gray-950 z-40 overflow-y-auto scrollbar-hide pb-24 animate-in fade-in duration-300">

      {/* STUDENT MENU */}
      {activeMenu === 'student' && (
        <div className="flex flex-col h-full">
          {renderHeader("Student Management")}
          <div className="p-6 space-y-4">
            {canAccess(user, PAGE_PERMISSIONS.STUDENT_NEW) && (
              <Button
                label="Add New Student"
                icon={FiPlus}
                color="green"
                onClick={() => { navigate('/user/student/new'); onClose(); }}
              />
            )}
            {canAccess(user, PAGE_PERMISSIONS.STUDENT_LIST) && (
              <Button
                label="View Students"
                icon={FiList}
                color="blue"
                onClick={() => { navigate('/user/student'); onClose(); }}
              />
            )}
          </div>
        </div>
      )}

      {/* LEADER MENU */}
      {activeMenu === 'leader' && (
        <div className="flex flex-col h-full">
          {renderHeader("Leader Management")}
          <div className="p-6 space-y-4">
            {canAccess(user, PAGE_PERMISSIONS.LEADER_NEW) && (
              <Button
                label="New Leader"
                icon={FiPlus}
                color="purple"
                onClick={() => { navigate('/user/leader/new'); onClose(); }}
              />
            )}
            {canAccess(user, PAGE_PERMISSIONS.LEADER_LIST) && (
              <Button
                label="View Leader"
                icon={FiList}
                color="blue"
                onClick={() => { navigate('/user/leader'); onClose(); }}
              />
            )}
            {isAdminOrCoAdmin(user) && (
              <Button
                label="View Tasks"
                icon={FiActivity}
                color="indigo"
                onClick={() => { navigate('/user/task'); onClose(); }}
              />
            )}
          </div>
        </div>
      )}

      {/* MEDICAL MENU */}
      {activeMenu === 'medical' && (
        <div className="flex flex-col h-full">
          {renderHeader("Medical Reports")}
          <div className="p-6 space-y-4">
            {canAccess(user, PAGE_PERMISSIONS.MEDICAL_REPORT_NEW) && (
              <Button
                label="Add Medical Report"
                icon={FiPlus}
                color="red"
                onClick={() => { navigate('/user/medical/new'); onClose(); }}
              />
            )}
            {canAccess(user, PAGE_PERMISSIONS.MEDICAL_REPORT_LIST) && (
              <Button
                label="View Medical Reports"
                icon={FiActivity}
                color="blue"
                onClick={() => { navigate('/user/medical'); onClose(); }}
              />
            )}
          </div>
        </div>
      )}

      {/* GROUP MENU */}
      {activeMenu === 'group' && (
        <div className="flex flex-col h-full">
          {renderHeader("Group Navigation")}
          <div className="p-6">
            {step === 1 && (
              <div className="space-y-4">
                {canAccess(user, PAGE_PERMISSIONS.SUB_GROUP) && (
                  <Button label="Sub Group" icon={FiGrid} onClick={() => handleGroupCategorySelect('sub')} />
                )}
                {canAccess(user, PAGE_PERMISSIONS.FOLLOWING_GROUP) && (
                  <Button label="Following Group" icon={FiGrid} onClick={() => handleGroupCategorySelect('follow')} />
                )}
                {(!canAccess(user, PAGE_PERMISSIONS.SUB_GROUP) && !canAccess(user, PAGE_PERMISSIONS.FOLLOWING_GROUP)) && (
                  <div className="p-8 text-center text-slate-400">
                    No group permissions available.
                  </div>
                )}
              </div>
            )}
            {step === 2 && (
              <div className="grid grid-cols-4 gap-3">
                {(user?.groups || []).map((alpha: string) => (
                  <GridButton key={alpha} label={alpha} onClick={() => handleGroupAlphabetSelect(alpha)} />
                ))}
                {(user?.groups || []).length === 0 && (
                  <div className="col-span-4 p-8 text-center text-slate-400">
                    No groups assigned.
                  </div>
                )}
              </div>
            )}
            {step === 3 && (
              <div className="space-y-3">
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl mb-4 text-center">
                  <span className="font-bold text-indigo-800 dark:text-indigo-400 text-lg">
                    Group {selectedGroup || '...'} {selectedCategory === 'sub' ? 'Sub Groups' : 'Follow Groups'}
                  </span>
                </div>
                {isLoadingSubGroups ? (
                  <div className="flex flex-col items-center justify-center p-12 space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <p className="text-sm text-slate-500 font-medium">Loading subgroups...</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-4 gap-3 pb-24">
                      {subGroups.map((sg: string) => (
                        <button
                          key={sg}
                          onClick={() => handleSubGroupSelect(sg)}
                          className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 hover:border-indigo-200 transition-all"
                        >
                          <span>{sg}</span>
                          <FiChevronRight className="w-5 h-5 text-slate-300" />
                        </button>
                      ))}
                    </div>
                    {subGroups.length === 0 && (
                      <div className="p-8 text-center text-slate-400">
                        No subgroups found for this group.
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADMIN MENU */}
      {activeMenu === 'admin' && (
        <div className="flex flex-col h-full">
          {renderHeader("User Management")}
          <div className="px-6 pt-6 mb-2">
            <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-100 rounded-xl">
              <div className="p-2 bg-rose-100 rounded-lg shadow-sm">
                <FiShield className="w-4 h-4 text-rose-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Security Notice</span>
                <p className="text-xs font-medium text-rose-700">This Area it access to Event Admin</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <Button
              label="User List"
              icon={FiUsers}
              color="indigo"
              onClick={() => { navigate('/admin/users'); onClose(); }}
            />
            <Button
              label="Add New User"
              icon={FiPlus}
              color="green"
              onClick={() => { navigate('/admin/users/new'); onClose(); }}
            />
          </div>
        </div>
      )}

      {/* ROOM MENU */}
      {activeMenu === 'room' && (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 min-h-screen">
          {renderHeader("Room Management")}
          <div className="p-6">
            {step === 1 && (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                <Button label="Male" icon={FiUser} color="blue" onClick={() => handleRoomGenderSelect('male')} />
                <Button label="Female" icon={FiUser} color="pink" onClick={() => handleRoomGenderSelect('female')} />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl mb-4 flex justify-between items-center">
                  <span className="font-bold text-indigo-800 dark:text-indigo-400 capitalize text-lg">{selectedGender} Section</span>
                  {isLoadingRooms && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>}
                </div>
                {isLoadingRooms ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <p className="text-sm text-slate-500 font-medium">Fetching details...</p>
                  </div>
                ) : (
                  <>
                    <Button label="All Floor" icon={FiGrid} color="indigo" onClick={() => handleFloorSelect('all')} />
                    {roomData && selectedGender && Object.keys(roomData[selectedGender].floors).sort().map(floor => (
                      <Button key={floor} label={`Floor ${floor}`} icon={FiGrid} color="blue" onClick={() => handleFloorSelect(floor)} />
                    ))}
                    <Button label="Waiting List" icon={FiList} color="orange" onClick={() => handleFloorSelect('waiting')} />
                  </>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl mb-2 text-center">
                  <span className="font-bold text-blue-800 dark:text-blue-400 capitalize text-lg">
                    {selectedGender} • {selectedFloor === 'all' || !selectedFloor ? 'All Floors' : `Floor ${selectedFloor}`}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-24">
                  {/* If All Floor, group by floor */}
                  {selectedFloor === 'all' ? (
                    roomData && selectedGender && Object.keys(roomData[selectedGender].floors).sort().map(floor => (
                      <React.Fragment key={floor}>
                        <div className="col-span-2 mt-4 first:mt-0 font-black text-slate-400 dark:text-slate-600 text-xs uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
                          Floor {floor}
                        </div>
                        {roomData[selectedGender].floors[floor].map(room => (
                          <GridButton key={room.roomId} label={room.roomName} onClick={() => handleRoomSelect(room)} />
                        ))}
                      </React.Fragment>
                    ))
                  ) : (
                    roomData && selectedGender && selectedFloor && roomData[selectedGender].floors[selectedFloor]?.map(room => (
                      <GridButton key={room.roomId} label={room.roomName} onClick={() => handleRoomSelect(room)} />
                    ))
                  )}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl mb-2 text-center">
                  <span className="font-bold text-indigo-800 dark:text-indigo-400 capitalize text-lg">{selectedGender} • {selectedRoom}</span>
                </div>
                <Button label="Stayers" icon={FiUsers} color="emerald" onClick={() => handleRoomActionSelect('all')} />
                {canAccess(user, PAGE_PERMISSIONS.KEY_HANDING) && (
                  <Button label="Key Management" icon={FiKey} color="orange" onClick={() => handleRoomActionSelect('key')} />
                )}
                {canAccess(user, PAGE_PERMISSIONS.ROOM_LEADER_ASSIGN) && (
                  <Button label="Main Leader" icon={FiUserCheck} color="purple" onClick={() => handleRoomActionSelect('room_leader')} />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileMenuPage;
