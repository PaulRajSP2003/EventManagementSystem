import React from 'react';
import { useNavigate } from 'react-router-dom';

interface EmptyStateProps {
  title?: string;
  message?: string;
  description?: string;
  error?: string;
  icon?: 'search' | 'inbox' | 'user' | 'calendar' | 'alert';
  action?: {
    label: string;
    onClick: () => void;
  };
  buttonText?: string;
  navigatePath?: string;
  onClick?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  description,
  error,
  icon = 'inbox',
  action,
  buttonText,
  navigatePath,
  onClick,
}) => {
  const navigate = useNavigate();
  // Use first available title-like prop
  const displayTitle = title || message || error || 'No data';
  const displayDescription = description || message;

  // Create action from button props if provided
  const displayAction = action || (buttonText && (navigatePath || onClick) ? {
    label: buttonText,
    onClick: onClick || (() => { if (navigatePath) navigate(navigatePath); })
  } : undefined);
  const iconComponents: Record<string, React.ReactNode> = {
    search: (
      <svg
        className="h-12 w-12 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    ),
    inbox: (
      <svg
        className="h-12 w-12 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        />
      </svg>
    ),
    user: (
      <svg
        className="h-12 w-12 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4.354a4 4 0 110 8.048 4 4 0 010-8.048M3 20.333A8 8 0 0112 4c4.97 0 9.185 3.364 9.938 7.8"
        />
      </svg>
    ),
    calendar: (
      <svg
        className="h-12 w-12 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
    alert: (
      <svg
        className="h-12 w-12 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="mb-4">{iconComponents[icon]}</div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
        {displayTitle}
      </h3>
      {displayDescription && (
        <p className="text-gray-600 dark:text-gray-400 text-center mb-6 max-w-md">
          {displayDescription}
        </p>
      )}
      {displayAction && (
        <button
          onClick={displayAction.onClick}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {displayAction.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
