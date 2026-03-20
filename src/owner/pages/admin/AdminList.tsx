import { useEffect, useState } from 'react';
import { FiSearch, FiPlus, FiChevronUp, FiChevronDown, FiFilter, FiEdit, FiX } from 'react-icons/fi';
import { adminAPI } from '../../api/AdminData';
import type { Admin } from '../../../types';
import OwnerLayout from '../components/OwnerLayout';
import { Link, useNavigate } from 'react-router-dom';
import StickyHeader from '../components/StickyHeader';

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
  <div className="max-w-6xl mx-auto px-4 mt-2 sm:mt-8 space-y-6 animate-pulse">
    <div className="h-20 bg-white rounded-xl border border-slate-200 shadow-sm"></div>
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-visible">
      <div className="h-12 bg-slate-50 border-b border-slate-200 rounded-t-xl"></div>
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
        <StickyHeader 
          title="Admin Management"
          onBack={() => navigate('/owner/dashboard')}
        >
          <Link
            to="/owner/admin/new"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg transition-all text-sm font-medium whitespace-nowrap shadow-sm active:scale-95"
          >
            <FiPlus className="w-4 h-4" />
            <span className="hidden sm:inline">New Admin</span>
            <span className="sm:hidden text-lg">+</span>
          </Link>
        </StickyHeader>

        {loading ? (
          <AdminListSkeleton />
        ) : (
          <div className="max-w-6xl mx-auto px-4 mt-2 sm:mt-8 space-y-6">
            {/* Search & Filter Bar */}
            <div className="rounded-xl border border-slate-200 overflow-visible bg-white shadow-sm">
              <div className="p-4 border-b border-slate-50">
                <div className="flex flex-row items-center justify-between gap-2 sm:gap-4">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiSearch className="text-slate-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search admins..."
                      className="pl-10 pr-4 py-2 w-full border border-slate-200 rounded-lg sm:bg-slate-50 bg-transparent text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        <FiX className="text-slate-400 hover:text-slate-600" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all border ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'sm:bg-white bg-transparent border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                    >
                      <FiFilter /> <span className="hidden xs:inline">Filters</span>
                    </button>
                    {(searchTerm || Object.values(filters).some(v => v)) && (
                      <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-red-600 font-semibold px-1 sm:px-2 transition-colors">
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {showFilters && (
                <div className="p-3 border-b border-slate-100">
                  {/* Desktop View: Grid */}
                  <div className="hidden sm:grid grid-cols-5 gap-4">
                    {['eventId', 'name', 'email'].map((field) => (
                      <div key={field} className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400">{field === 'eventId' ? 'Event ID' : field.toUpperCase()}</label>
                        <input
                          type={field === 'eventId' ? 'number' : 'text'}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                          value={filters[field as keyof FilterType]}
                          onChange={(e) => setFilters(p => ({ ...p, [field]: e.target.value }))}
                        />
                      </div>
                    ))}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Role</label>
                      <select className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-white" value={filters.role} onChange={(e) => setFilters(p => ({ ...p, role: e.target.value }))}>
                        <option value="">Any Role</option>
                        <option value="admin">Admin</option>
                        <option value="co-admin">Co-Admin</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Status</label>
                      <select className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-white" value={filters.status} onChange={(e) => setFilters(p => ({ ...p, status: e.target.value }))}>
                        <option value="">Any Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  {/* Mobile View: Rows */}
                  <div className="sm:hidden space-y-3">
                    <div className="flex gap-3">
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400">Event ID</label>
                        <input
                          type="number"
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-white shadow-sm"
                          value={filters.eventId}
                          onChange={(e) => setFilters(p => ({ ...p, eventId: e.target.value }))}
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400">Role</label>
                        <select
                          className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer shadow-sm"
                          value={filters.role}
                          onChange={(e) => setFilters(p => ({ ...p, role: e.target.value }))}
                        >
                          <option value="">Any Role</option>
                          <option value="admin">Admin</option>
                          <option value="co-admin">Co-Admin</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Name</label>
                      <input
                        type="text"
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-white shadow-sm"
                        value={filters.name}
                        onChange={(e) => setFilters(p => ({ ...p, name: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400">Status</label>
                        <select 
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-white shadow-sm cursor-pointer" 
                          value={filters.status} 
                          onChange={(e) => setFilters(p => ({ ...p, status: e.target.value }))}
                        >
                          <option value="">Any Status</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
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

            {/* Table Container - Desktop View */}
            <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
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

            {/* Card View - Mobile View */}
            <div className="sm:hidden space-y-4">
              {filteredAdmins.map((admin, index) => (
                <div
                  key={admin.id ? `admin-mobile-${admin.id}-${index}` : `admin-mobile-${index}`}
                  onClick={() => navigate(`/owner/admin/${admin.id}`)}
                  className="rounded-xl border border-slate-200 overflow-hidden p-4 shadow-sm bg-white"
                >
                  <div className="flex gap-4">
                    {/* Admin ID */}
                    <div className="w-1/4 border-r border-slate-100 pr-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Admin ID</div>
                      <div className="text-sm font-bold text-indigo-600">Id:{admin.id}</div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase">Details</span>
                        <div className="flex gap-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            admin.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                            'bg-blue-50 text-blue-700 border-blue-100'
                          }`}>
                            {admin.role.toUpperCase()}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${admin.isActive
                              ? 'bg-green-50 text-green-700 border-green-100'
                              : 'bg-red-50 text-red-700 border-red-100'
                            }`}>
                            {admin.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-1">
                        <div className="flex gap-2">
                          <span className="text-xs font-semibold text-slate-500 w-16">Name:</span>
                          <span className="text-xs font-bold text-slate-800 capitalize">{admin.name}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-xs font-semibold text-slate-500 w-16">Event ID:</span>
                          <span className="text-xs text-slate-700">{admin.eventId || 'N/A'}</span>
                        </div>
                        <div className="flex gap-2 text-[11px]">
                          <span className="text-xs font-semibold text-slate-500 w-16 shrink-0">Email:</span>
                          <span className="text-xs text-slate-700 truncate flex-1 lowercase">{admin.email}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-xs font-semibold text-slate-500 w-16">Phone:</span>
                          <span className="text-xs text-slate-700">{admin.contactNumber || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/owner/admin/edit/${admin.id}`);
                          }}
                          className="w-full py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border border-indigo-100 uppercase"
                        >
                          <FiEdit size={14} /> Edit Admin
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredAdmins.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-sm bg-white rounded-xl border border-dashed border-slate-300">
                  No admins found.
                </div>
              )}
            </div>

            {filteredAdmins.length > 0 && (
              <div className="text-xs text-slate-400 px-2 pt-2">
                Showing {filteredAdmins.length} of {admins.length} total admins
              </div>
            )}
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}
