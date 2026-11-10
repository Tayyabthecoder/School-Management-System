import React, { useRef, useState } from 'react'
import { Download, FileText, Upload } from 'lucide-react'
import Button from '../../../../components/ui/Button'
import api from '../../../../lib/axios'
import { downloadBlobResponse } from '../../../../lib/download'
import { formatDate } from '../../../../lib/formatters'
import { useToast } from '../../../../store/toastStore'

const ACCEPTED_TYPES = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.webp'

async function readBlobError(err, fallback) {
  const data = err.response?.data
  if (data instanceof Blob) {
    try {
      return JSON.parse(await data.text())?.error?.message || fallback
    } catch {
      return fallback
    }
  }
  return data?.error?.message || fallback
}

/**
 * Lists the documents actually attached to the student record. Files are fetched through
 * the authorised GET /students/:id/documents/:docId endpoint (SEC-05), so they open for
 * whoever may see this student and nobody else.
 */
export default function StudentDocumentsTab({ student, canManage, onDocumentsChanged }) {
  const toast = useToast()
  const fileInputRef = useRef(null)
  const [docName, setDocName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)
  const documents = student?.documents || []

  const handleDownload = async (doc) => {
    setDownloadingId(doc._id)
    try {
      const response = await api.get(`/students/${student._id}/documents/${doc._id}`, { responseType: 'blob' })
      downloadBlobResponse(response, doc.name || 'document')
    } catch (err) {
      toast.error(await readBlobError(err, 'Failed to download document'))
    } finally {
      setDownloadingId(null)
    }
  }

  const handleUpload = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const formData = new FormData()
    formData.append('document', file)
    formData.append('name', docName.trim() || file.name)
    setUploading(true)
    try {
      const res = await api.post(`/uploads/student/${student._id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (res.data?.success) {
        onDocumentsChanged?.(res.data.data)
        setDocName('')
        toast.success('Document attached to the student record')
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to upload document')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="card-surface p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Student Documents
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Files attached to this student&apos;s record.
          </p>
        </div>
        {canManage && (
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="Document name (optional)"
              maxLength={80}
              className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
            <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES} className="hidden" onChange={handleUpload} />
            <Button
              type="button"
              variant="primary"
              icon={<Upload className="w-4 h-4" />}
              loading={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              Attach Document
            </Button>
          </div>
        )}
      </div>

      {documents.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
          No documents have been attached to this student yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <div
              key={doc._id}
              className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">{doc.name || 'Document'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Uploaded {doc.uploadedAt ? formatDate(doc.uploadedAt) : '—'}
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<Download className="w-4 h-4" />}
                loading={downloadingId === doc._id}
                onClick={() => handleDownload(doc)}
              >
                Download
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
