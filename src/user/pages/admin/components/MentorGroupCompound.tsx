import React, { useState } from 'react';
import { FiPlus, FiTrash2, FiUsers, FiSave, FiInfo, FiLoader, FiCheck } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { saveMentorGroups } from '../api/GroupData';

interface MentorGroup {
  groupName: string;
  initialAge: number;
  finalAge: number;
  capacity: number;
}

interface MentorGroupCompoundProps {
  mentorGroupStructureJSON: MentorGroup[];
  onMentorGroupChange: (groups: MentorGroup[]) => void;
}

const MentorGroupCompound: React.FC<MentorGroupCompoundProps> = ({
  mentorGroupStructureJSON,
  onMentorGroupChange,
}) => {
  // Local state for the Save button animation status
  const [status, setStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  /** Normalize groups: enforce sequential names + continuous age ranges */
  const normalizeGroups = (groups: MentorGroup[]): MentorGroup[] => {
    return groups.map((group, index) => {
      const initialAge = index === 0 ? 0 : groups[index - 1].finalAge + 1;
      const finalAge = Math.max(initialAge, group.finalAge);

      return {
        ...group,
        groupName: String.fromCharCode(65 + index), // A, B, C, ...
        initialAge,
        finalAge,
      };
    });
  };

  const handleSave = async () => {
    if (status !== 'idle') return;

    setStatus('saving');
  
    const success = await saveMentorGroups(
      mentorGroupStructureJSON
    );

    if (success) {
      setStatus('success');
      // Reset to idle after 2 seconds to allow the success animation to be seen
      setTimeout(() => setStatus('idle'), 2000);
    } else {
      setStatus('idle');
      alert('Failed to save mentor groups');
    }
  };

  const addMentorGroup = () => {
    const last = mentorGroupStructureJSON.at(-1);

    const newGroup: MentorGroup = {
      groupName: '',
      initialAge: last ? last.finalAge + 1 : 0,
      finalAge: last ? last.finalAge + 11 : 10,
      capacity: 10,
    };

    onMentorGroupChange(normalizeGroups([...mentorGroupStructureJSON, newGroup]));
  };

  const updateMentorGroup = (
    index: number,
    field: 'finalAge' | 'capacity',
    value: number
  ) => {
    const updated = mentorGroupStructureJSON.map((group, i) =>
      i === index ? { ...group, [field]: value } : group
    );

    onMentorGroupChange(normalizeGroups(updated));
  };

  const removeMentorGroup = (index: number) => {
    if (mentorGroupStructureJSON.length <= 1) {
      alert('Cannot remove the last mentor group');
      return;
    }

    const filtered = mentorGroupStructureJSON.filter((_, i) => i !== index);
    onMentorGroupChange(normalizeGroups(filtered));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-transparent">
        <div className="flex items-start gap-3">
          <div className="bg-indigo-600 text-white p-3 rounded-lg">
            <FiUsers className="text-xl" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Mentor Groups</h2>
            <p className="text-sm text-slate-600 mt-1">
              Configure mentor groups with capacity and age ranges
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={addMentorGroup}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center gap-2 font-medium transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            <FiPlus size={18} /> Add Group
          </button>

          {/* Animated Save Button */}
          <button
            onClick={handleSave}
            disabled={status !== 'idle'}
            className={`flex-1 sm:flex-none min-w-[120px] px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-all shadow-sm hover:shadow-md active:scale-95 
              ${status === 'success' ? 'bg-emerald-500 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}
              ${status === 'saving' ? 'opacity-80 cursor-wait' : ''}`}
          >
            <AnimatePresence mode="wait">
              {status === 'saving' ? (
                <motion.div
                  key="saving"
                  initial={{ opacity: 0, rotate: -45 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <FiLoader className="animate-spin" size={18} />
                </motion.div>
              ) : status === 'success' ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <FiCheck size={18} />
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <FiSave size={18} />
                </motion.div>
              )}
            </AnimatePresence>
            <span>
              {status === 'saving' ? 'Saving...' : status === 'success' ? 'Saved' : 'Save'}
            </span>
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <FiInfo className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
        <p className="text-sm text-amber-900">
          Each mentor group has a capacity setting. Adjust based on your event needs.
        </p>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mentorGroupStructureJSON.map((group, index) => (
          <div
            key={index}
            className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden border border-slate-200 hover:border-slate-300"
          >
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center text-white font-bold text-xl border border-white/30">
                  {group.groupName}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Group {group.groupName}
                  </h3>
                  <p className="text-sm text-indigo-100">
                    Age {group.initialAge} – {group.finalAge}
                  </p>
                </div>
              </div>

              <button
                onClick={() => removeMentorGroup(index)}
                disabled={mentorGroupStructureJSON.length <= 1}
                className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-white/20 text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                title="Remove group"
              >
                <FiTrash2 size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                    From Age
                  </label>
                  <div className="px-3 py-2.5 bg-slate-100 rounded-lg border border-slate-200 text-sm font-medium text-slate-700">
                    {group.initialAge}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                    To Age
                  </label>
                  <input
                    type="number"
                    value={group.finalAge}
                    min={group.initialAge}
                    onChange={(e) =>
                      updateMentorGroup(index, 'finalAge', Number(e.target.value))
                    }
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="h-px bg-slate-200 my-5" />

              <div className="space-y-3">
                <div>
                  <label className="flex items-center text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2 gap-1.5">
                    <FiUsers size={14} /> Capacity
                  </label>
                  <input
                    type="number"
                    value={group.capacity}
                    min={1}
                    onChange={(e) =>
                      updateMentorGroup(index, 'capacity', Number(e.target.value))
                    }
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium text-slate-900"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Maximum members per mentor group
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {mentorGroupStructureJSON.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <FiUsers className="mx-auto text-slate-300 mb-3" size={40} />
          <p className="text-slate-600 font-medium">No mentor groups yet</p>
          <p className="text-sm text-slate-500 mt-1">
            Click "Add Group" to create your first mentor group
          </p>
        </div>
      )}
    </div>
  );
};

export default MentorGroupCompound;
