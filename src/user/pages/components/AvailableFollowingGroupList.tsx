import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { GroupStructure } from '../api/FollowingGroupData';
import { FaSortAmountUp, FaSortAmountDown, FaUserCheck, FaUserTimes, FaUsers } from 'react-icons/fa';

interface AvailableFollowingGroupListProps {
  structure: GroupStructure;
  gender: 'Male' | 'Female';
  mainGroup: string;
  selectedFollowingGroup: string;
  onSelectionChange: (followingGroupName: string) => void;
  disabled?: boolean;
  leaderType?: 'leader1' | 'leader2';
  isReplacementCase?: boolean;
}

const AvailableFollowingGroupList: React.FC<AvailableFollowingGroupListProps> = ({
  structure,
  gender,
  mainGroup,
  selectedFollowingGroup,
  onSelectionChange,
  disabled = false,
  leaderType,
  isReplacementCase,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortAsc, setSortAsc] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentMainGroupData = useMemo(() => {
    if (!mainGroup) return null;
    const genderKey = gender.toLowerCase() as 'male' | 'female';
    return structure[genderKey]?.find((g) => g.groupName === mainGroup) ?? null;
  }, [structure, gender, mainGroup]);

  const filteredFollowingGroups = useMemo(() => {
    if (!currentMainGroupData) return [];
    let list = [...currentMainGroupData.followingGroups];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter((fg) => fg.followingGroupName.toLowerCase().includes(term));
    }
    // Filter out groups with same leader type in replacement case, but always include the currently selected group
    if (isReplacementCase && (leaderType === 'leader1' || leaderType === 'leader2')) {
      list = list.filter((fg) => {
        if (fg.followingGroupName === selectedFollowingGroup) return true;
        if (leaderType === 'leader1' && fg.leader1Id) return false;
        if (leaderType === 'leader2' && fg.leader2Id) return false;
        return true;
      });
    }
    return list.sort((a, b) =>
      sortAsc ? a.studentIds.length - b.studentIds.length : b.studentIds.length - a.studentIds.length
    );
  }, [currentMainGroupData, searchTerm, sortAsc, isReplacementCase, leaderType, selectedFollowingGroup]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative w-full text-slate-800 font-sans" ref={dropdownRef}>
      {/* Label Section */}
      <div className="flex justify-between items-center mb-1.5 px-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Following Group {mainGroup && <span className="text-indigo-500">/ {mainGroup}</span>}
        </span>
      </div>

      {/* Main Trigger Button */}
      <button
        type="button"
        disabled={disabled || !mainGroup}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 bg-white shadow-sm ${
          isOpen ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-slate-200 hover:border-slate-300'
        } ${disabled || !mainGroup ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${selectedFollowingGroup ? 'bg-indigo-500' : 'bg-slate-300 animate-pulse'}`} />
          <span className={`text-sm font-semibold ${!selectedFollowingGroup ? 'text-slate-400' : 'text-slate-700'}`}>
            {selectedFollowingGroup || 'Select a group...'}
          </span>
        </div>
        <svg className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute left-0 z-50 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300"
          style={{ minWidth: 'max(450px, 100%)' }}
        >
          {/* Action Bar — Matches MainGroupList Padding/Size */}
          <div className="p-3.5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
            <input
              autoFocus
              className="flex-1 px-4 py-2.5 text-base bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-400 transition-colors shadow-sm"
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <button
              onClick={() => setSortAsc(!sortAsc)}
              className={`p-2.5 rounded-lg transition-all border flex items-center justify-center shadow-sm ${
                !sortAsc
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              {sortAsc ? <FaSortAmountUp size={16} /> : <FaSortAmountDown size={16} />}
            </button>
          </div>

          {/* Table Header */}
          <div className="flex items-center px-4 py-3 bg-slate-50 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider">
            <div className="flex-1">Group Name</div>
            <div className="w-[85px] text-left">Leader 1</div>
            <div className="w-[85px] text-left">Leader 2</div>
            <div className="w-[75px] text-right">Student</div>
          </div>

          {/* List Container — Increased padding to 2.5 to match MainGroupList */}
          <div className="max-h-80 overflow-y-auto p-2.5">
            {filteredFollowingGroups.length === 0 ? (
              <div className="p-10 text-center text-base text-slate-400 italic">No groups found</div>
            ) : (
              filteredFollowingGroups.map((fg) => {
                const isSelected = fg.followingGroupName === selectedFollowingGroup;
                const hasL1 = !!fg.leader1Id;
                const hasL2 = !!fg.leader2Id;

                return (
                  <button
                    key={fg.followingGroupName}
                    onClick={() => {
                      onSelectionChange(fg.followingGroupName);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center p-3.5 rounded-xl transition-all mb-1 border group ${
                      isSelected
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700 ring-1 ring-indigo-100"
                      : "bg-transparent border-transparent hover:bg-slate-50 hover:border-slate-200 text-slate-600"
                    }`}
                  >
                    {/* Col 1: Name + Letter Box (Matches MainGroupList Style) */}
                    <div className="flex-1 flex items-center gap-4 text-left">
                      <span className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg text-[13px] font-black transition-colors ${
                        isSelected ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {fg.followingGroupName.charAt(0)}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-[15px] font-bold tracking-tight">
                          {fg.followingGroupName}
                        </span>
                        {/* Added "Active" badge style like MainGroupList */}
                        {isSelected && (
                          <span className="text-[9px] font-black text-indigo-500 uppercase mt-0.5">Active Now</span>
                        )}
                      </div>
                    </div>

                    {/* Col 2: Leader 1 */}
                    <div className="w-[85px] flex justify-start">
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${
                          hasL1 ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-400 border-rose-100 opacity-60"
                        }`}
                      >
                        {hasL1 ? <FaUserCheck size={11} /> : <FaUserTimes size={11} />}
                        <span>{hasL1 ? "Done" : "None"}</span>
                      </div>
                    </div>

                    {/* Col 3: Leader 2 */}
                    <div className="w-[85px] flex justify-start">
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${
                          hasL2 ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-rose-50 text-rose-400 border-rose-100 opacity-60"
                        }`}
                      >
                        {hasL2 ? <FaUserCheck size={11} /> : <FaUserTimes size={11} />}
                        <span>{hasL2 ? "Done" : "None"}</span>
                      </div>
                    </div>

                    {/* Col 4: Student Count — Scaled up */}
                    <div className="w-[75px] flex justify-end">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] font-black ${
                          isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-white"
                        }`}
                      >
                        <FaUsers size={14} />
                        {fg.studentIds.length}
                      </div>
                    </div>
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

export default AvailableFollowingGroupList;