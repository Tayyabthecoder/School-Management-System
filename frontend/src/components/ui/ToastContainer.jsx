import React, { useEffect, useState } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { useToastStore } from '../../store/toastStore'

const ICONS = {
  success: <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />,
  error: <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />,
  warning: <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />,
  info: <Info className="w-5 h-5 text-indigo-500 flex-shrink-0" />,
}

const BG = {
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  warning: 'bg-amber-50 border-amber-200',
  info: 'bg-indigo-50 border-indigo-200',
}

const TEXT = {
  success: 'text-green-800',
  error: 'text-red-800',
  warning: 'text-amber-800',
  info: 'text-indigo-800',
}

function ToastItem({ toast }) {
  const { removeToast } = useToastStore()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Trigger enter animation
    const enterTimer = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(enterTimer)
  }, [])

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg max-w-sm w-full transition-all duration-300 ${
        BG[toast.type]
      } ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
    >
      {ICONS[toast.type]}
      <p className={`text-sm font-medium flex-1 leading-snug ${TEXT[toast.type]}`}>{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="ml-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export default function ToastContainer() {
  const { toasts } = useToastStore()

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} />
        </div>
      ))}
    </div>
  )
}
