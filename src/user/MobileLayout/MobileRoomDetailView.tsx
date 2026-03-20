import { FiFilter, FiHome, FiLock } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import RoomKeyHandler from '../pages/room/compounds/RoomKeyHandler';
import RoomLeaderAssign from '../pages/room/compounds/RoomLeaderAssign';
import { canAccess, PAGE_PERMISSIONS } from '../pages/permission';

interface MobileRoomDetailViewProps {
  gender: string;
  activeRoom: string;
  activeFloor: string;
  activeSubGroup: string;
  showKeyView: boolean;
  showLeaderAssignView: boolean;
  activeRoomObj: any;
  renderRoom: (room: any) => React.ReactNode;
  renderWaitingList: () => React.ReactNode;
  renderWithLeaderList: () => React.ReactNode;
  renderWithLeaderInRoomView: () => React.ReactNode;
  getAllSubGroups: () => string[];
  setActiveSubGroup: (sg: string) => void;
  capitalize: (text: string) => string;
  permissionData: any;
  KEY_TAB: string;
  LEADER_ASSIGN_TAB: string;
  WITH_LEADER_IN_ROOM_TAB: string;
}

const MobileRoomDetailView: React.FC<MobileRoomDetailViewProps> = ({
  gender,
  activeRoom,
  activeFloor,
  activeSubGroup,
  showKeyView,
  showLeaderAssignView,
  activeRoomObj,
  renderRoom,
  renderWaitingList,
  renderWithLeaderList,
  renderWithLeaderInRoomView,
  getAllSubGroups,
  setActiveSubGroup,
  capitalize,
  permissionData,
  KEY_TAB,
  LEADER_ASSIGN_TAB,
  WITH_LEADER_IN_ROOM_TAB,
}) => {
  const navigate = useNavigate();

  // Unused title and subtitle removed

  const hasViewRoomPermission = canAccess(permissionData, PAGE_PERMISSIONS.VIEW_ROOM);

  const subGroups = getAllSubGroups().filter(sg =>
    sg !== KEY_TAB &&
    sg !== LEADER_ASSIGN_TAB &&
    sg !== WITH_LEADER_IN_ROOM_TAB
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      <div className="p-3 space-y-3">
        {showKeyView ? (
          canAccess(permissionData, PAGE_PERMISSIONS.KEY_HANDING) ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-1 shadow-sm overflow-hidden">
              <RoomKeyHandler
                roomName={activeRoom}
                roomId={activeRoomObj?.roomId ? String(activeRoomObj.roomId) : undefined}
              />
            </div>
          ) : (
            <div className="py-16 text-center">
              <FiLock className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-3" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Access Denied: Keys</p>
            </div>
          )
        ) : showLeaderAssignView ? (
          canAccess(permissionData, PAGE_PERMISSIONS.ROOM_LEADER_ASSIGN) ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-1 shadow-sm">
              <RoomLeaderAssign activeRoomName={activeRoom} gender={gender as 'male' | 'female'} />
            </div>
          ) : (
            <div className="py-16 text-center">
              <FiLock className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-3" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Access Denied: Leader</p>
            </div>
          )
        ) : !hasViewRoomPermission ? (
          <div className="py-16 text-center">
            <FiLock className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-3" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Access Denied: View Room</p>
          </div>
        ) : (
          <>
            {/* Only show Sub Group filter for Stayers and Waiting List */}
            {(activeRoom !== 'all' || activeFloor === 'waiting') && (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-600 mb-0.5">
                  <FiFilter className="w-2.5 h-2.5" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Filter by Group</span>
                </div>
                <div className="flex overflow-x-auto gap-2 pb-1.5 no-scrollbar">
                  {subGroups.map((sg) => (
                    <button
                      key={sg}
                      onClick={() => {
                        setActiveSubGroup(sg);
                        if (activeRoom !== 'all') {
                          navigate(`/user/room/${gender}/${encodeURIComponent(activeRoom)}/${sg}`);
                        } else {
                          navigate(`/user/room/${gender}/${sg === 'all' ? '' : sg}`);
                        }
                      }}
                      className={`px-4 py-2 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all border ${activeSubGroup === sg
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100 dark:shadow-none"
                        : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                        }`}
                    >
                      {sg === 'all' ? 'All Groups' : capitalize(sg)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic Content */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {activeFloor === 'waiting' ? (
                renderWaitingList()
              ) : activeFloor === 'with_leader_list' ? (
                renderWithLeaderList()
              ) : activeSubGroup === WITH_LEADER_IN_ROOM_TAB ? (
                renderWithLeaderInRoomView()
              ) : (
                <>
                  {activeRoomObj ? renderRoom(activeRoomObj) : (
                    <div className="py-20 text-center">
                      <FiHome className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No Room Selected</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MobileRoomDetailView;
