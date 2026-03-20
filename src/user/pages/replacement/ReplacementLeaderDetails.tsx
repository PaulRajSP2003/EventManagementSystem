// src/user/pages/replacement/ReplacementLeaderDetails.tsx
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiUser,
  FiMapPin,
  FiActivity,
  FiSave,
  FiRefreshCw,
  FiClock,
  FiLoader,
} from 'react-icons/fi';
import { FaChurch, FaMars, FaVenus } from 'react-icons/fa6';
import RoomListCompound from '../components/RoomListCompound';
import AvailableFollowingGroupList from '../components/AvailableFollowingGroupList';
import MainGroupList from '../components/MainGroupList';
import { followingGroupAPI } from '../api/FollowingGroupDataAPI';
import type { GroupStructure } from '../api/FollowingGroupDataAPI';
import { replacementLeaderAPI, updateReplacementLeader } from '../api/ReplacementLeaderData';
import AccessAlert from '../components/AccessAlert';
import { isAdminOrCoAdmin, fetchPermissionData, type PermissionData } from '../permission';
import { StickyHeader } from '../components';

// ─── Skeleton Components ─────────────────────────────────────────────
const ProfileSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-pulse">
    <div className="h-32 bg-slate-200"></div>
    <div className="px-6 pb-6 text-center -mt-12 relative">
      <div className="w-24 h-24 mx-auto bg-slate-300 rounded-full p-1 shadow-lg"></div>
      <div className="h-8 w-48 bg-slate-300 rounded mx-auto mt-6"></div>
      <div className="h-5 w-32 bg-slate-200 rounded mx-auto mt-2"></div>
      <div className="flex justify-center gap-2 mt-4">
        <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
        <div className="h-6 w-16 bg-slate-200 rounded-full"></div>
      </div>
    </div>
  </div>
);

const AllocationSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 animate-pulse">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="flex flex-col gap-2 p-3 rounded-xl border bg-slate-50">
        <div className="h-4 w-24 bg-slate-200 rounded"></div>
        <div className="h-10 bg-slate-200 rounded-lg"></div>
      </div>
    ))}
  </div>
);

const HistorySkeleton = () => (
  <div className="space-y-6 animate-pulse">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="relative pl-8 pb-6 border-l-2 border-slate-100">
        <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-slate-300 border-4 border-white"></div>
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
          <div className="flex justify-between mb-2">
            <div className="h-5 w-32 bg-slate-200 rounded"></div>
            <div className="h-5 w-16 bg-slate-200 rounded"></div>
          </div>
          <div className="h-5 w-3/4 bg-slate-200 rounded"></div>
        </div>
      </div>
    ))}
  </div>
);

// ─── Reusable Components ─────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center gap-2 mb-4 mt-6 pb-2 border-b border-gray-100">
    <Icon className="text-indigo-500 text-lg" />
    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
  </div>
);

const InfoItem = ({
  icon: Icon,
  label,
  value,
  color = "text-gray-500",
}: any) => (
  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
    <div
      className={`p-2 rounded-full bg-white shadow-sm border border-gray-100 ${color} group-hover:scale-110 transition-transform`}
    >
      <Icon className="text-lg" />
    </div>
    <div className="flex-1">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      <div className="font-medium text-gray-900 mt-0.5">{value}</div>
    </div>
  </div>
);

