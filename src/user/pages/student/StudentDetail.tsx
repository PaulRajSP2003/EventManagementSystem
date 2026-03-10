// src/user/pages/student/StudentDetail.tsx
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  FiEdit,
  FiArrowLeft,
  FiUser,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiUsers,
  FiHome,
  FiUserCheck,
  FiMessageSquare,
  FiActivity,
  FiSave,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
} from 'react-icons/fi';
import { FaChurch, FaBriefcaseMedical, FaWhatsapp, FaMars, FaVenus } from 'react-icons/fa6';
import type { Student, Leader } from '../../../types';
import LeaderListCompound from '../components/LeaderListCompound';
import { leaderAPI } from '../api/LeaderData';
import EmptyState from '../components/EmptyState';
import { PAGE_PERMISSIONS, canAccess, isAdminOrCoAdmin, fetchPermissionData, type PermissionData } from '../permission';
import AccessAlert from '../components/AccessAlert';
import { studentAPI } from '../api/StudentData';

// Helper component for section headers
const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center gap-2 mb-4 mt-6 pb-2 border-b border-gray-100">
    <Icon className="text-indigo-500 text-lg" />
    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
  </div>
);

// Helper component for data display
const InfoItem = ({ icon: Icon, label, value, color = 'text-gray-500', onClick }: any) => (
  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
    <div className={`p-2 rounded-full bg-white shadow-sm border border-gray-100 ${color} group-hover:scale-110 transition-transform`}>
      <Icon className="text-lg" />
    </div>
    <div className="flex-1">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      {onClick ? (
        <div
          onClick={onClick}
          className="font-medium text-indigo-600 mt-0.5 cursor-pointer hover:underline decoration-indigo-300 underline-offset-2 transition-all"
        >
          {value}
        </div>
      ) : (
        <div className="font-medium text-gray-900 mt-0.5">{value}</div>
      )}
    </div>
  </div>
);

// Skeleton component
const SkeletonBlock = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
);

