import React, { useState, useEffect } from 'react';

interface MobileLayoutWrapperProps {
  children: React.ReactNode;
  desktopLayout: React.ReactNode;
}

const MobileLayoutWrapper: React.FC<MobileLayoutWrapperProps> = ({ children, desktopLayout }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-slate-800 dark:text-slate-100 font-sans">
      <div className="flex-1 pb-20 overflow-x-hidden overflow-y-auto scrollbar-hide">
          {children}
        </div>
      </div>
    );
  }

  return <>{desktopLayout}</>;
};

export default MobileLayoutWrapper;
