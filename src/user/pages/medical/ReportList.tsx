// src/user/pages/medical/ReportList.tsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiArrowLeft, FiPlus, FiSearch, FiFilter,
  FiChevronUp, FiChevronDown
} from 'react-icons/fi';
import type { Medical } from '../../../types';
import { PAGE_PERMISSIONS, canAccess, fetchPermissionData, type PermissionData } from '../permission';
import AccessAlert from '../components/AccessAlert';
import { medicalAPI } from '../api/MedicalData';
import { studentAPI } from '../api/StudentData';

// Define a new type that extends Medical and includes the new fields
interface MedicalReportWithPatientName extends Medical {
  patientName: string;
  patientStatus?: string;
  patientGender?: string;
  followingGroup?: string | null;
  roomNumber?: string | null;
}

type FilterType = {
  reportId: string;
  patientId: string;
  patientName: string;
  title: string;
  severity: string;
  status: string;
  gender: string;
  followingGroup: string;
  roomNumber: string;
};

type SortConfig = {
  key: keyof MedicalReportWithPatientName;
  direction: 'asc' | 'desc';
};

// Session storage keys
const STORAGE_KEYS = {
  SEARCH_TERM: 'medicalReportList_searchTerm',
  FILTERS: 'medicalReportList_filters',
  SORT_CONFIG: 'medicalReportList_sortConfig',
  SHOW_FILTERS: 'medicalReportList_showFilters'
} as const;

// Default filter values
const DEFAULT_FILTERS: FilterType = {
  reportId: '',
  patientId: '',
  patientName: '',
  title: '',
  severity: '',
  status: '',
  gender: '',
  followingGroup: '',
  roomNumber: ''
};