// ─── Main Component ─────────────────────────────────────────────────
const ReplacementLeaderDetailComponent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Permission data state
  const [permissionData, setPermissionData] = useState<PermissionData | null>(null);
  const [permissionLoading, setPermissionLoading] = useState(true);
  const [permissionError, setPermissionError] = useState<boolean>(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [leader, setLeader] = useState<any>(null);
  const [status, setStatus] = useState<string>("Present");
  const [selectedMainGroup, setSelectedMainGroup] = useState<string>("");
  const [selectedFollowingGroup, setSelectedFollowingGroup] = useState<string>("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [isDirty, setIsDirty] = useState(false);
  const [originalData, setOriginalData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [groupStructure, setGroupStructure] = useState<GroupStructure | null>(null);

  // Fetch permission data on component mount
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        setPermissionLoading(true);
        setPermissionError(false);
        const data = await fetchPermissionData();
        setPermissionData(data);
        
        // Check if user is admin or co-admin
        const isAdmin = isAdminOrCoAdmin(data);
        if (!isAdmin) {
          setAccessDenied(true);
          setErrorMessage("This page is only accessible to administrators");
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

  // Check if user is admin or co-admin using permissionData
  const isAdmin = permissionData && isAdminOrCoAdmin(permissionData);

  // Permission check function - Only admin and co-admin have access
  const hasAccess = () => {
    if (!permissionData || accessDenied || permissionError) return false;
    return isAdminOrCoAdmin(permissionData);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!hasAccess()) {
        setLoading(false);
        return;
      }
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const apiResponse = await replacementLeaderAPI.getById(Number(id));
        const genderPrefix = apiResponse.gender === 'male' ? 'M' : 'F';
        const uiMainGroup =
          apiResponse.isFollowing && apiResponse.isFollowing !== "no"
            ? `${genderPrefix}${apiResponse.isFollowing}`
            : "";
        const normalized = {
          ...apiResponse,
          uiMainGroup,
        };
        setLeader(normalized);
        setOriginalData(normalized);
        applyOriginalData(normalized);
      } catch (err) {
        console.error('Error fetching leader:', err);
        
        // Check if it's a 403 Forbidden error
        const errorMsg = err instanceof Error ? err.message : 'Failed to load leader data';
        
        // Handle 403 Forbidden specifically
        if (errorMsg.toLowerCase().includes('forbidden') || 
            errorMsg.includes('403') ||
            errorMsg.toLowerCase().includes('permission')) {
          setAccessDenied(true);
          setErrorMessage("Access Forbidden: You don't have permission");
        } else if (errorMsg.toLowerCase().includes('unauthorized') || 
                   errorMsg.includes('401')) {
          setAccessDenied(true);
          setErrorMessage("Unauthorized: Please log in to access this page");
        }
        
        setLeader(null);
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchData();
    } else if (permissionData && !permissionLoading && !accessDenied) {
      // User is logged in but not admin/co-admin
      setAccessDenied(true);
      setErrorMessage("This page is only accessible to administrators");
    }
  }, [id, isAdmin, permissionData, permissionLoading]);

  useEffect(() => {
    if (hasAccess()) {
      followingGroupAPI.fetchGroupStructure()
        .then(setGroupStructure)
        .catch((err) => console.error('Failed to load group structure:', err));
    }
  }, [permissionData]);

  // Sync UI when originalData changes
  useEffect(() => {
    if (originalData) {
      setStatus(originalData.status.charAt(0).toUpperCase() + originalData.status.slice(1));
      setSelectedMainGroup(originalData.uiMainGroup || "");
      setSelectedFollowingGroup(originalData.followingGroup || originalData.mentorGroup || "");
      setSelectedRoomId(originalData.roomId || "");
      setIsDirty(false);
    }
  }, [originalData]);

  const applyOriginalData = (data: any) => {
    setStatus(data.status.charAt(0).toUpperCase() + data.status.slice(1));
    setSelectedMainGroup(data.uiMainGroup || "");
    setSelectedFollowingGroup(data.followingGroup || "");
    setSelectedRoomId(data.roomId || "");
    setIsDirty(false);
  };

  const handleReset = () => {
    if (originalData && hasAccess()) applyOriginalData(originalData);
  };

  const isPresent = status === "Present";
  const isRegistered = status === "Registered";
  const isAbsent = status === "Absent";
  const isFullProgram = leader?.type === "fullProgram";

  const canEditMainGroup = (isPresent || isRegistered) && hasAccess();
  const canEditFollowingGroup = (isPresent || isRegistered) && selectedMainGroup !== "" && hasAccess();
  const canEditRoom = isPresent && leader?.staying === "yes" && hasAccess();

  // ── Change Detection ───────────────────────────────────────────────
  const changeJson = useMemo(() => {
    if (!leader || !originalData) return {};

    const changes: any = {};

    const currentIsFollowing = selectedMainGroup
      ? selectedMainGroup.charAt(1)
      : "no";

    const originalIsFollowing = originalData.isFollowing || "no";

    const statusChanged = status.toLowerCase() !== originalData.status;
    const isFollowingChanged = currentIsFollowing !== originalIsFollowing;
    const followingGroupChanged = selectedFollowingGroup !== (originalData.followingGroup || "");

    const originalRoom = originalData.roomId || "";
    const shouldAutoClearRoom =
      originalData.status === "present" &&
      status.toLowerCase() === "registered" &&
      originalRoom !== "";

    // Calculate new room value
    const newRoomValue = shouldAutoClearRoom
      ? ""
      : (selectedRoomId ? String(selectedRoomId) : "");

    const roomChanged = String(newRoomValue) !== String(originalRoom || "");

    // Build simplified changes object with only new values
    if (statusChanged) {
      changes.status = status.toLowerCase();
    }

    if (isFollowingChanged) {
      changes.isFollowing = currentIsFollowing;
    }

    if (followingGroupChanged) {
      changes.mentorGroup = selectedFollowingGroup || null;
    }

    if (roomChanged) {
      changes.roomId = newRoomValue;
    }

    // Only return changes object if there are actual changes
    return Object.keys(changes).length > 0 ? changes : {};
  }, [status, selectedMainGroup, selectedFollowingGroup, selectedRoomId, originalData, leader]);
  
  const hasAllocationChanges = Object.keys(changeJson).length > 0;
  const isFollowingGroupMissing = selectedMainGroup !== "" && !selectedFollowingGroup;
  const canSave = isDirty && hasAllocationChanges && !isFollowingGroupMissing && hasAccess();

  const handleSave = () => {
    if (!canSave || !hasAccess()) return;

    (async () => {
      try {
        setIsSaving(true);
        const updateResponse = await updateReplacementLeader(Number(id), changeJson);

        if (updateResponse) {
          const updatedLeader = {
            ...leader,
            ...updateResponse,
            roomId: updateResponse.roomId !== undefined ? String(updateResponse.roomId) : leader?.roomId,
            followingGroup: updateResponse.mentorGroup || leader?.followingGroup || "",
          };

          if (updateResponse.isFollowing) {
            const genderPrefix = updatedLeader.gender === 'male' ? 'M' : 'F';
            updatedLeader.uiMainGroup = updateResponse.isFollowing !== "no"
              ? `${genderPrefix}${updateResponse.isFollowing}`
              : "";
          }

          setOriginalData(updatedLeader);
          setLeader(updatedLeader);
          setStatus(updatedLeader.status.charAt(0).toUpperCase() + updatedLeader.status.slice(1));
          setSelectedMainGroup(updatedLeader.uiMainGroup || "");
          setSelectedFollowingGroup(updatedLeader.followingGroup || "");
          setSelectedRoomId(updatedLeader.roomId || "");
          setIsDirty(false);
        }

      } catch (err: any) {
        console.error('Update error:', err);
        const errorMsg = err instanceof Error ? err.message : 'Failed to update leader';
        if (errorMsg.toLowerCase().includes('forbidden') || 
            errorMsg.toLowerCase().includes('unauthorized') ||
            errorMsg.includes('403') ||
            errorMsg.includes('401')) {
          setAccessDenied(true);
          setErrorMessage(errorMsg);
        } else {
          alert(err.message || 'Failed to update leader replacement.');
        }
      } finally {
        setIsSaving(false);
      }
    })();
  };

  const getInitials = (name?: string) => {
    if (!name || typeof name !== 'string') return '';
    return name
      .split(' ')
      .filter((n) => n.length > 0)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-32">
      <StickyHeader title="Replacement Leader Detail">
        {hasAccess() && (
          <div className="flex items-center gap-2 sm:gap-3">
            {isDirty && (
              <button
                onClick={handleReset}
                disabled={isSaving}
                className="flex items-center gap-2 px-2 py-2 text-sm font-medium transition text-rose-600 hover:text-rose-800 disabled:opacity-50"
              >
                <FiRefreshCw className={isSaving ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}

            <button
              onClick={handleSave}
              disabled={!canSave || isSaving}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition text-sm font-medium ${
                canSave && !isSaving
                  ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
                  : "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-70"
              }`}
            >
              {isSaving ? <FiLoader className="animate-spin" /> : <FiSave />}
              <span className="hidden sm:inline">{isSaving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        )}
      </StickyHeader>

      <div className="max-w-6xl mx-auto px-4 mt-6">
        {permissionLoading ? (
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ProfileSkeleton />
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                  <div className="h-8 w-48 bg-slate-200 rounded mb-6"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-20 bg-slate-100 rounded-lg"></div>
                    ))}
                  </div>
                  <div className="mt-10">
                    <div className="h-8 w-64 bg-slate-200 rounded mb-6"></div>
                    <AllocationSkeleton />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                  <div className="h-8 w-48 bg-slate-200 rounded mb-6"></div>
                  <HistorySkeleton />
                </div>
              </div>
            </div>
          </div>
        ) : !isAdmin || accessDenied || permissionError ? (
          <div className="flex items-center justify-center py-20">
            <AccessAlert message={errorMessage || "You do not have access to view this leader's details."} />
          </div>
        ) : loading ? (
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ProfileSkeleton />
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                  <div className="h-8 w-48 bg-slate-200 rounded mb-6"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-20 bg-slate-100 rounded-lg"></div>
                    ))}
                  </div>
                  <div className="mt-10">
                    <div className="h-8 w-64 bg-slate-200 rounded mb-6"></div>
                    <AllocationSkeleton />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                  <div className="h-8 w-48 bg-slate-200 rounded mb-6"></div>
                  <HistorySkeleton />
                </div>
              </div>
            </div>
          </div>
        ) : !leader ? (
          <div className="py-20 text-center text-slate-500">Leader not found</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>

                <div className="px-6 pb-6 text-center -mt-12 relative">
                  <div
                    className="w-24 h-24 mx-auto bg-white p-1 rounded-full shadow-lg"
                    style={{ border: `4px solid ${leader.tagColor || "#6366f1"}` }}
                  >
                    <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-2xl font-bold text-indigo-600">
                      {getInitials(leader.name)}
                    </div>
                  </div>

                  <h1 className="text-2xl font-bold text-slate-800 mt-3 capitalize">{leader.name}</h1>

                  <p className="text-slate-500 text-sm mt-1 capitalize">
                    ID: #{leader.id} • {leader.place}
                  </p>

                  <div className="flex justify-center gap-2 mt-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        status === "Present"
                          ? "bg-emerald-100 text-emerald-700"
                          : status === "Registered"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {status}
                    </span>

                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-slate-100 text-slate-600 flex items-center gap-1">
                      {leader.gender === "male" ? <FaMars /> : <FaVenus />}
                      {leader.gender}
                    </span>

                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-indigo-100 text-indigo-700">
                      {leader.type === "leader1" ? "Leader 1" : leader.type === "leader2" ? "Leader 2" : leader.type}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <button
                  onClick={() => leader && navigate(`/user/leader/${leader.id}`)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition
               border bg-indigo-50 border-indigo-200 text-indigo-700
               hover:bg-indigo-100"
                >
                  <FiUser />
                  <span className="hidden sm:inline">View Profile</span>
                </button>
              </div>

              {!isAbsent && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <FiActivity className="text-indigo-500" /> Attendance Status
                  </h3>
                  <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium">
                    {status}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                <SectionHeader icon={FiUser} title="Leader Personal Details" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 capitalize">
                  <InfoItem
                    icon={FiMapPin}
                    label="Place / City"
                    value={
                      leader.place
                        ? (() => {
                            const p = leader.place.split(",")[0].trim();
                            return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
                          })()
                        : "N/A"
                    }
                    color="text-red-500"
                  />
                  <InfoItem icon={FaChurch} label="Home Church" value={leader.churchName || "N/A"} color="text-amber-500" />
                  <InfoItem icon={FiUser} label="Contact" value={leader.contactNumber || "N/A"} color="text-blue-500" />
                  <InfoItem icon={FiUser} label="WhatsApp" value={leader.whatsappNumber || "N/A"} color="text-green-500" />
                </div>

                {!isAbsent && (
                  <>
                    <SectionHeader icon={FiRefreshCw} title="Replacement & Allocation" />

                    <div className="grid gap-3 sm:gap-4 mt-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {!isFullProgram && leader?.isFollowing !== "no" && (
                        <>
                          <div
                            className={`flex flex-col gap-2 p-3 rounded-xl border ${
                              !canEditMainGroup ? "bg-gray-100 opacity-60" : "bg-slate-50"
                            }`}
                          >
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Main Group</label>
                            {canEditMainGroup ? (
                              groupStructure ? (
                                <MainGroupList
                                  structure={groupStructure}
                                  selectedGender={leader.gender?.toLowerCase() === "male" ? "Male" : "Female"}
                                  onGroupSelect={(groupName: string) => {
                                    if (groupName !== selectedMainGroup) setSelectedFollowingGroup("");
                                    setSelectedMainGroup(groupName);
                                    setIsDirty(true);
                                  }}
                                  activeGroup={selectedMainGroup}
                                  disabled={!hasAccess() || isSaving}
                                />
                              ) : (
                                <div className="text-center py-2 text-gray-500">Loading groups...</div>
                              )
                            ) : (
                              <div className="p-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg">
                                {selectedMainGroup || "—"}
                              </div>
                            )}
                          </div>

                          <div
                            className={`flex flex-col gap-2 p-3 rounded-xl border ${
                              !canEditFollowingGroup
                                ? "bg-gray-100 opacity-60"
                                : isFollowingGroupMissing
                                ? "border-rose-300 bg-rose-50"
                                : "bg-slate-50"
                            }`}
                          >
                            <label
                              className={`text-[10px] font-bold uppercase ${
                                isFollowingGroupMissing ? "text-rose-500" : "text-slate-400"
                              }`}
                            >
                              Mentorship Group *
                            </label>
                            {canEditFollowingGroup && selectedMainGroup ? (
                              groupStructure ? (
                                <AvailableFollowingGroupList
                                  structure={groupStructure}
                                  gender={leader.gender?.toLowerCase() === "male" ? "Male" : "Female"}
                                  mainGroup={selectedMainGroup}
                                  selectedFollowingGroup={selectedFollowingGroup}
                                  onSelectionChange={(val: string) => {
                                    setSelectedFollowingGroup(val);
                                    setIsDirty(true);
                                  }}
                                  leaderType={
                                    leader.type === "leader1" ? "leader1" : leader.type === "leader2" ? "leader2" : undefined
                                  }
                                  isReplacementCase={true}
                                  disabled={isSaving}
                                />
                              ) : (
                                <div className="text-center py-2 text-gray-500">Loading groups...</div>
                              )
                            ) : (
                              <div className="p-2 text-sm text-slate-400 bg-slate-100 rounded-lg">
                                {selectedFollowingGroup || "None"}
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {leader?.staying === "yes" && (
                        <div
                          className={`flex flex-col gap-2 p-3 rounded-xl border transition-all duration-300 shadow-sm ${
                            selectedRoomId === "-1"
                              ? "border-red-400 bg-red-50/50 animate-pulse-subtle"
                              : !canEditRoom
                              ? "bg-gray-100/60 opacity-60 border-gray-200"
                              : "bg-white border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <label
                              className={`text-[10px] font-bold uppercase tracking-wider ${
                                selectedRoomId === "-1" ? "text-red-100" : "text-slate-500"
                              }`}
                            >
                              Room
                            </label>

                            {selectedRoomId === "-1" && (
                              <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase">
                                Waiting List
                              </span>
                            )}
                          </div>

                          {canEditRoom ? (
                            <RoomListCompound
                              key={`room-${selectedRoomId}-${Date.now()}`}
                              personType="leader"
                              genderFilter={leader.gender as "male" | "female"}
                              initialRoomId={selectedRoomId}
                              activeRoomId={leader.id}
                              onRoomSelect={(room: any) => {
                                setSelectedRoomId(String(room?.roomId || ""));
                                setIsDirty(true);
                              }}
                            />
                          ) : (
                            <div
                              className={`p-2 text-xs font-semibold rounded-lg border border-dashed transition-colors duration-200 ${
                                selectedRoomId === "-1"
                                  ? "border-red-300 text-red-700 bg-red-50"
                                  : "border-slate-200 text-slate-500 bg-slate-100"
                              }`}
                            >
                              {selectedRoomId === "-1" ? "⚠️ No Room Assigned" : selectedRoomId || "Unassigned"}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {isAbsent && (
                  <div className="mt-6 p-6 bg-amber-50 border border-amber-200 rounded-xl text-center">
                    <FiClock className="text-amber-500 text-3xl mx-auto mb-2" />
                    <h3 className="text-lg font-semibold text-amber-800">Leader is Absent</h3>
                    <p className="text-amber-600 text-sm mt-1">
                      No allocation or replacement options available for absent leaders.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Snackbar Actions - Slides from under the bottom nav */}
      <div 
        className={`fixed left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-[360px] z-40 sm:hidden transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${
          hasAccess() && isDirty 
            ? "bottom-24 translate-y-0 opacity-100 scale-100" 
            : "bottom-0 translate-y-full opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-2xl p-3 flex items-center justify-between ring-1 ring-black/5">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest leading-none">Changes Pending</span>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5">Leader allocation updated</span>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={!canSave || isSaving}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs tracking-widest transition-all ${
              canSave && !isSaving 
                ? "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-md shadow-indigo-200" 
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            {isSaving ? <FiLoader className="animate-spin" size={14} /> : <FiSave size={14} />}
            {isSaving ? "SAVING..." : "SAVE NOW"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReplacementLeaderDetailComponent;
