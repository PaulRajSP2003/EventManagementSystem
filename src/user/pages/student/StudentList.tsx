// src/user/pages/student/StudentList.tsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiArrowLeft, FiPlus, FiSearch, FiFilter,
  FiChevronUp, FiChevronDown,
  FiDownload,
  FiLoader,
  FiX
} from 'react-icons/fi';

import { studentAPI } from '../api/StudentData';
import type { Student } from '../../../types';
import { PAGE_PERMISSIONS, isAdminOrCoAdmin, canAccess, fetchPermissionData, type PermissionData } from '../permission';
import AccessAlert from '../components/AccessAlert';
import SignalRService from '../../Services/signalRService';

// Permission constant for this page
const PAGE_ID = PAGE_PERMISSIONS.STUDENT_LIST;

type FilterType = {
  id: string;
  name: string;
  age: string;
  gender: string;
  place: string;
  age_group: string;
  status: string;
};

type SortConfig = {
  key: keyof Student;
  direction: 'asc' | 'desc';
};

const StudentListSkeleton = () => (
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

const StudentList = () => {
  const navigate = useNavigate();
  const [accessDenied, setAccessDenied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [permissionData, setPermissionData] = useState<PermissionData | null>(null);
  const [permissionLoading, setPermissionLoading] = useState(true);
  const [permissionError, setPermissionError] = useState<boolean>(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  // Open filter bar if gender filter is set from localStorage
  const [showFilters, setShowFilters] = useState(() => {
    try {
      return !!localStorage.getItem('studentListGender');
    } catch {
      return false;
    }
  });

  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'id', direction: 'desc' });
  const [filters, setFilters] = useState<FilterType>(() => {
    // Try to load gender filter from localStorage
    let gender = '';
    try {
      gender = localStorage.getItem('studentListGender') || '';
    } catch { }
    return { id: '', name: '', age: '', gender, place: '', age_group: '', status: '' };
  });

  const uniqueAgeGroups = useMemo(() =>
    Array.from(new Set(students.map((s) => s.age_group).filter(Boolean))).sort(),
    [students]
  );

  useEffect(() => {
    const notificationHandler = async (notification: any) => {
      switch (notification.messageType) {
        case 'student_added':
          // New student added - fetch the new student and add to list
          try {
            const newStudent = await studentAPI.getStudent(notification.student.studentId);
            setStudents(prevStudents => [newStudent, ...prevStudents]);
          } catch (err) {
            console.error('Failed to fetch new student:', err);
            // If can't fetch individual, refresh entire list
            const data = await studentAPI.getStudents();
            setStudents(data);
          }
          break;

        case 'student_status_changed':
          // Student status changed - update that specific student
          try {
            const updatedStudent = await studentAPI.getStudent(notification.student.studentId);
            setStudents(prevStudents => {
              const filtered = prevStudents.filter(s => s.id !== updatedStudent.id);
              return [updatedStudent, ...filtered];
            });
          } catch (err) {
            console.error('Failed to fetch updated student:', err);
            // If can't fetch individual, refresh entire list
            const data = await studentAPI.getStudents();
            setStudents(data);
          }
          break;

        case 'leader_added':
        case 'leader_status_changed':
          break;

        default:
          break;
      }
    };

    SignalRService.onNotification(notificationHandler);
    return () => {
      SignalRService.removeNotificationCallback(notificationHandler);
    };
  }, []);

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
          setErrorMessage("You don't have permission to view students");
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

  // Fetch students only if user has access
  useEffect(() => {
    if (!permissionData || accessDenied || permissionError) {
      setLoading(false);
      return;
    }

    const fetchStudents = async () => {
      try {
        setLoading(true);
        const data = await studentAPI.getStudents();
        setStudents(data);
        setErrorMessage(null);
      } catch (err: any) {
        console.error('Failed to fetch students:', err);

        // Handle 403 Forbidden for student API
        if (err.message === 'Forbidden' || err.message?.includes('403')) {
          setAccessDenied(true);
          setErrorMessage("Access Forbidden: You don't have permission to view students");
        } else if (err.message === 'Unauthorized' || err.message?.includes('401')) {
          setAccessDenied(true);
          setErrorMessage("Unauthorized: Please log in to access this page");
        } else {
          setErrorMessage(err.message || 'Failed to fetch students');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [permissionData, accessDenied, permissionError]);

  // Filter and sort students
  useEffect(() => {
    if (!permissionData || accessDenied || permissionError || !students.length) {
      setFilteredStudents([]);
      return;
    }

    let results = [...students];

    // Global search with Google-like functionality
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase().trim();
      const searchTerms = searchLower.split(/\s+/).filter(term => term.length > 0);

      results = results.filter(student => {
        const searchableText = [
          String(student.id || ''),
          student.name || '',
          student.place || '',
          student.age?.toString() || '',
          student.gender || '',
          student.age_group || '',
          student.status || ''
        ].join(' ').toLowerCase();

        return searchTerms.every(term => searchableText.includes(term));
      });

      // Sort by relevance - exact matches first
      results.sort((a, b) => {
        const aExactId = String(a.id) === searchTerm.trim();
        const bExactId = String(b.id) === searchTerm.trim();
        const aExactName = a.name?.toLowerCase() === searchLower;
        const bExactName = b.name?.toLowerCase() === searchLower;
        const aExactPlace = a.place?.toLowerCase() === searchLower;
        const bExactPlace = b.place?.toLowerCase() === searchLower;

        // Priority: exact ID > exact name > exact place > partial matches
        if (aExactId && !bExactId) return -1;
        if (!aExactId && bExactId) return 1;
        if (aExactName && !bExactName) return -1;
        if (!aExactName && bExactName) return 1;
        if (aExactPlace && !bExactPlace) return -1;
        if (!aExactPlace && bExactPlace) return 1;

        return 0;
      });
    }

    // Apply individual filters
    if (filters.id) {
      const idFilter = filters.id.trim();
      results = results.filter(s => String(s.id) === idFilter);
    }

    if (filters.name) {
      const nameSearchLower = filters.name.toLowerCase().trim();
      const nameTerms = nameSearchLower.split(/\s+/).filter(term => term.length > 0);
      results = results.filter(s => {
        const studentName = s.name.toLowerCase();
        return nameTerms.every(term => studentName.includes(term));
      });
    }

    // Age range filtering
    if (filters.age) {
      const ageFilter = filters.age.trim();

      if (ageFilter.includes('-')) {
        const [min, max] = ageFilter.split('-').map(num => parseInt(num.trim(), 10));

        if (!isNaN(min) && !isNaN(max)) {
          results = results.filter(s => {
            const studentAge = parseInt(s.age.toString(), 10);
            return studentAge >= min && studentAge <= max;
          });
        }
      } else {
        const exactAge = parseInt(ageFilter, 10);
        if (!isNaN(exactAge)) {
          results = results.filter(s => parseInt(s.age.toString(), 10) === exactAge);
        }
      }
    }

    if (filters.gender) {
      results = results.filter(s => s.gender === filters.gender);
    }

    if (filters.place) {
      const placeSearchLower = filters.place.toLowerCase().trim();
      const placeTerms = placeSearchLower.split(/\s+/).filter(term => term.length > 0);
      results = results.filter(s => {
        const studentPlace = s.place.toLowerCase();
        return placeTerms.every(term => studentPlace.includes(term));
      });
    }

    if (filters.age_group) {
      results = results.filter(s => s.age_group === filters.age_group);
    }

    if (filters.status) {
      results = results.filter(s => s.status === filters.status);
    }

    // Apply sorting
    results.sort((a, b) => {
      if (sortConfig.key === 'id' || sortConfig.key === 'age') {
        const aValue = a[sortConfig.key] ?? -Infinity;
        const bValue = b[sortConfig.key] ?? -Infinity;

        if (aValue === bValue) return 0;
        return sortConfig.direction === 'asc'
          ? (Number(aValue) - Number(bValue))
          : (Number(bValue) - Number(aValue));
      } else {
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
      }
    });

    setFilteredStudents(results);
  }, [searchTerm, filters, students, sortConfig, permissionData, accessDenied, permissionError]);

  const handleSort = (key: keyof Student) => {
    if (accessDenied || !permissionData || permissionError) return;
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const clearFilters = () => {
    if (accessDenied || !permissionData || permissionError) return;
    setFilters({ id: '', name: '', age: '', gender: '', place: '', age_group: '', status: '' });
    setSearchTerm('');
    setSortConfig({ key: 'id', direction: 'desc' });
    try {
      localStorage.removeItem('studentListGender');
    } catch { }
  };

  const downloadCSV = async () => {
    try {
      await studentAPI.downloadCSV();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const SortIcon = ({ column }: { column: keyof Student }) => {
    if (sortConfig.key !== column) return <FiChevronUp className="opacity-20 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' ? <FiChevronUp className="text-indigo-600" /> : <FiChevronDown className="text-indigo-600" />;
  };

  // Show loading state while permissions are loading
  if (permissionLoading) {
    return <StudentListSkeleton />;
  }

  // Show access denied page for permission errors or access denied
  if (permissionError || accessDenied || !permissionData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AccessAlert message={errorMessage || "You do not have access to this page."} />
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
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium"
            >
              <FiArrowLeft /> Back
            </button>
            <div className="h-4 w-[1px] bg-gray-300 hidden sm:block"></div>
            <h1 className="text-lg font-bold text-slate-800 hidden sm:block">
              Student Management
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Download CSV Button */}
            {isAdminOrCoAdmin(permissionData) && (
              <button
                onClick={downloadCSV}
                disabled={downloading || students.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium shadow-sm ${downloading
                    ? 'bg-green-400 text-white cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 hover:shadow'
                  }`}
                title={students.length === 0 ? "No data to export" : "Download as CSV"}
              >
                {downloading ? (
                  <>
                    <FiLoader className="animate-spin" /> Downloading...
                  </>
                ) : (
                  <>
                    <FiDownload /> Export CSV
                  </>
                )}
              </button>
            )}

            <Link
              to="/user/student/new"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-all text-sm font-medium shadow-sm hover:shadow"
            >
              <FiPlus /> New Student
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <StudentListSkeleton />
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
                    placeholder="Search by ID, name or place..."
                    className="pl-10 pr-4 py-2 w-full border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
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
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                  >
                    <FiFilter /> Filters
                  </button>
                  {(searchTerm || Object.values(filters).some(v => v) || sortConfig.key !== 'id' || sortConfig.direction !== 'desc') && (
                    <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-red-600 font-semibold px-2 transition-colors">
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>

            {showFilters && (
              <div className="p-4 bg-slate-50/50 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 border-b border-slate-100">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">ID</label>
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder=""
                    value={filters.id}
                    onChange={(e) => setFilters(p => ({ ...p, id: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder=""
                    value={filters.name}
                    onChange={(e) => setFilters(p => ({ ...p, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Age</label>
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="e.g. 10 | 5–12"
                    value={filters.age}
                    onChange={(e) => setFilters(p => ({ ...p, age: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Gender</label>
                  <select
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    value={filters.gender}
                    onChange={(e) => {
                      setFilters(p => ({ ...p, gender: e.target.value }));
                      try {
                        localStorage.setItem('studentListGender', e.target.value);
                      } catch { }
                    }}
                  >
                    <option value="">All</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Place</label>
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder=""
                    value={filters.place}
                    onChange={(e) => setFilters(p => ({ ...p, place: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Main Group</label>
                  <select
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    value={filters.age_group}
                    onChange={(e) => setFilters(p => ({ ...p, age_group: e.target.value }))}
                  >
                    <option value="">All</option>
                    {uniqueAgeGroups.map(g => (
                      <option key={g} value={g}>Group {g}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Status</label>
                  <select
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    value={filters.status}
                    onChange={(e) => setFilters(p => ({ ...p, status: e.target.value }))}
                  >
                    <option value="">All</option>
                    <option value="registered">Registered</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
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
                    <th onClick={() => handleSort('id')} className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider cursor-pointer group select-none">
                      <div className="flex items-center gap-1">ID <SortIcon column="id" /></div>
                    </th>
                    <th onClick={() => handleSort('name')} className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider cursor-pointer group select-none">
                      <div className="flex items-center gap-1">Student Name <SortIcon column="name" /></div>
                    </th>
                    <th onClick={() => handleSort('age')} className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider text-center cursor-pointer group select-none">
                      <div className="flex items-center justify-center gap-1">Age <SortIcon column="age" /></div>
                    </th>
                    <th onClick={() => handleSort('gender')} className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider text-left cursor-pointer group select-none">
                      <div className="flex items-center gap-1">Gender <SortIcon column="gender" /></div>
                    </th>
                    <th onClick={() => handleSort('place')} className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider cursor-pointer group select-none">
                      <div className="flex items-center gap-1">Place <SortIcon column="place" /></div>
                    </th>
                    <th onClick={() => handleSort('age_group')} className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider text-center cursor-pointer group select-none">
                      <div className="flex items-center justify-center gap-1">Group <SortIcon column="age_group" /></div>
                    </th>
                    <th onClick={() => handleSort('status')} className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider text-center cursor-pointer group select-none">
                      <div className="flex items-center justify-center gap-1">Status <SortIcon column="status" /></div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id || `student-${Math.random()}`}
                      onClick={() => navigate(`/user/student/${student.id || ''}`)}
                      className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-slate-400">
                        {student.id ? `#${student.id}` : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors capitalize">
                          {student.name.charAt(0).toUpperCase() + student.name.slice(1).toLowerCase()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-slate-600">
                        {student.age}
                      </td>
                      <td className="px-6 py-4 text-left">
                        <span className="text-xs font-medium text-slate-500 uppercase">{student.gender.toUpperCase()}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 capitalize">{student.place.charAt(0).toUpperCase() + student.place.slice(1).toLowerCase()}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                          {student.age_group ? `Group ${student.age_group}` : 'No Group'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center justify-center w-24 py-1 text-[10px] uppercase font-bold rounded-full border ${student.status === 'present' ? 'bg-green-50 text-green-700 border-green-100' :
                            student.status === 'registered' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                              'bg-red-50 text-red-700 border-red-100'
                          }`}>
                          {student.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredStudents.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-sm">No students found matching your criteria.</div>
              )}
            </div>
          </div>
          <div className="text-xs text-slate-400 px-2">
            Showing {filteredStudents.length} of {students.length} total students
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;