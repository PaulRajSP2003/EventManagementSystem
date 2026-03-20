import React from 'react';
import { useState, useRef, useEffect } from 'react';
import type { Student } from '../../../types';
import { studentAPI } from '../api/StudentData';

interface StudentListCompoundProps {
  onStudentSelect: (student: Student | null) => void;
  initialStudentId?: number;
}

const StudentListCompound: React.FC<StudentListCompoundProps> = ({ onStudentSelect, initialStudentId }) => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [placeFilter, setPlaceFilter] = useState('');
  const [ageFilter, setAgeFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [idFilter, setIdFilter] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError(null);
        const studentData = await studentAPI.getStudents();
        // Deduplicate students by ID to prevent duplicate keys in the list
        const uniqueStudentsMap = new Map();
        studentData.forEach(s => {
          if (s.id && !uniqueStudentsMap.has(s.id)) {
            uniqueStudentsMap.set(s.id, s);
          }
        });
        setStudents(Array.from(uniqueStudentsMap.values()));
      } catch (err) {
        console.error('Failed to fetch students:', err);
        setError('Failed to load students');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  useEffect(() => {
    if (initialStudentId !== undefined && students.length > 0) {
      const initialStudent = students.find(student => student.id === initialStudentId) || null;
      setSelectedStudent(initialStudent);
    }
  }, [initialStudentId, students]);

  const filteredStudents = students.filter(student => {
    const matchesName = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlace = placeFilter === '' || student.place.toLowerCase().includes(placeFilter.toLowerCase());
    const matchesAge = ageFilter === '' || student.age.toString() === ageFilter;
    const matchesGender = genderFilter === '' || student.gender === genderFilter;
    const matchesId = idFilter === '' || (student.id !== undefined && student.id.toString() === idFilter);

    return matchesName && matchesPlace && matchesAge && matchesGender && matchesId;
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isDropdownOpen]);

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    onStudentSelect(student);
    setIsDropdownOpen(false);
    setSearchTerm('');
    setPlaceFilter('');
    setAgeFilter('');
    setGenderFilter('');
    setIdFilter('');
  };

  const clearSelection = () => {
    setSelectedStudent(null);
    onStudentSelect(null);
    setSearchTerm('');
    setPlaceFilter('');
    setAgeFilter('');
    setGenderFilter('');
    setIdFilter('');
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="relative w-64" ref={dropdownRef}>
      {/* Selection Display */}
      {selectedStudent ? (
        <div className="flex items-center justify-between p-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600">
          <div className="flex items-center">
            <div className="bg-indigo-100 text-indigo-700 rounded-full p-1 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-medium text-gray-800 dark:text-gray-200 capitalize">
              {selectedStudent.name} ({selectedStudent.age}, {selectedStudent.gender})
            </span>
          </div>
          <button
            onClick={clearSelection}
            className="text-gray-500 hover:text-red-500 transition-colors dark:text-gray-400 dark:hover:text-red-400"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      ) : (
        <div
          className="p-2 bg-white border border-gray-300 rounded-md shadow-sm cursor-pointer hover:border-indigo-400 transition-colors dark:bg-gray-800 dark:border-gray-600"
          onClick={toggleDropdown}
        >
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Select a Student</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute z-10 w-64 mt-1 bg-white border border-gray-300 rounded-md shadow-lg overflow-hidden dark:bg-gray-800 dark:border-gray-600">
          {/* Main Search Input */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                ref={searchInputRef}
                type="text"
                className="block w-full pl-8 pr-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                placeholder="Search students by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsDropdownOpen(false);
                  }
                }}
              />
            </div>
          </div>

          {/* New Filter Sections */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="id-filter" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                ID
              </label>
              <input
                id="id-filter"
                type="number"
                min="0"
                className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                placeholder="e.g., 3"
                value={idFilter}
                onChange={(e) => setIdFilter(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="place-filter" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Place
              </label>
              <input
                id="place-filter"
                type="text"
                className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                placeholder="e.g., New York"
                value={placeFilter}
                onChange={(e) => setPlaceFilter(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="age-filter" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Age
              </label>
              <input
                id="age-filter"
                type="number"
                min="0"
                className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                placeholder="e.g., 15"
                value={ageFilter}
                onChange={(e) => setAgeFilter(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="gender-filter" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Gender
              </label>
              <select
                id="gender-filter"
                className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          {/* Students List */}
          <div className="max-h-40 overflow-y-auto">
            {loading ? (
              <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading students...
                </div>
              </div>
            ) : error ? (
              <div className="px-3 py-4 text-center text-sm text-red-500 dark:text-red-400">
                {error}
              </div>
            ) : filteredStudents.length > 0 ? (
              filteredStudents.map((student, index) => (
                <div
                  key={`${student.id}-${index}`}
                  className="px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900 cursor-pointer transition-colors flex items-center text-sm"
                  onClick={() => handleStudentSelect(student)}
                >
                  <div className="bg-indigo-100 text-indigo-700 rounded-full p-1 mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-800 font-medium dark:text-gray-200 capitalize">{student.name}</span>
                    <span className="text-gray-600 text-xs dark:text-gray-400 capitalize">
                      ID: {student.id} | {student.gender} | {student.place}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-center text-sm">
                No students found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentListCompound;
