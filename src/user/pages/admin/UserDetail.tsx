// src/user/pages/admin/UserDetail.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiEdit, FiMail, FiPhone, FiUser, FiAlertTriangle, FiLock, FiCheckCircle, FiCheck, FiCopy } from 'react-icons/fi';
import type { User } from '../../../types';
import { getUserById } from './api/UserData';
import { PAGE_PERMISSIONS, isAdmin, fetchPermissionData } from '../permission';
import AccessAlert from '../components/AccessAlert';

const UserDetailSkeleton = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 animate-pulse">
      <div className="h-48 bg-white rounded-xl shadow-sm border border-slate-200"></div>
      <div className="h-64 bg-white rounded-xl shadow-sm border border-slate-200"></div>
    </div>
  );
};

const UserDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const permissionData = await fetchPermissionData();
        setUserRole(permissionData.role);
      } catch (err) {
        console.error('Error fetching permission data:', err);
        setUserRole('user'); // Default to user on error
      } finally {
        setCheckingAccess(false);
      }
    };
    
    checkAccess();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      if (!id || checkingAccess) return;
      
      setLoading(true);
      try {
        const userData = await getUserById(parseInt(id, 10));
        setUser(userData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load user data.';
        setError(errorMessage);
        console.error('Error fetching user:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id, checkingAccess]);

  const handleCopyEmail = () => {
    if (user?.email) {
      navigator.clipboard.writeText(user.email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  const permissionStructure = [
    {
      label: 'Student',
      category: 'STUDENT',
      items: [
        { name: 'Student List', permissionId: PAGE_PERMISSIONS.STUDENT_LIST },
        { name: 'Student Details', permissionId: PAGE_PERMISSIONS.STUDENT_DETAIL },
        { name: 'New Student', permissionId: PAGE_PERMISSIONS.STUDENT_NEW },
        { name: 'Edit Student', permissionId: PAGE_PERMISSIONS.STUDENT_EDIT },
        { name: 'Student Status Update', permissionId: PAGE_PERMISSIONS.STUDENT_STATUS_UPDATE },
      ],
    },
    {
      label: 'Leader',
      category: 'LEADER',
      items: [
        { name: 'Leader List', permissionId: PAGE_PERMISSIONS.LEADER_LIST },
        { name: 'Leader Details', permissionId: PAGE_PERMISSIONS.LEADER_DETAIL },
        { name: 'New Leader', permissionId: PAGE_PERMISSIONS.LEADER_NEW },
        { name: 'Edit Leader', permissionId: PAGE_PERMISSIONS.LEADER_EDIT },
        { name: 'Leader Status Update', permissionId: PAGE_PERMISSIONS.LEADER_STATUS_UPDATE },
      ],
    },
    {
      label: 'Groups',
      category: 'GROUPS',
      items: [
        { name: 'Following Groups', permissionId: PAGE_PERMISSIONS.FOLLOWING_GROUP },
        { name: 'Sub Groups', permissionId: PAGE_PERMISSIONS.SUB_GROUP },
      ],
    },
    {
      label: 'Medical',
      category: 'MEDICAL',
      items: [
        { name: 'Medical Report List', permissionId: PAGE_PERMISSIONS.MEDICAL_REPORT_LIST },
        { name: 'Medical Report Details', permissionId: PAGE_PERMISSIONS.MEDICAL_REPORT_DETAIL },
        { name: 'New Medical Report', permissionId: PAGE_PERMISSIONS.MEDICAL_REPORT_NEW },
        { name: 'Edit Medical Report', permissionId: PAGE_PERMISSIONS.MEDICAL_REPORT_EDIT },
      ],
    },
    {
      label: 'Key Management',
      category: 'KEY_MANAGEMENT',
      items: [
        { name: 'Key Handling', permissionId: PAGE_PERMISSIONS.KEY_HANDING },
        { name: 'Room Leader Assign', permissionId: PAGE_PERMISSIONS.ROOM_LEADER_ASSIGN },
      ],
    },
  ];

  const getPermissionStatus = (permissionId: number) => {
    return user?.permissions?.includes(permissionId) || false;
  };

  // Check if user has admin access
  if (!checkingAccess && !isAdmin(userRole)) {
    return <AccessAlert message="You don't have access to view this page. Admin privileges required." />;
  }

  if (checkingAccess || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
        <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-3 border-b border-gray-100">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-6">
              <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium">
                <FiArrowLeft /> Back
              </button>
              <div className="h-4 w-[1px] bg-gray-300 hidden sm:block"></div>
              <h1 className="text-lg font-bold text-slate-800 hidden sm:block">User Profile</h1>
            </div>
          </div>
        </div>
        <UserDetailSkeleton />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
        <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-3 border-b border-gray-100">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-6">
              <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium">
                <FiArrowLeft /> Back
              </button>
              <div className="h-4 w-[1px] bg-gray-300 hidden sm:block"></div>
              <h1 className="text-lg font-bold text-slate-800 hidden sm:block">Error</h1>
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-xl flex items-center gap-4">
            <FiAlertTriangle size={24} />
            <div>
              <p className="font-bold text-lg">{error || 'User not found'}</p>
              <p className="mt-1 text-red-700">The requested user could not be found.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
      {/* Sticky Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-3 border-b border-gray-100">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium"
            >
              <FiArrowLeft /> Back
            </button>
            <div className="h-4 w-[1px] bg-gray-300 hidden sm:block"></div>
            <h1 className="text-lg font-bold text-slate-800 hidden sm:block">User Profile</h1>
          </div>

          <Link
            to={`/admin/users/edit/${user.id}`}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg transition-all text-sm font-medium shadow-sm hover:shadow"
          >
            <FiEdit /> Edit User
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-8 space-y-6">
        {/* Hero Section - Repositioned Name & ID as Tag */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Header Background Gradient */}
          <div className="relative h-48 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">

            {/* Profile Content Overlaid on Gradient */}
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-center gap-6">

                {/* Avatar - Single Letter */}
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-2xl p-1 border border-white/30">
                    <div className="w-full h-full bg-white rounded-xl flex items-center justify-center text-indigo-700 text-4xl font-black">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* User Info Overlay */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-black text-white tracking-tight capitalize">
                      {user.name}
                    </h1>
                    {/* ID as a Tag */}
                    <span className="px-2 py-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg text-[10px] font-black text-white uppercase tracking-widest">
                      ID: #{user.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-[10px] font-bold rounded-lg uppercase tracking-widest border ${user.isActive
                      ? 'bg-emerald-500/20 text-emerald-100 border-emerald-400/30'
                      : 'bg-rose-500/20 text-rose-100 border-rose-400/30'
                      }`}>
                      {user.isActive ? '● Active' : '● Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar - Matching your Contact Info Style */}
          <div className="px-6 py-4 flex items-center gap-2 bg-slate-50/50">
            <div className="w-1 h-5 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">User Profile Overview</p>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 text-xs uppercase font-bold tracking-wider">Account Status</span>
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <FiCheckCircle className="text-emerald-600" size={20} />
              </div>
            </div>
            <p className="text-lg font-bold text-slate-900">{user.isActive ? 'Active' : 'Inactive'}</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 text-xs uppercase font-bold tracking-wider">User Role</span>
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <FiUser className="text-purple-600" size={20} />
              </div>
            </div>
            <p className="text-lg font-bold text-slate-900">
              {user.role === 'co-admin' ? 'Co Admin' :
                user.role === 'user' ? 'User' :
                  user.role}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 text-xs uppercase font-bold tracking-wider">Permissions</span>
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FiLock className="text-blue-600" size={20} />
              </div>
            </div>
            <p className="text-lg font-bold text-slate-900">{user.permissions?.length || 0} Access</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 text-xs uppercase font-bold tracking-wider">Presence</span>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${user.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                <div className={`w-3 h-3 rounded-full ${user.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              </div>
            </div>
            <p className="text-lg font-bold text-slate-900">{user.isActive ? 'Online' : 'Offline'}</p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
              <h2 className="text-xl font-bold text-slate-900">Contact Information</h2>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiMail className="text-indigo-600" size={24} />
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase font-bold text-slate-400 mb-1">Email Address</p>
                <div className="flex items-center gap-2">
                  <p className="text-base font-semibold text-slate-900 break-all">{user.email}</p>
                  <button
                    onClick={handleCopyEmail}
                    className="flex-shrink-0 relative group"
                    aria-label="Copy email"
                  >
                    <div className={`p-1.5 rounded-lg transition-all duration-200 ${copiedEmail
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
                      }`}>
                      {copiedEmail ? <FiCheck size={16} /> : <FiCopy size={16} />}
                    </div>

                    {/* Tooltip */}
                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                      {copiedEmail ? 'Copied!' : 'Copy email'}
                    </span>
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">Primary contact</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiPhone className="text-emerald-600" size={24} />
              </div>
              <div>
                <p className="text-xs uppercase font-bold text-slate-400 mb-1">Phone Number</p>
                <p className="text-base font-semibold text-slate-900">{user.contactNumber}</p>
                <p className="text-xs text-slate-500 mt-1">Mobile device</p>
              </div>
            </div>
          </div>
        </div>

        {/* Full Permissions List - Ultra-Minimalist Variation */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Header Section */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/30">
            <div className="flex items-center gap-3">
              {/* Signature vertical accent */}
              <div className="w-1.5 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none">Access Permissions</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Security & Authorization Control</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
              {permissionStructure.map((group) => {
                const hasAnyPermissions = group.items.some(item => getPermissionStatus(item.permissionId));
                if (!hasAnyPermissions) return null;

                const isFullAccess = group.items.every(item => getPermissionStatus(item.permissionId));

                return (
                  <div key={group.category} className="flex flex-col">
                    {/* Group Header */}
                    <div className="flex items-center justify-between mb-5 pb-2 border-b border-slate-100">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-[0.1em]">{group.label}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${isFullAccess ? 'text-emerald-500 bg-emerald-50' : 'text-amber-500 bg-amber-50'
                        }`}>
                        {isFullAccess ? 'Full Access' : 'Partial'}
                      </span>
                    </div>

                    {/* Permissions List */}
                    <div className="space-y-3">
                      {group.items.map(item => {
                        const hasPerm = getPermissionStatus(item.permissionId);

                        return (
                          <div key={item.permissionId} className="flex items-center gap-4">
                            {/* Status Icon Box */}
                            <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${hasPerm
                              ? 'bg-white border-emerald-200 text-emerald-600'
                              : 'bg-slate-50 border-slate-100 text-slate-300'
                              }`}>
                              {hasPerm ? (
                                <FiCheck size={14} strokeWidth={3} />
                              ) : (
                                <FiLock size={12} />
                              )}
                            </div>

                            {/* Permission Name Only */}
                            <span className={`text-sm font-bold tracking-tight ${hasPerm ? 'text-slate-700' : 'text-slate-400 opacity-70'
                              }`}>
                              {item.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty State */}
            {(!user.permissions || user.permissions.length === 0) && (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 text-slate-300 mb-4">
                  <FiLock size={24} />
                </div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No access protocols defined</p>
              </div>
            )}
          </div>
        </div>

        {/* Remarks/Notes Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <div className="w-1.5 h-8 bg-gradient-to-b from-slate-400 to-slate-600 rounded-full"></div>
            <h3 className="text-lg font-bold text-slate-900">Additional Notes</h3>
          </div>
          <div className="p-5 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl border border-slate-200">
            <p className="text-slate-700 leading-relaxed font-medium">
              <span className="text-slate-400">Notes: </span>
              <span className="italic">{user.remarks || 'No additional remarks provided for this account.'}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;