const StudentDetailSkeleton = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 mt-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
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
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <SkeletonBlock className="h-5 w-36" />
            <div className="space-y-3">
              <SkeletonBlock className="h-10 w-full rounded-lg" />
              <SkeletonBlock className="h-24 w-full rounded-lg" />
              <SkeletonBlock className="h-11 w-full rounded-lg" />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-sm">
            <SkeletonBlock className="h-5 w-32" />
            <SkeletonBlock className="h-14 w-full rounded-xl" />
            <SkeletonBlock className="h-14 w-full rounded-xl" />
          </div>
        </div>
        {/* RIGHT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-8 shadow-sm">
            <div className="space-y-4">
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
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <SkeletonBlock className="h-5 w-5 rounded-full" />
                <SkeletonBlock className="h-6 w-40" />
              </div>
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                <SkeletonBlock className="h-32 w-full rounded-lg" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <SkeletonBlock className="h-5 w-5 rounded-full" />
                <SkeletonBlock className="h-6 w-48" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SkeletonBlock className="h-14 w-full rounded-xl" />
                <SkeletonBlock className="h-14 w-full rounded-xl" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
              <SkeletonBlock className="h-5 w-24 mb-2" />
              <SkeletonBlock className="h-16 w-full rounded" />
            </div>
            <div className="bg-rose-50 rounded-2xl p-6 border border-rose-100">
              <SkeletonBlock className="h-5 w-24 mb-2" />
              <SkeletonBlock className="h-16 w-full rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Permission constants for this page
const PAGE_ID = PAGE_PERMISSIONS.STUDENT_DETAIL;
const ACTION_ID = PAGE_PERMISSIONS.STUDENT_STATUS_UPDATE;
const STUDENT_EDIT = PAGE_PERMISSIONS.STUDENT_EDIT;

const StudentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Permission data state (like StudentList)
  const [permissionData, setPermissionData] = useState<PermissionData | null>(null);
  const [permissionLoading, setPermissionLoading] = useState(true);
  const [permissionError, setPermissionError] = useState<boolean>(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [originalData, setOriginalData] = useState<Student | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showSuccessActions, setShowSuccessActions] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);
  const [availableLeaders, setAvailableLeaders] = useState<Leader[]>([]);

  // Administrative Form States
  const [status, setStatus] = useState<string>('');
  const [staying, setStaying] = useState<boolean>(false);
  const [stayingWithParent, setStayingWithParent] = useState<boolean>(false);
  const [stayingLeader, setStayingLeader] = useState<string>('');
  const [showAlert, setShowAlert] = useState(false);

  // Fetch permission data on component mount (like StudentList)
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        setPermissionLoading(true);
        setPermissionError(false);
        const data = await fetchPermissionData();
        setPermissionData(data);
        
        // Check access using canAccess directly with permission data
        const hasAccess = canAccess(data, PAGE_ID);
        setAccessDenied(!hasAccess);
        
        if (!hasAccess) {
          setErrorMessage("You don't have permission to view this student");
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

  // Permission checks using ONLY permissionData (like StudentList)
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
    return canAccess(permissionData, STUDENT_EDIT);
  };

  const isAdmin = () => {
    if (!permissionData || accessDenied || permissionError) return false;
    return isAdminOrCoAdmin(permissionData);
  };

  const goToLeader = (leaderId: number | string | undefined) => {
    if (leaderId != null && leaderId !== 0 && leaderId !== '') {
      navigate(`/user/leader/${leaderId}`);
    }
  };

  const goToRoom = () => {
    const room = student?.room_number?.trim();
    const gender = student?.gender;

    if (
      student?.status === 'present' &&
      student?.staying === 'yes' &&
      room &&
      gender &&
      student?.parental_detail !== 'yes'
    ) {
      const normalized = room.toLowerCase().replace(/\s+/g, ' ');

      if (normalized === 'waiting list') {
        navigate(`/user/room/${gender}/waiting_list`);
      } else {
        navigate(`/user/room/${gender}/${encodeURIComponent(room)}`);
      }
    }
  };

  useEffect(() => {
    // Check access before loading data
    if (!hasPageAccess()) {
      setLoading(false);
      setAccessDenied(true);
      return;
    }

    const fetchStudentData = async () => {
      setLoading(true);
      setNotFound(false);
      setAccessDenied(false);
      setErrorMessage(null);

      try {
        const numericId = Number(id);
        if (!id || isNaN(numericId)) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const response = await studentAPI.getStudentDetail(numericId);

        // This should already be the student data object
        const studentData = response;

        setOriginalData(studentData);
        setStudent(studentData);

        const fetchedStatus = studentData.status ? String(studentData.status) : '';
        setStatus(fetchedStatus.charAt(0).toUpperCase() + fetchedStatus.slice(1));
        setStaying(studentData.staying === 'yes');
        setStayingWithParent(studentData.parental_detail === 'yes');
        const normLeader = studentData.staying_leader === null || studentData.staying_leader === undefined || Number(studentData.staying_leader) === 0
          ? ''
          : String(studentData.staying_leader);
        setStayingLeader(normLeader);

        // Fetch available leaders
        try {
          const leaders = await leaderAPI.getAll();
          const stayingLeaders = leaders.filter(l => l.staying === 'yes');
          setAvailableLeaders(stayingLeaders);
        } catch (error) {
          console.error('Error fetching leaders:', error);
          setAvailableLeaders([]);
        }
      } catch (error) {
        console.error('Error fetching student:', error);

        const errorMsg = error instanceof Error ? error.message : 'Failed to load student data';
        setErrorMessage(errorMsg);

        // Check if it's a permission error
        if (errorMsg.toLowerCase().includes('forbidden') ||
          errorMsg.toLowerCase().includes('unauthorized') ||
          errorMsg.toLowerCase().includes('permission')) {
          setAccessDenied(true);
        } else {
          setNotFound(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [id, permissionData]);

  useEffect(() => {
    if (status !== 'Present') {
      if (staying) setStaying(false);
      if (stayingWithParent) setStayingWithParent(false);
      if (stayingLeader !== '') setStayingLeader('');
    }
  }, [status]);

  // Clear staying leader when "With Parent" is unchecked
  useEffect(() => {
    if (!stayingWithParent && stayingLeader !== '') {
      setStayingLeader('');
    }
  }, [stayingWithParent]);

  // Show alert if returning from edit page and status is not 'Registered'
  useEffect(() => {
    if (location.state?.fromEdit && status !== 'Registered') {
      setShowAlert(true);
      const timer = setTimeout(() => setShowAlert(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state, status]);

  const isDirty = useMemo(() => {
    if (!originalData || !student) return false;

    const origStatus = originalData.status?.toLowerCase() || '';
    const currentStatus = status.toLowerCase();

    const origStaying = originalData.staying === 'yes';

    const origWithParent = originalData.parental_detail === 'yes';

    const origLeader = originalData.staying_leader;
    const origLeaderNormalized = (!origLeader || origLeader === 0) ? '' : String(origLeader);

    const currentLeaderNormalized = (!stayingLeader || stayingLeader === '') ? '' : stayingLeader;

    const statusChanged = currentStatus !== origStatus;
    const stayingChanged = staying !== origStaying;
    const parentChanged = stayingWithParent !== origWithParent;
    const leaderChanged = currentLeaderNormalized !== origLeaderNormalized;

    return statusChanged || stayingChanged || parentChanged || leaderChanged;
  }, [status, staying, stayingWithParent, stayingLeader, originalData, student]);

  const isSelectionValid = useMemo(() => {
    if (stayingWithParent) {
      return stayingLeader !== '' && stayingLeader !== '0';
    }
    return true;
  }, [stayingWithParent, stayingLeader]);

  const canStay = status === 'Present';
  const isAgeQualified = (student?.age || 0) <= (student?.parental_age || 0);
  const canStayWithParent = canStay && staying && isAgeQualified;
  const canSelectLeader = canStay && staying && stayingWithParent;

  const getInitials = (name: string) => name.trim()[0]?.toUpperCase() || '';

  const handleDisabledEditClick = () => {
    if (student?.status !== 'registered') {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000);
    }
  };

  const handleSave = async () => {
    if (!student || !isDirty || !isSelectionValid || isSaving || !hasActionAccess()) return;
    setIsSaving(true);

    const updatedStatus = status.toLowerCase() as "present" | "registered" | "absent";
    const finalStaying = canStay ? (staying ? "yes" : "no") : "no";
    const finalParental = canStayWithParent ? (stayingWithParent ? "yes" : "no") : "no";
    const finalLeader = canSelectLeader && stayingWithParent ? (Number(stayingLeader) || 0) : 0;

    try {
      // Call the API to update student status
      const responseData = await studentAPI.changeStudentStatus(
        student.id!,
        updatedStatus,
        finalStaying,
        finalParental,
        finalLeader
      );

      // Create a clean student object with the updated data
      const updatedStudent: Student = {
        ...student,

        // Update basic fields
        status: updatedStatus,
        staying: finalStaying,
        parental_detail: finalParental,
        staying_leader: finalLeader,

        // Update with API response
        followed_group: responseData.followed_group || student.followed_group || '',

        // Following group leaders
        following_leader1_id: responseData.following_leader1_id !== undefined && responseData.following_leader1_id !== null
          ? responseData.following_leader1_id
          : (student.following_leader1_id !== undefined && student.following_leader1_id !== null
            ? student.following_leader1_id
            : undefined),
        following_leader1_name: responseData.following_leader1_name || student.following_leader1_name || undefined,
        following_leader2_id: responseData.following_leader2_id !== undefined && responseData.following_leader2_id !== null
          ? responseData.following_leader2_id
          : (student.following_leader2_id !== undefined && student.following_leader2_id !== null
            ? student.following_leader2_id
            : undefined),
        following_leader2_name: responseData.following_leader2_name || student.following_leader2_name || undefined,

        // Sub group
        sub_group: responseData.sub_group || student.sub_group || '',
        sub_leader1_id: responseData.sub_leader1_id !== undefined && responseData.sub_leader1_id !== null
          ? responseData.sub_leader1_id
          : (student.sub_leader1_id !== undefined && student.sub_leader1_id !== null
            ? student.sub_leader1_id
            : undefined),
        sub_leader1_name: responseData.sub_leader1_name || student.sub_leader1_name || undefined,
        sub_leader2_id: responseData.sub_leader2_id !== undefined && responseData.sub_leader2_id !== null
          ? responseData.sub_leader2_id
          : (student.sub_leader2_id !== undefined && student.sub_leader2_id !== null
            ? student.sub_leader2_id
            : undefined),
        sub_leader2_name: responseData.sub_leader2_name || student.sub_leader2_name || undefined,

        // Room information
        room_number: responseData.room_number || student.room_number || '',
        room_teacher: responseData.room_teacher || student.room_teacher || '',
        room_id: responseData.room_id || student.room_id || '',
      };

      // Normalize staying_leader
      const normalizedStayingLeader = finalLeader === 0 ? '' : String(finalLeader);

      // Create a deep copy for original data
      const newOriginalData: Student = {
        ...updatedStudent,
        status: updatedStatus,
        staying_leader: normalizedStayingLeader === '' ? 0 : finalLeader,
      };

      // Update all states
      setStudent(updatedStudent);
      setOriginalData(newOriginalData);
      setStatus(updatedStatus.charAt(0).toUpperCase() + updatedStatus.slice(1));
      setStaying(finalStaying === 'yes');
      setStayingWithParent(finalParental === 'yes');
      setStayingLeader(normalizedStayingLeader);

      // Refresh available leaders if needed
      if (finalParental === 'yes' && finalLeader) {
        try {
          const leaders = await leaderAPI.getAll();
          const stayingLeaders = leaders.filter(l => l.staying === 'yes');
          setAvailableLeaders(stayingLeaders);
        } catch (error) {
          console.error('Error fetching leaders:', error);
        }
      }

      // Show success message
      setMessage("Changes Saved Successfully");
      setShowSuccessActions(true);

    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Error: ${error.message}`
          : 'Error: Failed to save changes'
      );
      setShowSuccessActions(false);
    } finally {
      setIsSaving(false);

      // Clear success message after 5 seconds
      setTimeout(() => {
        setMessage(null);
        setShowSuccessActions(false);
      }, 5000);
    }
  };

  // Determine if we should show sub-group related fields
  const showSubGroupInfo = status.toLowerCase() === 'present';

  // Show loading while permissions are loading (like StudentList)
  if (permissionLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
        <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-[11px] border-b border-gray-100">
          <div className="max-w-6xl mx-auto flex justify-between items-center min-h-[36px]">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium"
              >
                <FiArrowLeft /> Back
              </button>
              <div className="h-4 w-[1px] bg-gray-300 hidden sm:block"></div>
              <h1 className="text-lg font-bold text-slate-800 hidden sm:block">
                Student Details
              </h1>
            </div>
            <button disabled className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition border bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-70">
              <FiEdit /> Edit Profile
            </button>
          </div>
        </div>
        <StudentDetailSkeleton />
      </div>
    );
  }

  // Show access denied page for permission errors or access denied (like StudentList)
  if (permissionError || accessDenied || !permissionData || !hasPageAccess()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <AccessAlert message={errorMessage || "You do not have access to view this student."} />
      </div>
    );
  }

  if (notFound || !student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
        <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-[11px] border-b border-gray-100">
          <div className="max-w-6xl mx-auto flex justify-between items-center min-h-[36px]">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium"
              >
                <FiArrowLeft /> Back
              </button>
              <div className="h-4 w-[1px] bg-gray-300 hidden sm:block"></div>
              <h1 className="text-lg font-bold text-slate-800 hidden sm:block">
                Student Details
              </h1>
            </div>
            <button disabled className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition border bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-70">
              <FiEdit /> Edit Profile
            </button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto py-16 px-4 flex justify-center">
          <EmptyState
            title="Student Not Found"
            message="The student with this ID could not be found. It may have been removed or the link is incorrect."
            buttonText="Back to Students List"
            navigatePath="/user/student"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
      <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-[11px] border-b border-gray-100">
        <div className="max-w-6xl mx-auto flex justify-between items-center min-h-[36px]">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium"
            >
              <FiArrowLeft /> Back
            </button>
            <div className="h-4 w-[1px] bg-gray-300 hidden sm:block"></div>
            <h1 className="text-lg font-bold text-slate-800 hidden sm:block">
              Student Details
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <button
                onClick={() => {
                  if (student?.status === 'registered' && hasEditPermission()) {
                    navigate(`/user/student/edit/${student.id}`);
                  } else {
                    handleDisabledEditClick();
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition text-sm font-medium ${student?.status === 'registered' && hasEditPermission()
                  ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
              >
                <FiEdit />
                Edit Profile
              </button>
              {/* Tooltip - only shows when button is disabled */}
              {!(student?.status === 'registered' && hasEditPermission()) && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-slate-800 text-white text-[11px] p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                  {!hasEditPermission()
                    ? 'Editing Disabled'
                    : 'Only status "Registered" students can be edited.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
              <div className="h-32 bg-gradient-to-r from-indigo-600 to-violet-600"></div>
              <div className="px-6 pb-6 text-center -mt-12 relative">
                <div
                  className="w-24 h-24 mx-auto bg-white p-1 rounded-full shadow-lg relative z-10"
                  style={{ border: `4px solid ${student.tagColor || '#6366f1'}` }}
                >
                  <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-2xl font-bold text-indigo-600">
                    {getInitials(student.name)}
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-slate-800 mt-3 capitalize">{student.name}</h1>
                <p className="text-slate-500 text-sm flex items-center justify-center gap-2 mt-1">
                  <span>ID: #{student.id}</span>
                  <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                  <span>{student.age} Years</span>
                  <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                  <span className="flex items-center gap-1 text-xs font-medium border px-1.5 rounded" style={{ borderColor: student.tagColor }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: student.tagColor }}></span>
                    Tag
                  </span>
                </p>
                <div className="flex justify-center gap-2 mt-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${student.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                    student.status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                    {student.status}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700">
                    {student.registered_mode}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600 flex items-center gap-1">
                    {student.gender === 'male' ? <FaMars /> : <FaVenus />} {student.gender}
                  </span>
                </div>
              </div>
            </div>

            {isAdmin() && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                {/* Buttons Row */}
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate(`/user/student/history/${student.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition"
                  >
                    <FiClock /> History
                  </button>

                  <button
                    onClick={() => navigate(`/user/student/replacement/${student.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-indigo-200 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition"
                  >
                    <FiActivity /> Replacement
                  </button>
                </div>
              </div>
            )}

            {/* Admin Actions Card - Only show if user has ACTION_ID permission */}
            {hasActionAccess() && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-3">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <FiActivity className="text-indigo-500" /> Actions
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
                        Changes Saved
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-5">
                  <div className={`transition-all duration-300 p-1 rounded-lg ${showAlert && status !== 'Registered' ? 'bg-red-50 ring-2 ring-red-500' : ''
                    }`}>
                    <label className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase mb-1.5">
                      <span>Current Status</span>
                      {showAlert && status !== 'Registered' && (
                        <span className="text-red-600 normal-case font-bold flex items-center gap-1 animate-[bounce_1s_infinite]">
                          <FiAlertCircle className="w-3.5 h-3.5" /> Set to Registered and save
                        </span>
                      )}
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      disabled={isSaving || !hasActionAccess()}
                      className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-colors ${showAlert && status !== 'Registered' ? 'border-red-500 bg-white' : 'bg-slate-50 border-slate-200'
                        }`}
                    >
                      <option value="Present">Present</option>
                      <option value="Registered">Registered</option>
                      <option value="Absent">Absent</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all ${staying ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
                      } ${!canStay && 'opacity-50 cursor-not-allowed'}`}>
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={staying}
                          onChange={(e) => setStaying(e.target.checked)}
                          disabled={!canStay || isSaving || !hasActionAccess()}
                          className="rounded text-indigo-600 h-4 w-4"
                        />
                        <span className={`text-sm font-medium ${!canStay && 'text-gray-400'}`}>Staying</span>
                      </label>
                    </div>

                    <div className={`p-3.5 rounded-lg border-2 transition-all relative group ${stayingWithParent ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'
                      } ${!canStayWithParent ? 'bg-slate-50 opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-slate-300'}`}>
                      <label className={`flex items-center gap-2.5 ${canStayWithParent ? 'cursor-pointer' : 'cursor-not-allowed'
                        }`}>
                        <input
                          type="checkbox"
                          checked={stayingWithParent}
                          onChange={(e) => setStayingWithParent(e.target.checked)}
                          disabled={!canStayWithParent || isSaving || !hasActionAccess()}
                          className="rounded text-indigo-600 h-4 w-4"
                        />
                        <span className={`text-sm font-medium ${!canStayWithParent && 'text-gray-400'}`}>With Parent</span>
                      </label>
                      {!isAgeQualified && (
                        <div className="absolute -top-2 -right-2 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          Only students under {student.parental_age} years can stay with parents
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`relative transition-opacity ${!canSelectLeader ? 'pointer-events-none opacity-50' : 'opacity-100'
                    }`}>
                    <label className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase mb-1.5">
                      <span>Assigned Staying Leader</span>
                      {stayingWithParent && !isSelectionValid && (
                        <span className="text-rose-500 flex items-center gap-1 normal-case font-bold animate-bounce">
                          <FiAlertCircle className="w-3.5 h-3.5" /> Required
                        </span>
                      )}
                    </label>
                    <LeaderListCompound
                      initialLeaderId={
                        student.staying_leader !== null && student.staying_leader !== undefined && student.staying_leader !== 0
                          ? Number(student.staying_leader)
                          : (stayingLeader !== null && stayingLeader !== undefined && stayingLeader !== '' && Number(stayingLeader) !== 0
                            ? Number(stayingLeader)
                            : undefined)
                      }
                      onLeaderSelect={(leader: any) => setStayingLeader(leader ? String(leader.id) : '')}
                      availableLeaders={availableLeaders}
                    />
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={!isDirty || !isSelectionValid || isSaving || !hasActionAccess()}
                    className={`w-full mt-3 font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition shadow-lg ${isDirty && isSelectionValid && !isSaving && hasActionAccess()
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                      }`}
                  >
                    <FiSave className="w-4 h-4" />
                    {isSaving
                      ? 'Saving...'
                      : stayingWithParent && !isSelectionValid
                        ? 'Select Leader to Save'
                        : 'Update Record'}
                  </button>
                </div>
              </div>
            )}

            {/* Quick Contact */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <h3 className="font-bold text-slate-800 mb-4">Quick Contact</h3>
              <div className="space-y-3">
                <a href={`tel:${student.contactNumber}`} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
                  <div className="bg-emerald-100 p-2 rounded-full text-emerald-600"><FiPhone /></div>
                  <span className="font-medium text-slate-700">{student.contactNumber}</span>
                </a>
                <a href={`https://wa.me/${student.whatsappNumber}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
                  <div className="bg-green-100 p-2 rounded-full text-green-600"><FaWhatsapp /></div>
                  <span className="font-medium text-slate-700">WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 capitalize">
              <SectionHeader icon={FiUser} title="Personal Details" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                <InfoItem icon={FiUser} label="Parent Name" value={student.parentName.charAt(0).toUpperCase() + student.parentName.slice(1).toLowerCase()} color="text-blue-500" />
                <InfoItem icon={student.gender?.toLowerCase() === 'male' ? FaMars : FaVenus} label="Gender" value={student.gender || 'N/A'} color="text-amber-500" />
                <InfoItem icon={FiMapPin} label="Place / City" value={student.place ? student.place.split(',')[0].trim().charAt(0).toUpperCase() + student.place.split(',')[0].trim().slice(1).toLowerCase() : 'N/A'} color="text-red-500" />
                <InfoItem icon={FaChurch} label="Home Church" value={student.churchName ? student.churchName.charAt(0).toUpperCase() + student.churchName.slice(1).toLowerCase() : 'N/A'} color="text-amber-500" />
              </div>

              <SectionHeader icon={FiUsers} title="Group & Leadership" />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <InfoItem icon={FiCalendar} label="Section Group" value={student.age_group || 'N/A'} color="text-blue-500" />
                <InfoItem icon={FiUsers} label="Followed Group" value={student.followed_group || 'N/A'} color="text-indigo-500" />

                {showSubGroupInfo && (
                  <InfoItem
                    icon={FiUsers}
                    label="Sub Group"
                    value={student.sub_group || 'N/A'}
                    color="text-violet-500"
                  />
                )}
              </div>

              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
                  Leadership Assignments
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Followed Group Leaders - always shown */}
                  <div>
                    <span className="text-sm font-bold text-indigo-700 block mb-2">Followed Group Leaders</span>
                    <div className="space-y-2">
                      {student.following_leader1_id ? (
                        <div
                          onClick={() => goToLeader(student.following_leader1_id)}
                          className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition group"
                        >
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold border border-indigo-200">M</div>
                          <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700 capitalize">
                            {student.following_leader1_name}
                          </span>
                        </div>
                      ) : (
                        <div className="text-sm text-slate-400 italic px-2">Main: Unassigned</div>
                      )}

                      {student.following_leader2_id && (
                        <div
                          onClick={() => goToLeader(student.following_leader2_id)}
                          className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition group"
                        >
                          <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-400 flex items-center justify-center text-[10px] font-bold border border-indigo-100">S</div>
                          <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700 capitalize">
                            {student.following_leader2_name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sub Group Teachers - only when present */}
                  {showSubGroupInfo && (
                    <div>
                      <span className="text-sm font-bold text-violet-700 block mb-2">Sub Group Teachers</span>
                      <div className="space-y-2">
                        {student.sub_leader1_id ? (
                          <div
                            onClick={() => goToLeader(student.sub_leader1_id)}
                            className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm cursor-pointer hover:border-violet-300 hover:bg-violet-50 transition group"
                          >
                            <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-[10px] font-bold border border-violet-200">M</div>
                            <span className="text-sm font-medium text-slate-700 group-hover:text-violet-700 capitalize">
                              {student.sub_leader1_name}
                            </span>
                          </div>
                        ) : (
                          <div className="text-sm text-slate-400 italic px-2">Main: Unassigned</div>
                        )}

                        {student.sub_leader2_id && (
                          <div
                            onClick={() => goToLeader(student.sub_leader2_id)}
                            className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm cursor-pointer hover:border-violet-300 hover:bg-violet-50 transition group"
                          >
                            <div className="w-6 h-6 rounded-full bg-violet-50 text-violet-400 flex items-center justify-center text-[10px] font-bold border border-violet-100">S</div>
                            <span className="text-sm font-medium text-slate-700 group-hover:text-violet-700 capitalize">
                              {student.sub_leader2_name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <SectionHeader icon={FiHome} title="Accommodation Details" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                <InfoItem
                  icon={FiUserCheck}
                  label="Room Status"
                  value={
                    student.status === 'present'
                      ? student.staying === 'yes'
                        ? student.parental_detail === 'yes'
                          ? 'Staying with Parent'
                          : 'Staying'
                        : 'Not Staying'
                      : student.status === 'absent' || student.status === 'registered'
                        ? 'Not Present'
                        : 'Not Staying'
                  }
                  color={
                    student.staying === 'yes'
                      ? student.parental_detail === 'yes'
                        ? 'text-indigo-600'
                        : 'text-emerald-500'
                      : 'text-red-500'
                  }
                />

                <InfoItem
                  icon={FiHome}
                  label="Room Number"
                  value={
                    student.status === 'present'
                      ? student.staying === 'yes'
                        ? student.parental_detail === 'yes'
                          ? student.room_number && student.room_number.trim() !== ''
                            ? student.room_number
                            : 'With Parent'
                          : student.room_number && student.room_number.trim() !== ''
                            ? student.room_number
                            : 'Not Assigned'
                        : 'Not Staying'
                      : student.status === 'absent' || student.status === 'registered'
                        ? 'Not Present'
                        : 'Not Assigned'
                  }
                  color={
                    student.staying === 'yes' && student.room_number && student.room_number.trim() !== ''
                      ? 'text-indigo-600'
                      : student.staying === 'yes'
                        ? 'text-gray-500'
                        : 'text-red-500'
                  }
                  onClick={goToRoom}
                />

                <InfoItem
                  icon={FiUser}
                  label={student.parental_detail === 'yes' ? 'Assigned Staying Leader' : 'Room Teacher'}
                  value={
                    student.status === 'present'
                      ? student.staying === 'yes'
                        ? student.parental_detail === 'yes'
                          ? (() => {
                            // For parental staying, we want to show the leader's name
                            let leaderId: number | null = null;

                            // Check staying_leader from the API response (this should be the leaderId from leaderMaster)
                            if (student.staying_leader !== null &&
                              student.staying_leader !== undefined &&
                              student.staying_leader !== 0) {
                              leaderId = Number(student.staying_leader);
                            }

                            if (leaderId !== null && !isNaN(leaderId) && leaderId !== 0) {
                              const leader = availableLeaders.find(l => Number(l.id) === leaderId);
                              if (leader && leader.name) {
                                return leader.name.replace(/\b\w/g, char => char.toUpperCase());
                              }
                            }
                            return 'Not Assigned';
                          })()
                          : student.room_teacher && student.room_teacher.trim() !== ''
                            ? student.room_teacher.replace(/\b\w/g, char => char.toUpperCase())
                            : 'Not Assigned'
                        : 'Not Staying'
                      : student.status === 'absent' || student.status === 'registered'
                        ? 'Not Present'
                        : 'Not Assigned'
                  }
                  color={
                    student.status === 'present' && student.staying === 'yes'
                      ? student.parental_detail === 'yes'
                        ? 'text-indigo-600'
                        : student.room_teacher && student.room_teacher.trim() !== ''
                          ? 'text-indigo-600'
                          : 'text-gray-500'
                      : 'text-red-500'
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {student.comments && (
                <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                  <h4 className="flex items-center gap-2 font-bold text-indigo-800 mb-2">
                    <FiMessageSquare /> Comments
                  </h4>
                  <p className="text-indigo-900/80 text-sm leading-relaxed">{student.comments}</p>
                </div>
              )}
              {student.medicationIds && (
                <div
                  className={`rounded-2xl p-6 border ${student.medicationIds && student.medicationIds.length > 0
                    ? 'bg-rose-50 border-rose-100'
                    : 'bg-green-50 border-green-100'
                    }`}
                >
                  <h4
                    className={`flex items-center gap-2 font-bold mb-2 ${student.medicationIds && student.medicationIds.length > 0
                      ? 'text-rose-800'
                      : 'text-green-800'
                      }`}
                  >
                    <FaBriefcaseMedical />
                    Medical Alert
                  </h4>

                  {student.medicationIds && student.medicationIds.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {student.medicationIds.map((id: number) => (
                        <button
                          key={id}
                          onClick={() => window.open(`/user/medical/${id}`, '_blank')}
                          className="group relative overflow-hidden px-5 py-2.5 rounded-xl
                   bg-white border border-rose-200 text-rose-600
                   hover:border-rose-500 hover:text-white
                   transition-all duration-300 ease-out shadow-sm
                   active:scale-95"
                        >
                          {/* Animated Background Fill */}
                          <span className="absolute inset-0 bg-gradient-to-r from-rose-500 to-rose-600 
                         translate-y-[102%] group-hover:translate-y-0 
                         transition-transform duration-300 ease-out" />

                          {/* Button Text */}
                          <div className="relative flex flex-col items-start">
                            <span className="text-[10px] uppercase tracking-[0.1em] font-bold opacity-60 
                           group-hover:opacity-90 transition-opacity leading-none mb-1">
                              Reference
                            </span>
                            <span className="text-sm font-bold tracking-tight">
                              Report #{id}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-2 py-3 px-4 rounded-xl border border-green-100 bg-green-50/30 flex items-center justify-between">
                      <span className="text-green-800 text-xs font-semibold tracking-wide uppercase">
                        Healthy
                      </span>
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetail;