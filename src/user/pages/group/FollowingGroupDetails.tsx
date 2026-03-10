// src/user/pages/group/FollowingGroupDetails.tsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiChevronLeft, FiChevronRight,
  FiUser, FiUsers, FiHome, FiAlertTriangle, FiMessageSquare, FiTrash2, FiX, FiCheckCircle, FiGrid,
  FiUsers as FiUsersIcon, FiUserCheck, FiUserX, FiDownload
} from 'react-icons/fi';
import type { Student, Leader } from '../../../types';
import { studentAPI } from '../api/StudentData';
import { leaderAPI } from '../api/LeaderData';
import { followingGroupAPI } from '../api/FollowingGroupDataAPI';
import type { GroupStructure } from '../api/FollowingGroupDataAPI';
import EmptyState from '../components/EmptyState';
import AccessAlert from '../components/AccessAlert';
import { PAGE_PERMISSIONS, canAccess, isAdminOrCoAdmin, fetchPermissionData, type PermissionData } from '../permission';


// Helper function to sort following groups in natural order
const sortFollowingGroups = (groups: string[]): string[] => {
  return groups.sort((a, b) => {
    const matchA = a.match(/^(M|F)([A-Z]?)(\d+)$/i);
    const matchB = b.match(/^(M|F)([A-Z]?)(\d+)$/i);

    if (!matchA || !matchB) return a.localeCompare(b);

    const prefixA = matchA[1].toUpperCase();
    const prefixB = matchB[1].toUpperCase();
    const subPrefixA = matchA[2] || '';
    const subPrefixB = matchB[2] || '';
    const numA = parseInt(matchA[3], 10);
    const numB = parseInt(matchB[3], 10);

    if (prefixA !== prefixB) {
      return prefixA === 'M' ? -1 : 1;
    }

    if (subPrefixA !== subPrefixB) {
      if (!subPrefixA) return -1;
      if (!subPrefixB) return 1;
      return subPrefixA.localeCompare(subPrefixB);
    }

    return numA - numB;
  });
};

// Analytics Card Component
const AnalyticsCard = ({ title, value, icon: Icon, color, subtitle }: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}) => (
  <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs sm:text-sm font-medium text-slate-500 uppercase tracking-wide">{title}</p>
        <p className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-2 sm:p-3 rounded-lg ${color} bg-opacity-10`}>
        <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
    </div>
  </div>
);

// ─── Loading Skeleton with responsive improvements ───
const FollowingGroupSkeleton = () => (
  <div className="max-w-6xl mx-auto py-4 sm:py-6 px-3 sm:px-4 lg:px-8 space-y-4 sm:space-y-6 animate-pulse">
    {/* Analytics Skeleton */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="h-3 w-16 bg-slate-200 rounded"></div>
              <div className="h-6 w-12 bg-slate-200 rounded"></div>
            </div>
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-slate-200 rounded-lg"></div>
          </div>
        </div>
      ))}
    </div>

    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-3 sm:p-4">
        <div className="h-10 sm:h-12 bg-slate-200 rounded-lg w-full"></div>
      </div>
    </div>

    {/* Mobile tab skeleton */}
    <div className="lg:hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="h-8 w-20 bg-slate-200 rounded-lg"></div>
        <div className="h-8 w-20 bg-slate-200 rounded-lg"></div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 bg-slate-200 rounded-lg"></div>
        ))}
      </div>
    </div>

    {/* Desktop tab skeleton */}
    <div className="hidden lg:flex items-center">
      <div className="p-2 mr-2 h-10 w-10 bg-slate-200 rounded-full"></div>
      <div className="flex-1 flex space-x-2 overflow-x-auto py-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="px-6 py-3 bg-slate-200 rounded-lg h-10 w-24 flex-shrink-0"></div>
        ))}
      </div>
      <div className="p-2 ml-2 h-10 w-10 bg-slate-200 rounded-full"></div>
    </div>

    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6 sm:mb-8">
      <div className="p-4 sm:p-6 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-slate-200 rounded-lg flex-shrink-0"></div>
            <div className="flex-1">
              <div className="h-6 sm:h-8 w-32 sm:w-40 bg-slate-200 rounded mb-2"></div>
              <div className="h-3 sm:h-4 w-48 sm:w-64 bg-slate-200 rounded"></div>
            </div>
          </div>
          <div className="h-9 sm:h-10 w-full sm:w-28 bg-slate-200 rounded"></div>
        </div>
      </div>

      <div className="p-4 sm:p-6 bg-slate-50/30">
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
          {[1, 2].map((col) => (
            <div key={col} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 sm:px-5 py-2 sm:py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                <div className="h-4 sm:h-5 w-24 sm:w-32 bg-slate-300 rounded"></div>
                <div className="h-5 sm:h-6 w-8 sm:w-12 bg-slate-300 rounded-full"></div>
              </div>
              <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                {Array.from({ length: col === 1 ? 2 : 4 }).map((_, i) => (
                  <div key={i} className="h-14 sm:h-16 bg-slate-100 rounded-lg"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const FollowingGroupDetails = () => {
  const { groupId = '' } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const tabsRef = useRef<HTMLDivElement>(null);
  const [showMobileTabDropdown, setShowMobileTabDropdown] = useState(false);

  // Permission data state
  const [permissionData, setPermissionData] = useState<PermissionData | null>(null);
  const [permissionLoading, setPermissionLoading] = useState(true);
  const [permissionError, setPermissionError] = useState<boolean>(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [absentStudents, setAbsentStudents] = useState<Student[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [groupStructure, setGroupStructure] = useState<GroupStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<string>('');
  const [followingGroups, setFollowingGroups] = useState<string[]>([]);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [downloading, setDownloading] = useState(false); // Added for download functionality

  // Delete confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  // Analytics data
  const [analytics, setAnalytics] = useState({
    totalGroups: 0,
    totalLeaders: 0,
    totalStudents: 0,
    totalAbsent: 0,
    groupsWithNoLeader: 0,
    groupsWithOneLeader: 0
  });

  // Download handler
  const handleDownload = async () => {
    if (downloading) return;

    try {
      setDownloading(true);
      await followingGroupAPI.downloadExcel();
    } catch (error) {
      console.error("Download failed:", error);
      alert(error instanceof Error ? error.message : "Failed to download Excel file.");
    } finally {
      setDownloading(false);
    }
  };

  // Fetch permission data on component mount
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        setPermissionLoading(true);
        setPermissionError(false);
        const data = await fetchPermissionData();
        setPermissionData(data);

        // Check if user has FOLLOWING_GROUP permission
        if (!canAccess(data, PAGE_PERMISSIONS.FOLLOWING_GROUP) && !isAdminOrCoAdmin(data)) {
          setAccessDenied(true);
          setErrorMessage("You don't have permission to view following groups");
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

  // Permission checks using ONLY permissionData
  const hasPageAccess = () => {
    if (!permissionData || accessDenied || permissionError) return false;
    return canAccess(permissionData, PAGE_PERMISSIONS.FOLLOWING_GROUP) || isAdminOrCoAdmin(permissionData);
  };

  const canDeleteGroup = () => {
    if (!permissionData || accessDenied || permissionError) return false;
    return isAdminOrCoAdmin(permissionData);
  };

  const canViewWhatsApp = () => {
    if (!permissionData || accessDenied || permissionError) return false;
    return isAdminOrCoAdmin(permissionData);
  };

  useEffect(() => {
    const fetchGroupData = async () => {
      if (!hasPageAccess()) {
        setLoading(false);
        return;
      }

      try {
      const groupData = await followingGroupAPI.fetchGroupStructure();

        const maleGroupId = `M${groupId}`;
        const femaleGroupId = `F${groupId}`;

        const filteredMale = groupData.male.filter(g => g.groupName === maleGroupId);
        const filteredFemale = groupData.female.filter(g => g.groupName === femaleGroupId);

        const current = { male: filteredMale, female: filteredFemale };
        setGroupStructure(current);

        const studentIds = new Set<number>();
        const absentStudentIdsSet = new Set<number>();
        const leaderIds = new Set<number>();
        const fgNames: string[] = [];

        let totalLeaders = 0;
        let totalStudents = 0;
        let totalAbsent = 0;
        let groupsWithNoLeader = 0;
        let groupsWithOneLeader = 0;

        [...current.male, ...current.female].forEach(g => {
          g.followingGroups.forEach(fg => {
            fgNames.push(fg.followingGroupName);
            fg.studentIds.forEach(id => studentIds.add(id));
            fg.absentStudentIds.forEach(id => absentStudentIdsSet.add(id));

            totalStudents += fg.studentIds.length;
            totalAbsent += fg.absentStudentIds.length;

            let leaderCount = 0;
            if (fg.leader1Id > 0) {
              leaderIds.add(fg.leader1Id);
              leaderCount++;
            }
            if (fg.leader2Id > 0) {
              leaderIds.add(fg.leader2Id);
              leaderCount++;
            }
            totalLeaders += leaderCount;

            if (leaderCount === 0) groupsWithNoLeader++;
            else if (leaderCount === 1) groupsWithOneLeader++;
          });
        });

        const allStudents = await studentAPI.getStudents();
        const allAbsentStudents = await studentAPI.getStudents();

        let allLeaders: Leader[] = [];
        try {
          allLeaders = await leaderAPI.getAll();
        } catch (err) {
          console.error('Failed to fetch leaders:', err);
        }

        setStudents(allStudents.filter(s => studentIds.has(s.id || 0)));
        setAbsentStudents(allAbsentStudents.filter(s => absentStudentIdsSet.has(s.id || 0)));
        setLeaders(allLeaders.filter(l => leaderIds.has(l.id || 0)));

        // Get unique following group names and sort them properly
        const unique = [...new Set(fgNames)];
        const sorted = sortFollowingGroups(unique);

        setFollowingGroups(sorted);
        setAnalytics({
          totalGroups: sorted.length,
          totalLeaders,
          totalStudents,
          totalAbsent,
          groupsWithNoLeader,
          groupsWithOneLeader
        });

        if (sorted.length > 0) setActiveTab(sorted[0]);
      } catch (err) {
        setError('Failed to load group data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (hasPageAccess()) {
      fetchGroupData();
    }
  }, [groupId, permissionData]);

  const getFilteredData = () => {
    if (!groupStructure || !activeTab) return { filteredStudents: [], filteredLeaders: [], filteredAbsent: [] };

    let sIds: number[] = [];
    let aIds: number[] = [];
    let lIds: number[] = [];

    [...groupStructure.male, ...groupStructure.female].forEach(g => {
      g.followingGroups.forEach(fg => {
        if (fg.followingGroupName === activeTab) {
          sIds = [...fg.studentIds];
          aIds = [...fg.absentStudentIds];
          lIds = [fg.leader1Id, fg.leader2Id].filter(id => id > 0);
        }
      });
    });

    let fs = students.filter(s => sIds.includes(s.id || 0));
    let fa = absentStudents.filter(s => aIds.includes(s.id || 0));
    let fl = leaders.filter(l => lIds.includes(l.id || 0));

    return { filteredStudents: fs, filteredLeaders: fl, filteredAbsent: fa };
  };

  const { filteredStudents, filteredAbsent } = getFilteredData();

  const scrollTabs = (dir: 'left' | 'right') => {
    if (!tabsRef.current) return;
    const amount = 180;
    const pos = dir === 'left'
      ? Math.max(0, scrollPosition - amount)
      : scrollPosition + amount;

    tabsRef.current.scrollTo({ left: pos, behavior: 'smooth' });
    setScrollPosition(pos);
  };

  const getLeadersForCurrentTab = () => {
    if (!groupStructure) return { leader1: undefined, leader2: undefined };

    let l1: number | null = null;
    let l2: number | null = null;

    [...groupStructure.male, ...groupStructure.female].forEach(g => {
      g.followingGroups.forEach(fg => {
        if (fg.followingGroupName === activeTab) {
          l1 = fg.leader1Id;
          l2 = fg.leader2Id;
        }
      });
    });

    return {
      leader1: leaders.find(l => l.id === l1),
      leader2: leaders.find(l => l.id === l2),
    };
  };

  const getLeaderCountForGroup = (groupName: string): number => {
    if (!groupStructure) return 0;
    for (const g of [...groupStructure.male, ...groupStructure.female]) {
      for (const fg of g.followingGroups) {
        if (fg.followingGroupName === groupName) {
          let count = 0;
          if (fg.leader1Id > 0) count++;
          if (fg.leader2Id > 0) count++;
          return count;
        }
      }
    }
    return 0;
  };

  const getStudentCountForGroup = (groupName: string): number => {
    if (!groupStructure) return 0;
    for (const g of [...groupStructure.male, ...groupStructure.female]) {
      for (const fg of g.followingGroups) {
        if (fg.followingGroupName === groupName) {
          return fg.studentIds.length;
        }
      }
    }
    return 0;
  };

  const requestDeleteGroup = (fgName: string) => {
    setGroupToDelete(fgName);
    setShowDeleteConfirm(true);
    setDeleteSuccess(false);
  };

  const confirmDeleteGroup = async () => {
    if (!groupToDelete) return;

    try {
      await followingGroupAPI.remove(groupToDelete);

      setDeleteSuccess(true);

      setFollowingGroups(prev => {
        const updated = prev.filter(g => g !== groupToDelete);
        if (activeTab === groupToDelete && updated.length > 0) {
          setActiveTab(updated[0]);
        }
        return updated;
      });

      setTimeout(() => {
        setShowDeleteConfirm(false);
        setGroupToDelete(null);
        setDeleteSuccess(false);
      }, 3000);

    } catch (err) {
      console.error('Failed to remove following group:', err);
      alert('Failed to delete the group. Please try again.');
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setGroupToDelete(null);
    setDeleteSuccess(false);
  };

  const sendWhatsAppToLeader = (leader: Leader) => {
    if (!leader.whatsappNumber) {
      alert("This leader has no WhatsApp number saved.");
      return;
    }

    // Helper function to capitalize first letter of each word
    const capitalizeWords = (str: string): string => {
      if (!str || str === '—') return str;
      return str.split(' ').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
    };

    // Helper function to capitalize first letter of sentence
    const capitalizeFirstLetter = (str: string): string => {
      if (!str) return str;
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    const prefix = leader.gender?.toLowerCase() === 'female' ? 'Sis.' : 'Bro.';
    const leaderFirstName = leader.name?.split(' ')[0] || 'Leader';
    const capitalizedLeaderName = capitalizeWords(leaderFirstName);

    // Capitalize sender info (first letter of each word)
    const senderName = permissionData?.name ? capitalizeWords(permissionData.name) : '—';
    const senderRole = permissionData?.role ? capitalizeFirstLetter(permissionData.role) : '—';

    const groupPrefix = activeTab.startsWith('M') ? 'Male' : 'Female';
    const ageGroup = `${groupPrefix} Group ${groupId}`;
    const followingGroup = activeTab; // Keep as is (already in format like "MB1")

    const formatContactLine = (contact: string, whatsapp: string) => {
      if (contact === '—' && whatsapp === '—') return '';
      if (contact === whatsapp && contact !== '—') return `Contact/WA: ${contact}`;
      let lines = [];
      if (contact !== '—') lines.push(`Contact: ${contact}`);
      if (whatsapp !== '—') lines.push(`WA: ${whatsapp}`);
      return lines.join('\n');
    };

    const { leader1, leader2 } = getLeadersForCurrentTab();
    const coLeader = leader1?.id === leader.id ? leader2 : leader1;

    const coLeaderBlock = coLeader
      ? `Name: ${capitalizeWords(coLeader.name || '—')}\nPlace: ${capitalizeWords(coLeader.place || '—')}\n${formatContactLine(coLeader.contactNumber || '—', coLeader.whatsappNumber || '—')}`
      : '(No co-leader assigned)';

    const { filteredStudents: presentStudents, filteredAbsent: absentStudentsHere } = getFilteredData();

    const presentBlocks = presentStudents.length > 0
      ? presentStudents
        .map((s, i) => {
          const nameLine = `${i + 1}. Name: ${capitalizeWords(s.name || '—')} (ID: ${s.id || '—'})`;
          const contactLine = formatContactLine(s.contactNumber || '—', s.whatsappNumber || '—');
          const indented = contactLine ? contactLine.split('\n').map(l => '   ' + l).join('\n') : '';
          return `${nameLine}\n   Age: ${s.age || '—'}\n   Place: ${capitalizeWords(s.place || '—')}\n${indented}`;
        })
        .join('\n\n')
      : '(No present students)';

    const absentBlocks = absentStudentsHere.length > 0
      ? absentStudentsHere
        .map((s, i) => {
          const nameLine = `${i + 1}. Name: ${capitalizeWords(s.name || '—')} (ID: ${s.id || '—'}) **ABSENT**`;
          const contactLine = formatContactLine(s.contactNumber || '—', s.whatsappNumber || '—');
          const indented = contactLine ? contactLine.split('\n').map(l => '   ' + l).join('\n') : '';
          return `${nameLine}\n   Age: ${s.age || '—'}\n   Place: ${capitalizeWords(s.place || '—')}\n${indented}`;
        })
        .join('\n\n')
      : '';

    const studentSection = absentBlocks
      ? `${presentBlocks}\n\n**Absent Students:**\n${absentBlocks}`
      : presentBlocks;

    const message = `Praise the Lord ${prefix} ${capitalizedLeaderName},

This message is to inform you about your following group assignment.

*Group Details*
Age Group: ${ageGroup}
Following Group: ${followingGroup}

*Co-Leader Details*
${coLeaderBlock}

*Student Details*
${studentSection}

Thank you for your support.

Regards,
${senderName}
${senderRole}

God bless you.`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${leader.whatsappNumber}?text=${encoded}`, '_blank');
  };

  const LeaderCard = ({ leader }: { leader: Leader }) => {
    const showWhatsApp = canViewWhatsApp();

    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-slate-50 border border-slate-100 rounded-lg hover:bg-white hover:border-indigo-200 hover:shadow-sm transition-all group gap-3 sm:gap-4">
        <div className="flex-1 w-full sm:w-auto">
          <div className="font-bold text-slate-800 text-sm sm:text-base">{leader.name.charAt(0).toUpperCase() + leader.name.slice(1).toLowerCase()}</div>
          <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-1 sm:gap-2 items-center">
            <span className="font-semibold text-indigo-600">{activeTab}</span>
            <span className="hidden xs:inline">•</span>
            <span>ID: #{leader.id}</span>
            <span>•</span>
            <span className="capitalize">{leader.gender}</span>
            {leader.type && (
              <>
                <span>•</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${leader.type === 'leader1'
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-purple-100 text-purple-800 border border-purple-200'
                  }`}>
                  {leader.type === 'leader1' ? 'L1' : 'L2'}
                </span>
              </>
            )}
            <span>•</span>
            <span className="truncate max-w-[100px] sm:max-w-[150px]">{leader.place}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => navigate(`/user/leader/${leader.id}`)}
            className="text-xs font-bold bg-white border border-slate-200 text-slate-600 px-2 sm:px-3 py-1.5 rounded-lg group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all shadow-sm whitespace-nowrap"
          >
            View
          </button>

          {showWhatsApp && leader.whatsappNumber && (
            <button
              onClick={() => sendWhatsAppToLeader(leader)}
              title="Send WhatsApp message"
              className="p-2 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors flex-shrink-0"
            >
              <FiMessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const StudentCard = ({ student, isAbsent = false }: { student: Student; isAbsent?: boolean }) => {
    const statusColor = isAbsent
      ? 'text-red-600 font-medium'
      : student.status === 'present'
        ? 'text-green-600 font-medium'
        : student.status === 'registered'
          ? 'text-yellow-600 font-medium'
          : 'text-red-600 font-medium';

    return (
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-slate-50 border rounded-lg hover:shadow-sm transition-all group gap-3 sm:gap-4 ${isAbsent ? 'border-red-200 hover:border-red-300' : 'border-slate-100 hover:border-green-200'
        }`}>
        <div className="flex-1 w-full sm:w-auto">
          <div className="font-bold text-slate-800 text-sm sm:text-base capitalize">{student.name.charAt(0).toUpperCase() + student.name.slice(1).toLowerCase()}</div>
          <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-1 sm:gap-2 items-center">
            <span className="font-semibold text-green-600">{activeTab}</span>
            <span className="hidden xs:inline">•</span>
            <span>ID: {student.id}</span>
            <span>•</span>
            <span className="uppercase">{student.gender.toUpperCase()}</span>
            <span>•</span>
            <span className={statusColor}>
              {isAbsent ? 'Absent' : (student.status.charAt(0).toUpperCase() + student.status.slice(1))}
            </span>
            <span>•</span>
            <span className="uppercase truncate max-w-[80px] sm:max-w-[120px]">{student.place}</span>
          </div>
        </div>
        <button
          onClick={() => navigate(`/user/student/${student.id}`)}
          className="text-xs font-bold bg-white border border-slate-200 text-slate-600 px-2 sm:px-3 py-1.5 rounded-lg group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all shadow-sm whitespace-nowrap self-end sm:self-auto"
        >
          View
        </button>
      </div>
    );
  };

  const renderCurrentFollowingGroup = () => {
    if (!groupStructure || !activeTab) return null;

    const { leader1, leader2 } = getLeadersForCurrentTab();
    const leadersHere = [leader1, leader2].filter(Boolean) as Leader[];
    const studentsHere = filteredStudents;
    const absentHere = filteredAbsent;

    const noLeaders = leadersHere.length === 0;
    const totalMembers = leadersHere.length + studentsHere.length + absentHere.length;

    const leaderCount = getLeaderCountForGroup(activeTab);
    const studentCount = getStudentCountForGroup(activeTab);
    const canBeDeleted = leaderCount === 0 && studentCount === 0 && canDeleteGroup();

    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6 sm:mb-8">
        <div className="p-4 sm:p-6 border-b border-slate-200 bg-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 w-full sm:w-auto">
              <div
                className={`h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0 ${noLeaders ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'
                  }`}
              >
                <FiHome className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight truncate">{activeTab}</h2>
                  {noLeaders && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                      <FiAlertTriangle className="mr-1 w-3 h-3" /> No Leader
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-xs sm:text-sm mt-0.5 sm:mt-1">Following Group • Group {groupId}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              {!canBeDeleted && (
                <div className="text-right flex-shrink-0">
                  <div className={`text-lg sm:text-xl font-bold ${totalMembers > 30 ? 'text-red-600' : 'text-indigo-600'}`}>
                    {totalMembers}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">Members</div>
                </div>
              )}

              {canBeDeleted && canDeleteGroup() && (
                <button
                  onClick={() => requestDeleteGroup(activeTab)}
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors shadow-sm whitespace-nowrap text-sm"
                  title="Delete this empty following group"
                >
                  <FiTrash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden xs:inline">Delete</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 bg-slate-50/30">
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Leaders Column */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 sm:px-5 py-2 sm:py-3 bg-blue-50 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1 sm:gap-2 uppercase tracking-wide">
                  <FiUser className="text-blue-600 w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">LEADERS</span>
                  <span className="xs:hidden">Leaders</span>
                </h3>
                <span className="bg-blue-100 text-blue-700 text-xs font-black px-2 py-1 rounded-full">
                  {leadersHere.length}
                </span>
              </div>
              <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 max-h-[400px] overflow-y-auto">
                {leadersHere.length === 0 ? (
                  <div className="text-center py-6 sm:py-10">
                    <FiUser className="w-8 h-8 sm:w-10 sm:h-10 mx-auto opacity-20 mb-2 sm:mb-3" />
                    <p className="text-xs sm:text-sm text-slate-400">No leaders</p>
                  </div>
                ) : (
                  leadersHere.map(l => <LeaderCard key={l.id} leader={l} />)
                )}
              </div>
            </div>

            {/* Students Column */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 sm:px-5 py-2 sm:py-3 bg-green-50 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1 sm:gap-2 uppercase tracking-wide">
                  <FiUsers className="text-green-600 w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">STUDENTS</span>
                  <span className="xs:hidden">Students</span>
                </h3>
                <span className="bg-green-100 text-green-700 text-xs font-black px-2 py-1 rounded-full">
                  {studentsHere.length}
                </span>
              </div>
              <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 max-h-[400px] overflow-y-auto">
                {studentsHere.length === 0 ? (
                  <div className="text-center py-6 sm:py-10">
                    <FiUsers className="w-8 h-8 sm:w-10 sm:h-10 mx-auto opacity-20 mb-2 sm:mb-3" />
                    <p className="text-xs sm:text-sm text-slate-400">No students</p>
                  </div>
                ) : (
                  studentsHere.map(s => <StudentCard key={s.id} student={s} />)
                )}
              </div>
            </div>
          </div>

          {/* Absent Students Section */}
          {filteredAbsent.length > 0 && (
            <div className="mt-4 sm:mt-6">
              <div className="bg-white border border-red-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-4 sm:px-5 py-2 sm:py-3 bg-red-50 border-b border-red-200 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1 sm:gap-2 uppercase tracking-wide">
                    <FiAlertTriangle className="text-red-600 w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">ABSENT STUDENTS</span>
                    <span className="xs:hidden">ABSENT</span>
                  </h3>
                  <span className="bg-red-100 text-red-700 text-xs font-black px-2 py-1 rounded-full">
                    {filteredAbsent.length}
                  </span>
                </div>
                <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 max-h-[300px] overflow-y-auto">
                  {filteredAbsent.map(s => (
                    <StudentCard key={s.id} student={s} isAbsent />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Mobile tab selector
  const MobileTabSelector = () => (
    <div className="lg:hidden mb-4">
      <button
        onClick={() => setShowMobileTabDropdown(!showMobileTabDropdown)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-lg shadow-sm"
      >
        <span className="font-medium text-slate-800">{activeTab || 'Select Group'}</span>
        <FiChevronRight className={`w-5 h-5 text-slate-500 transition-transform ${showMobileTabDropdown ? 'rotate-90' : ''}`} />
      </button>

      {showMobileTabDropdown && (
        <div className="absolute z-20 mt-2 w-full max-w-[calc(100%-2rem)] bg-white border border-slate-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          <div className="p-2 grid grid-cols-2 gap-2">
            {followingGroups.map((tab) => {
              const leaderCount = getLeaderCountForGroup(tab);
              let bgColor = '';
              let textColor = '';

              if (leaderCount === 0) {
                bgColor = activeTab === tab ? 'bg-red-600' : 'bg-red-50';
                textColor = activeTab === tab ? 'text-white' : 'text-red-700';
              } else if (leaderCount === 1) {
                bgColor = activeTab === tab ? 'bg-orange-600' : 'bg-orange-50';
                textColor = activeTab === tab ? 'text-white' : 'text-orange-700';
              } else {
                bgColor = activeTab === tab ? 'bg-indigo-600' : 'bg-white';
                textColor = activeTab === tab ? 'text-white' : 'text-slate-700';
              }

              return (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setShowMobileTabDropdown(false);
                  }}
                  className={`px-3 py-2.5 text-sm font-medium rounded-lg border ${bgColor} ${textColor} ${activeTab !== tab ? 'border-slate-200 hover:bg-slate-50' : 'border-transparent'
                    } transition-colors`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  // Show loading while permissions are loading
  if (permissionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="bg-white shadow-sm sticky top-0 z-10 px-3 sm:px-4 py-3 sm:py-4 border-b border-gray-100">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3 sm:gap-6">
              <button onClick={() => navigate('/user/dashboard')} className="flex items-center gap-1 sm:gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium text-sm sm:text-base">
                <FiArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" /> Back
              </button>
              <div className="h-4 w-[1px] bg-gray-300 hidden sm:block"></div>
              <h1 className="text-base sm:text-lg font-bold text-slate-800 hidden sm:block">
                Following Group {groupId}
              </h1>
            </div>
          </div>
        </div>
        <FollowingGroupSkeleton />
      </div>
    );
  }

  // Show access denied if user doesn't have FOLLOWING_GROUP permission
  if (accessDenied || permissionError || !hasPageAccess()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <AccessAlert message={errorMessage || "You do not have permission to view following groups."} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="bg-white shadow-sm sticky top-0 z-10 px-3 sm:px-4 py-3 sm:py-4 border-b border-gray-100">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3 sm:gap-6">
              <button onClick={() => navigate('/user/dashboard')} className="flex items-center gap-1 sm:gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium text-sm sm:text-base">
                <FiArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" /> Back
              </button>
              <div className="h-4 w-[1px] bg-gray-300 hidden sm:block"></div>
              <h1 className="text-base sm:text-lg font-bold text-slate-800 hidden sm:block">
                Following Group {groupId}
              </h1>
            </div>
          </div>
        </div>
        <FollowingGroupSkeleton />
      </div>
    );
  }

  if (error || !groupStructure || followingGroups.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="bg-white shadow-sm sticky top-0 z-10 px-3 sm:px-4 py-3 sm:py-4 border-b border-gray-100">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3 sm:gap-6">
              <button onClick={() => navigate('/user/dashboard')} className="flex items-center gap-1 sm:gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium text-sm sm:text-base">
                <FiArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" /> Back
              </button>
              <div className="h-4 w-[1px] bg-gray-300 hidden sm:block"></div>
              <h1 className="text-base sm:text-lg font-bold text-slate-800 hidden sm:block capitalize">
                Following Group {groupId}
              </h1>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto py-8 sm:py-10 px-3 sm:px-4 text-center text-slate-600">
          <EmptyState
            title="Following Group Not Available"
            message={error || "No following-groups are assigned to this group yet. Please check again later or contact the admin."}
            buttonText="Back to Dashboard"
            navigatePath="/dashboard"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-8 sm:pb-12 relative">
      <div className="bg-white shadow-sm sticky top-0 z-10 px-3 sm:px-4 py-3 sm:py-4 border-b border-gray-100">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 sm:gap-6">
            <button
              onClick={() => navigate('/user/dashboard')}
              className="flex items-center gap-1 sm:gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium text-sm sm:text-base"
            >
              <FiArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" /> Back
            </button>
            <div className="h-4 w-[1px] bg-gray-300 hidden sm:block"></div>
            <h1 className="text-base sm:text-lg font-bold text-slate-800 hidden sm:block capitalize">
              Following Group {groupId}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {isAdminOrCoAdmin(permissionData) && (
              <button
                onClick={handleDownload}
                disabled={downloading}
                className={"flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200 transform active:scale-95 " + (downloading ? 'bg-green-400 cursor-not-allowed opacity-75' : 'bg-green-600 hover:bg-green-700 hover:shadow-md active:bg-green-800') + " disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"}
                aria-label={downloading ? 'Downloading groups' : 'Download groups'}
              >
                <FiDownload className={"w-4 h-4 " + (downloading ? 'animate-bounce' : '')} />
                <span>{downloading ? 'Downloading...' : 'Download'}</span>
              </button>
            )}
            <div className="w-px h-6 bg-slate-200" aria-hidden="true" />
            <div className="flex items-center gap-2 px-1">
              <div className="p-1.5 bg-indigo-50 rounded-lg">
                <FiGrid className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-800">
                  {followingGroups.length} Groups
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-4 sm:py-6 px-3 sm:px-4 lg:px-8 space-y-4 sm:space-y-6">
        {/* Analytics Dashboard */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <AnalyticsCard
            title="Total Groups"
            value={analytics.totalGroups}
            icon={FiGrid}
            color="bg-indigo-500"
            subtitle={`${analytics.groupsWithNoLeader} with no leader`}
          />
          <AnalyticsCard
            title="Total Leaders"
            value={analytics.totalLeaders}
            icon={FiUserCheck}
            color="bg-blue-500"
            subtitle={`${analytics.groupsWithOneLeader} groups with 1 leader`}
          />
          <AnalyticsCard
            title="Total Students"
            value={analytics.totalStudents}
            icon={FiUsersIcon}
            color="bg-green-500"
          />
          <AnalyticsCard
            title="Absent Today"
            value={analytics.totalAbsent}
            icon={FiUserX}
            color="bg-red-500"
            subtitle={`${((analytics.totalAbsent / analytics.totalStudents) * 100 || 0).toFixed(1)}% absent`}
          />
        </div>

        {/* Mobile Tab Selector */}
        <MobileTabSelector />

        {/* Desktop Tab Navigation */}
        <div className="hidden lg:flex items-center">
          <button
            onClick={() => scrollTabs('left')}
            className="p-2 mr-2 text-slate-500 hover:text-slate-800 disabled:opacity-40 transition-colors flex-shrink-0"
            disabled={scrollPosition === 0}
          >
            <FiChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <div
            ref={tabsRef}
            className="flex-1 flex space-x-2 overflow-x-auto scrollbar-hide py-1"
            style={{ scrollBehavior: 'smooth' }}
          >
            {followingGroups.map((tab) => {
              const leaderCount = getLeaderCountForGroup(tab);
              let tabClass = '';
              let dotColor = '';

              if (leaderCount === 0) {
                tabClass = activeTab === tab
                  ? 'bg-red-600 text-white border-red-600 shadow-md'
                  : 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100';
                dotColor = 'bg-red-500';
              } else if (leaderCount === 1) {
                tabClass = activeTab === tab
                  ? 'bg-orange-600 text-white border-orange-600 shadow-md'
                  : 'bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100';
                dotColor = 'bg-orange-500';
              } else {
                tabClass = activeTab === tab
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50';
              }

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 sm:px-5 py-2 sm:py-2.5 font-medium text-xs sm:text-sm whitespace-nowrap rounded-lg transition-all flex items-center border min-w-[80px] sm:min-w-[100px] justify-center ${tabClass}`}
                >
                  <FiUser className="mr-1 sm:mr-1.5 w-3 h-3 sm:w-4 sm:h-4" /> {tab}
                  {leaderCount < 2 && activeTab !== tab && (
                    <span className={`ml-1 sm:ml-1.5 inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 ${dotColor} rounded-full`}></span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => scrollTabs('right')}
            className="p-2 ml-2 text-slate-500 hover:text-slate-800 disabled:opacity-40 transition-colors flex-shrink-0"
            disabled={scrollPosition >= ((tabsRef.current?.scrollWidth || 0) - (tabsRef.current?.clientWidth || 0))}
          >
            <FiChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {renderCurrentFollowingGroup()}
      </div>

      {/* Delete Confirmation / Success Modal */}
      {showDeleteConfirm && groupToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            {!deleteSuccess ? (
              <>
                <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2 sm:gap-3">
                    <FiAlertTriangle className="text-red-600 w-5 h-5 sm:w-6 sm:h-6" />
                    Confirm Deletion
                  </h3>
                  <button
                    onClick={cancelDelete}
                    className="text-slate-500 hover:text-slate-800"
                  >
                    <FiX className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>

                <div className="p-4 sm:p-6">
                  <p className="text-sm sm:text-base text-slate-700 mb-2">
                    You are about to <span className="font-semibold text-red-600">permanently delete</span>:
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-slate-900 mb-4 sm:mb-6">
                    "{groupToDelete}"
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600">
                    This group is empty.<br />
                    This action <strong>cannot be undone</strong>.
                  </p>
                </div>

                <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 sm:gap-4">
                  <button
                    onClick={cancelDelete}
                    className="px-3 sm:px-5 py-2 sm:py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors font-medium text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteGroup}
                    className="px-3 sm:px-5 py-2 sm:py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm flex items-center gap-1 sm:gap-2 text-sm"
                  >
                    <FiTrash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    Delete
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 sm:p-6 border-b border-green-200 bg-green-50 flex items-center justify-between">
                  <h3 className="text-lg sm:text-xl font-bold text-green-800 flex items-center gap-2 sm:gap-3">
                    <FiCheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                    Success
                  </h3>
                  <button
                    onClick={cancelDelete}
                    className="text-slate-500 hover:text-slate-800"
                  >
                    <FiX className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>

                <div className="p-6 sm:p-8 text-center">
                  <FiCheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-600 mx-auto mb-3 sm:mb-4" />
                  <p className="text-lg sm:text-xl font-bold text-slate-800 mb-2">
                    Group Deleted
                  </p>
                  <p className="text-sm sm:text-base text-slate-600">
                    {groupToDelete} has been removed.
                  </p>
                </div>

                <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border-t border-slate-200 flex justify-center">
                  <button
                    onClick={cancelDelete}
                    className="px-6 sm:px-8 py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm text-sm"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowingGroupDetails;