import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  Layers,
  Filter,
  Eye,
  Download,
  CheckSquare,
  Square,
  FileSpreadsheet,
  FileText,
} from 'lucide-react'
import api from '../../../lib/axios'
import { useToast } from '../../../store/toastStore'
import { downloadBlobResponse } from './downloadHelper'
import { useAuthStore } from '../../../store/authStore'
import { canExportEntity } from '../exportAccess'
import { logError } from '../../../lib/logger'

const REPORT_ENTITIES = [
  {
    id: 'students',
    label: 'Students Directory',
    description: 'Demographics, admission details, classes, and guardian records',
    fields: [
      { id: 'studentId', label: 'Student ID' },
      { id: 'fullName', label: 'Full Name' },
      { id: 'gender', label: 'Gender' },
      { id: 'className', label: 'Class / Grade' },
      { id: 'sectionId', label: 'Section' },
      { id: 'guardianName', label: 'Guardian Name' },
      { id: 'guardianPhone', label: 'Guardian Phone' },
      { id: 'cnic', label: 'B-Form / CNIC' },
      { id: 'bloodGroup', label: 'Blood Group' },
      { id: 'joiningDate', label: 'Admission Date' },
      { id: 'status', label: 'Enrollment Status' },
    ],
  },
  {
    id: 'staff',
    label: 'Staff & Faculty Directory',
    description: 'Employment details, designations, departments, and payroll base',
    fields: [
      { id: 'staffId', label: 'Staff ID' },
      { id: 'fullName', label: 'Full Name' },
      { id: 'designation', label: 'Designation' },
      { id: 'department', label: 'Department' },
      { id: 'phone', label: 'Phone Number' },
      { id: 'email', label: 'Email' },
      { id: 'cnic', label: 'CNIC' },
      { id: 'joiningDate', label: 'Joining Date' },
      { id: 'salary', label: 'Base Salary (PKR)' },
      { id: 'status', label: 'Active Status' },
    ],
  },
  {
    id: 'fees',
    label: 'Fee Ledger & Balances',
    description: 'Student fee charges, payments, outstanding dues, and deadlines',
    fields: [
      { id: 'studentId', label: 'Student ID' },
      { id: 'fullName', label: 'Student Name' },
      { id: 'className', label: 'Class' },
      { id: 'sectionId', label: 'Section' },
      { id: 'amountDue', label: 'Amount Due' },
      { id: 'amountPaid', label: 'Amount Paid' },
      { id: 'outstandingAmount', label: 'Outstanding Balance' },
      { id: 'status', label: 'Fee Status' },
      { id: 'dueDate', label: 'Due Date' },
    ],
  },
  {
    id: 'attendance',
    label: 'Student Daily Attendance',
    description: 'Daily attendance roster records with present/absent/late status',
    fields: [
      { id: 'date', label: 'Date' },
      { id: 'className', label: 'Class' },
      { id: 'sectionId', label: 'Section' },
      { id: 'studentId', label: 'Student ID' },
      { id: 'fullName', label: 'Student Name' },
      { id: 'status', label: 'Attendance Status' },
    ],
  },
  {
    id: 'grades',
    label: 'Academic Grades & Examination',
    description: 'Exam marks, subjects, percentages, and letter grades',
    fields: [
      { id: 'studentId', label: 'Student ID' },
      { id: 'fullName', label: 'Student Name' },
      { id: 'className', label: 'Class' },
      { id: 'termName', label: 'Academic Term' },
      { id: 'subjectName', label: 'Subject' },
      { id: 'maxMarks', label: 'Max Marks' },
      { id: 'marksObtained', label: 'Marks Obtained' },
      { id: 'percentage', label: 'Percentage' },
      { id: 'gradeLetter', label: 'Letter Grade' },
    ],
  },
]

