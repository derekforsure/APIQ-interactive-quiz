import React from 'react';

export function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-10 bg-gray-200 rounded w-full"></div>
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded w-full"></div>
        ))}
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="animate-pulse flex items-center gap-4">
      <div className="h-5 bg-gray-200 rounded w-32"></div>
      <div className="h-5 bg-gray-200 rounded w-32"></div>
    </div>
  );
}
