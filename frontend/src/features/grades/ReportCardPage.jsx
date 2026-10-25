import React, { useState, useEffect } from 'react'
import {
  Award, Download, BookOpen, User, CheckCircle2, XCircle, Calendar, FileText
} from 'lucide-react'
import Breadcrumb from '../../components/layout/Breadcrumb'
import Badge from '../../components/ui/Badge'
import api from '../../lib/axios'
import { useAuthStore } from '../../store/authStore'

export default function ReportCardPage() {
  const { user } = useAuthStore()
  const isStudent = user?.role === 'student' || user?.roleName === 'student'

  const [classes, setClasses] = useState([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [students, setStudents] = useState([])
  const [selectedStudentId, setSelectedStudentId] = useState(user?.studentId || '')
  const [termName, setTermName] = useState('Final Term')

  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [bulkDownloading, setBulkDownloading] = useState(false)

  // Load classes if staff/admin
  useEffect(() => {
    if (!isStudent) {
      api.get('/classes')
        .then(res => {
          const clsList = res.data?.data || []
          setClasses(clsList)
          if (clsList.length > 0 && !selectedClassId) {
            setSelectedClassId(clsList[0]._id)
          }
        })
        .catch(console.error)
    }
  }, [isStudent])

  // Load students for selected class
  useEffect(() => {
    if (!isStudent && selectedClassId) {
      api.get(`/students?classId=${selectedClassId}&limit=200`)
        .then(res => {
          const stList = res.data?.data || []
          setStudents(stList)
          if (stList.length > 0) {
            setSelectedStudentId(stList[0]._id)
          } else {
            setSelectedStudentId('')
            setReportData(null)
          }
        })
        .catch(console.error)
    }
  }, [selectedClassId, isStudent])

  // Fetch report card data
  useEffect(() => {
    const studentToFetch = isStudent ? (user?.studentId?._id || user?.studentId) : selectedStudentId
    if (!studentToFetch) return

    setLoading(true)
    api.get(`/report-cards/${studentToFetch}?termName=${encodeURIComponent(termName)}`)
      .then(res => {
        if (res.data?.success) {
          setReportData(res.data.data)
        }
      })
      .catch(err => {
        console.error('Failed to load report card', err)
        setReportData(null)
      })
      .finally(() => setLoading(false))
  }, [selectedStudentId, termName, isStudent, user])

  const handleDownloadPDF = async () => {
    const studentToFetch = isStudent ? (user?.studentId?._id || user?.studentId) : selectedStudentId
    if (!studentToFetch) return

    setDownloading(true)
    try {
      const response = await api.get(`/report-cards/${studentToFetch}/pdf?termName=${encodeURIComponent(termName)}`, {
        responseType: 'blob',
      })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `ReportCard_${reportData?.studentId || 'Student'}_${termName}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      console.error('PDF download error', err)
    } finally {
      setDownloading(false)
    }
  }

  const handleBulkDownloadClass = async () => {
    if (!selectedClassId) return
    setBulkDownloading(true)
    try {
      const response = await api.get(`/report-cards/class/${selectedClassId}?termName=${encodeURIComponent(termName)}`, {
        responseType: 'blob',
      })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Class_ReportCards_${selectedClassId}_${termName}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      console.error('Bulk PDF download error', err)
    } finally {
      setBulkDownloading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        title="Academic Report Cards"
        subtitle="View and download certified term report cards and grade sheets."
      />

      {/* Controls Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {!isStudent && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Class
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                >
                  {classes.map(cls => (
                    <option key={cls._id} value={cls._id}>{cls.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Student
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white min-w-[200px]"
                >
                  {students.map(st => (
                    <option key={st._id} value={st._id}>{st.fullName} ({st.studentId})</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Examination Term
            </label>
            <select
              value={termName}
              onChange={(e) => setTermName(e.target.value)}
              className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            >
              <option value="Final Term">Final Term</option>
              <option value="Midterm">Midterm</option>
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isStudent && (
            <button
              onClick={handleBulkDownloadClass}
              disabled={bulkDownloading || !selectedClassId}
              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-xl border border-indigo-200 flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              {bulkDownloading ? 'Generating Batch...' : 'Download Class Batch PDF'}
            </button>
          )}

          <button
            onClick={handleDownloadPDF}
            disabled={downloading || !reportData}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-100 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Downloading...' : 'Download Official PDF'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center text-gray-500 animate-pulse">
          Loading report card data...
        </div>
      ) : !reportData ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center text-gray-500">
          No grade entries found for this student and term.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold bg-indigo-500/30 px-3 py-1 rounded-full uppercase tracking-wider text-indigo-100">
                  {reportData.termName} Academic Statement
                </span>
                <h2 className="text-2xl font-bold mt-2">{reportData.studentName}</h2>
                <p className="text-indigo-200 text-sm mt-0.5">
                  Roll No: <span className="font-semibold text-white">{reportData.studentId}</span> • Class: <span className="font-semibold text-white">{reportData.className} ({reportData.sectionId})</span>
                </p>
              </div>

              <div className="flex items-center gap-6 text-right">
                <div>
                  <div className="text-3xl font-extrabold text-white">{reportData.summary.overallGradeLetter}</div>
                  <div className="text-xs text-indigo-200 mt-0.5">Overall Grade</div>
                </div>
                <div className="h-10 w-px bg-indigo-500/50" />
                <div>
                  <div className="text-3xl font-extrabold text-white">{reportData.summary.overallPercentage}%</div>
                  <div className="text-xs text-indigo-200 mt-0.5">Aggregate %</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-400 uppercase">Total Marks</span>
              <div className="text-xl font-bold text-gray-900 mt-1">
                {reportData.summary.totalMarksObtained} <span className="text-xs font-normal text-gray-500">/ {reportData.summary.totalMaxMarks}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-400 uppercase">Passed Subjects</span>
              <div className="text-xl font-bold text-green-600 mt-1">
                {reportData.summary.passedSubjects} <span className="text-xs font-normal text-gray-500">/ {reportData.summary.totalSubjects}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-400 uppercase">Failed Subjects</span>
              <div className={`text-xl font-bold mt-1 ${reportData.summary.failedSubjects > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {reportData.summary.failedSubjects}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-400 uppercase">Attendance Rate</span>
              <div className="text-xl font-bold text-indigo-600 mt-1">
                {reportData.attendancePercentage}
              </div>
            </div>
          </div>

          {/* Grades Breakdown Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Subject-wise Performance
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/75 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
                    <th className="p-4">Subject</th>
                    <th className="p-4">Max Marks</th>
                    <th className="p-4">Pass Marks</th>
                    <th className="p-4">Marks Obtained</th>
                    <th className="p-4">Percentage</th>
                    <th className="p-4">Grade</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {reportData.grades.map((g, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 font-semibold text-gray-900">{g.subjectName}</td>
                      <td className="p-4 text-gray-600">{g.maxMarks}</td>
                      <td className="p-4 text-gray-600">{g.passMarks}</td>
                      <td className="p-4 font-bold text-gray-900">{g.marksObtained}</td>
                      <td className="p-4 text-gray-600">{g.percentage}%</td>
                      <td className="p-4 font-bold text-indigo-600">{g.gradeLetter}</td>
                      <td className="p-4">
                        {g.isPassed ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700">
                            <XCircle className="w-3.5 h-3.5" /> Retained
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
