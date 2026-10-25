import React from 'react'

export default function PageLoader() {
  return (
    <div className="space-y-6 animate-pulse p-2">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-slate-200 rounded-lg"></div>
          <div className="h-4 w-72 bg-slate-100 rounded"></div>
        </div>
        <div className="h-9 w-28 bg-slate-200 rounded-lg"></div>
      </div>

      {/* Metric Cards Skeleton Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 w-20 bg-slate-200 rounded"></div>
              <div className="h-8 w-8 bg-slate-100 rounded-xl"></div>
            </div>
            <div className="h-6 w-16 bg-slate-200 rounded"></div>
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="h-80 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="h-5 w-40 bg-slate-200 rounded"></div>
        <div className="h-full max-h-56 bg-slate-50 rounded-xl"></div>
      </div>
    </div>
  )
}
