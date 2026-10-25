import React, { useState, useEffect } from 'react'
import {
  GraduationCap, Settings, CheckCircle2, XCircle, AlertTriangle, Play, RefreshCw, Layers
} from 'lucide-react'
import Breadcrumb from '../../components/layout/Breadcrumb'
import api from '../../lib/axios'

export default function PromotionPage() {
  const [config, setConfig] = useState(null)
  const [classes, setClasses] = useState([])
  const [loadingConfig, setLoadingConfig] = useState(true)

  const [finalTermName, setFinalTermName] = useState('Final Term')
  const [mappings, setMappings] = useState([])

  const [previewData, setPreviewData] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('promote') // 'promote' | 'retain' | 'unresolved'

  const [overrides, setOverrides] = useState({}) // studentId -> 'promote' | 'retain'
  const [executing, setExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState(null)

  // Load initial classes and config
  useEffect(() => {
    const init = async () => {
      try {
        const [clsRes, cfgRes] = await Promise.all([
          api.get('/classes'),
          api.get('/students/promotion/config'),
        ])
        const clsList = clsRes.data?.data || []
        setClasses(clsList)

        if (cfgRes.data?.data) {
          const cfg = cfgRes.data.data
          setConfig(cfg)
          setFinalTermName(cfg.finalExamTermName || 'Final Term')
          setMappings(cfg.mappings || [])
        }
      } catch (err) {
        console.error('Initialization error', err)
      } finally {
        setLoadingConfig(false)
      }
    }
    init()
  }, [])

  const handleSaveConfig = async () => {
    try {
      const res = await api.post('/students/promotion/config', {
        academicYearId: config?.academicYearId?._id || config?.academicYearId,
        finalExamTermName: finalTermName,
        mappings: mappings.map(m => ({
          fromClassId: m.fromClassId?._id || m.fromClassId,
          toClassId: m.toClassId?._id || m.toClassId,
        })),
      })
      if (res.data?.success) {
        setConfig(res.data.data)
        alert('Promotion mapping configuration saved!')
      }
    } catch (err) {
      alert('Failed to save configuration: ' + (err.response?.data?.error?.message || err.message))
    }
  }

  const handlePreview = async () => {
    setPreviewLoading(true)
    setExecutionResult(null)
    try {
      const res = await api.post('/students/promotion/preview', {
        configId: config?._id,
      })
      if (res.data?.success) {
        setPreviewData(res.data.data)
        setOverrides({})
      }
    } catch (err) {
      alert('Preview failed: ' + (err.response?.data?.error?.message || err.message))
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleOverrideChange = (studentId, decision) => {
    setOverrides(prev => ({
      ...prev,
      [studentId]: decision,
    }))
  }

  const handleExecute = async () => {
    if (!window.confirm('Are you sure you want to execute annual student promotions? This will update student class enrollments.')) {
      return
    }

    setExecuting(true)
    try {
      const formattedOverrides = Object.entries(overrides).map(([studentId, decision]) => ({
        studentId,
        decision,
      }))

      const res = await api.post('/students/promotion/execute', {
        configId: config?._id,
        overrides: formattedOverrides,
      })

      if (res.data?.success) {
        setExecutionResult(res.data)
        setPreviewData(null)
      }
    } catch (err) {
      alert('Execution failed: ' + (err.response?.data?.error?.message || err.message))
    } finally {
      setExecuting(false)
    }
  }

  const updateMappingTo = (index, toClassId) => {
    const updated = [...mappings]
    updated[index].toClassId = toClassId
    setMappings(updated)
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        title="Year-End Student Promotion"
        subtitle="Manage academic progression rules, verify Final Exam pass thresholds, and execute annual promotions."
      />

      {executionResult && (
        <div className="p-6 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500 text-white rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-green-900">{executionResult.message}</h3>
              <p className="text-sm text-green-700 mt-0.5">
                Students have been enrolled into their new classes successfully.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Mapping Configuration */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Promotion Rules & Class Progression Map</h3>
              <p className="text-xs text-gray-500">Configure target classes and the qualifying Final Term examination.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={finalTermName}
              onChange={(e) => setFinalTermName(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Final Term">Term: Final Term</option>
              <option value="Annual Exam">Term: Annual Exam</option>
              <option value="Term 2">Term: Term 2</option>
            </select>

            <button
              onClick={handleSaveConfig}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl transition-colors"
            >
              Save Map
            </button>
          </div>
        </div>

        {loadingConfig ? (
          <div className="text-center py-6 text-sm text-gray-400">Loading promotion rules...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {mappings.map((m, idx) => {
              const fromName = m.fromClassId?.name || classes.find(c => c._id === m.fromClassId)?.name || 'Class'
              return (
                <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between gap-3 text-sm">
                  <span className="font-bold text-gray-800">{fromName}</span>
                  <span className="text-gray-400 font-bold">➔</span>
                  <select
                    value={m.toClassId?._id || m.toClassId || ''}
                    onChange={(e) => updateMappingTo(idx, e.target.value)}
                    className="px-2.5 py-1 bg-white border border-gray-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Target Class</option>
                    {classes.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )
            })}
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            onClick={handlePreview}
            disabled={previewLoading || !config}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-100 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {previewLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Preview Annual Promotion (Dry Run)
          </button>
        </div>
      </div>

      {/* Step 2: Preview Results & Overrides */}
      {previewData && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Promotion Eligibility Preview</h3>
                <p className="text-xs text-gray-500">Review results evaluated against Exam pass marks. Modify decisions with overrides.</p>
              </div>
            </div>

            <button
              onClick={handleExecute}
              disabled={executing}
              className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-green-100 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <GraduationCap className="w-5 h-5" />
              {executing ? 'Executing Promotions...' : 'Confirm & Execute Promotions'}
            </button>
          </div>

          {/* Metric Badges */}
          <div className="px-6 grid grid-cols-3 gap-4">
            <button
              onClick={() => setActiveTab('promote')}
              className={`p-4 rounded-xl border text-left transition-all ${
                activeTab === 'promote' ? 'bg-green-50 border-green-300 ring-2 ring-green-500' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 text-green-700 font-semibold text-xs uppercase">
                <CheckCircle2 className="w-4 h-4" /> Passed & Promoted
              </div>
              <div className="text-2xl font-extrabold text-green-900 mt-1">{previewData.summary.promoteCount}</div>
            </button>

            <button
              onClick={() => setActiveTab('retain')}
              className={`p-4 rounded-xl border text-left transition-all ${
                activeTab === 'retain' ? 'bg-red-50 border-red-300 ring-2 ring-red-500' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 text-red-700 font-semibold text-xs uppercase">
                <XCircle className="w-4 h-4" /> Retained (Failed)
              </div>
              <div className="text-2xl font-extrabold text-red-900 mt-1">{previewData.summary.retainCount}</div>
            </button>

            <button
              onClick={() => setActiveTab('unresolved')}
              className={`p-4 rounded-xl border text-left transition-all ${
                activeTab === 'unresolved' ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 text-amber-700 font-semibold text-xs uppercase">
                <AlertTriangle className="w-4 h-4" /> Unresolved (Missing Grades)
              </div>
              <div className="text-2xl font-extrabold text-amber-900 mt-1">{previewData.summary.unresolvedCount}</div>
            </button>
          </div>

          {/* Students List Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
                  <th className="p-4">Roll No</th>
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Current Class</th>
                  <th className="p-4">Target Class</th>
                  <th className="p-4">Exam Evaluation</th>
                  <th className="p-4">Decision</th>
                  <th className="p-4">Override Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {(previewData[activeTab] || []).length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-400">
                      No students in the {activeTab} group.
                    </td>
                  </tr>
                ) : (
                  previewData[activeTab].map((st) => {
                    const currentDecision = overrides[st.studentId] || st.decision
                    return (
                      <tr key={st.studentId} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-mono text-xs font-bold text-gray-700">{st.rollNo}</td>
                        <td className="p-4 font-semibold text-gray-900">{st.fullName}</td>
                        <td className="p-4 text-gray-600">{st.currentClass}</td>
                        <td className="p-4 font-semibold text-indigo-600">{st.targetClass}</td>
                        <td className="p-4 text-xs text-gray-500">{st.reason}</td>
                        <td className="p-4">
                          {currentDecision === 'promote' ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                              Promote
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                              Retain
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <select
                            value={currentDecision}
                            onChange={(e) => handleOverrideChange(st.studentId, e.target.value)}
                            className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="promote">Set to Promote</option>
                            <option value="retain">Set to Retain</option>
                          </select>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
