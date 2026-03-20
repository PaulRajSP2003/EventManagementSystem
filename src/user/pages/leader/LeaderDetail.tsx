// src/user/pages/leader/LeaderDetail.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { leaderAPI } from '../api/LeaderData';
import {
  FiEdit,
  FiUser,
  FiPhone,
  FiMapPin,
  FiUsers,
  FiActivity,
  FiSave,
  FiMessageSquare,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
} from 'react-icons/fi';
import { FaChurch, FaWhatsapp, FaMars, FaVenus } from 'react-icons/fa6';
import EmptyState from '../components/EmptyState';
import { PAGE_PERMISSIONS, canAccess, isAdminOrCoAdmin, fetchPermissionData, type PermissionData } from '../permission';
import { StickyHeader, AccessAlert } from '../components';

// Reusable Components
const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center gap-2 mb-4 mt-8 pb-2 border-b border-gray-100">
    <Icon className="text-indigo-500 text-lg" />
    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
  </div>
);

const InfoItem = ({ icon: Icon, label, value, color = "text-gray-500", onClick }: any) => (
  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
    <div className={`p-2 rounded-full bg-white border border-gray-100 ${color} group-hover:scale-110 transition-transform`}>
      <Icon className="text-lg" />
    </div>
    <div className="flex-1">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      {onClick ? (
        <div
          onClick={onClick}
          className="font-medium text-gray-900 mt-0.5 cursor-pointer hover:text-indigo-600 hover:underline decoration-indigo-300 underline-offset-2 transition-all"
        >
          {value}
        </div>
      ) : (
        <div className="font-medium text-gray-900 mt-0.5">{value}</div>
      )}
    </div>
  </div>
);

// Skeleton Components
const SkeletonBlock = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
);

