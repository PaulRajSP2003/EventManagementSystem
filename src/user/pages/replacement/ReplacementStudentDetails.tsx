// src/user/pages/replacement/ReplacementStudentDetails.tsx
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiUser,
  FiMapPin,
  FiActivity,
  FiSave,
  FiRefreshCw,
  FiLoader,
  FiClock,
} from 'react-icons/fi';
import { FaChurch, FaBriefcaseMedical, FaMars, FaVenus } from 'react-icons/fa6';
import type { Student } from '../../../types';
import RoomListCompound from '../components/RoomListCompound';
import AvailableFollowingGroupList from '../components/AvailableFollowingGroupList';
import { followingGroupAPI } from '../api/FollowingGroupDataAPI';
import type { GroupStructure } from '../api/FollowingGroupDataAPI';
import { replacementStudentAPI } from '../api/ReplacementStudentData';
import AccessAlert from '../components/AccessAlert';
import { isAdminOrCoAdmin, fetchPermissionData, type PermissionData } from '../permission';

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

const AttendanceSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-pulse">
    <div className="h-7 w-48 bg-slate-200 rounded mb-4"></div>
    <div className="h-10 bg-slate-200 rounded-lg"></div>
  </div>
);

const AllocationSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 animate-pulse">
    {[...Array(2)].map((_, i) => (
      <div key={i} className="flex flex-col gap-2 p-3 rounded-xl border bg-slate-50">
        <div className="h-4 w-24 bg-slate-200 rounded"></div>
        <div className="h-10 bg-slate-200 rounded-lg"></div>
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
      <div className="font-medium text-gray-900 mt-0.5">{value ?? '-'}</div>
    </div>
  </div>
);

// ─── Main Component ─────────────────────────────────────────────────
const ReplacementStudentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Permission data state
  const [permissionData, setPermissionData] = useState<PermissionData | null>(null);
  const [permissionLoading, setPermissionLoading] = useState(true);
  const [permissionError, setPermissionError] = useState<boolean>(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [student, setStudent] = useState<Student | null>(null);
  const [status, setStatus] = useState<string>("Present");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [isDirty, setIsDirty] = useState(false);
  const [originalData, setOriginalData] = useState<Student | null>(null);
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
        // Real API call - cookies are sent automatically with credentials: 'include'
        const studentData = await replacementStudentAPI.getById(Number(id));
        setStudent(studentData);
        setOriginalData(studentData);
        applyOriginalData(studentData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching student:', err);
        
        // Check if it's a permission error
        const errorMsg = err instanceof Error ? err.message : 'Failed to load student data';
        if (errorMsg.toLowerCase().includes('forbidden') || 
            errorMsg.toLowerCase().includes('unauthorized') ||
            errorMsg.toLowerCase().includes('permission')) {
          setAccessDenied(true);
          setErrorMessage(errorMsg);
        }
        
        setStudent(null);
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchData();
    }
  }, [id, isAdmin]);

  // Fetch group structure
  useEffect(() => {
    const loadGroupStructure = async () => {
      if (hasAccess()) {
        try {
          const data = await followingGroupAPI.fetchGroupStructure();
          setGroupStructure(data);
        } catch (error) {
          console.error('Failed to load group structure:', error);
        }
      }
    };

    loadGroupStructure();
  }, [permissionData]);

  // Sync UI when originalData changes
  useEffect(() => {
    if (originalData) {
      setStatus(originalData.status?.charAt(0).toUpperCase() + originalData.status?.slice(1) || "Present");
      setSelectedGroup(originalData.mentor_group ?? "");
      setSelectedRoomId(originalData.room_id ?? "");
      setIsDirty(false);
    }
  }, [originalData]);

  const applyOriginalData = (data: Student) => {
    setStatus(data.status?.charAt(0).toUpperCase() + data.status?.slice(1) || "Present");
    setSelectedGroup(data.mentor_group ?? "");
    setSelectedRoomId(data.room_id ?? "");
    setIsDirty(false);
  };

  const handleReset = () => {
    if (originalData && hasAccess()) applyOriginalData(originalData);
  };

  const isPresent = status === "Present";
  const isRegistered = status === "Registered";
  const isStaying = student?.staying === "yes";

  const canEditGroup = (isPresent || isRegistered) && hasAccess();
  const canEditRoom = isPresent && isStaying && hasAccess();

  // ── Change Detection ───────────────────────────────────────────────
  const changeJson = useMemo(() => {
    if (!student || !originalData) return {};

    const changes: any = {};

    const currentStatusLower = status.toLowerCase() as 'present' | 'registered';
    const statusChanged = currentStatusLower !== originalData.status;

    // Calculate new room value (clear room if status changed from present to registered)
    const shouldAutoClearRoom =
      originalData.status === "present" &&
      status.toLowerCase() === "registered" &&
      originalData.room_id !== "";

    const newRoomValue = shouldAutoClearRoom
      ? ""
      : (selectedRoomId ? String(selectedRoomId) : "");

    const roomChanged = String(newRoomValue) !== String(originalData.room_id || "");

    const originalGroup = originalData.mentor_group ?? "";
    const groupChanged = selectedGroup !== originalGroup;

    // Build simplified changes object with only new values
    if (statusChanged) {
      changes.status = currentStatusLower;
    }

    if (groupChanged) {
      changes.mentor_group = selectedGroup || null;
    }

    if (roomChanged) {
      changes.room_id = newRoomValue;
    }

    return Object.keys(changes).length > 0 ? changes : {};
  }, [status, selectedGroup, selectedRoomId, originalData, student]);

  const hasAllocationChanges = Object.keys(changeJson).length > 0;
  const canSave = isDirty && hasAllocationChanges && hasAccess();

  const handleSave = async () => {
    if (!canSave || !hasAccess() || !student || typeof student.id !== 'number') return;

    setIsSaving(true);
    try {
      // Cookies are sent automatically with credentials: 'include'
      const data = await replacementStudentAPI.update(
        student.id,
        changeJson
      );

      // Update local state with response
      const updatedStudent: Student = {
        ...student,
        mentor_group: data.mentorGroup ?? student.mentor_group,
        room_id: data.roomId ?? student.room_id,
        status: data.status ?? student.status,
        staying: data.staying ?? student.staying,
      };
      setOriginalData(updatedStudent);
      setStudent(updatedStudent);
      setIsDirty(false);
    } catch (err) {
      console.error('Failed to update student:', err);
      
      // Check if it's a permission error
      const errorMsg = err instanceof Error ? err.message : 'Failed to update student';
      if (errorMsg.toLowerCase().includes('forbidden') || 
          errorMsg.toLowerCase().includes('unauthorized')) {
        setAccessDenied(true);
        setErrorMessage(errorMsg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  // ── Header Component ─────────────────────────────────────────────────
  const Header = () => (
    <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-[11px] border-b border-gray-100">
      <div className="max-w-6xl mx-auto flex justify-between items-center min-h-[36px]">

        {/* LEFT */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium"
          >
            <FiArrowLeft /> Back
          </button>

          <div className="h-4 w-[1px] bg-gray-300 hidden sm:block"></div>

          <h1 className="text-lg font-bold text-slate-800 hidden sm:block">
            Replacement Student Detail
          </h1>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2 sm:gap-3">

          {hasAccess() && isDirty && (
            <button
              onClick={handleReset}
              disabled={isSaving}
              className="flex items-center gap-2 px-2 py-2 text-sm font-medium transition
               text-rose-600 hover:text-rose-800 disabled:opacity-50"
            >
              <FiRefreshCw className={isSaving ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          {hasAccess() && (
            <button
              onClick={handleSave}
              disabled={!canSave || isSaving}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition border
              ${canSave && !isSaving
                  ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
                  : "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-70"
                }`}
            >
              {isSaving ? (
                <FiLoader className="animate-spin" />
              ) : (
                <FiSave />
              )}
              <span className="hidden sm:inline">
                {isSaving ? "Saving..." : "Save Changes"}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Show loading while permissions are loading
  if (permissionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
        <Header />
        <div className="max-w-6xl mx-auto px-4 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ProfileSkeleton />
            <div className="lg:col-span-2 space-y-6">
              <AttendanceSkeleton />
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
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied if not admin/co-admin or permission error
  if (!isAdmin || permissionError || accessDenied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <AccessAlert message={errorMessage || "This page is only accessible to administrators."} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
        <Header />
        <div className="max-w-6xl mx-auto px-4 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ProfileSkeleton />
            <div className="lg:col-span-2 space-y-6">
              <AttendanceSkeleton />
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
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-20 text-center text-slate-500">
          Student not found
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
      <Header />

      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT COLUMN - Profile + Status (read-only) */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
              <div className="px-6 pb-6 text-center -mt-12 relative">
                <div
                  className="w-24 h-24 mx-auto bg-white p-1 rounded-full shadow-lg"
                  style={{ border: `4px solid ${student.tagColor || '#6366f1'}` }}
                >
                  <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-2xl font-bold text-indigo-600">
                    {getInitials(student.name)}
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-slate-800 mt-3 capitalize">{student.name}</h1>
                <p className="text-slate-500 text-sm mt-1">ID: #{student.id} • {student.age} Years</p>
                <div className="flex justify-center gap-2 mt-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${status === 'Present'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                    }`}>
                    {status}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-slate-100 text-slate-600 flex items-center gap-1">
                    {student.gender === 'male' ? <FaMars /> : <FaVenus />} {student.gender || '?'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <button
                onClick={() => student && navigate(`/user/student/${student.id}`)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition
               border bg-indigo-50 border-indigo-200 text-indigo-700
               hover:bg-indigo-100"
              >
                <FiUser />
                <span className="hidden sm:inline">View Profile</span>
              </button>
            </div>


            {/* Attendance Status - Read-only display */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                <FiActivity className="text-indigo-500" /> Attendance Status
              </h3>
              <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium">
                {status}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Details + Allocation */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <SectionHeader icon={FiUser} title="Student Personal Details" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 capitalize">
                <InfoItem
                  icon={FiUser}
                  label="Parent Name"
                  value={student.parentName}
                  color="text-blue-500"
                />
                <InfoItem
                  icon={FiMapPin}
                  label="Place / City"
                  value={student.place ? student.place.split(',')[0].trim() : 'N/A'}

                  color="text-red-500"
                />
                <InfoItem
                  icon={FaChurch}
                  label="Home Church"
                  value={student.churchName}
                  color="text-amber-500"
                />
                <InfoItem
                  icon={FaBriefcaseMedical}
                  label="Medications"
                  value={student.medication === "yes" ? "Yes" : "None"}
                  color="text-green-500"
                />
              </div>

              <SectionHeader icon={FiRefreshCw} title="Replacement & Allocation" />

              {status !== "Absent" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {/* Mentor Group */}
                  <div className={`flex flex-col gap-2 p-3 rounded-xl border ${!canEditGroup ? "bg-gray-100 opacity-60" : "bg-slate-50"
                    }`}>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Mentor Group</label>

                    {canEditGroup ? (
                      groupStructure ? (
                        <AvailableFollowingGroupList
                          structure={groupStructure}
                          gender={student.gender === 'male' ? 'Male' : 'Female'}
                          mainGroup={`${student.gender === 'male' ? 'M' : 'F'}${student.mentor_age_group ?? ""}`}
                          selectedFollowingGroup={selectedGroup}
                          onSelectionChange={(followingGroupName: string) => {
                            setSelectedGroup(followingGroupName);
                            setIsDirty(true);
                          }}
                          disabled={isSaving}
                        />
                      ) : (
                        <div className="text-center py-2 text-gray-500">Loading groups...</div>
                      )
                    ) : (
                      <div className="p-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg">
                        {selectedGroup || "—"}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <div className="px-2 py-1 bg-violet-50 rounded text-[10px] text-violet-700 font-bold border border-violet-100">
                        Mentor Age Group: {student.mentor_age_group || "—"}
                      </div>
                    </div>
                  </div>

                  {/* Room Allocation - Only show if staying === "yes" */}
                  {isStaying && (
                    <div className={`flex flex-col gap-2 p-3 rounded-xl border transition-all duration-300 shadow-sm ${selectedRoomId === "-1"
                      ? "border-red-400 bg-red-50/50 animate-pulse-subtle"
                      : !canEditRoom
                        ? "bg-gray-100/60 opacity-60 border-gray-200"
                        : "bg-white border-slate-200 hover:border-slate-300"
                      }`}>
                      <div className="flex items-center justify-between">
                        <label className={`text-[10px] font-bold uppercase tracking-wider ${selectedRoomId === "-1" ? "text-red-600" : "text-slate-500"
                          }`}>
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
                          personType="student"
                          genderFilter={student.gender as 'male' | 'female'}
                          initialRoomId={selectedRoomId}
                          activeRoomId={student.id}
                          onRoomSelect={(room: any) => {
                            setSelectedRoomId(String(room?.roomId || ""));
                            setIsDirty(true);
                          }}
                        />
                      ) : (
                        <div className={`p-2 text-xs font-semibold rounded-lg border border-dashed transition-colors duration-200 ${selectedRoomId === "-1"
                          ? "border-red-300 text-red-700 bg-red-50"
                          : "border-slate-200 text-slate-500 bg-slate-100"
                          }`}>
                          {selectedRoomId === "-1" ? "⚠️ No Room Assigned" : (selectedRoomId || "Unassigned")}
                        </div>
                      )}
                    </div>
                  )}
                </div>
               ) : (
                // Show absent message
                <div className="mt-6 p-6 bg-amber-50 border border-amber-200 rounded-xl text-center">
                  <FiClock className="text-amber-500 text-3xl mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-amber-800">Student is Absent</h3>
                  <p className="text-amber-600 text-sm mt-1">
                    No allocation or replacement options available for absent students.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReplacementStudentDetail;