import React from 'react';
import SideDashboard from './SideDashboard';

const UserPageLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex min-h-screen">
      <div className="flex-1">{children}</div>
      
        <SideDashboard />
    </div>
  );
};

export default UserPageLayout;
