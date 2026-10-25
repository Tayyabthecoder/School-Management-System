import React, { useState, useRef } from 'react'
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  FileCheck,
  AlertTriangle,
  Info,
  Users,
} from 'lucide-react'
import api from '../../../lib/axios'
import { useToastStore } from '../../../store/toastStore'

export default function ImportStudentsModal({
  open,
  onClose,
  onSuccess,
}) {
  const toast = useToastStore()
  const fileInputRef = useRef(null)

  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)
  const [importResult, setImportResult] = useState(null)

  if (!open) return null

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const validateAndSetFile = (selectedFile) => {
    const validExtensions = ['.xlsx', '.xls', '.csv']
    const fileName = selectedFile.name.toLowerCase()
    const isValid = validExtensions.some((ext) => fileName.endsWith(ext))

    if (!isValid) {
      toast.error('Please upload an Excel spreadsheet (.xlsx, .xls) or CSV file.')
      return
    }

    if (selectedFile.size > 15 * 1024 * 1024) {
      toast.error('File size exceeds the 15MB limit.')
      return
    }

    setFile(selectedFile)
    setImportResult(null)
  }

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true)
    try {
      const response = await api.get('/students/import-template', {
        responseType: 'blob',
      })
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = 'student_import_template.xlsx'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
      toast.success('Excel import template downloaded successfully!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to download template. Please try again.')
    } finally {
      setDownloadingTemplate(false)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select an Excel file to upload.')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await api.post('/students/import-excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (res.data?.success) {
        setImportResult(res.data.data)
        const { createdCount, updatedCount, errorCount } = res.data.data
        toast.success(
          `Import complete: ${createdCount} enrolled, ${updatedCount} updated${
            errorCount > 0 ? `, ${errorCount} errors` : ''
          }`
        )
        if (onSuccess) {
          onSuccess(res.data.data)
        }
      }
    } catch (err) {
      console.error(err)
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Failed to import student file. Please verify file format.'
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleModalClose = () => {
    handleReset()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-indigo-950 p-5 text-white flex items-center justify-between relative flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-md">
              <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Import Students Directory</h2>
              <p className="text-xs text-emerald-100/80">
                Bulk upload students roster via Excel (.xlsx, .xls, .csv)
              </p>
            </div>
          </div>
          <button
            onClick={handleModalClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Step 1: Template Download Banner */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/60 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 flex-shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Standard Import Template</h4>
                <p className="text-xs text-gray-600 mt-0.5">
                  Includes formatted columns, field guidelines, and sample records.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              disabled={downloadingTemplate}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-white hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-300 rounded-xl text-xs font-bold transition-all shadow-xs flex-shrink-0 disabled:opacity-50"
            >
              {downloadingTemplate ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Download Template (.xlsx)
            </button>
          </div>

          {/* Results View or Upload Zone */}
          {importResult ? (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-emerald-950">
                <div className="flex items-center gap-2.5 mb-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  <h3 className="text-base font-bold">Import Summary</h3>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/80 p-3 rounded-xl border border-emerald-100">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Total Evaluated
                    </span>
                    <p className="text-xl font-extrabold text-gray-900">{importResult.totalRows}</p>
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-emerald-100">
                    <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">
                      Newly Created
                    </span>
                    <p className="text-xl font-extrabold text-emerald-700">
                      +{importResult.createdCount}
                    </p>
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-emerald-100">
                    <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
                      Updated Records
                    </span>
                    <p className="text-xl font-extrabold text-indigo-700">
                      {importResult.updatedCount}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-emerald-800 mt-3 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  Students directory has been refreshed with new enrollments and updates.
                </p>
              </div>

              {/* Display Row Errors if Any */}
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-xs mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Some rows could not be imported ({importResult.errors.length}):
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {importResult.errors.map((err, idx) => (
                      <div
                        key={idx}
                        className="text-xs text-amber-900 bg-white/70 p-2 rounded-lg border border-amber-100 flex items-start gap-2"
                      >
                        <span className="font-semibold text-amber-700">Row {err.row}:</span>
                        <span>{err.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Drag and Drop Box */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-emerald-500 bg-emerald-50/70 scale-[0.99]'
                    : file
                    ? 'border-emerald-400 bg-emerald-50/20'
                    : 'border-gray-300 hover:border-emerald-400 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 shadow-xs">
                  {file ? (
                    <FileSpreadsheet className="w-7 h-7 text-emerald-600" />
                  ) : (
                    <UploadCloud className="w-7 h-7 text-emerald-600" />
                  )}
                </div>

                {file ? (
                  <div>
                    <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full mb-1">
                      Ready to Upload
                    </span>
                    <h4 className="text-sm font-bold text-gray-900 truncate max-w-sm mx-auto">
                      {file.name}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB • Click or drop another file to replace
                    </p>
                  </div>
                ) : (
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      Drop student Excel spreadsheet here
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      or <span className="text-emerald-600 font-semibold underline">browse file</span> from your computer
                    </p>
                    <p className="text-[11px] text-gray-400 mt-2">
                      Supports .xlsx, .xls, and .csv up to 15MB
                    </p>
                  </div>
                )}
              </div>

              {/* Supported Columns Guide */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
                  <Info className="w-3.5 h-3.5 text-slate-500" />
                  Supported Excel Columns & Aliases:
                </div>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold rounded-md">
                    Full Name *
                  </span>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-semibold rounded-md">
                    Class / Grade *
                  </span>
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">Section</span>
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">Gender</span>
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                    Date of Birth
                  </span>
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">Father Name</span>
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                    Guardian Phone
                  </span>
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                    Guardian CNIC
                  </span>
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">Address</span>
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">Blood Group</span>
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">B-Form</span>
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                    Student ID (Update mode)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  * Tip: Leave <strong>Student ID</strong> blank to automatically enroll new students with system-generated IDs and student portal credentials. Provide an existing Student ID to update an active record.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
          {importResult ? (
            <div className="w-full flex items-center justify-between">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl text-xs font-semibold transition-colors"
              >
                Import Another File
              </button>
              <button
                type="button"
                onClick={handleModalClose}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <Users className="w-4 h-4" /> View Updated Directory
              </button>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between">
              <button
                type="button"
                onClick={handleModalClose}
                disabled={uploading}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || uploading}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing & Updating Directory...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Import and Update Directory</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
