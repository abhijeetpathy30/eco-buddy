
import React from 'react';

const LeafIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
        <path d="M11 20A7 7 0 0 1 4 13V8a2 2 0 0 1 2-2h4l2 4l2-4h4a2 2 0 0 1 2 2v5a7 7 0 0 1-7 7Z"></path>
        <path d="M11 20v-8"></path>
    </svg>
);


export const Header: React.FC = () => {
  return (
    <header className="p-4 border-b border-gray-700/50 flex items-center justify-center space-x-3 shadow-md">
      <LeafIcon />
      <h1 className="text-3xl font-bold text-gray-100 tracking-wide">
        Eco-Buddy
      </h1>
    </header>
  );
};
