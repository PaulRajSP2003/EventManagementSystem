import React from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

interface StickyHeaderProps {
  title: string;
  onBack?: () => void;
  children?: React.ReactNode;
  className?: string;
  showBack?: boolean;
}

const StickyHeader: React.FC<StickyHeaderProps> = ({
  title,
  onBack,
  children,
  className = "",
  showBack = true
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={`bg-transparent backdrop-blur-md sticky top-0 z-10 px-4 py-3 border-b border-white/20 hidden sm:block ${className}`}>
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-6">
          {showBack && (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium group"
            >
              <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
              Back
            </button>
          )}

          {showBack && (
            <div className="h-4 w-[1px] bg-slate-300/50 hidden sm:block" />
          )}

          <h1 className="text-lg font-bold text-slate-800 hidden sm:block">
            {title}
          </h1>
        </div>

        {children}
      </div>
    </div>
  );
};

export default StickyHeader;
