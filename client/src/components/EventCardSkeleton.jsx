import React from 'react';

const EventCardSkeleton = () => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm animate-pulse flex flex-col h-full">
      {/* Image Skeleton */}
      <div className="h-48 bg-slate-200 w-full relative">
        <div className="absolute top-3 left-3 w-20 h-6 bg-slate-300 rounded-full"></div>
      </div>

      {/* Body Skeleton */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Date & Time */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-4 h-4 bg-slate-200 rounded"></div>
            <div className="w-28 h-4 bg-slate-200 rounded"></div>
          </div>

          {/* Title */}
          <div className="w-3/4 h-5 bg-slate-200 rounded mb-2"></div>
          <div className="w-1/2 h-5 bg-slate-200 rounded mb-4"></div>

          {/* Location */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-4 h-4 bg-slate-200 rounded"></div>
            <div className="w-36 h-3 bg-slate-200 rounded"></div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="w-20 h-5 bg-slate-200 rounded"></div>
          <div className="w-24 h-8 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
};

export default EventCardSkeleton;
