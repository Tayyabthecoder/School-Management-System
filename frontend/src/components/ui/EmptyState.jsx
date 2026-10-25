import React from 'react'
import { Inbox } from 'lucide-react'

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There is currently no data to display in this view.',
  action,
  className = '',
}) {
  return (
    <div className={`text-center py-12 px-4 flex flex-col items-center justify-center ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4 shadow-xs">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight mb-1">
        {title}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-5 leading-relaxed">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow-soft transition-all"
        >
          {action.icon && <action.icon className="w-4 h-4" />}
          <span>{action.label}</span>
        </button>
      )}
    </div>
  )
}
