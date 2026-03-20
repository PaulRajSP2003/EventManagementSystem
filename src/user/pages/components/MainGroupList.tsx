import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { GroupStructure } from '../api/FollowingGroupDataAPI';

// Types remain the same...
interface MainGroupListProps {
  structure: GroupStructure;
  selectedGender: 'Male' | 'Female';
  onGroupSelect: (groupName: string) => void;
  activeGroup?: string;
  disabled?: boolean;
}

const MainGroupList: React.FC<MainGroupListProps> = ({
  structure,
  selectedGender,
  onGroupSelect,
  activeGroup,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const availableGroups = useMemo(() => {
    const genderKey = selectedGender.toLowerCase() as 'male' | 'female';
    const genderGroups = structure[genderKey] || [];
    return genderGroups
      .map(group => ({
        groupName: group.groupName,
      }))
      .sort((a, b) => a.groupName.localeCompare(b.groupName, undefined, { numeric: true, sensitivity: 'base' }));
  }, [structure, selectedGender]);

  const filteredGroups = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return availableGroups.filter(g => g.groupName.toLowerCase().includes(term));
  }, [availableGroups, searchTerm]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const currentSelection = availableGroups.find(g => g.groupName === activeGroup);

  return (
    <div className="relative w-full text-slate-800" ref={dropdownRef}>
      {/* Label Section */}
      <div className="flex justify-between items-center mb-1.5 px-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Main Category <span className="text-indigo-500">/ {selectedGender}</span>
        </span>
      </div>

      {/* Main Select Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 bg-white shadow-sm ${
          isOpen ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-slate-200 hover:border-slate-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold transition-colors ${
            currentSelection ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
          }`}>
            {currentSelection ? currentSelection.groupName.charAt(0) : '?'}
          </div>
          <span className={`text-sm font-semibold ${!currentSelection ? 'text-slate-400' : 'text-slate-700'}`}>
            {currentSelection ? currentSelection.groupName : 'Select Main Group'}
          </span>
        </div>
        <svg className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="fixed sm:absolute bottom-24 sm:bottom-auto sm:top-full left-4 right-4 sm:left-0 sm:right-auto z-[100] w-auto sm:w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 min-w-[280px] max-w-[calc(100vw-2rem)]">
          <div className="p-3 border-b border-slate-50 bg-slate-50/50">
            <input
              autoFocus
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-400 transition-colors"
              placeholder="Search main groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="max-h-[40vh] sm:max-h-64 overflow-y-auto p-2">
            {filteredGroups.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400 italic">No groups found</div>
            ) : (
              filteredGroups.map(group => {
                const isActive = activeGroup === group.groupName;
                return (
                  <button
                    key={group.groupName}
                    onClick={() => { onGroupSelect(group.groupName); setIsOpen(false); setSearchTerm(''); }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all mb-1 ${
                      isActive ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-black ${
                        isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {group.groupName.charAt(1)}
                      </span>
                      <span className="text-sm font-bold tracking-tight">{group.groupName}</span>
                    </div>
                    {isActive && <span className="text-[9px] font-black bg-indigo-600 text-white px-1.5 py-0.5 rounded uppercase">Active</span>}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MainGroupList;
