import React, { useId } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

function Sparkline({ data, color = 'indigo' }) {
  const gradId = useId()
  if (!data || data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max === min ? 1 : max - min
  const width = 84
  const height = 30
  const pad = 3

  const strokeMap = {
    indigo: '#6366F1',
    teal: '#14B8A6',
    green: '#10B981',
    amber: '#F59E0B',
    rose: '#F43F5E',
  }
  const strokeColor = strokeMap[color] || strokeMap.indigo

  const points = data.map((val, idx) => {
    const x = pad + (idx / (data.length - 1)) * (width - 2 * pad)
    const y = height - pad - ((val - min) / range) * (height - 2 * pad)
    return { x, y }
  })

  const pathD = points.reduce((acc, pt, i) => (i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`), '')
  const areaD = `${pathD} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`
  const lastPt = points[points.length - 1]

  return (
    <svg width={width} height={height} className="overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradId})`} />
      <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastPt.x} cy={lastPt.y} r="2.5" fill={strokeColor} />
    </svg>
  )
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  isPositive = true,
  color = 'indigo',
  sparklineData = null,
}) {
  const colorMap = {
    indigo: 'bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50',
    teal: 'bg-teal-50/80 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-900/50',
    green: 'bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50',
    amber: 'bg-amber-50/80 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50',
    rose: 'bg-rose-50/80 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50',
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-soft hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight tabular-nums">
            {value}
          </h3>
        </div>
        {Icon && (
          <div className={`p-3.5 rounded-2xl border shadow-xs ${colorMap[color] || colorMap.indigo}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        {trend ? (
          <span
            className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
              isPositive
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/40'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/40'
            }`}
          >
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend}
          </span>
        ) : <div />}

        {sparklineData && (
          <div className="flex items-center">
            <Sparkline data={sparklineData} color={color} />
          </div>
        )}
      </div>
    </div>
  )
}
