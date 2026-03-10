// src/user/pages/admin/UserList.tsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiSearch, FiFilter, FiEdit, FiMoreVertical } from 'react-icons/fi';
import type { User } from '../../../types';
import AccessAlert from '../components/AccessAlert';
import { getAllUsers } from './api/UserData';
import { fetchPermissionData, isAdmin } from '../permission';

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

  // Show skeleton while checking access
  if (checkingAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
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
              <h1 className="text-lg font-bold text-slate-800 hidden sm:block">
                User Management
              </h1>
            </div>
            <div className="h-10 w-24 bg-slate-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
        <UserListSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
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
            <h1 className="text-lg font-bold text-slate-800 hidden sm:block">
              User Management
            </h1>
          </div>
          <Link
            to="/admin/users/new"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-all text-sm font-medium shadow-sm hover:shadow"
          >
            <FiPlus /> New User
          </Link>
        </div>
      </div>

      {loading ? (
        <UserListSkeleton />
      ) : (
        <div className="max-w-5xl mx-auto px-4 mt-8 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-50 bg-white">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Quick search..."
                    className="pl-10 pr-4 py-2 w-full border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                      showFilters
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <FiFilter /> Filters
                  </button>
                  {(searchTerm || Object.values(filters).some((v) => v)) && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-slate-500 hover:text-red-600 font-semibold px-2 transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>

            {showFilters && (
              <div className="p-4 bg-slate-50/50 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 border-b border-slate-100">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">
                    User ID
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none"
                    value={filters.id}
                    onChange={(e) => handleFilterChange('id', e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none"
                    value={filters.name}
                    onChange={(e) => handleFilterChange('name', e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">
                    Email
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none"
                    value={filters.email}
                    onChange={(e) => handleFilterChange('email', e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">
                    Contact
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none"
                    value={filters.contactNumber}
                    onChange={(e) => handleFilterChange('contactNumber', e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">
                    Account Status
                  </label>
                  <select
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none"
                    value={filters.isActive}
                    onChange={(e) => handleFilterChange('isActive', e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">
                    Role
                  </label>
                  <select
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none"
                    value={filters.role}
                    onChange={(e) => handleFilterChange('role', e.target.value)}
                  >
                    <option value="">All Roles</option>
                    <option value="co-admin">Co-Admin</option>
                    <option value="user">User</option>
                    {/* admin option intentionally removed as per request */}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
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
                          className={`px-3 py-1 text-[10px] font-bold rounded-full border uppercase tracking-widest ${
                            user.isActive
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