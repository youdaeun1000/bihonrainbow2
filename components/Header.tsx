
import React from 'react';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, showBack, onBack }) => {
  return (
    <header className="h-20 flex items-center justify-between px-6 bg-white sticky top-0 z-20 border-b border-slate-100">
      <div className="flex items-center gap-4">
        {showBack && (
          <button onClick={onBack} className="text-slate-700 p-2 -ml-2 hover:bg-slate-50 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
        )}
        <h1 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h1>
      </div>
    </header>
  );
};

export default Header;
