import React from 'react'

/**
 * Gives a chart a text alternative. Recharts draws SVG that screen readers either skip or read as
 * a pile of unlabelled shapes, so the chart is exposed as one image with a short description
 * (what it shows and, when useful, its headline numbers).
 */
export default function ChartFrame({ label, className, children }) {
  return (
    <div role="img" aria-label={label} className={className}>
      {children}
    </div>
  )
}
