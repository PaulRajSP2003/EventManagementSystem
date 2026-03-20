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
    <div className={`bg-white sticky top-0 z-30 px-4 py-3 border-b border-gray-100 min-h-[64px] hidden sm:flex items-center ${className}`}>
      <div className="max-w-6xl mx-auto w-full flex justify-between items-center bg-white">
        {/* LEFT */}
        <div className="flex items-center gap-4 sm:gap-6">
          {showBack && (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium whitespace-nowrap group"
            >
              <FiArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
              <span className="hidden xs:inline">Back</span>
            </button>
          )}

          {showBack && (
            <div className="h-4 w-[1px] bg-gray-300 hidden sm:block"></div>
          )}

          <h1 className="text-lg font-bold text-slate-800 line-clamp-1">
            {title}
          </h1>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2 sm:gap-3 ml-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default StickyHeader;