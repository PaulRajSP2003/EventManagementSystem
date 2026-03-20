import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPlus,
  FiList,
  FiChevronRight,
  FiLogOut
} from 'react-icons/fi';

interface MobileMenuPageProps {
  activeMenu: string;
  onClose: () => void;
  onLogout: () => void;
}

const MobileMenuPage: React.FC<MobileMenuPageProps> = ({ activeMenu, onClose, onLogout }) => {
  const navigate = useNavigate();

  if (!activeMenu) return null;

  const renderHeader = (title: string) => (
    <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight truncate">{title}</h2>
      </div>
      <button
        onClick={onLogout}
        className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors"
        title="Logout"
      >
        <FiLogOut className="w-5 h-5" />
      </button>
    </div>
  );

  const ActionButton = ({ onClick, icon: Icon, label, color = "indigo" }: any) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl hover:border-${color}-200 dark:hover:border-${color}-900 transition-all group`}
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600 dark:text-${color}-400 group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
        <span className="font-bold text-slate-700 dark:text-slate-200 text-lg">{label}</span>
      </div>
      <FiChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
    </button>
  );

  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-gray-950 z-40 overflow-y-auto scrollbar-hide pb-24 animate-in fade-in duration-300">
      {activeMenu === 'event' && (
        <div className="flex flex-col h-full">
          {renderHeader("Event Management")}
          <div className="p-6 space-y-4">
            <ActionButton
              label="Add New Event"
              icon={FiPlus}
              color="green"
              onClick={() => { navigate('/owner/event/new'); onClose(); }}
            />
            <ActionButton
              label="View All Events"
              icon={FiList}
              color="blue"
              onClick={() => { navigate('/owner/event'); onClose(); }}
            />
          </div>
        </div>
      )}

      {activeMenu === 'admin' && (
        <div className="flex flex-col h-full">
          {renderHeader("Admin Management")}
          <div className="p-6 space-y-4">
            <ActionButton
              label="Add New Admin"
              icon={FiPlus}
              color="purple"
              onClick={() => { navigate('/owner/admin/new'); onClose(); }}
            />
            <ActionButton
              label="View All Admins"
              icon={FiList}
              color="blue"
              onClick={() => { navigate('/owner/admin'); onClose(); }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileMenuPage;
