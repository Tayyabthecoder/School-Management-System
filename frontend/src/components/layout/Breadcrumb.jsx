import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

export default function Breadcrumb({ title, subtitle }) {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter((x) => x)

  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
      </div>
      <nav className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <Link to="/dashboard" className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center">
          <Home className="w-3.5 h-3.5" />
        </Link>
        {pathnames.map((name, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`
          const isLast = index === pathnames.length - 1
          return (
            <React.Fragment key={name}>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
              {isLast ? (
                <span className="font-semibold text-indigo-600 dark:text-indigo-400 capitalize">{name.replace('-', ' ')}</span>
              ) : (
                <Link to={routeTo} className="hover:text-indigo-600 dark:hover:text-indigo-400 capitalize">
                  {name.replace('-', ' ')}
                </Link>
              )}
            </React.Fragment>
          )
        })}
      </nav>
    </div>
  )
}
