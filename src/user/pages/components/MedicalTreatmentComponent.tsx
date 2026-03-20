import React, { useState } from 'react';
import { FiPlus, FiEdit, FiSave, FiX, FiCalendar, FiUser } from 'react-icons/fi';
import type { MedicalTreatment } from '../../../types';

interface MedicalTreatmentComponentProps {
  treatments: MedicalTreatment[];
  onAddTreatment: (newTreatment: Omit<MedicalTreatment, 'createdAt' | 'updatedAt'>) => void;
  onEditTreatment: (index: number, updatedTreatment: MedicalTreatment) => void;
  onDeleteTreatment: (index: number) => void;
  canManageTreatments?: boolean;
}

const MedicalTreatmentComponent: React.FC<MedicalTreatmentComponentProps> = ({
  treatments,
  onAddTreatment,
  onEditTreatment,
  canManageTreatments = false
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    treaterName: '',
    description: '',
  });

  // Reset form and editing state
  const resetForm = () => {
    setFormData({ treaterName: '', description: '' });
    setEditingIndex(null);
    setIsAdding(false);
  };

  // Handle form submission for both add and edit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.treaterName || !formData.description) return;
    
    if (editingIndex !== null) {
      // Edit existing treatment
      onEditTreatment(editingIndex, {
        ...treatments[editingIndex],
        treaterName: formData.treaterName,
        description: formData.description,
        updatedAt: new Date().toISOString(), // Use ISO string for full date and time
      });
    } else {
      // Add new treatment
      onAddTreatment({
        ...formData,
        createdBy: 'Current User', // This should come from auth context
      });
    }
    
    resetForm();
  };

  // Start editing a treatment
  const startEdit = (index: number) => {
    if (!canManageTreatments) return;
    setEditingIndex(index);
    setFormData({
      treaterName: treatments[index].treaterName,
      description: treatments[index].description,
    });
  };

  // Sort treatments by date (newest first)
  const sortedTreatments = [...treatments].sort((a, b) => {
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  // Helper function to format the ISO date string
  const formatDateTime = (isoString: string | undefined): string => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 mt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Treatment Update</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track all medical treatments and updates
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          disabled={!canManageTreatments}
          className={`flex items-center justify-center w-full sm:w-auto px-4 py-2.5 rounded-lg transition-all font-medium shadow-sm ${
            !canManageTreatments
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-500 active:scale-[0.98]'
          }`}
          title={!canManageTreatments ? "You don't have permission to manage treatments" : "Add new treatment"}
        >
          <FiPlus className="mr-2" /> Add Treatment
        </button>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingIndex !== null) && canManageTreatments && (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {editingIndex !== null ? 'Edit Treatment' : 'Add New Treatment'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="treaterName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Treater Name *
              </label>
              <input
                type="text"
                id="treaterName"
                value={formData.treaterName}
                onChange={(e) => setFormData({ ...formData, treaterName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Dr. Smith"
                required
                autoComplete='off'
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Treatment Details *
              </label>
              <textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Describe the treatment provided..."
                required
                autoComplete='off'
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 justify-end pt-4 border-t border-gray-100 dark:border-gray-600 mt-2">
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center justify-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 w-full sm:w-auto transition-colors"
              >
                <FiX className="mr-1" /> Cancel
              </button>
              <button
                type="submit"
                className="flex items-center justify-center px-4 py-2.5 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto shadow-sm transition-all active:scale-[0.98]"
              >
                <FiSave className="mr-1" /> {editingIndex !== null ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Treatments List */}
      {sortedTreatments.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
          <FiCalendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-white">No treatments recorded</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by adding the first treatment update.
          </p>
          {canManageTreatments && (
            <div className="mt-6">
              <button
                onClick={() => setIsAdding(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
              >
                <FiPlus className="mr-2" /> Add Treatment
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedTreatments.map((treatment, index) => (
            <div
              key={index}
              className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
            >
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-3 capitalize">
                {treatment.description}
              </p>
              
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="flex items-center gap-1.5 capitalize">
                    <FiUser className="text-indigo-500" />
                    {treatment.treaterName}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FiCalendar className="text-indigo-500" />
                    {formatDateTime(treatment.createdAt)}
                  </span>
                  {treatment.updatedAt && treatment.updatedAt !== treatment.createdAt && (
                    <span className="text-xs italic bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                      Updated: {formatDateTime(treatment.updatedAt)}
                    </span>
                  )}
                </div>
                
                {canManageTreatments && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(index)}
                      className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-md transition-colors"
                      title="Edit treatment"
                    >
                      <FiEdit size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicalTreatmentComponent;
