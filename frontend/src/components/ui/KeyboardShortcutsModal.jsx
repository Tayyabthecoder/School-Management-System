import React from 'react'
import {
  Keyboard,
  Compass,
  Command,
  FileSpreadsheet,
} from 'lucide-react'
import Modal from './Modal'
import { useUIStore } from '../../store/uiStore'

const SHORTCUT_GROUPS = [
  {
    category: 'Global System Actions',
    icon: Command,
    shortcuts: [
      { keys: ['Ctrl', 'K'], desc: 'Open Command Palette & Global Search' },
      { keys: ['?'], desc: 'Open this Keyboard Shortcuts Reference' },
      { keys: ['Esc'], desc: 'Close any active modal, popover, or dropdown' },
      { keys: ['Alt', 'P'], desc: 'Print current view or active report voucher' },
    ],
  },
  {
    category: 'Quick Navigation Sequences',
    icon: Compass,
    shortcuts: [
      { keys: ['G', 'D'], desc: 'Navigate to Super Admin Dashboard' },
      { keys: ['G', 'S'], desc: 'Navigate to Student Directory' },
      { keys: ['G', 'A'], desc: 'Navigate to Daily Attendance Ledger' },
      { keys: ['G', 'F'], desc: 'Navigate to Finance & Fee Collection' },
      { keys: ['G', 'G'], desc: 'Navigate to Gradebook & Examination' },
      { keys: ['G', 'P'], desc: 'Navigate to System & School Settings' },
    ],
  },
  {
    category: 'Forms, Tables & Dialogs',
    icon: FileSpreadsheet,
    shortcuts: [
      { keys: ['Tab'], desc: 'Move focus to the next input or action button' },
      { keys: ['Shift', 'Tab'], desc: 'Move focus to the previous input' },
      { keys: ['Enter'], desc: 'Submit current form or execute selected action' },
      { keys: ['Space'], desc: 'Toggle checkbox or activate selected button' },
    ],
  },
]

export default function KeyboardShortcutsModal() {
  const { isShortcutsModalOpen, closeShortcutsModal } = useUIStore()

  return (
    <Modal
      open={isShortcutsModalOpen}
      onClose={closeShortcutsModal}
      title="Keyboard Shortcuts"
      subtitle="Power-user shortcuts to accelerate your daily SMS workflows"
      size="lg"
    >
      <div className="space-y-6">
        {SHORTCUT_GROUPS.map((group, gIdx) => {
          const Icon = group.icon
          return (
            <div key={gIdx} className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                <Icon className="w-4 h-4" />
                <span>{group.category}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
                {group.shortcuts.map((sc, sIdx) => (
                  <div
                    key={sIdx}
                    className="flex items-center justify-between p-3 px-4 hover:bg-slate-100/50 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {sc.desc}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {sc.keys.map((key, kIdx) => (
                        <React.Fragment key={kIdx}>
                          <kbd className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200 shadow-2xs min-w-[24px] text-center">
                            {key}
                          </kbd>
                          {kIdx < sc.keys.length - 1 && (
                            <span className="text-[10px] text-slate-400 font-bold">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between text-xs text-indigo-700 dark:text-indigo-300">
          <span>💡 Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 rounded border border-indigo-200 dark:border-indigo-800 font-mono font-bold text-[10px]">?</kbd> anywhere in the app to toggle this modal.</span>
          <button
            onClick={closeShortcutsModal}
            className="text-indigo-800 dark:text-indigo-200 font-bold hover:underline"
          >
            Got it
          </button>
        </div>
      </div>
    </Modal>
  )
}