const ReportListSkeleton = () => (
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

const PAGE_ID = PAGE_PERMISSIONS.MEDICAL_REPORT_LIST;

const ReportList = () => {
  const navigate = useNavigate();

  // Permission data state
  const [permissionData, setPermissionData] = useState<PermissionData | null>(null);
  const [permissionLoading, setPermissionLoading] = useState(true);
  const [permissionError, setPermissionError] = useState<boolean>(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [reports, setReports] = useState<MedicalReportWithPatientName[]>([]);
  const [filteredReports, setFilteredReports] = useState<MedicalReportWithPatientName[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Initialize state from sessionStorage or defaults
  const [searchTerm, setSearchTerm] = useState(() => {
    const saved = sessionStorage.getItem(STORAGE_KEYS.SEARCH_TERM);
    return saved || '';
  });
  
  const [showFilters, setShowFilters] = useState(() => {
    const saved = sessionStorage.getItem(STORAGE_KEYS.SHOW_FILTERS);
    return saved === 'true';
  });
  
  const [sortConfig, setSortConfig] = useState<SortConfig>(() => {
    const saved = sessionStorage.getItem(STORAGE_KEYS.SORT_CONFIG);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse sort config from sessionStorage', e);
      }
    }
    return { key: 'reportId', direction: 'desc' };
  });

  const [filters, setFilters] = useState<FilterType>(() => {
    const saved = sessionStorage.getItem(STORAGE_KEYS.FILTERS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse filters from sessionStorage', e);
      }
    }
    return DEFAULT_FILTERS;
  });

  const severityOptions = ["mild", "moderate", "critical", "normal"];
  const statusOptions = ["present", "registered", "absent"];
  const genderOptions = ["male", "female"];

  // Save to sessionStorage whenever values change
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.SEARCH_TERM, searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.SHOW_FILTERS, String(showFilters));
  }, [showFilters]);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.SORT_CONFIG, JSON.stringify(sortConfig));
  }, [sortConfig]);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.FILTERS, JSON.stringify(filters));
  }, [filters]);

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

  // Permission check using ONLY permissionData
  const hasAccess = () => {
    if (!permissionData || accessDenied || permissionError) return false;
    return canAccess(permissionData, PAGE_ID);
  };

  // Check if user can create new report
  const canCreateReport = () => {
    if (!permissionData || accessDenied || permissionError) return false;
    return canAccess(permissionData, PAGE_PERMISSIONS.MEDICAL_REPORT_NEW);
  };

  useEffect(() => {
    // Check access before loading data
    if (!hasAccess()) {
      setLoading(false);
      return;
    }

    const fetchReports = async () => {
      try {
        setLoading(true);
        const [reportsData, studentsData] = await Promise.all([
          medicalAPI.listMedicalReports(),
          studentAPI.getStudents()
        ]);

        const reportsWithStudent = reportsData.map(report => {
          const student = studentsData.find(s => s.id === report.patientId);
          return {
            ...report,
            patientName: student?.name || 'Unknown Patient',
            patientStatus: student?.status || '',
            patientGender: student?.gender || '',
          };
        });
        setReports(reportsWithStudent);
        setFilteredReports(reportsWithStudent);
      } catch (err) {
        console.error('Failed to fetch medical reports:', err);

        // Check if it's a permission error
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch reports';
        if (errorMsg.toLowerCase().includes('forbidden') ||
          errorMsg.toLowerCase().includes('403') ||
          errorMsg.toLowerCase().includes('unauthorized')) {
          setAccessDenied(true);
          setErrorMessage(errorMsg);
        }
      } finally {
        setLoading(false);
      }
    };

    if (hasAccess()) {
      fetchReports();
    }
  }, [permissionData]);

  useEffect(() => {
    if (!hasAccess()) return;

    let results = [...reports];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      results = results.filter(report =>
        report.patientName.toLowerCase().includes(lowerSearch) ||
        report.title.toLowerCase().includes(lowerSearch) ||
        report.description.toLowerCase().includes(lowerSearch) ||
        report.reportId?.toString().includes(searchTerm) ||
        (report.followingGroup && report.followingGroup.toLowerCase().includes(lowerSearch)) ||
        (report.roomNumber && report.roomNumber.toLowerCase().includes(lowerSearch))
      );
    }

    if (filters.reportId) results = results.filter(report =>
      report.reportId?.toString().includes(filters.reportId)
    );
    if (filters.patientId) results = results.filter(report =>
      report.patientId?.toString().includes(filters.patientId)
    );
    if (filters.patientName) results = results.filter(report =>
      report.patientName.toLowerCase().includes(filters.patientName.toLowerCase())
    );
    if (filters.title) results = results.filter(report =>
      report.title.toLowerCase().includes(filters.title.toLowerCase())
    );
    if (filters.severity) results = results.filter(report =>
      report.severity === filters.severity
    );
    if (filters.status) results = results.filter(report =>
      report.patientStatus === filters.status
    );
    if (filters.gender) results = results.filter(report =>
      report.patientGender === filters.gender
    );
    if (filters.followingGroup) results = results.filter(report =>
      report.followingGroup && report.followingGroup.toLowerCase().includes(filters.followingGroup.toLowerCase())
    );
    if (filters.roomNumber) results = results.filter(report =>
      report.roomNumber && report.roomNumber.toLowerCase().includes(filters.roomNumber.toLowerCase())
    );

    results.sort((a, b) => {
      const aValue = a[sortConfig.key] ?? '';
      const bValue = b[sortConfig.key] ?? '';
      if (aValue === bValue) return 0;
      return sortConfig.direction === 'asc'
        ? (aValue < bValue ? -1 : 1)
        : (aValue > bValue ? -1 : 1);
    });

    setFilteredReports(results);
  }, [searchTerm, filters, reports, sortConfig, permissionData]);

  const handleSort = (key: keyof MedicalReportWithPatientName) => {
    if (!hasAccess()) return;
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const clearFilters = () => {
    if (!hasAccess()) return;
    
    setFilters(DEFAULT_FILTERS);
    setSearchTerm('');
    setSortConfig({ key: 'reportId', direction: 'desc' });
    setShowFilters(false);
    
    // Clear session storage for this page
    Object.values(STORAGE_KEYS).forEach(key => {
      sessionStorage.removeItem(key);
    });
  };

  const SortIcon = ({ column }: { column: keyof MedicalReportWithPatientName }) => {
    if (sortConfig.key !== column) return <FiChevronUp className="opacity-20 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' ? <FiChevronUp className="text-indigo-600" /> : <FiChevronDown className="text-indigo-600" />;
  };

  // Show loading while permissions are loading
  if (permissionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
        <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-3 border-b border-gray-100">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate('/user/dashboard')}
                disabled
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiArrowLeft /> Back
              </button>
              <div className="h-4 w-[1px] bg-gray-300 hidden sm:block"></div>
              <h1 className="text-lg font-bold text-slate-800 hidden sm:block">
                Medical Reports
              </h1>
            </div>
            <button
              disabled
              className="flex items-center gap-2 px-4 py-2 bg-slate-300 text-white rounded-lg transition-all text-sm font-medium shadow-sm cursor-not-allowed opacity-50"
            >
              <FiPlus /> New Report
            </button>
          </div>
        </div>
        <ReportListSkeleton />
      </div>
    );
  }

  // Show access denied if user doesn't have permission
  if (!hasAccess() || accessDenied || permissionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <AccessAlert message={errorMessage || "You do not have access to view medical reports."} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
      {/* Sticky Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-3 border-b border-gray-100">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/user/dashboard')}
              disabled={!hasAccess()}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiArrowLeft /> Back
            </button>
            <div className="h-4 w-[1px] bg-gray-300 hidden sm:block"></div>
            <h1 className="text-lg font-bold text-slate-800 hidden sm:block">
              Medical Reports
            </h1>
          </div>
          {/* New Report button - disabled based on permission */}
          <Link
            to={canCreateReport() ? "/user/medical/new" : "#"}
            onClick={(e) => {
              if (!canCreateReport()) {
                e.preventDefault();
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium shadow-sm ${canCreateReport()
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-slate-300 text-white cursor-not-allowed opacity-50'
              }`}
          >
            <FiPlus /> New Report
          </Link>
        </div>
      </div>

      {loading ? (
        <ReportListSkeleton />
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
                    placeholder="Search by patient name, title, following group, room number..."
                    className="pl-10 pr-4 py-2 w-full border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={!hasAccess()}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    disabled={!hasAccess()}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      } ${!hasAccess() ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <FiFilter /> Filters
                  </button>
                  {(searchTerm || Object.values(filters).some(v => v) || sortConfig.key !== 'reportId' || sortConfig.direction !== 'desc') && (
                    <button
                      onClick={clearFilters}
                      disabled={!hasAccess()}
                      className="text-xs text-slate-500 hover:text-red-600 font-semibold px-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>

            {showFilters && (
              <div className="p-4 bg-slate-50/50 grid grid-cols-1 md:grid-cols-8 gap-4 border-b border-slate-100">
                {['patientId', 'patientName', 'title', 'followingGroup', 'roomNumber'].map((field) => (
                  <div key={field} className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">
                      {field.replace(/([A-Z])/g, ' $1')}
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none"
                      value={(filters as any)[field]}
                      onChange={(e) => setFilters(p => ({ ...p, [field]: e.target.value }))}
                      disabled={!hasAccess()}
                      placeholder=""
                    />
                  </div>
                ))}
                {/* Severity filter */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Severity</label>
                  <select
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none capitalize"
                    value={filters.severity}
                    onChange={(e) => setFilters(p => ({ ...p, severity: e.target.value }))}
                    disabled={!hasAccess()}
                  >
                    <option value="">All</option>
                    {severityOptions.map(option => (
                      <option key={option} value={option} className="capitalize">
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Status filter */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Status</label>
                  <select
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none capitalize"
                    value={filters.status}
                    onChange={(e) => setFilters(p => ({ ...p, status: e.target.value }))}
                    disabled={!hasAccess()}
                  >
                    <option value="">All</option>
                    {statusOptions.map(option => (
                      <option key={option} value={option} className="capitalize">
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Gender filter */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Gender</label>
                  <select
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none capitalize"
                    value={filters.gender}
                    onChange={(e) => setFilters(p => ({ ...p, gender: e.target.value }))}
                    disabled={!hasAccess()}
                  >
                    <option value="">All</option>
                    {genderOptions.map(option => (
                      <option key={option} value={option} className="capitalize">
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    <th onClick={() => handleSort('reportId')} className="px-4 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider cursor-pointer group select-none">
                      <div className="flex items-center gap-1">ID <SortIcon column="reportId" /></div>
                    </th>
                    <th onClick={() => handleSort('patientName')} className="px-4 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider cursor-pointer group select-none">
                      <div className="flex items-center gap-1">Name <SortIcon column="patientName" /></div>
                    </th>
                    <th className="px-4 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider text-left select-none">Gender</th>
                    <th className="px-4 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider text-center select-none">Status</th>
                    <th onClick={() => handleSort('followingGroup')} className="px-4 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider cursor-pointer group select-none">
                      <div className="flex items-center gap-1">Following Group <SortIcon column="followingGroup" /></div>
                    </th>
                    <th onClick={() => handleSort('roomNumber')} className="px-4 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider cursor-pointer group select-none">
                      <div className="flex items-center gap-1">Room <SortIcon column="roomNumber" /></div>
                    </th>
                    <th onClick={() => handleSort('title')} className="px-4 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider cursor-pointer group select-none">
                      <div className="flex items-center gap-1">Title <SortIcon column="title" /></div>
                    </th>
                    <th onClick={() => handleSort('severity')} className="px-4 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider cursor-pointer group select-none text-center">
                      <div className="flex items-center gap-1 justify-center">Severity <SortIcon column="severity" /></div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReports.map((report) => (
                    <tr
                      key={report.reportId}
                      onClick={() => hasAccess() && navigate(`/user/medical/${report.reportId}`)}
                      className={`hover:bg-slate-50/50 transition-colors group ${hasAccess() ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
                    >
                      <td className="px-4 py-4 text-sm font-medium text-slate-400">#{report.reportId}</td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 capitalize">
                          {report.patientName}
                        </div>
                        <div className="text-xs text-slate-500">
                          Student ID: {report.patientId}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-left">
                        <span className="text-xs font-medium text-slate-500 uppercase">
                          {report.patientGender ? report.patientGender.toUpperCase() : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {report.patientStatus ? (
                          <span className={`inline-flex items-center justify-center w-24 py-1 text-[10px] uppercase font-bold rounded-full border ${report.patientStatus === 'active' || report.patientStatus === 'present' ? 'bg-green-50 text-green-700 border-green-100' :
                            report.patientStatus === 'pending' || report.patientStatus === 'registered' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                              'bg-red-50 text-red-700 border-red-100'
                            }`}>
                            {report.patientStatus}
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-24 py-1 text-[10px] uppercase font-bold rounded-full border bg-slate-50 text-slate-500 border-slate-200">
                            Unknown
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-block text-sm font-medium px-2 py-1 rounded ${report.followingGroup
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-slate-400'
                            }`}
                        >
                          {report.followingGroup || '-'}
                        </span>
                      </td>
                      <td
                        className="px-4 py-4"
                        title={
                          report.roomNumber === 'Waiting List'
                            ? 'Waiting List'
                            : report.roomNumber === 'not present'
                              ? 'Not Present'
                              : report.roomNumber === 'not staying'
                                ? 'Not Staying'
                                : report.roomNumber || 'No room assigned'
                        }
                      >
                        <span className={`inline-flex items-center text-sm font-medium ${report.roomNumber === 'Waiting List'
                          ? 'text-amber-600 bg-amber-50 px-2 py-1 rounded-full text-xs font-bold uppercase'
                          : report.roomNumber === 'not present'
                            ? 'text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-bold uppercase'
                            : report.roomNumber === 'not staying'
                              ? 'text-orange-600 bg-orange-50 px-2 py-1 rounded-full text-xs font-bold uppercase'
                              : report.roomNumber
                                ? 'text-slate-700'
                                : 'text-slate-400'
                          }`}>
                          {report.roomNumber === 'Waiting List'
                            ? 'WL'
                            : report.roomNumber === 'not present'
                              ? 'NP'
                              : report.roomNumber === 'not staying'
                                ? 'NS'
                                : report.roomNumber || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-slate-800 capitalize">{report.title}</div>
                        <div className="text-xs text-slate-500 mt-1 truncate max-w-xs capitalize">
                          {report.description}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center justify-center w-24 py-1 text-[10px] uppercase font-bold rounded-full border ${report.severity === 'mild' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          report.severity === 'normal' ? 'bg-green-50 text-green-700 border-green-100' :
                            report.severity === 'moderate' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                              'bg-red-50 text-red-700 border-red-100'
                          }`}>
                          {report.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="text-xs text-slate-400 px-2">
            Showing {filteredReports.length} of {reports.length} total reports
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportList;