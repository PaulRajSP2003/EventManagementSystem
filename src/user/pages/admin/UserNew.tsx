// src/user/pages/admin/UserNew.tsx
import { useState, useEffect } from 'react';
import { FiCheckCircle } from 'react-icons/fi';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AssignRole from '../components/AssignRole';
import type { AssignRole as AssignRoleType } from '../../../types';
import AccessAlert from '../components/AccessAlert';
import { PAGE_PERMISSIONS, fetchPermissionData, isAdmin } from '../permission';
import { createUser } from './api/UserData';
import StickyHeader from '../components/StickyHeader';

// Skeleton (unchanged)
const UserNewSkeleton = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 mt-8 space-y-6 animate-pulse">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="h-6 w-48 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 rounded"></div>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i}>
                <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                <div className="h-10 w-full bg-gray-100 rounded-lg"></div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-100">
            <div className="pb-5">
              <div className="h-6 w-40 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 w-72 bg-gray-200 rounded"></div>
            </div>
            <div className="h-16 bg-gray-100 rounded-lg"></div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <div className="h-6 w-48 bg-gray-200 rounded mb-2"></div>
            <div className="h-24 w-full bg-gray-100 rounded-lg"></div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <div className="h-10 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
};

// Permission Structure
const permissionStructure = [
  {
    label: 'Student',
    permissionId: 'STUDENT_GROUP',
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
    permissionId: 'LEADER_GROUP',
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
    permissionId: 'GROUPS',
    items: [
      { name: 'Following Groups', permissionId: PAGE_PERMISSIONS.FOLLOWING_GROUP },
      { name: 'Sub Groups', permissionId: PAGE_PERMISSIONS.SUB_GROUP },
    ],
  },
  {
    label: 'Medical',
    permissionId: 'MEDICAL_GROUP',
    items: [
      { name: 'Medical Report List', permissionId: PAGE_PERMISSIONS.MEDICAL_REPORT_LIST },
      { name: 'Medical Report Details', permissionId: PAGE_PERMISSIONS.MEDICAL_REPORT_DETAIL },
      { name: 'New Medical Report', permissionId: PAGE_PERMISSIONS.MEDICAL_REPORT_NEW },
      { name: 'Edit Medical Report', permissionId: PAGE_PERMISSIONS.MEDICAL_REPORT_EDIT },
      { name: 'Add Treatment', permissionId: PAGE_PERMISSIONS.MEDICAL_TREATMENT_ADD },
    ],
  },
  {
    label: 'Room Management',
    permissionId: 'KEY_MANAGEMENT',
    items: [
      { name: 'Room View', permissionId: PAGE_PERMISSIONS.VIEW_ROOM },
      { name: 'Key Handling', permissionId: PAGE_PERMISSIONS.KEY_HANDING },
      { name: 'Room Leader Assign', permissionId: PAGE_PERMISSIONS.ROOM_LEADER_ASSIGN },
    ],
  },
  {
    label: 'Task Management',
    permissionId: 'TASK_GROUP',
    items: [
      { name: 'Task Details', permissionId: PAGE_PERMISSIONS.TASK_DETAILS },
    ],
  },
];

// Permissions Section with ON/OFF toggles + disabled support
interface PermissionsSectionProps {
  permissions: number[];
  onPermissionChange: (permissionId: number, isEnabled: boolean) => void;
  disabled?: boolean;
}

