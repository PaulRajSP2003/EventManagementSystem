import React from 'react';

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  enabledLabel?: string;
  disabledLabel?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  enabled,
  onChange,
  enabledLabel = "Auto",
  disabledLabel = "Manual"
}) => (
  <div className="flex items-center space-x-3">
    <span className={`text-sm font-medium ${enabled ? 'text-gray-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
      {disabledLabel}
    </span>
    <button
      type="button"
      className={`${enabled ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
      onClick={() => onChange(!enabled)}
    >
      <span
        className={`${enabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-gray-200 shadow ring-0 transition duration-200 ease-in-out`}
      />
    </button>
    <span className={`text-sm font-medium ${enabled ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}>
      {enabledLabel}
    </span>
  </div>
);

export default ToggleSwitch;
