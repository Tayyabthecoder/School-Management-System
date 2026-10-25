import React from 'react'

/**
 * Skeleton shimmer for card grids
 */
export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-200 p-5 animate-pulse ${className}`}>
      <div className="h-3 bg-gray-200 rounded-full w-1/3 mb-3" />
      <div className="h-8 bg-gray-200 rounded-lg w-2/3 mb-4" />
      <div className="h-2 bg-gray-100 rounded-full w-1/2" />
    </div>
  )
}

/**
 * Skeleton shimmer for table rows
 */
export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 flex gap-6">
        {[40, 25, 20, 15].map((w, i) => (
          <div key={i} className={`h-3 bg-gray-200 rounded-full w-${w}`} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-6 py-4 border-t border-gray-100 flex gap-6 items-center">
          <div className="h-8 w-8 bg-gray-200 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-200 rounded-full w-3/4" />
            <div className="h-2 bg-gray-100 rounded-full w-1/2" />
          </div>
          <div className="h-6 bg-gray-200 rounded-full w-16" />
          <div className="h-6 bg-gray-200 rounded-full w-20" />
        </div>
      ))}
    </div>
  )
}

/**
 * Full page skeleton (12 grade cards)
 */
export function SkeletonGradeCards() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="h-28 bg-gray-200 rounded-2xl animate-pulse"
          style={{ animationDelay: `${i * 50}ms` }}
        />
      ))}
    </div>
  )
}

export default SkeletonCard
