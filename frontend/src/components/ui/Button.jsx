import React, { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

const VARIANTS = {
  primary:
    'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs hover:shadow-soft focus-visible:ring-indigo-500 border border-transparent',
  secondary:
    'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 focus-visible:ring-slate-400 border border-transparent',
  outline:
    'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus-visible:ring-slate-400 shadow-2xs',
  ghost:
    'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-transparent focus-visible:ring-slate-400',
  danger:
    'bg-rose-600 hover:bg-rose-700 text-white shadow-xs focus-visible:ring-rose-500 border border-transparent',
  'danger-outline':
    'bg-transparent hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 focus-visible:ring-rose-400',
  success:
    'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs focus-visible:ring-emerald-500 border border-transparent',
}

const SIZES = {
  xs: 'h-7 px-2.5 text-xs rounded-lg gap-1.5',
  sm: 'h-8.5 px-3 text-xs rounded-xl gap-2 font-medium',
  md: 'h-10 px-4 text-sm rounded-xl gap-2 font-medium',
  lg: 'h-11 px-5 text-base rounded-xl gap-2.5 font-semibold',
  icon: 'h-9 w-9 p-0 rounded-xl justify-center',
  'icon-sm': 'h-8 w-8 p-0 rounded-lg justify-center',
}

export const Button = forwardRef(function Button(
  {
    children,
    type = 'button',
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon: Icon,
    iconRight: IconRight,
    className = '',
    ...props
  },
  ref
) {
  const variantClass = VARIANTS[variant] || VARIANTS.primary
  const sizeClass = SIZES[size] || SIZES.md
  const isDisabled = disabled || loading

  const renderIcon = (iconItem) => {
    if (!iconItem) return null
    if (React.isValidElement(iconItem)) return iconItem
    const IconComponent = iconItem
    return <IconComponent className="w-4 h-4 shrink-0" />
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 select-none outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
        isDisabled
          ? 'opacity-50 cursor-not-allowed pointer-events-none'
          : 'cursor-pointer active:scale-[0.98]'
      } ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
      ) : (
        renderIcon(Icon)
      )}

      {children && <span>{children}</span>}

      {!loading && renderIcon(IconRight)}
    </button>
  )
})

export default Button