const PermissionsSection: React.FC<PermissionsSectionProps> = ({
  permissions,
  onPermissionChange,
  disabled = false,
}) => {
  const handleGroupToggle = (
    group: (typeof permissionStructure)[0],
    shouldEnable: boolean
  ) => {
    if (disabled) return;
    group.items.forEach((item) => {
      onPermissionChange(item.permissionId as number, shouldEnable);
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {permissionStructure.slice(0, 2).map((group) => {
          const allEnabled = group.items.every((item) =>
            permissions.includes(item.permissionId as number)
          );

          return (
            <div
              key={group.permissionId}
              className={`p-5 border border-slate-200 rounded-xl bg-white shadow-sm ${disabled ? 'opacity-75' : ''}`}
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <span className="font-semibold text-slate-800 text-base">
                  {group.label}
                </span>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleGroupToggle(group, !allEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${allEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                    } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${allEnabled ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                  />
                </button>
              </div>

              <div className="space-y-4">
                {group.items.map((item) => {
                  const isEnabled = permissions.includes(item.permissionId as number);

                  return (
                    <div
                      key={item.permissionId}
                      className="flex items-center justify-between py-1"
                    >
                      <span className="text-sm text-slate-700 font-medium">
                        {item.name}
                      </span>
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() =>
                          !disabled && onPermissionChange(item.permissionId as number, !isEnabled)
                        }
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${isEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                          } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${isEnabled ? 'translate-x-4' : 'translate-x-0.5'
                            }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {permissionStructure.slice(2).map((group) => {
          const allEnabled = group.items.every((item) =>
            permissions.includes(item.permissionId as number)
          );

          return (
            <div
              key={group.permissionId}
              className={`p-5 border border-slate-200 rounded-xl bg-white shadow-sm ${disabled ? 'opacity-75' : ''}`}
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <span className="font-semibold text-slate-800 text-base">
                  {group.label}
                </span>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleGroupToggle(group, !allEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${allEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                    } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${allEnabled ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                  />
                </button>
              </div>

              <div className="space-y-4">
                {group.items.map((item) => {
                  const isEnabled = permissions.includes(item.permissionId as number);

                  return (
                    <div
                      key={item.permissionId}
                      className="flex items-center justify-between py-1"
                    >
                      <span className="text-sm text-slate-700 font-medium">
                        {item.name}
                      </span>
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() =>
                          !disabled && onPermissionChange(item.permissionId as number, !isEnabled)
                        }
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${isEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                          } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${isEnabled ? 'translate-x-4' : 'translate-x-0.5'
                            }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const UserNew = () => {
  const navigate = useNavigate();
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccessActions, setShowSuccessActions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [formDisabled, setFormDisabled] = useState(false);

  const [formData, setFormData] = useState({
    id: 0,
    name: '',
    email: '',
    contactNumber: '',
    role: 'user',
    password: '',
    confirmPassword: '',
    assignRole: 0,
    remarks: '',
    isActive: true,
    permissions: [] as number[],
  });

  // Check admin access
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const permissionData = await fetchPermissionData();
        setUserRole(permissionData?.role || 'user');
      } catch (err) {
        console.error('Error fetching permission data:', err);
        setUserRole('user'); // Default to user on error
      } finally {
        setCheckingAccess(false);
      }
    };

    checkAccess();
  }, []);

  // Simulate loading after access check
  useEffect(() => {
    if (!checkingAccess) {
      const timer = setTimeout(() => setLoading(false), 800);
      return () => clearTimeout(timer);
    }
  }, [checkingAccess]);

  // Auto-hide message after 3 seconds (success or error)
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage('');
        setError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  // Check if user has admin access
  if (!checkingAccess && !isAdmin(userRole)) {
    return <AccessAlert message="Only administrators can create new users." />;
  }

  const handleTextChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (formDisabled) return;
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (formDisabled) return;
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleSelect = (role: AssignRoleType | null) => {
    if (formDisabled) return;
    setFormData((prev) => ({
      ...prev,
      assignRole: role ? role.id : 0,
    }));
  };

  const handlePermissionChange = (permissionId: number, isEnabled: boolean) => {
    if (formDisabled) return;
    setFormData((prev) => {
      let newPermissions = isEnabled
        ? [...prev.permissions, permissionId]
        : prev.permissions.filter((p) => p !== permissionId);

      // Request 1: Automatically select Room View if Key Handling or Room Leader Assign is selected
      if (isEnabled && (permissionId === PAGE_PERMISSIONS.KEY_HANDING || permissionId === PAGE_PERMISSIONS.ROOM_LEADER_ASSIGN)) {
        if (!newPermissions.includes(PAGE_PERMISSIONS.VIEW_ROOM)) {
          newPermissions.push(PAGE_PERMISSIONS.VIEW_ROOM);
        }
      }

      // Request 2: If Room View is turned OFF, automatically turn OFF Key Handling and Room Leader Assign
      if (!isEnabled && permissionId === PAGE_PERMISSIONS.VIEW_ROOM) {
        newPermissions = newPermissions.filter(
          (p) => p !== PAGE_PERMISSIONS.KEY_HANDING && p !== PAGE_PERMISSIONS.ROOM_LEADER_ASSIGN
        );
      }

      return { ...prev, permissions: newPermissions };
    });
  };

  const [createdUserId, setCreatedUserId] = useState<number | null>(null);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setError('');
    setShowSuccessActions(false);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setIsSubmitting(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setIsSubmitting(false);
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address.');
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        id: 0,
        name: formData.name.trim().toLocaleLowerCase(),
        email: formData.email.trim().toLocaleLowerCase(),
        contactNumber: formData.contactNumber.trim(),
        role: formData.role.toLocaleLowerCase(),
        assignRole: formData.assignRole,
        isActive: true,
        remarks: formData.remarks.trim() || '',
        password: formData.password,
        permissions: formData.permissions,
      };

      const createdUser = await createUser(payload);
      setCreatedUserId(createdUser.id || null);
      setMessage('User created successfully!');
      setShowSuccessActions(true);
      setFormDisabled(true); // ← Lock form, but **do not clear** formData

      // IMPORTANT: We do NOT reset formData here → entered data stays visible
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to create user. Please try again.';
      setError(errorMessage);
      console.error('Error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterNext = () => {
    // Clear form + unlock for new entry
    setFormData({
      id: 0,
      name: '',
      email: '',
      contactNumber: '',
      role: 'user',
      password: '',
      confirmPassword: '',
      assignRole: 0,
      remarks: '',
      isActive: true,
      permissions: [],
    });
    setShowSuccessActions(false);
    setMessage('');
    setError('');
    setFormDisabled(false);
  };

  if (checkingAccess || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
        <StickyHeader title="New User" onBack={() => navigate('/admin/users')}>
          <Link
            to="/admin/users"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg transition text-sm font-medium"
          >
            View All Users
          </Link>
        </StickyHeader>
        <UserNewSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
      <StickyHeader title="User Management" onBack={() => navigate('/admin/users')}>
        <Link
          to="/admin/users"
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg transition text-sm font-medium"
        >
          View All Users
        </Link>
      </StickyHeader>

      <div className="max-w-5xl mx-auto px-4 mt-2 sm:mt-8 space-y-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-6 flex-wrap sm:flex-nowrap">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                User Management
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                {formDisabled
                  ? 'User successfully created. Entered data is shown below. Click "Register Next" to create another user.'
                  : 'Fill in the details below to create a new user account.'}
              </p>
            </div>

            {(message || error) && (
              <div
                className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 border min-w-[220px] ${message.includes('successfully')
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
                  }`}
              >
                {message.includes('successfully') && (
                  <FiCheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                )}
                <span>{message || error}</span>
              </div>
            )}
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="name">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleTextChange}
                  disabled={formDisabled}
                  required
                  autoComplete="off"
                  className={`w-full px-4 py-2.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none text-sm transition-all ${formDisabled ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50'
                    }`}
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="email">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleTextChange}
                  disabled={formDisabled}
                  required
                  autoComplete="off"
                  className={`w-full px-4 py-2.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none text-sm transition-all ${formDisabled ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50'
                    }`}
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="role">
                  User Role <span className="text-red-500">*</span>
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleSelectChange}
                  disabled={formDisabled}
                  className={`w-full px-4 py-2.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none text-sm transition-all ${formDisabled ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50'
                    }`}
                >
                  <option value="user">User</option>
                  <option value="co-admin">Co-Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="contactNumber">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="contactNumber"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={(e) => {
                      if (formDisabled) return;
                      if (/^\d*$/.test(e.target.value)) {
                        handleTextChange(e);
                      }
                    }}
                    disabled={formDisabled}
                    required
                    autoComplete="off"
                    className={`w-full px-4 py-2.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none text-sm transition-all pr-10 ${formDisabled ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50'
                      }`}
                    placeholder="Enter phone number"
                  />
                  {formData.contactNumber.length >= 10 && !formDisabled && (
                    <motion.div
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <FiCheckCircle className="text-green-500" size={20} />
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="password">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleTextChange}
                      disabled={formDisabled}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className={`w-full px-4 py-2.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none text-sm transition-all ${formDisabled ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50'
                        }`}
                      placeholder="At least 6 characters"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="confirmPassword">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleTextChange}
                      disabled={formDisabled}
                      required
                      autoComplete="new-password"
                      className={`w-full px-4 py-2.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none text-sm transition-all ${formDisabled ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50'
                        }`}
                      placeholder="Re-enter password"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Role Assignment */}
            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Role Assignment</h3>
              <div className={formDisabled ? 'opacity-70 pointer-events-none' : ''}>
                <AssignRole
                  onRoleSelect={handleRoleSelect}
                  initialRoleId={formData.assignRole}
                />
              </div>
            </div>

            {/* Page Permissions */}
            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Page Permissions
              </h3>
              <p className="text-slate-600 text-sm mb-6">
                Toggle access to specific pages and features.
              </p>
              <PermissionsSection
                permissions={formData.permissions}
                onPermissionChange={handlePermissionChange}
                disabled={formDisabled}
              />
            </div>

            {/* Remarks */}
            <div className="pt-6 border-t border-slate-100">
              <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="remarks">
                Remarks / Notes
              </label>
              <textarea
                id="remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleTextChange}
                disabled={formDisabled}
                rows={3}
                className={`w-full px-4 py-2.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none text-sm transition-all resize-y ${formDisabled ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50'
                  }`}
                placeholder="Any additional notes about this user (e.g. Manager, Developer, etc.)"
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-6">
              <div className="flex items-center gap-2 text-blue-800">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">Note:</span>
              </div>
              <p className="text-blue-700 text-sm mt-1 ml-7">
                New users are created as <strong>active</strong> by default.<br />
              </p>
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-end gap-3">
            {showSuccessActions ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (createdUserId) {
                      navigate(`/admin/users/${createdUserId}`);
                    }
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium shadow-sm hover:shadow transition-all"
                  disabled={!createdUserId}
                >
                  User Profile
                </button>
                <button
                  type="button"
                  onClick={handleRegisterNext}
                  className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-medium shadow-sm hover:shadow transition-all"
                >
                  Register Next
                </button>
              </>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || formDisabled}
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-medium shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Creating...
                  </>
                ) : (
                  'Create User'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserNew;