export default function CustomReportBuilderTab({ classesList = [] }) {
  const toast = useToast()
  const user = useAuthStore((s) => s.user)
  const allowedEntities = REPORT_ENTITIES.filter((e) => canExportEntity(user, e.id))
  const firstEntity = allowedEntities[0] || REPORT_ENTITIES[0]
  const [customEntity, setCustomEntity] = useState(firstEntity.id)
  const [selectedFields, setSelectedFields] = useState(firstEntity.fields.map(f => f.id))
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [customClassId, setCustomClassId] = useState('ALL')
  const [customSectionId, setCustomSectionId] = useState('ALL')
  const [customSortBy, setCustomSortBy] = useState('default')
  const [customSortOrder, setCustomSortOrder] = useState(1)
  const [customStatus, setCustomStatus] = useState('ALL')
  const [previewData, setPreviewData] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [customExportLoading, setCustomExportLoading] = useState(null)

  const activeEntityConfig = REPORT_ENTITIES.find(e => e.id === customEntity) || REPORT_ENTITIES[0]

  const handleEntityChange = (newEntityId) => {
    setCustomEntity(newEntityId)
    const entityCfg = REPORT_ENTITIES.find(e => e.id === newEntityId)
    if (entityCfg) {
      setSelectedFields(entityCfg.fields.map(f => f.id))
    }
    setPreviewData(null)
    setCustomSortBy('default')
  }

  const toggleField = (fieldId) => {
    setSelectedFields(prev =>
      prev.includes(fieldId) ? prev.filter(f => f !== fieldId) : [...prev, fieldId]
    )
  }

  const selectAllFields = () => {
    const entityCfg = REPORT_ENTITIES.find(e => e.id === customEntity)
    if (entityCfg) setSelectedFields(entityCfg.fields.map(f => f.id))
  }

  const clearAllFields = () => {
    setSelectedFields([])
  }

  const handlePreviewCustomReport = async () => {
    if (selectedFields.length === 0) {
      toast.error('Please select at least one field to include')
      return
    }
    setPreviewLoading(true)
    try {
      const payload = {
        entity: customEntity,
        fields: selectedFields,
        filters: {
          classId: customClassId !== 'ALL' ? customClassId : undefined,
          sectionId: customSectionId !== 'ALL' ? customSectionId : undefined,
          status: customStatus !== 'ALL' ? customStatus : undefined,
          dateRange: (customFrom || customTo) ? { from: customFrom || undefined, to: customTo || undefined } : undefined,
        },
        sortBy: customSortBy !== 'default' ? customSortBy : undefined,
        sortOrder: customSortOrder,
      }
      const res = await api.post('/reports/custom/preview', payload)
      if (res.data?.success) {
        setPreviewData(res.data.data)
        toast.success(`Preview generated: ${res.data.data?.total || 0} records found`)
      }
    } catch (err) {
      logError('Preview failed:', err)
      toast.error(err.response?.data?.error?.message || 'Failed to generate custom report preview')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleExportCustomReport = async (format) => {
    if (selectedFields.length === 0) {
      toast.error('Please select at least one field to export')
      return
    }
    setCustomExportLoading(format)
    try {
      const payload = {
        entity: customEntity,
        fields: selectedFields,
        filters: {
          classId: customClassId !== 'ALL' ? customClassId : undefined,
          sectionId: customSectionId !== 'ALL' ? customSectionId : undefined,
          status: customStatus !== 'ALL' ? customStatus : undefined,
          dateRange: (customFrom || customTo) ? { from: customFrom || undefined, to: customTo || undefined } : undefined,
        },
        sortBy: customSortBy !== 'default' ? customSortBy : undefined,
        sortOrder: customSortOrder,
        format,
      }
      const response = await api.post('/reports/custom/export', payload, { responseType: 'blob' })
      const ext = format === 'pdf' ? 'pdf' : 'xlsx'
      await downloadBlobResponse(response, `${customEntity}_custom_report_${Date.now()}.${ext}`)
      toast.success(`Custom ${format.toUpperCase()} export downloaded successfully`)
    } catch (err) {
      logError('Export failed:', err)
      let msg = `Failed to generate ${format.toUpperCase()} export`
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text()
          const parsed = JSON.parse(text)
          if (parsed?.error?.message) msg = parsed.error.message
        } catch (_) {
      // ignore error
    }
      } else if (err.response?.data?.error?.message) {
        msg = err.response.data.error.message
      }
      toast.error(msg)
    } finally {
      setCustomExportLoading(null)
    }
  }

  return (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  Dynamic Custom Report Builder (SRS FR-RP-03)
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Select a primary data entity, pick your required fields, apply filters, and export customized Excel or PDF reports.
                </p>
              </div>
            </div>

            {/* Step 1: Entity Selector */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                1. Select Primary Data Entity
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {allowedEntities.map((ent) => {
                  const isSelected = customEntity === ent.id
                  return (
                    <button
                      key={ent.id}
                      onClick={() => handleEntityChange(ent.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-200'
                          : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100/70'
                      }`}
                    >
                      <p className={`text-xs font-bold ${isSelected ? 'text-indigo-900' : 'text-gray-800'}`}>
                        {ent.label}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">{ent.description}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step 2: Field Selection Checkboxes */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  2. Choose Columns to Include ({selectedFields.length} of {activeEntityConfig.fields.length} selected)
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllFields}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={clearAllFields}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-700"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 p-4 bg-gray-50/60 rounded-xl border border-gray-200">
                {activeEntityConfig.fields.map((f) => {
                  const isChecked = selectedFields.includes(f.id)
                  return (
                    <label
                      key={f.id}
                      onClick={() => toggleField(f.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-white border-indigo-400 text-indigo-900 shadow-sm'
                          : 'bg-transparent border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400 shrink-0" />
                      )}
                      <span className="truncate">{f.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Step 3: Filter Controls */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                3. Apply Filter Criteria (Optional)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 p-4 bg-gray-50/60 rounded-xl border border-gray-200">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Grade / Class</label>
                  <select
                    value={customClassId}
                    onChange={(e) => {
                      setCustomClassId(e.target.value)
                      setCustomSectionId('ALL')
                    }}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">All Classes</option>
                    {classesList.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Section</label>
                  <select
                    value={customSectionId}
                    onChange={(e) => setCustomSectionId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">All Sections</option>
                    {(() => {
                      const selClass = classesList.find(c => c._id === customClassId)
                      return (selClass?.sections || []).map(s => (
                        <option key={s} value={s}>Section {s}</option>
                      ))
                    })()}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Status Filter</label>
                  <select
                    value={customStatus}
                    onChange={(e) => setCustomStatus(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Transferred">Transferred</option>
                    <option value="Withdrawn">Withdrawn</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Sort By</label>
                  <select
                    value={customSortBy}
                    onChange={(e) => setCustomSortBy(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="default">Default Order</option>
                    {activeEntityConfig.fields.map(f => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Sort Direction</label>
                  <select
                    value={customSortOrder}
                    onChange={(e) => setCustomSortOrder(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={1}>Ascending (A–Z / 0–9)</option>
                    <option value={-1}>Descending (Z–A / 9–0)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Date Range: From</label>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Date Range: To</label>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={handlePreviewCustomReport}
                disabled={previewLoading}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-60"
              >
                <Eye className="w-4 h-4" />
                {previewLoading ? 'Loading Preview...' : 'Preview Report (First 50)'}
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => handleExportCustomReport('excel')}
                  disabled={customExportLoading !== null}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors disabled:opacity-60"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  {customExportLoading === 'excel' ? 'Exporting...' : 'Export Excel (.xlsx)'}
                </button>

                <button
                  onClick={() => handleExportCustomReport('pdf')}
                  disabled={customExportLoading !== null}
                  className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors disabled:opacity-60"
                >
                  <FileText className="w-4 h-4" />
                  {customExportLoading === 'pdf' ? 'Exporting...' : 'Export PDF Report (.pdf)'}
                </button>
              </div>
            </div>
          </div>

          {/* Table Preview Panel */}
          {previewData && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-900">Interactive Preview</h3>
                  <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-semibold border border-indigo-100">
                    {previewData.count} Total Records Matched
                  </span>
                </div>
                <span className="text-xs text-gray-400">Showing first {previewData.rows.length} rows</span>
              </div>

              {previewData.rows.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400">
                  No records match your selected criteria.
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                      <tr>
                        {previewData.columns.map((col) => (
                          <th key={col.key} className="px-4 py-2.5 whitespace-nowrap">
                            {col.header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {previewData.rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/70 transition-colors">
                          {previewData.columns.map((col) => (
                            <td key={col.key} className="px-4 py-2 text-gray-800 whitespace-nowrap">
                              {String(row[col.key] !== undefined && row[col.key] !== null ? row[col.key] : '-')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
  )
}
