import { useEffect, useState } from 'react';
import { FiSearch, FiPlus, FiArrowLeft, FiChevronUp, FiChevronDown, FiFilter, FiEdit } from 'react-icons/fi';
import { adminAPI } from '../../api/AdminData';
import type { Admin } from '../../../types';
import OwnerLayout from '../components/OwnerLayout';
import { Link, useNavigate } from 'react-router-dom';

type FilterType = {
  eventId: string;
  name: string;
  email: string;
  role: string;
  status: string;
};

type SortConfig = {
  key: keyof Admin;
  direction: 'asc' | 'desc';
};

const AdminListSkeleton = () => (
  <div className="max-w-6xl mx-auto px-4 mt-8 space-y-6 animate-pulse">
    <div className="h-20 bg-white rounded-xl border border-slate-200 shadow-sm"></div>
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="h-12 bg-slate-50 border-b border-slate-200"></div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-16 border-b border-slate-100 mx-4"></div>
      ))}
    </div>
  </div>
);

export default function AdminList() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [filteredAdmins, setFilteredAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'id', direction: 'desc' });
  const [filters, setFilters] = useState<FilterType>({
    eventId: '', name: '', email: '', role: '', status: '',
  });

  useEffect(() => {
    loadAdmins();
  }, []);

  useEffect(() => {
    let results = [...admins];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      results = results.filter(admin =>
        admin.name.toLowerCase().includes(searchLower) ||
        admin.email.toLowerCase().includes(searchLower) ||
        admin.role.toLowerCase().includes(searchLower)
      );
    }

    // Apply filters
    if (filters.eventId) {
      results = results.filter(a => a.eventId?.toString().includes(filters.eventId));
    }
    if (filters.name) {
      results = results.filter(a => a.name.toLowerCase().includes(filters.name.toLowerCase()));
    }
    if (filters.email) {
      results = results.filter(a => a.email.toLowerCase().includes(filters.email.toLowerCase()));
    }
    if (filters.role) {
      results = results.filter(a => a.role.toLowerCase() === filters.role.toLowerCase());
    }
    if (filters.status) {
      results = results.filter(a => a.isActive === (filters.status === 'active'));
    }

    // Sorting
    results.sort((a, b) => {
      const aValue = a[sortConfig.key] ?? '';
      const bValue = b[sortConfig.key] ?? '';

      if (aValue === bValue) return 0;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortConfig.direction === 'asc'
        ? (aValue < bValue ? -1 : 1)
        : (aValue > bValue ? -1 : 1);
    });

    setFilteredAdmins(results);
  }, [searchTerm, admins, sortConfig, filters]);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getAll();
      setAdmins(data);
    } catch (err) {
      setError('Failed to load admins');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: keyof Admin) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const clearFilters = () => {
    setFilters({ eventId: '', name: '', email: '', role: '', status: '' });
    setSearchTerm('');
    setSortConfig({ key: 'id', direction: 'desc' });
  };

  const SortIcon = ({ column }: { column: keyof Admin }) => {
    if (sortConfig.key !== column) return <FiChevronUp className="opacity-20 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' ? <FiChevronUp className="text-indigo-600" /> : <FiChevronDown className="text-indigo-600" />;
  };

  return (
    <OwnerLayout>
      <div className="min-h-screen bg-slate-50 pb-12">
        {/* Sticky Header */}
        <div className="bg-transparent backdrop-blur-md sticky top-0 z-10 px-4 py-3 border-b border-white/20">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium group"
              >
                <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                Back
              </button>

              <div className="h-4 w-[1px] bg-slate-300/50 hidden sm:block"></div>

              <h1 className="text-lg font-bold text-slate-800 hidden sm:block">
                Admin Management
              </h1>
            </div>

            <Link
              to="/owner/admin/new"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg transition text-sm font-medium"
            >
              <FiPlus /> New Admin
            </Link>

          </div>
        </div>

        {loading ? (
          <AdminListSkeleton />
        ) : (
          <div className="max-w-6xl mx-auto px-4 mt-8 space-y-6">
            {/* Search & Filter Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-50 bg-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiSearch className="text-slate-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search by name, email, or role..."
                      className="pl-10 pr-4 py-2 w-full border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                    >
                      <FiFilter /> Filters
                    </button>
                    {(searchTerm || Object.values(filters).some(v => v)) && (
                      <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-red-600 font-semibold px-2 transition-colors">
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {showFilters && (
                <div className="p-4 bg-slate-50/50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Event ID</label>
                    <input
                      type="number"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                      value={filters.eventId}
                      onChange={(e) => setFilters(p => ({ ...p, eventId: e.target.value }))}
                      placeholder="Filter by Event ID"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                      value={filters.name}
                      onChange={(e) => setFilters(p => ({ ...p, name: e.target.value }))}
                      placeholder="Filter by Name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Email</label>
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                      value={filters.email}
                      onChange={(e) => setFilters(p => ({ ...p, email: e.target.value }))}
                      placeholder="Filter by Email"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Role</label>
                    <select 
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500" 
                      value={filters.role} 
                      onChange={(e) => setFilters(p => ({ ...p, role: e.target.value }))}
                    >
                      <option value="">All Roles</option>
                      <option value="admin">Admin</option>
                      <option value="co-admin">Co-Admin</option>
                      <option value="user">User</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Status</label>
                    <select 
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500" 
                      value={filters.status} 
                      onChange={(e) => setFilters(p => ({ ...p, status: e.target.value }))}
                    >
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                <p className="font-medium">Error: {error}</p>
              </div>
            )}

            {/* Table Container */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/80 border-b border-slate-200">
                    <tr>
                      <th onClick={() => handleSort('id')} className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider cursor-pointer group select-none">
                        <div className="flex items-center gap-1">ID <SortIcon column="id" /></div>
                      </th>
                      <th onClick={() => handleSort('eventId')} className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider cursor-pointer group select-none">
                        <div className="flex items-center gap-1">Event ID <SortIcon column="eventId" /></div>
                      </th>
                      <th onClick={() => handleSort('name')} className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider cursor-pointer group select-none">
                        <div className="flex items-center gap-1">Admin Name <SortIcon column="name" /></div>
                      </th>
                      <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider">Email</th>
                      <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider text-center">Phone</th>
                      <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider text-center">Role</th>
                      <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider text-center">Status</th>
                      <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAdmins.map((admin) => (
                      <tr
                        key={admin.id}
                        onClick={() => navigate(`/owner/admin/${admin.id}`)}
                        className="hover:bg-slate-50/50 cursor-pointer transition-colors group"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-slate-400">
                          {admin.id ? `#${admin.id}` : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">
                            {admin.eventId || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors capitalize">
                            {admin.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {admin.email}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-slate-600">
                          {admin.contactNumber || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center justify-center px-3 py-1 text-[10px] uppercase font-bold rounded-full border ${
                            admin.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                            admin.role === 'co-admin' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            'bg-slate-50 text-slate-700 border-slate-100'
                          }`}>
                            {admin.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center justify-center px-3 py-1 text-[10px] uppercase font-bold rounded-full border ${admin.isActive
                            ? 'bg-green-50 text-green-700 border-green-100'
                            : 'bg-red-50 text-red-700 border-red-100'
                            }`}>
                            {admin.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => navigate(`/owner/admin/edit/${admin.id}`)}
                            className="inline-flex items-center justify-center gap-1 px-4 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-full hover:bg-indigo-100 hover:text-indigo-700 transition-colors duration-200"
                          >
                            <FiEdit className="w-3 h-3" />
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredAdmins.length === 0 && (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    {searchTerm ? 'No admins found matching your search.' : 'No admins found.'}
                  </div>
                )}
              </div>
            </div>

            {filteredAdmins.length > 0 && (
              <div className="text-xs text-slate-400 px-2">
                Showing {filteredAdmins.length} of {admins.length} total admins
              </div>
            )}
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}