import React from 'react';
import { Ticket } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-indigo-400" />
            <span className="font-semibold text-white tracking-wide">EventPass TBS</span>
            <span className="text-xs text-slate-400">— Ticket Booking & Validation System</span>
          </div>
          <div className="text-sm text-slate-400">
            Phase 0 Skeleton Initialized • Monorepo Ready
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
