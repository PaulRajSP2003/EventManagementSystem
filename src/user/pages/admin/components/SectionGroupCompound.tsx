import React, { useState } from 'react';
import { FiPlus, FiTrash2, FiTag, FiSave, FiInfo, FiLoader, FiCheck } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { saveSectionGroups } from '../api/GroupData';

interface SectionGroup {
  groupName: string;
  initialAge: number;
  finalAge: number;
  tagColor: string;
}

interface SectionGroupCompoundProps {
  sectionGroupStructureJSON: SectionGroup[];
  onSectionGroupChange: (groups: SectionGroup[]) => void;
}

const SectionGroupCompound: React.FC<SectionGroupCompoundProps> = ({
  sectionGroupStructureJSON,
  onSectionGroupChange,
}) => {
  // Animation state for the save button
  const [status, setStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  const normalizeGroups = (groups: SectionGroup[]) => {
    return groups.map((group, index) => {
      const initialAge = index === 0 ? 0 : groups[index - 1].finalAge + 1;
      const finalAge = Math.max(group.finalAge, initialAge);

      return {
        ...group,
        groupName: String.fromCharCode(65 + index),
        initialAge,
        finalAge,
      };
    });
  };

  const handleSaveSectionGroups = async () => {
    setStatus('saving');

    const success = await saveSectionGroups(
      sectionGroupStructureJSON
    );

    if (success) {
      setStatus('success');
      // Reset to idle after 2 seconds so the user can save again if they make more changes
      setTimeout(() => setStatus('idle'), 2000);
    } else {
      setStatus('idle');
      alert('Failed to save section groups');
    }
  };

  const addSectionGroup = () => {
    const lastGroup = sectionGroupStructureJSON[sectionGroupStructureJSON.length - 1];

    const newGroup: SectionGroup = {
      groupName: '',
      initialAge: lastGroup ? lastGroup.finalAge + 1 : 0,
      finalAge: lastGroup ? lastGroup.finalAge + 10 : 10,
      tagColor: '#8B5CF6',
    };

    onSectionGroupChange(
      normalizeGroups([...sectionGroupStructureJSON, newGroup])
    );
  };

  const updateFinalAge = (index: number, value: number) => {
    const updated = sectionGroupStructureJSON.map((group, i) =>
      i === index ? { ...group, finalAge: value } : group
    );

    onSectionGroupChange(normalizeGroups(updated));
  };

  const updateColor = (index: number, value: string) => {
    onSectionGroupChange(
      sectionGroupStructureJSON.map((group, i) =>
        i === index ? { ...group, tagColor: value } : group
      )
    );
  };

  const removeSectionGroup = (index: number) => {
    if (sectionGroupStructureJSON.length <= 1) {
      alert('Cannot remove the last group');
      return;
    }

    const filtered = sectionGroupStructureJSON.filter((_, i) => i !== index);
    onSectionGroupChange(normalizeGroups(filtered));
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-transparent">
        <div className="flex items-start gap-3">
          <div className="bg-indigo-600 text-white p-3 rounded-lg">
            <FiTag className="text-xl" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Section Groups</h2>
            <p className="text-sm text-slate-600 mt-1">
              Create and manage section groups based on age ranges
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={addSectionGroup}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center gap-2 font-medium transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            <FiPlus size={18} /> Add Group
          </button>

          {/* SAVE BUTTON WITH ANIMATION STATES */}
          <button
            onClick={handleSaveSectionGroups}
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

      {/* Info Alert */}
      <div className="bg-transparent border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <FiInfo className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
        <p className="text-sm text-blue-900">
          Group names are automatically assigned alphabetically (A, B, C...). You can customize the age ranges and colors for each group.
        </p>
      </div>


      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sectionGroupStructureJSON.map((group, index) => (
          <div key={index} className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all overflow-hidden">
            <div
              className="p-4 text-white flex items-center justify-between"
              style={{ backgroundColor: group.tagColor }}
            >
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold opacity-90">
                  {group.groupName}
                </div>
                <div>
                  <p className="text-sm font-semibold opacity-90">
                    Group {group.groupName}
                  </p>
                  <p className="text-xs opacity-75">
                    Age {group.initialAge} – {group.finalAge}
                  </p>
                </div>
              </div>

              <button
                onClick={() => removeSectionGroup(index)}
                disabled={sectionGroupStructureJSON.length <= 1}
                className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-white/20 text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <FiTrash2 size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                  Tag Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={group.tagColor}
                    onChange={(e) => updateColor(index, e.target.value)}
                    className="w-12 h-10 rounded-lg cursor-pointer border border-slate-200"
                  />
                  <span className="text-sm text-slate-600 font-mono">
                    {group.tagColor}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                    From Age
                  </label>
                  <div className="px-3 py-2.5 bg-slate-100 rounded-lg border border-slate-200 text-sm font-medium">
                    {group.initialAge}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                    To Age
                  </label>
                  <input
                    type="number"
                    min={group.initialAge}
                    value={group.finalAge}
                    onChange={(e) =>
                      updateFinalAge(index, Number(e.target.value))
                    }
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SectionGroupCompound;