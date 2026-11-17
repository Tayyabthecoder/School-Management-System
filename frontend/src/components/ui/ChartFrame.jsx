import React from 'react'

/**
 * Gives a chart a text alternative. Recharts draws SVG that screen readers either skip or read as
 * a pile of unlabelled shapes, so the chart is exposed as one image with a short description
 * (what it shows and, when useful, its headline numbers). The drawn chart inside is hidden from assistive
 * technology: its slices and bars are unlabelled shapes (axe reports them as images without text).
 */
// h-full/w-full keep percentage-sized charts (ResponsiveContainer height="100%") filling the box they sit in.
export default function ChartFrame({ label, className = '', children }) {
  return (
    <div role="img" aria-label={label} className={`h-full w-full ${className}`}>
      <div aria-hidden="true" className="h-full w-full">{children}</div>
    </div>
  )
}
