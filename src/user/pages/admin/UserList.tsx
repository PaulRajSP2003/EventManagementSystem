// src/user/pages/admin/UserList.tsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiPlus, FiSearch, FiFilter, FiEdit, FiMoreVertical } from 'react-icons/fi';
import type { User } from '../../../types';
import AccessAlert from '../components/AccessAlert';
import { getAllUsers } from './api/UserData';
import { fetchPermissionData, isAdmin } from '../permission';
import StickyHeader from '../components/StickyHeader';

type FilterType = {
  id: string;
  name: string;
  email: string;
  contactNumber: string;
  isActive: string;
  role: string;
};

const UserListSkeleton = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 mt-8 space-y-6 animate-pulse">
      <div className="h-20 bg-white rounded-xl border border-slate-200 shadow-sm"></div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-12 bg-slate-50 border-b border-slate-200"></div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 border-b border-slate-100 mx-4"></div>
        ))}
      </div>
    </div>
  );
};

const UserList = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterType>({
    id: '',
    name: '',
    email: '',
    contactNumber: '',
    isActive: '',
    role: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  useEffect(() => {
    const fetchUsers = async () => {
      if (checkingAccess) return;

      try {
        setLoading(true);
        const data = await getAllUsers();
        setUsers(data);
        setFilteredUsers(data);
      } catch (err) {
        console.error('Failed to fetch users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [checkingAccess]);

  useEffect(() => {
    let results = users;

    // Quick search
    if (searchTerm) {
      results = results.filter(
        (u) =>
          u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.contactNumber.includes(searchTerm) ||
          u.id.toString().includes(searchTerm)
      );
    }

    // Advanced filters
    if (filters.id) {
      results = results.filter((u) => u.id.toString().includes(filters.id));
    }
    if (filters.name) {
      results = results.filter((u) =>
        u.name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }
    if (filters.email) {
      results = results.filter((u) =>
        u.email.toLowerCase().includes(filters.email.toLowerCase())
      );
    }
    if (filters.contactNumber) {
      results = results.filter((u) => u.contactNumber.includes(filters.contactNumber));
    }
    if (filters.isActive !== '') {
      results = results.filter(
        (u) => u.isActive === (filters.isActive === 'true')
      );
    }
    if (filters.role !== '') {
      results = results.filter((u) => u.role === filters.role);
    }

    setFilteredUsers(results);
  }, [searchTerm, filters, users]);

  const handleFilterChange = (key: keyof FilterType, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      id: '',
      name: '',
      email: '',
      contactNumber: '',
      isActive: '',
      role: '',
    });
    setSearchTerm('');
  };

  // Check if user has admin access
  if (!checkingAccess && !isAdmin(userRole)) {
    return <AccessAlert message="You don't have access to view this page. Admin privileges required." />;
  }

  if (checkingAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
        <StickyHeader title="User List" onBack={() => navigate(-1)} />
        <UserListSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
      <StickyHeader title="User Management" onBack={() => navigate(-1)}>
        <Link
          to="/admin/users/new"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-all text-sm font-medium shadow-sm hover:shadow"
        >
          <FiPlus /> New User
        </Link>
      </StickyHeader>

      {loading ? (
        <UserListSkeleton />
      ) : (
        <div className="max-w-5xl mx-auto px-4 mt-2 sm:mt-8 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-50">
              <div className="flex flex-row items-center justify-between gap-2 sm:gap-4">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="pl-10 pr-4 py-2 w-full border border-slate-200 rounded-lg sm:bg-slate-50 bg-transparent text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all border ${showFilters
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'sm:bg-white bg-transparent border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                  >
                    <FiFilter /> <span className="hidden xs:inline">Filters</span>
                  </button>
                  {(searchTerm || Object.values(filters).some((v) => v)) && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-slate-500 hover:text-red-600 font-semibold px-1 sm:px-2 transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>

            {showFilters && (
              <div className="p-3 border-b border-slate-100">
                {/* Desktop View: Grid */}
                <div className="hidden sm:grid grid-cols-6 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">ID</label>
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                      value={filters.id}
                      onChange={(e) => handleFilterChange('id', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                      value={filters.name}
                      onChange={(e) => handleFilterChange('name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Email</label>
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                      value={filters.email}
                      onChange={(e) => handleFilterChange('email', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Contact</label>
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                      value={filters.contactNumber}
                      onChange={(e) => handleFilterChange('contactNumber', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Status</label>
                    <select
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                      value={filters.isActive}
                      onChange={(e) => handleFilterChange('isActive', e.target.value)}
                    >
                      <option value="">All</option>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Role</label>
                    <select
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                      value={filters.role}
                      onChange={(e) => handleFilterChange('role', e.target.value)}
                    >
                      <option value="">All</option>
                      <option value="co-admin">Co-Admin</option>
                      <option value="user">User</option>
                    </select>
                  </div>
                </div>

                {/* Mobile View: Rows */}
                <div className="sm:hidden space-y-3">
                  {/* Line 1: Email */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Email</label>
                    <input
                      type="text"
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-transparent"
                      value={filters.email}
                      onChange={(e) => handleFilterChange('email', e.target.value)}
                    />
                  </div>

                  {/* Line 3: Role and Status */}
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Role</label>
                      <select
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-transparent"
                        value={filters.role}
                        onChange={(e) => handleFilterChange('role', e.target.value)}
                      >
                        <option value="">All</option>
                        <option value="co-admin">Co-Admin</option>
                        <option value="user">User</option>
                      </select>
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Status</label>
                      <select
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-transparent"
                        value={filters.isActive}
                        onChange={(e) => handleFilterChange('isActive', e.target.value)}
                      >
                        <option value="">All</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Admin Mode Badge for Mobile */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {isMobile ? (
              <div className="divide-y divide-slate-100 pb-20">
                {filteredUsers.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-slate-400 text-sm font-medium">No users found</p>
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => navigate(`/admin/users/${user.id}`)}
                      className="p-4 active:bg-slate-50 transition-colors space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-800 capitalize">{user.name}</div>
                            <div className="text-[10px] text-slate-400 font-medium">ID: #{user.id}</div>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 text-[9px] font-bold rounded-full border uppercase tracking-widest ${user.isActive
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : 'bg-red-50 text-red-600 border-red-100'
                            }`}
                        >
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-1">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Email</p>
                          <p className="text-xs text-slate-600 truncate">{user.email}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Contact</p>
                          <p className="text-xs text-slate-600">{user.contactNumber}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{user.role}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/users/edit/${user.id}`);
                            }}
                            className="p-1.5 text-slate-400 border border-slate-100 rounded-md"
                          >
                            <FiEdit size={14} />
                          </button>
                          <button className="p-1.5 text-slate-400 border border-slate-100 rounded-md">
                            <FiMoreVertical size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/80 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider w-20">
                        ID
                      </th>
                      <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                        User Details
                      </th>
                      <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                        Contact Info
                      </th>
                      <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider text-center">
                        Role
                      </th>
                      <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                        Account
                      </th>
                      <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-slate-50 transition-colors cursor-pointer group"
                        onClick={() => navigate(`/admin/users/${user.id}`)}
                      >
                        <td className="px-6 py-4 text-xs font-bold text-slate-400">
                          #{user.id}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-extrabold text-slate-900 capitalize">
                                {user.name}
                              </div>
                              <div className="text-[11px] text-slate-400 font-medium lowercase">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-600 font-semibold">
                            {user.contactNumber}
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold">
                            Primary Mobile
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-[11px] font-bold text-slate-700 uppercase">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 text-[10px] font-bold rounded-full border uppercase tracking-widest ${user.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : 'bg-red-50 text-red-700 border-red-100'
                              }`}
                          >
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/users/edit/${user.id}`);
                              }}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            >
                              <FiEdit size={16} />
                            </button>
                            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                              <FiMoreVertical size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                Total Records: {filteredUsers.length}
              </span>
              <div className="text-[11px] text-slate-400 italic">Page 1 of 1</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
