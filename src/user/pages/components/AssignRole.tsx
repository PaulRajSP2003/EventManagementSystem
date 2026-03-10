import React, { useState, useRef, useEffect } from 'react';

// Define types inline since we can't import
type AssignRole = {
  id: number;
  assignRoleName: string;
};

// Roles will be fetched from API

interface AssignRoleProps {
  onRoleSelect: (role: AssignRole | null) => void;
  initialRoleId?: number;
}

const AssignRole: React.FC<AssignRoleProps> = ({ onRoleSelect, initialRoleId }) => {
  const [roles, setRoles] = useState<AssignRole[]>([]);
  const [selectedRole, setSelectedRole] = useState<AssignRole | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  // Fetch roles from API
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('https://localhost:7135/api/admin/roles', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        if (!res.ok) return setRoles([]);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) setRoles(data.data);
      } catch (err) {
        setRoles([]);
      }
    })();
  }, []);

  // Set initial role based on the initialRoleId prop
  useEffect(() => {
    if (initialRoleId !== undefined && roles.length > 0) {
      const initialRole = roles.find(role => role.id === initialRoleId) || null;
      setSelectedRole(initialRole);
    }
  }, [initialRoleId, roles]);

  const filteredRoles = roles.filter(role =>
    role.assignRoleName.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleRoleSelect = (role: AssignRole) => {
    setSelectedRole(role);
    onRoleSelect(role);
    setIsDropdownOpen(false);
    setSearchTerm('');
  };

  const clearSelection = () => {
    setSelectedRole(null);
    onRoleSelect(null);
    setSearchTerm('');
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="relative w-64" ref={dropdownRef}>
      {/* Selection Display */}
      {selectedRole ? (
        <div className="flex items-center justify-between p-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600">
          <div className="flex items-center">
            <div className="bg-indigo-100 text-indigo-700 rounded-full p-1 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-medium text-gray-800 dark:text-gray-200">{selectedRole.assignRoleName}</span>
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
            <span className="text-gray-500 text-sm">Select a role</span>
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
          {/* Search Input */}
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
                placeholder="Search roles..."
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

          {/* Roles List */}
          <div className="max-h-40 overflow-y-auto">
            {filteredRoles.length > 0 ? (
              filteredRoles.map((role) => (
                <div
                  key={role.id}
                  className="px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900 cursor-pointer transition-colors flex items-center text-sm"
                  onClick={() => handleRoleSelect(role)}
                >
                  <div className="bg-indigo-100 text-indigo-700 rounded-full p-1 mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-800 dark:text-gray-200">{role.assignRoleName}</span>
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-center text-sm">
                No roles found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignRole;
