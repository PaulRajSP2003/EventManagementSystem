import React from 'react';

interface BridgeProps {
  noBlur?: boolean;
}

const Bridge: React.FC<BridgeProps> = ({ noBlur = false }) => {
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center transition-colors duration-300 z-50 overflow-hidden ${noBlur ? 'bg-white dark:bg-gray-900' : 'bg-white/70 dark:bg-gray-900/70 backdrop-blur-md'}`}>
      <style>
        {`
          @keyframes status-progress {
            0% { transform: translateX(-100%); width: 30%; }
            50% { transform: translateX(50%); width: 40%; }
            100% { transform: translateX(100%); width: 30%; }
          }
          .animate-status-progress {
            animation: status-progress 2s infinite cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          /* Hide scrollbar for Chrome, Safari and Opera */
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          
          /* Hide scrollbar for IE, Edge and Firefox */
          .hide-scrollbar {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
          }
          
          /* Ensure body also has no scrollbars */
          body {
            overflow: hidden;
            margin: 0;
            padding: 0;
          }
        `}
      </style>
      <div className="flex flex-col items-center">
        {/* Logo Container */}
        <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl transition-transform hover:scale-105 duration-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 md:h-12 md:w-12 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>

        {/* Brand Name */}
        <h1 className="text-3xl font-black mb-10 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-700 dark:from-indigo-400 dark:to-purple-400">
          EMS Workspace
        </h1>

        {/* Loading Bar Container */}
        <div className="w-64 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden relative shadow-inner">
          <div className="absolute top-0 bottom-0 left-0 bg-indigo-600 dark:bg-indigo-500 rounded-full animate-status-progress shadow-[0_0_8px_rgba(79,70,229,0.5)]"></div>
        </div>

        {/* Loading Text */}
        <p className="mt-8 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-400 dark:text-gray-500">
          Syncing Workspace
        </p>
      </div>
    </div>
  );
};

export default Bridge;