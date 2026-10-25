import React, { useState } from 'react'
import {
  GraduationCap,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import Button from '../../../components/ui/Button'
import { useToastStore } from '../../../store/toastStore'

const DEFAULT_SCALE = [
  { label: 'A+', minPercent: 90, maxPercent: 100 },
  { label: 'A', minPercent: 80, maxPercent: 89 },
  { label: 'B', minPercent: 70, maxPercent: 79 },
  { label: 'C', minPercent: 60, maxPercent: 69 },
  { label: 'D', minPercent: 50, maxPercent: 59 },
  { label: 'F', minPercent: 0, maxPercent: 49 },
]

export default function GradingScaleTab({
  gradingScale,
  setGradingScale,
  onSaveGradingScale,
  savingGradingScale,
}) {
  const toast = useToastStore()
  const [newGrade, setNewGrade] = useState({ label: '', minPercent: 0, maxPercent: 100 })

  const scale = Array.isArray(gradingScale) && gradingScale.length > 0 ? gradingScale : DEFAULT_SCALE

  const handleUpdateItem = (index, field, value) => {
    const updated = [...scale]
    updated[index] = {
      ...updated[index],
      [field]: field === 'label' ? value : Number(value),
    }
    setGradingScale(updated)
  }

  const handleDeleteItem = (index) => {
    if (scale.length <= 1) {
      toast.warning('At least one grade bracket must remain.')
      return
    }
    const updated = scale.filter((_, idx) => idx !== index)
    setGradingScale(updated)
  }

  const handleAddGrade = (e) => {
    e.preventDefault()
    if (!newGrade.label.trim()) {
      toast.error('Grade label is required (e.g. A*, Distinction)')
      return
    }
    if (newGrade.minPercent > newGrade.maxPercent) {
      toast.error('Min % cannot be greater than Max %')
      return
    }
    const updated = [
      ...scale,
      {
        label: newGrade.label.trim().toUpperCase(),
        minPercent: Number(newGrade.minPercent),
        maxPercent: Number(newGrade.maxPercent),
      },
    ].sort((a, b) => b.minPercent - a.minPercent)
    setGradingScale(updated)
    setNewGrade({ label: '', minPercent: 0, maxPercent: 100 })
    toast.success(`Grade bracket "${newGrade.label}" added!`)
  }

  const handleResetDefaults = () => {
    if (window.confirm('Reset grading scale to system defaults (A+ to F)?')) {
      setGradingScale(DEFAULT_SCALE)
      toast.info('Grading scale reset to standard defaults.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Academic Grading Scale & Letter Boundaries
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Configure minimum and maximum percentages for letter grades. Automatically utilized by report card generation and grade sheets.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={handleResetDefaults}
            >
              Reset Defaults
            </Button>
            <Button
              type="button"
              variant="primary"
              icon={<Save className="w-4 h-4" />}
              loading={savingGradingScale}
              onClick={onSaveGradingScale}
            >
              Save Grading Scale
            </Button>
          </div>
        </div>
      </div>

      {/* Grade Scale Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
          Configured Letter Grade Brackets
        </h3>

        <div className="border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden mb-6">
          <div className="grid grid-cols-12 px-4 py-3 bg-gray-50 dark:bg-slate-800/50 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
            <div className="col-span-3">Letter Grade</div>
            <div className="col-span-3">Min Score (%)</div>
            <div className="col-span-3">Max Score (%)</div>
            <div className="col-span-2 text-center">Score Range Preview</div>
            <div className="col-span-1 text-right">Action</div>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {scale.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-12 px-4 py-3 items-center hover:bg-gray-50 dark:hover:bg-slate-800/30 text-xs"
              >
                <div className="col-span-3 pr-4">
                  <input
                    type="text"
                    required
                    value={item.label}
                    onChange={(e) => handleUpdateItem(index, 'label', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="col-span-3 pr-4">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={item.minPercent}
                    onChange={(e) => handleUpdateItem(index, 'minPercent', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="col-span-3 pr-4">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={item.maxPercent}
                    onChange={(e) => handleUpdateItem(index, 'maxPercent', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="col-span-2 text-center">
                  <span className="inline-block px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold rounded-lg text-xs">
                    {item.minPercent}% – {item.maxPercent}%
                  </span>
                </div>
                <div className="col-span-1 text-right">
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(index)}
                    className="text-gray-400 hover:text-rose-600 p-1 transition-colors"
                    title="Remove grade bracket"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add New Grade Form */}
        <form onSubmit={handleAddGrade} className="p-4 bg-gray-50 dark:bg-slate-800/40 rounded-xl border border-gray-200 dark:border-slate-800">
          <h4 className="text-xs font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Add New Grade Bracket
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 dark:text-slate-400 mb-1">Grade Label *</label>
              <input
                required
                type="text"
                placeholder="e.g. A*, Distinction"
                value={newGrade.label}
                onChange={(e) => setNewGrade({ ...newGrade, label: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 dark:text-slate-400 mb-1">Min Score (%) *</label>
              <input
                required
                type="number"
                min={0}
                max={100}
                value={newGrade.minPercent}
                onChange={(e) => setNewGrade({ ...newGrade, minPercent: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 dark:text-slate-400 mb-1">Max Score (%) *</label>
              <input
                required
                type="number"
                min={0}
                max={100}
                value={newGrade.maxPercent}
                onChange={(e) => setNewGrade({ ...newGrade, maxPercent: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg text-xs"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                className="w-full"
              >
                Add Grade
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