const LeaderDetailSkeleton = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 mt-2 sm:mt-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <SkeletonBlock className="h-2 w-full opacity-50" />
            <SkeletonBlock className="h-32 w-full rounded-none" />
            <div className="px-6 pb-6 text-center -mt-12">
              <div className="inline-block p-1 bg-white rounded-full">
                <SkeletonBlock className="h-24 w-24 rounded-full" />
              </div>
              <SkeletonBlock className="h-7 w-48 mx-auto mt-4 mb-2" />
              <SkeletonBlock className="h-4 w-32 mx-auto mb-6" />
              <div className="flex justify-center gap-2">
                <SkeletonBlock className="h-6 w-20 rounded-full" />
                <SkeletonBlock className="h-6 w-24 rounded-full" />
                <SkeletonBlock className="h-6 w-16 rounded-full" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <SkeletonBlock className="h-5 w-24" />
            <div className="space-y-3">
              <SkeletonBlock className="h-10 w-full rounded-lg" />
              <SkeletonBlock className="h-12 w-full rounded-lg" />
              <SkeletonBlock className="h-11 w-full rounded-lg" />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <SkeletonBlock className="h-5 w-32" />
            <SkeletonBlock className="h-14 w-full rounded-xl" />
            <SkeletonBlock className="h-14 w-full rounded-xl" />
          </div>
        </div>
        {/* RIGHT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-8">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-4">
                <div className="flex items-center gap-2">
                  <SkeletonBlock className="h-5 w-5 rounded-full" />
                  <SkeletonBlock className="h-6 w-40" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SkeletonBlock className="h-14 w-full rounded-xl" />
                  <SkeletonBlock className="h-14 w-full rounded-xl" />
                  <SkeletonBlock className="h-14 w-full rounded-xl" />
                  <SkeletonBlock className="h-14 w-full rounded-xl" />
                </div>
              </div>
            ))}
            <hr className="border-slate-100" />
            <div className="space-y-4">
              <SkeletonBlock className="h-6 w-48" />
              <SkeletonBlock className="h-48 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Permission constants
const PAGE_ID = PAGE_PERMISSIONS.LEADER_DETAIL;
const ACTION_ID = PAGE_PERMISSIONS.LEADER_STATUS_UPDATE;
const LEADER_EDIT = PAGE_PERMISSIONS.LEADER_EDIT;

const LeaderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Permission data state
  const [permissionData, setPermissionData] = useState<PermissionData | null>(null);
  const [permissionLoading, setPermissionLoading] = useState(true);
  const [permissionError, setPermissionError] = useState<boolean>(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [leader, setLeader] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [showSuccessActions, setShowSuccessActions] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);

  // State for form inputs
  const [status, setStatus] = useState<'present' | 'registered' | 'absent'>('present');
  const [staying, setStaying] = useState<boolean>(false);

  // Initial values for dirty checking
  const [initialStatus, setInitialStatus] = useState<string>('');
  const [initialStaying, setInitialStaying] = useState<boolean>(false);

  // Track if this is the first load
  const isFirstLoad = useRef(true);
  // Track if we're in the middle of a save operation
  const isSavingRef = useRef(false);
  // Track if we're currently fetching data
  const isFetchingRef = useRef(false);

  // Fetch permission data on component mount
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        setPermissionLoading(true);
        setPermissionError(false);
        const data = await fetchPermissionData();
        setPermissionData(data);
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

  // Permission checks using ONLY permissionData
  const hasPageAccess = () => {
    if (!permissionData || accessDenied || permissionError) return false;
    return canAccess(permissionData, PAGE_ID);
  };

  const hasActionAccess = () => {
    if (!permissionData || accessDenied || permissionError) return false;
    return canAccess(permissionData, ACTION_ID);
  };

  const hasEditPermission = () => {
    if (!permissionData || accessDenied || permissionError) return false;
    return canAccess(permissionData, LEADER_EDIT);
  };

  const isAdmin = () => {
    if (!permissionData || accessDenied || permissionError) return false;
    return isAdminOrCoAdmin(permissionData);
  };

  // Fetch leader data
  const fetchLeaderData = async (skipFirstLoadReset = false) => {
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;

    try {
      const numericId = Number(id);
      if (!id || isNaN(numericId)) {
        setNotFound(true);
        return;
      }

      const data = await leaderAPI.getDetail(numericId);


      const processedData = {
        ...data,
        roomName: data?.roomName || data?.room_number || '',
        staying: data?.staying || 'no',
        status: data?.status || 'registered',
      };

      setLeader(processedData);

      const newStatus = processedData?.status ?? 'registered';
      const newStaying = processedData?.staying === "yes";

      setStatus(newStatus);
      setStaying(newStaying);
      setInitialStatus(newStatus);
      setInitialStaying(newStaying);

      if (!skipFirstLoadReset && isFirstLoad.current) {
        isFirstLoad.current = false;
      }
    } catch (error) {
      console.error('Error fetching leader:', error);

      // Check if it's a permission error
      const errorMsg = error instanceof Error ? error.message : 'Failed to load leader data';
      if (errorMsg.toLowerCase().includes('forbidden') ||
        errorMsg.toLowerCase().includes('unauthorized') ||
        errorMsg.toLowerCase().includes('permission')) {
        setAccessDenied(true);
        setErrorMessage(errorMsg);
      } else {
        setNotFound(true);
      }
    } finally {
      isFetchingRef.current = false;
    }
  };

  // Initial load
  useEffect(() => {
    if (!hasPageAccess()) {
      setLoading(false);
      return;
    }

    const loadLeader = async () => {
      setLoading(true);
      setNotFound(false);
      setMessage(null);
      await fetchLeaderData(false);
      setLoading(false);
    };

    loadLeader();

    // Cleanup function
    return () => {
      isFirstLoad.current = true;
      isFetchingRef.current = false;
    };
  }, [id, permissionData]);

  // Refresh when id changes (but don't reset first load flag)
  useEffect(() => {
    if (hasPageAccess() && id && !isNaN(Number(id)) && !loading && !isFirstLoad.current) {
      fetchLeaderData(true); // true = skip resetting first load flag
    }
  }, [id]);

  // Auto-uncheck staying when status ≠ present
  useEffect(() => {
    if (status !== 'present' && staying) {
      setStaying(false);
    }
  }, [status]);

  // Show alert if returning from edit
  useEffect(() => {
    if (location.state?.fromEdit && status !== 'registered') {
      setShowAlert(true);
      const timer = setTimeout(() => setShowAlert(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state, status]);

  // Dirty check - FIXED VERSION
  const isDirty = useMemo(() => {
    // Don't show dirty if still loading or no leader data
    if (loading || !leader || isFetchingRef.current) return false;

    // Don't show dirty during save operation
    if (isSavingRef.current || isSaving) return false;

    // Don't show dirty on first load
    if (isFirstLoad.current) return false;

    // Compare current values with initial values
    const statusChanged = status !== initialStatus;
    const stayingChanged = staying !== initialStaying;

    return statusChanged || stayingChanged;
  }, [status, staying, initialStatus, initialStaying, leader, loading, isSaving]);

  const isEditEnabled = leader && leader.status === 'registered';

  const handleDisabledEditClick = () => {
    if (!isEditEnabled) {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000);
    }
  };

  const handleSave = async () => {
    if (!isDirty || isSaving || !hasActionAccess()) return;

    setIsSaving(true);
    isSavingRef.current = true;
    setMessage(null);
    setShowSuccessActions(false);

    const updatedStatus = status;
    const updatedStaying = status === 'present' ? (staying ? "yes" : "no") : "no";

    try {
      console.debug('[DEBUG] Saving changes:', { status: updatedStatus, staying: updatedStaying });

      const response = await leaderAPI.changeLeaderStatus(Number(id), updatedStatus, updatedStaying);

      // debug: log last API response
      console.debug('Leader change response:', response);

      if (!response || !response.success) {
        setMessage(response?.message || "Failed to update leader");
        return;
      }

      // Update room name and other fields from response immediately
      if (response.data) {
        // Update leader state
        setLeader((prev: any) => ({
          ...prev,
          ...response.data,
          roomName: response.data.roomName || response.data.room_number || '',
        }));

        // Update initial values immediately to prevent dirty state
        const newStatus = response.data.status ?? status;
        const newStaying = response.data.staying === 'yes';

        setInitialStatus(newStatus);
        setInitialStaying(newStaying);

        // Also update current status to match
        setStatus(newStatus);
        setStaying(newStaying);
      }

      setMessage(response.message || "Saved successfully");
      setShowSuccessActions(true);

      // Re-fetch full data after update for consistency
      // Pass true to skip resetting first load flag
      await fetchLeaderData(true);

    } catch (error) {
      console.error('[DEBUG] Save error:', error);

      // Check if it's a permission error
      const errorMsg = error instanceof Error ? error.message : "Failed to update leader";
      if (errorMsg.toLowerCase().includes('forbidden') ||
        errorMsg.toLowerCase().includes('unauthorized')) {
        setAccessDenied(true);
        setErrorMessage(errorMsg);
      }

      setMessage(errorMsg);
    } finally {
      setIsSaving(false);
      isSavingRef.current = false;
      setTimeout(() => {
        setMessage(null);
        setShowSuccessActions(false);
      }, 3000);
    }
  };

  const getStatusBadge = (statusValue: string) => {
    const map: Record<string, string> = {
      present: "bg-emerald-100 text-emerald-700",
      registered: "bg-orange-100 text-orange-700",
      absent: "bg-red-100 text-red-700",
    };
    return map[statusValue] || "bg-gray-100 text-gray-700";
  };

  const getInitials = (name: string) => name.trim()[0]?.toUpperCase() || '';

  const goToLeader = (leaderId: number) => {
    if (leaderId) navigate(`/user/leader/${leaderId}`);
  };

  const goToStudent = (studentId: number) => {
    if (studentId) navigate(`/user/student/${studentId}`);
  };

  const goToRoom = () => {
    if (leader?.roomName && leader?.gender) {
      const gender = leader.gender;
      const roomName = leader.roomName;
      navigate(`/user/room/${gender}/${roomName}/all`);
    } else if (leader?.room_number && leader?.gender) {
      const gender = leader.gender;
      const roomName = leader.room_number;
      navigate(`/user/room/${gender}/${roomName}/all`);
    }
  };

  // WhatsApp message generator
  const generateWhatsAppMessage = (group: any, isSubGroup: boolean = false) => {
    const groupName = isSubGroup ? group.subgroupName : group.followingName;
    const absentStudents = group.students.filter((s: any) => s.status === 'absent');

    let message = `Praise the Lord Bro. Paul,\n`;
    message += `This message is to inform you about your following group assignment.\n\n`;
    message += `*Group Details*\n`;
    message += `Age Group: Male Group ${leader?.isFollowing || ''}\n`;
    message += `${isSubGroup ? 'Sub' : 'Following'} Group: ${groupName}\n\n`;
    message += `*Co-Leader Details*\n`;
    message += `Name: ${group.leader2?.name || 'N/A'}\n`;
    message += `Place: ${group.leader2?.place || 'N/A'}\n`;
    message += `Contact: ${group.leader2?.contactNumber || 'N/A'}\n`;
    message += `WA: ${group.leader2?.whatsappNumber || 'N/A'}\n\n`;
    message += `*Student Details*\n`;
    group.students.forEach((student: any, index: number) => {
      message += `${index + 1}. Name: ${student.name} (ID: ${student.id})\n`;
      message += ` Age: ${student.age || '—'}\n`;
      message += ` Place: ${student.place}\n`;
      message += ` Contact: ${student.contactNumber}\n`;
      message += ` WA: ${student.whatsappNumber}\n`;
    });
    if (absentStudents.length > 0) {
      message += `\n*Absent Students:*\n`;
      absentStudents.forEach((student: any, index: number) => {
        message += `${index + 1}. Name: ${student.name} (ID: ${student.id}) **ABSENT**\n`;
        message += ` Age: ${student.age || '—'}\n`;
        message += ` Place: ${student.place}\n`;
        message += ` Contact: ${student.contactNumber}\n`;
        message += ` WA: ${student.whatsappNumber}\n`;
      });
    }
    message += `\nThank you for your support.\n`;
    message += `Regards,\n`;
    message += `Paul Raj\n`;
    message += `admin\n`;
    message += `Contact: 1234567890\n`;
    message += `God bless you.`;
    return message;
  };

  const openWhatsApp = (phone: string, message: string) => {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  // ────────────────────────────────────────────────
  // LOADING / ACCESS / NOT FOUND STATES
  // ────────────────────────────────────────────────

  if (permissionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
        <StickyHeader title="Leader Details" onBack={() => navigate('/user/leader')}>
          <button disabled className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition border bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-70">
            <FiEdit /> Edit Profile
          </button>
        </StickyHeader>
        <LeaderDetailSkeleton />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
        <StickyHeader title="Leader Details" onBack={() => navigate('/user/leader')}>
          <button disabled className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition border bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-70">
            <FiEdit /> Edit Profile
          </button>
        </StickyHeader>
        <LeaderDetailSkeleton />
      </div>
    );
  }

  if (accessDenied || permissionError || !hasPageAccess()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <AccessAlert message={errorMessage || "You do not have access to view this leader."} />
      </div>
    );
  }

  if (notFound || !leader) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
        <StickyHeader title="Leader Details" onBack={() => navigate('/user/leader')}>
          <button disabled className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition border bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-70">
            <FiEdit /> Edit Profile
          </button>
        </StickyHeader>
        <div className="max-w-6xl mx-auto py-16 px-4 flex justify-center">
          <EmptyState
            title="Leader Not Found"
            message="The leader with this ID could not be found."
            buttonText="Back to Leaders List"
            navigatePath="/user/leader"
          />
        </div>
      </div>
    );
  }

  // Consider any non-empty, non-'no' value as following
  const isFollowing = !!leader.isFollowing && leader.isFollowing !== "no";
  const followingLabel = isFollowing ? `Group ${leader.isFollowing}` : "Not Follow";
  // Show followingGroup if present and not absent
  const shouldShowFollowingGroup = !!leader.followingGroup && leader.followingGroup.length > 0 && status !== 'absent';
  // Show subGroups if present and status is present
  const shouldShowSubGroups = !!leader.subGroups && leader.subGroups.length > 0 && status === 'present';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
      <StickyHeader title="Leader Details" onBack={() => navigate('/user/leader')}>
        <div className="relative group">
          <button
            onClick={() => {
              if (leader?.status === 'registered' && hasEditPermission()) {
                navigate(`/user/leader/edit/${leader.id}`);
              } else {
                handleDisabledEditClick();
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition text-sm font-medium ${leader?.status === 'registered' && hasEditPermission()
              ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
              }`}
          >
            <FiEdit />
            Edit Profile
          </button>
          {!(leader?.status === 'registered' && hasEditPermission()) && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-slate-800 text-white text-[11px] p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
              {!hasEditPermission()
                ? 'Editing Disabled - No Edit Permission'
                : 'Only status "Registered" leaders can be edited.'}
            </div>
          )}
        </div>
      </StickyHeader>

      <div className="max-w-6xl mx-auto px-4 mt-2 sm:mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden relative">
              <div className="h-2 w-full" style={{ backgroundColor: leader.tagColor || "#e91e63" }}></div>
              <div className="h-32 bg-gradient-to-r from-pink-600 to-red-600"></div>
              <div className="px-6 pb-6 text-center -mt-12 relative">
                <div className="w-24 h-24 mx-auto bg-white p-1 rounded-full relative z-10" style={{ border: `4px solid ${leader.tagColor || "#e91e63"}` }}>
                  <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-2xl font-bold text-pink-600">
                    {getInitials(leader.name)}
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-slate-800 mt-3 capitalize">{leader.name}</h1>
                <p className="text-slate-500 text-sm flex items-center justify-center gap-2 mt-1">
                  <span>ID: #{leader.id}</span>
                  <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                  <span className="capitalize">
                    {leader.type === "leader1" || leader.type === "leader2" ? "Mentor" : leader.type}
                  </span>
                </p>
                <div className="flex justify-center gap-2 mt-4 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusBadge(status)}`}>
                    {status}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-pink-50 text-pink-700">
                    {followingLabel}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600 flex items-center gap-1">
                    {leader.gender === "male" ? <FaMars /> : <FaVenus />} {leader.gender}
                  </span>
                </div>
              </div>
            </div>
            {isAdmin() && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate(`/user/leader/history/${leader.id}`)}
                    className="flex-1 hidden sm:flex items-center justify-center gap-2 px-4 py-2 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition"
                  >
                    <FiClock /> History
                  </button>
                  <button
                    onClick={() => navigate(`/user/leader/replacement/${leader.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-pink-200 bg-pink-50 text-pink-700 rounded-lg text-sm font-medium hover:bg-pink-100 transition"
                  >
                    <FiActivity /> Replacement
                  </button>


                </div>
              </div>
            )}

            {/* Admin Actions Card */}
            {hasActionAccess() && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-3">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <FiActivity className="text-pink-500" /> Actions
                  </h3>
                  <div className="flex flex-wrap items-center gap-4">
                    {isSaving ? (
                      <span className="text-xs text-indigo-600 font-semibold flex items-center gap-1.5 animate-pulse">
                        <FiSave className="w-3.5 h-3.5" /> Saving...
                      </span>
                    ) : isDirty && !isSaving ? (
                      <span className="text-xs text-amber-600 font-semibold animate-pulse">
                        Unsaved Changes
                      </span>
                    ) : message && showSuccessActions ? (
                      <span className="text-xs text-green-600 font-semibold flex items-center gap-1.5">
                        <FiCheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        {message}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className={`transition-all duration-300 p-1 rounded-lg ${showAlert && status !== 'registered' ? 'bg-red-50 ring-2 ring-red-500' : ''}`}>
                    <label className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase mb-1.5">
                      <span>Status</span>
                      {showAlert && status !== 'registered' && (
                        <span className="text-red-600 normal-case font-bold flex items-center gap-1 animate-[bounce_1s_infinite]">
                          <FiAlertCircle className="w-3.5 h-3.5" /> Set to Registered and save
                        </span>
                      )}
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as typeof status)}
                      disabled={isSaving || !hasActionAccess()}
                      className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none transition-colors ${showAlert && status !== 'registered' ? 'border-red-500 bg-white' : 'bg-slate-50 border-slate-200'
                        }`}
                    >
                      <option value="present">Present</option>
                      <option value="registered">Registered</option>
                      <option value="absent">Absent</option>
                    </select>
                  </div>

                  <div
                    className={`p-3 rounded-lg border-2 transition-all ${staying ? 'border-pink-500 bg-pink-50' : 'border-slate-200 hover:border-slate-300'
                      } ${status !== 'present' && 'opacity-60'}`}
                  >
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={staying}
                        onChange={(e) => setStaying(e.target.checked)}
                        disabled={status !== 'present' || isSaving || !hasActionAccess()}
                        className="rounded text-pink-600"
                      />
                      <span className={`text-sm font-medium ${status !== 'present' && 'text-gray-400'}`}>
                        Staying at Venue
                      </span>
                    </label>
                  </div>

                  <button
                    disabled={!isDirty || isSaving || !hasActionAccess()}
                    onClick={handleSave}
                    className={`w-full font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition ${isDirty && !isSaving && hasActionAccess()
                      ? "bg-pink-600 hover:bg-pink-700 text-white"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                      }`}
                  >
                    <FiSave />
                    {isSaving ? 'Saving...' : 'Update Leader'}
                  </button>
                </div>
              </div>
            )}

            {/* Quick Contact */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
              <h3 className="font-bold text-slate-800 mb-4">Quick Contact</h3>
              <div className="space-y-3">
                <a
                  href={`tel:${leader.contactNumber}`}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
                >
                  <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">
                    <FiPhone />
                  </div>
                  <span className="font-medium text-slate-700">{leader.contactNumber}</span>
                </a>
                <a
                  href={`https://wa.me/${leader.whatsappNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
                >
                  <div className="bg-green-100 p-2 rounded-full text-green-600">
                    <FaWhatsapp />
                  </div>
                  <span className="font-medium text-slate-700">WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Remark */}
            {leader.remark && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <FiMessageSquare className="text-purple-500" />
                  Remark
                </h3>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                  <p className="text-slate-600 leading-relaxed italic">
                    "{leader.remark}"
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <SectionHeader icon={FiUser} title="Personal Details" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                <InfoItem icon={FiMapPin} label="Place" value={leader.place ? leader.place.charAt(0).toUpperCase() + leader.place.slice(1).toLowerCase() : 'N/A'} color="text-red-500" />
                <InfoItem icon={FaChurch} label="Church" value={leader.churchName ? leader.churchName.charAt(0).toUpperCase() + leader.churchName.slice(1).toLowerCase() : 'N/A'} color="text-amber-600" />
                <InfoItem
                  icon={FiUsers}
                  label="Following Students"
                  value={followingLabel}
                  color={isFollowing ? "text-indigo-500" : "text-gray-500"}
                />
              </div>

              <SectionHeader icon={FiMapPin} title="Accommodation Details" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 capitalize">
                <InfoItem
                  icon={FiActivity}
                  label="Room Status"
                  value={staying ? "Staying" : "Not Staying"}
                  color={staying ? "text-emerald-500" : "text-red-500"}
                />
                <InfoItem
                  icon={FiMapPin}
                  label="Room Number"
                  value={
                    staying
                      ? (leader?.roomName?.trim() === "waiting list"
                        ? "Waiting List"
                        : (leader?.roomName?.trim() || leader?.room_number?.trim() || "Not Assigned"))
                      : "Not Staying"
                  }
                  color={
                    staying && leader?.roomName?.trim() === "waiting list"
                      ? "text-amber-600"
                      : staying && (leader?.roomName?.trim() || leader?.room_number?.trim())
                        ? "text-indigo-600"
                        : "text-red-500"
                  }
                  onClick={
                    staying && leader?.roomName?.trim() === "waiting list"
                      ? undefined  // No click for waiting list
                      : staying && (leader?.roomName?.trim() || leader?.room_number?.trim())
                        ? goToRoom
                        : undefined
                  }
                />
              </div>

              {/* Grouping Details */}
              {isFollowing && (
                <>
                  <SectionHeader icon={FiUsers} title="Grouping Details" />
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                      <h4 className="text-sm font-semibold text-slate-600 mb-3">Main Group</h4>
                      <p className="text-lg font-medium text-slate-800">{leader.isFollowing}</p>
                    </div>
                    {(status === 'present' || status === 'registered') && leader.followingGroup?.length > 0 && (
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h4 className="text-sm font-semibold text-slate-600 mb-3">Following Group</h4>
                        <div className="space-y-1.5">
                          {leader.followingGroup.map((group: any, idx: number) => (
                            <p key={idx} className="text-base font-medium text-slate-800">
                              {group.followingName}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    {status === 'present' && leader.subGroups?.length > 0 && (
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h4 className="text-sm font-semibold text-slate-600 mb-3">Sub Group</h4>
                        <div className="space-y-1.5">
                          {leader.subGroups.map((group: any, idx: number) => (
                            <p key={idx} className="text-base font-medium text-slate-800">
                              {group.subgroupName}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Following Groups */}
              {shouldShowFollowingGroup && leader.followingGroup?.length > 0 && (
                <>
                  <SectionHeader icon={FiUsers} title="Following Groups" />
                  <div className="space-y-4">
                    {leader.followingGroup.map((group: any, idx: number) => (
                      <div key={idx} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        <div className="px-4 sm:px-6 py-4 bg-indigo-50 border-b border-indigo-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                                FG
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-semibold text-gray-900 truncate">{group.followingName}</h4>
                                <p className="text-xs text-indigo-600 mt-0.5 truncate">
                                  {group.students?.length || 0} Students • 2 Mentors
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const msg = generateWhatsAppMessage(group, false);
                                openWhatsApp(leader.whatsappNumber, msg);
                              }}
                              className="bg-white hover:bg-indigo-600 text-indigo-600 hover:text-white p-3 rounded-full shadow-sm border border-indigo-200 transition-all duration-200 flex-shrink-0 ml-2"
                              title="Send WhatsApp message"
                            >
                              <FaWhatsapp className="text-lg" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 divide-x divide-gray-100 bg-gray-50">
                          <div className="py-3 text-center px-1">
                            <div className="text-lg sm:text-xl font-bold text-orange-500">
                              {group.students?.filter((s: any) => s.status === "registered").length || 0}
                            </div>
                            <div className="text-xs text-gray-500 truncate">Registered</div>
                          </div>
                          <div className="py-3 text-center px-1">
                            <div className="text-lg sm:text-xl font-bold text-green-500">
                              {group.students?.filter((s: any) => s.status === "present").length || 0}
                            </div>
                            <div className="text-xs text-gray-500 truncate">Present</div>
                          </div>
                          <div className="py-3 text-center px-1">
                            <div className="text-lg sm:text-xl font-bold text-red-500">
                              {group.students?.filter((s: any) => s.status === "absent").length || 0}
                            </div>
                            <div className="text-xs text-gray-500 truncate">Absent</div>
                          </div>
                        </div>

                        <div className="p-4 border-t border-gray-100">
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Mentors</p>
                          {/* Mentors: stacked on mobile, grid on desktop */}
                          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2 sm:gap-3">
                            {[group.leader1, group.leader2].map((mentor, index) => (
                              <div
                                key={index}
                                onClick={() => mentor?.id && goToLeader(mentor.id)}
                                className="flex items-center gap-3 p-2 rounded-xl hover:bg-indigo-50 transition cursor-pointer group w-full"
                              >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-sm group-hover:scale-105 transition capitalize flex-shrink-0">
                                  {mentor?.name?.charAt(0) || 'M'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  {mentor ? (
                                    <>
                                      <div className="font-medium text-gray-800 text-sm truncate capitalize">{mentor.name}</div>
                                      <div className="text-xs text-gray-500 truncate capitalize">{mentor.place || 'Location not set'}</div>
                                    </>
                                  ) : (
                                    <div className="text-sm text-red-500 truncate">Unassigned</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {group.students && group.students.length > 0 && (
                          <div className="p-4 pt-0">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Students</p>
                              <Link
                                to={`/user/group/follow/${group.followingName?.charAt(1)}/${group.followingName}`}
                                className="text-xs text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
                              >
                                View all →
                              </Link>
                            </div>
                            {/* Students: stacked on mobile, grid on desktop */}
                            <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2">
                              {group.students.slice(0, 4).map((student: any) => (
                                <div
                                  key={student.id}
                                  onClick={() => goToStudent(student.id)}
                                  className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg hover:bg-indigo-50 transition cursor-pointer border border-transparent hover:border-indigo-200 w-full"
                                >
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-300 to-indigo-500 text-white flex items-center justify-center text-xs font-bold capitalize flex-shrink-0">
                                    {typeof student.name === 'string' && student.name.length > 0 ? student.name.charAt(0) : 'S'}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-800 truncate capitalize">{student.name}</div>
                                    <div className="flex items-center gap-1">
                                      <span className={`w-1.5 h-1.5 rounded-full ${student.status === 'present' ? 'bg-green-500' :
                                        student.status === 'registered' ? 'bg-orange-500' : 'bg-red-500'
                                        }`}></span>
                                      <span className="text-xs text-gray-500 capitalize truncate">{student.status}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {group.students.length > 4 && (
                              <Link
                                to={`/user/group/follow/${group.followingName?.charAt(1)}/${group.followingName}`}
                                className="block w-full mt-2 py-2 text-center text-xs text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition"
                              >
                                +{group.students.length - 4} more students
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Sub Groups */}
              {shouldShowSubGroups && leader.subGroups?.length > 0 && (
                <>
                  <SectionHeader icon={FiUsers} title="Sub Groups" />
                  <div className="space-y-4">
                    {leader.subGroups.map((group: any, idx: number) => (
                      <div key={idx} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        <div className="px-4 sm:px-6 py-4 bg-violet-50 border-b border-violet-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                                SG
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-semibold text-gray-900 truncate">{group.subgroupName}</h4>
                                <p className="text-xs text-violet-600 mt-0.5 truncate">
                                  {group.students?.length || 0} Students • 2 Mentors
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const msg = generateWhatsAppMessage(group, true);
                                openWhatsApp(leader.whatsappNumber, msg);
                              }}
                              className="bg-white hover:bg-violet-600 text-violet-600 hover:text-white p-3 rounded-full shadow-sm border border-violet-200 transition-all duration-200 flex-shrink-0 ml-2"
                              title="Send WhatsApp message"
                            >
                              <FaWhatsapp className="text-lg" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 divide-x divide-gray-100 bg-gray-50">
                          <div className="py-3 text-center px-1">
                            <div className="text-lg sm:text-xl font-bold text-orange-500">
                              {group.students?.filter((s: any) => s.status === "registered").length || 0}
                            </div>
                            <div className="text-xs text-gray-500 truncate">Registered</div>
                          </div>
                          <div className="py-3 text-center px-1">
                            <div className="text-lg sm:text-xl font-bold text-green-500">
                              {group.students?.filter((s: any) => s.status === "present").length || 0}
                            </div>
                            <div className="text-xs text-gray-500 truncate">Present</div>
                          </div>
                          <div className="py-3 text-center px-1">
                            <div className="text-lg sm:text-xl font-bold text-red-500">
                              {group.students?.filter((s: any) => s.status === "absent").length || 0}
                            </div>
                            <div className="text-xs text-gray-500 truncate">Absent</div>
                          </div>
                        </div>

                        <div className="p-4 border-t border-gray-100">
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Mentors</p>
                          {/* Mentors: stacked on mobile, grid on desktop */}
                          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2 sm:gap-3">
                            {[group.leader1, group.leader2].map((mentor, index) => (
                              <div
                                key={index}
                                onClick={() => mentor?.id && goToLeader(mentor.id)}
                                className="flex items-center gap-3 p-2 rounded-xl hover:bg-violet-50 transition cursor-pointer group w-full"
                              >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 text-white flex items-center justify-center text-sm font-bold shadow-sm group-hover:scale-105 transition capitalize flex-shrink-0">
                                  {mentor?.name?.charAt(0) || 'M'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  {mentor ? (
                                    <>
                                      <div className="font-medium text-gray-800 text-sm truncate capitalize">{mentor.name}</div>
                                      <div className="text-xs text-gray-500 truncate capitalize">{mentor.place || 'Location not set'}</div>
                                    </>
                                  ) : (
                                    <div className="text-sm text-red-500 truncate">Unassigned</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {group.students && group.students.length > 0 && (
                          <div className="p-4 pt-0">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Students</p>
                              <Link
                                to={`/user/group/sub/${group.subgroupName?.charAt(1)}/${group.subgroupName}`}
                                className="text-xs text-violet-600 font-medium hover:text-violet-800 transition-colors"
                              >
                                View all →
                              </Link>
                            </div>
                            {/* Students: stacked on mobile, grid on desktop */}
                            <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2">
                              {group.students.slice(0, 4).map((student: any) => (
                                <div
                                  key={student.id}
                                  onClick={() => goToStudent(student.id)}
                                  className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg hover:bg-violet-50 transition cursor-pointer border border-transparent hover:border-violet-200 w-full"
                                >
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-300 to-violet-500 text-white flex items-center justify-center text-xs font-bold capitalize flex-shrink-0">
                                    {typeof student.name === 'string' && student.name.length > 0 ? student.name.charAt(0) : 'S'}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-800 truncate capitalize">{student.name}</div>
                                    <div className="flex items-center gap-1">
                                      <span className={`w-1.5 h-1.5 rounded-full ${student.status === 'present' ? 'bg-green-500' :
                                        student.status === 'registered' ? 'bg-orange-500' : 'bg-red-500'
                                        }`}></span>
                                      <span className="text-xs text-gray-500 capitalize truncate">{student.status}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {group.students.length > 4 && (
                              <Link
                                to={`/user/group/sub/${group.subgroupName?.charAt(1)}/${group.subgroupName}`}
                                className="block w-full mt-2 py-2 text-center text-xs text-violet-600 font-medium hover:bg-violet-50 rounded-lg transition"
                              >
                                +{group.students.length - 4} more students
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div >
  );
};

export default LeaderDetail;
