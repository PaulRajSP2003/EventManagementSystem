import React from 'react';
import { FiEdit } from 'react-icons/fi';

const RoomSettingsCompound: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-300 dark:border-gray-600 p-5">
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className="bg-indigo-100 dark:bg-indigo-800/50 text-indigo-600 dark:text-indigo-400 p-3 rounded-full flex items-center justify-center flex-shrink-0">
          <FiEdit className="text-2xl" />
        </div>

        {/* Text */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Room Settings
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage room preferences and configurations
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoomSettingsCompound;