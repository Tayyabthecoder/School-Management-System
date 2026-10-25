import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileText,
} from 'lucide-react'
import Breadcrumb from '../../components/layout/Breadcrumb'
import { SkeletonCard, SkeletonTable } from '../../components/ui/Skeleton'
import api from '../../lib/axios'
import { formatDate } from '../../lib/formatters'
import { useToastStore } from '../../store/toastStore'

// Modular Subcomponents
import ProfileHeader from './components/StudentProfile/ProfileHeader'
import PersonalMedicalTab from './components/StudentProfile/PersonalMedicalTab'
import AcademicRecordsTab from './components/StudentProfile/AcademicRecordsTab'
import AttendanceHistoryTab from './components/StudentProfile/AttendanceHistoryTab'
import FeeLedgerTab from './components/StudentProfile/FeeLedgerTab'
import StudentIdCardModal from './components/StudentProfile/StudentIdCardModal'
import StudentStatusModal from './components/StudentProfile/StudentStatusModal'
import ChangeSectionModal from './components/ChangeSectionModal'
import {
  AdjustConcessionModal,
  RecordPaymentModal,
  AssignFeeModal,
} from './components/StudentProfile/StudentFinanceModals'

// ─── Helpers ─────────────────────────────────────────────────────────────────
const calculateAge = (dobString) => {
  if (!dobString) return '—'
  const dob = new Date(dobString)
  if (isNaN(dob.getTime())) return '—'
  const today = new Date()
  let ageYears = today.getFullYear() - dob.getFullYear()
  let ageMonths = today.getMonth() - dob.getMonth()
  if (ageMonths < 0 || (ageMonths === 0 && today.getDate() < dob.getDate())) {
    ageYears--
    ageMonths += 12
  }
  return `${ageYears} yrs, ${ageMonths} mos`
}

const cleanPhoneNumber = (phone) => {
  if (!phone) return ''
  return String(phone).replace(/[^0-9]/g, '')
}

const formatWhatsAppUrl = (phone) => {
  const digits = cleanPhoneNumber(phone)
  if (!digits) return null
  let fullDigits = digits
  if (digits.startsWith('0')) {
    fullDigits = '92' + digits.slice(1)
  } else if (!digits.startsWith('92') && digits.length === 10) {
    fullDigits = '92' + digits
  }
  return `https://wa.me/${fullDigits}`
}

export default function StudentProfilePage() {
  const { id } = useParams()
  const toast = useToastStore()

  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('personal') // 'personal' | 'academics' | 'grades' | 'attendance' | 'fees' | 'documents'

  // Data collections
  const [fees, setFees] = useState([])
  const [grades, setGrades] = useState([])
  const [attendanceRecords, setAttendanceRecords] = useState([])

  // Inline Profile Edit Mode
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [savingProfile, setSavingProfile] = useState(false)

  // Modals
  const [showIdCardModal, setShowIdCardModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showChangeSectionModal, setShowChangeSectionModal] = useState(false)
  const [selectedFeeForConcession, setSelectedFeeForConcession] = useState(null)
  const [selectedFeeForPayment, setSelectedFeeForPayment] = useState(null)
  const [showAssignFeeModal, setShowAssignFeeModal] = useState(false)

  const handleDownloadPDF = async (url, filename) => {
    try {
      toast.info('Preparing document for download…')
      const res = await api.get(url, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(link.href)
      toast.success('Document downloaded successfully')
    } catch (err) {
      console.error(err)
      toast.error('Failed to download PDF document')
    }
  }

  const initEditForm = useCallback((st) => {
    if (!st) return
    const isFatherAlive =
      st.guardian?.relationship === 'Father' ||
      (!st.guardian?.relationship && Boolean(st.fatherName))
    setEditForm({
      fullName: st.fullName || '',
      dob: st.dob ? new Date(st.dob).toISOString().split('T')[0] : '',
      gender: st.gender || 'Male',
      bFormNumber: st.bFormNumber || '',
      bloodGroup: st.bloodGroup || '',
      nationality: st.nationality || 'Pakistani',
      religion: st.religion || 'Islam',
      address: st.address || '',
      city: st.city || 'Karachi',
      previousSchool: st.previousSchool || '',
      fatherName: st.fatherName || '',
      fatherStatus: isFatherAlive ? 'Alive' : 'Deceased',
      guardianName: st.guardian?.name || '',
      guardianRelationship:
        st.guardian?.relationship || (isFatherAlive ? 'Father' : 'Mother'),
      guardianPhone: st.guardian?.phone || '',
      guardianEmail: st.guardian?.email || '',
      guardianCnic: st.guardian?.cnic || '',
      guardianOccupation: st.guardian?.occupation || '',
      emergencyName: st.emergencyContact?.name || '',
      emergencyPhone: st.emergencyContact?.phone || '',
      emergencyRel: st.emergencyContact?.relationship || 'Guardian',
      medicalNotes: st.medicalNotes || '',
      photoUrl: st.photoUrl || '',
    })
  }, [])

  const loadAllStudentData = useCallback(async () => {
    setLoading(true)
    try {
      const [stRes, feeRes, grdRes, attRes] = await Promise.allSettled([
        api.get(`/students/${id}`),
        api.get('/finance/student-fees', { params: { studentId: id } }),
        api.get(`/grades/student/${id}`),
        api.get('/attendance', { params: { studentId: id } }),
      ])

      if (stRes.status === 'fulfilled' && stRes.value.data?.success) {
        setStudent(stRes.value.data.data)
        initEditForm(stRes.value.data.data)
      }

      if (feeRes.status === 'fulfilled' && feeRes.value.data?.success) {
        setFees(feeRes.value.data.data || [])
      }

      if (grdRes.status === 'fulfilled' && grdRes.value.data?.success) {
        setGrades(grdRes.value.data.data || [])
      }

      if (attRes.status === 'fulfilled' && attRes.value.data?.success) {
        setAttendanceRecords(attRes.value.data.data || [])
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to load full student profile')
    } finally {
      setLoading(false)
    }
  }, [id, toast, initEditForm])

  useEffect(() => {
    loadAllStudentData()
  }, [loadAllStudentData])

  // Handle Photo Upload in Edit Mode
  const handleEditPhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WebP)')
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error('Image size must be less than 3MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      setEditForm((prev) => ({ ...prev, photoUrl: event.target.result }))
      toast.success('Photo uploaded')
    }
    reader.readAsDataURL(file)
  }

  // Handle Profile Save
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault()
    if (!editForm.fullName?.trim()) {
      toast.error('Student Full Name is required')
      return
    }
    if (!editForm.dob) {
      toast.error('Date of Birth is required')
      return
    }

    setSavingProfile(true)
    try {
      const isFatherAlive = editForm.fatherStatus === 'Alive'
      const payload = {
        fullName: editForm.fullName.trim(),
        dob: editForm.dob,
        gender: editForm.gender,
        bloodGroup: editForm.bloodGroup,
        bFormNumber: editForm.bFormNumber,
        nationality: editForm.nationality,
        religion: editForm.religion,
        address: editForm.address,
        city: editForm.city,
        previousSchool: editForm.previousSchool,
        fatherName: editForm.fatherName.trim(),
        photoUrl: editForm.photoUrl,
        guardian: {
          name: isFatherAlive
            ? editForm.fatherName || editForm.guardianName
            : editForm.guardianName || editForm.fatherName,
          phone: editForm.guardianPhone,
          email: editForm.guardianEmail,
          relationship: isFatherAlive
            ? 'Father'
            : editForm.guardianRelationship || 'Guardian',
          cnic: editForm.guardianCnic,
          occupation: editForm.guardianOccupation,
        },
        emergencyContact: {
          name:
            editForm.emergencyName || editForm.guardianName || editForm.fatherName,
          phone: editForm.emergencyPhone || editForm.guardianPhone,
          relationship:
            editForm.emergencyRel || (isFatherAlive ? 'Father' : 'Guardian'),
        },
        medicalNotes: editForm.medicalNotes,
      }

      const res = await api.put(`/students/${student._id}`, payload)
      if (res.data?.success) {
        toast.success('Student profile updated successfully!')
        setStudent(res.data.data)
        initEditForm(res.data.data)
        setEditMode(false)
      }
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Failed to update student profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleCancelEdit = () => {
    initEditForm(student)
    setEditMode(false)
  }

  // Attendance Metrics Computation
  const attendanceStats = useMemo(() => {
    let totalAttended = 0
    let presentDays = 0
    let absentDays = 0
    let lateDays = 0
    let excusedDays = 0

    attendanceRecords.forEach((att) => {
      if (att.records && att.records.length > 0) {
        att.records.forEach((r) => {
          totalAttended++
          if (r.status === 'Present') presentDays++
          else if (r.status === 'Absent') absentDays++
          else if (r.status === 'Late') lateDays++
          else if (r.status === 'Excused') excusedDays++
        })
      }
    })

    const attendancePct =
      totalAttended > 0
        ? Math.round(((presentDays + lateDays * 0.8) / totalAttended) * 100)
        : null

    return {
      totalAttended,
      presentDays,
      absentDays,
      lateDays,
      excusedDays,
      attendancePct,
    }
  }, [attendanceRecords])

  // Flattened Attendance List for Timeline & Calendar Mapping
  const flatAttendanceList = useMemo(() => {
    const list = []
    attendanceRecords.forEach((att) => {
      if (att.records && att.records.length > 0) {
        att.records.forEach((r) => {
          list.push({
            id: `${att._id}_${r.studentId?._id || r.studentId}`,
            date: new Date(att.date),
            dateString: new Date(att.date).toISOString().split('T')[0],
            status: r.status,
            remarks: r.remarks || 'Regular attendance',
            periodNumber: att.periodNumber,
            className: att.classId?.name,
            sectionId: att.sectionId,
          })
        })
      }
    })
    return list.sort((a, b) => b.date - a.date)
  }, [attendanceRecords])

  const attendanceDateMap = useMemo(() => {
    const map = {}
    flatAttendanceList.forEach((item) => {
      if (!map[item.dateString]) {
        map[item.dateString] = item
      }
    })
    return map
  }, [flatAttendanceList])

  // Academic GPA Computation
  const totalMarksScored = grades.reduce((acc, g) => acc + (g.marksObtained || 0), 0)
  const totalMaxMarks = grades.reduce(
    (acc, g) => acc + (g.examId?.maxMarks || 100),
    0
  )
  const overallAvgPct =
    grades.length > 0 && totalMaxMarks > 0
      ? Math.round((totalMarksScored / totalMaxMarks) * 100)
      : null

  // Financial Metrics Computation
  const totalFeeDue = fees.reduce((acc, f) => acc + (f.netAmount || 0), 0)
  const totalFeePaid = fees.reduce((acc, f) => acc + (f.amountPaid || 0), 0)
  const totalOutstanding = fees.reduce(
    (acc, f) => acc + (f.outstandingAmount || 0),
    0
  )
  const feePaymentPct =
    totalFeeDue > 0
      ? Math.min(Math.round((totalFeePaid / totalFeeDue) * 100), 100)
      : totalFeePaid > 0
      ? 100
      : 0

  const subjectsList = student?.classId?.subjects || []

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard className="h-40" />
        <SkeletonTable rows={6} />
      </div>
    )
  }

  if (!student) {
    return (
      <div className="card-surface p-12 text-center border-rose-200 dark:border-rose-800">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Student Record Not Found
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          The requested student ID could not be located in the database.
        </p>
        <Link
          to="/students"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Student Roster
        </Link>
      </div>
    )
  }

  const guardianPhone =
    student.guardian?.phone || student.emergencyContact?.phone || ''
  const whatsAppUrl = formatWhatsAppUrl(guardianPhone)

  return (
    <div className="pb-12 space-y-6">
      <Breadcrumb
        title={`${student.fullName || 'Student Profile'} — 360° Comprehensive Record`}
        subtitle={`Student ID: ${student.studentId || '—'} · Enrolled in ${
          student.classId?.name || 'Class'
        } (Section ${student.sectionId || 'A'})`}
      />

      {/* ── Profile Header & Metrics Banner ── */}
      <ProfileHeader
        student={student}
        editMode={editMode}
        editForm={editForm}
        onToggleEdit={() => {
          if (!editMode) {
            initEditForm(student)
            setActiveTab('personal')
          }
          setEditMode(!editMode)
        }}
        onOpenIdCard={() => setShowIdCardModal(true)}
        onDownloadReportCard={() =>
          handleDownloadPDF(
            `/grades/report-card?studentId=${student._id}&termName=Term+1`,
            `ReportCard_${(student.fullName || 'Student').replace(/\s+/g, '_')}.pdf`
          )
        }
        onOpenStatusModal={() => setShowStatusModal(true)}
        onOpenChangeSection={() => setShowChangeSectionModal(true)}
        onPhotoUpload={handleEditPhotoUpload}
        guardianPhone={guardianPhone}
        whatsAppUrl={whatsAppUrl}
        overallAvgPct={overallAvgPct}
        grades={grades}
        attendanceStats={attendanceStats}
        totalOutstanding={totalOutstanding}
        activeTab={activeTab}
        onSelectTab={(tabId) => setActiveTab(tabId)}
      />

      {/* ── TAB 1: PERSONAL & FAMILY ── */}
      {activeTab === 'personal' && (
        <PersonalMedicalTab
          student={student}
          editMode={editMode}
          editForm={editForm}
          setEditForm={setEditForm}
          savingProfile={savingProfile}
          onSaveProfile={handleSaveProfile}
          onCancelEdit={handleCancelEdit}
          onStartEdit={() => {
            initEditForm(student)
            setEditMode(true)
          }}
          calculateAge={calculateAge}
        />
      )}

      {/* ── TAB 2: ENROLLED SUBJECTS ── */}
      {activeTab === 'academics' && (
        <AcademicRecordsTab
          type="academics"
          student={student}
          grades={grades}
          subjectsList={subjectsList}
          overallAvgPct={overallAvgPct}
          onDownloadReportCard={() =>
            handleDownloadPDF(
              `/grades/report-card?studentId=${student._id}&termName=Term+1`,
              `ReportCard_${(student.fullName || 'Student').replace(/\s+/g, '_')}.pdf`
            )
          }
        />
      )}

      {/* ── TAB 3: ACADEMIC GRADES & GPA ── */}
      {activeTab === 'grades' && (
        <AcademicRecordsTab
          type="grades"
          student={student}
          grades={grades}
          subjectsList={subjectsList}
          overallAvgPct={overallAvgPct}
          onDownloadReportCard={() =>
            handleDownloadPDF(
              `/grades/report-card?studentId=${student._id}&termName=Term+1`,
              `ReportCard_${(student.fullName || 'Student').replace(/\s+/g, '_')}.pdf`
            )
          }
        />
      )}

      {/* ── TAB 4: ATTENDANCE RECORDS ── */}
      {activeTab === 'attendance' && (
        <AttendanceHistoryTab
          attendanceStats={attendanceStats}
          flatAttendanceList={flatAttendanceList}
          attendanceDateMap={attendanceDateMap}
        />
      )}

      {/* ── TAB 5: FEE LEDGER & PAYMENTS ── */}
      {activeTab === 'fees' && (
        <FeeLedgerTab
          student={student}
          fees={fees}
          totalFeeDue={totalFeeDue}
          totalFeePaid={totalFeePaid}
          totalOutstanding={totalOutstanding}
          feePaymentPct={feePaymentPct}
          onOpenAssignFee={() => setShowAssignFeeModal(true)}
          onOpenConcession={(f) => setSelectedFeeForConcession(f)}
          onOpenPayment={(f) => setSelectedFeeForPayment(f)}
          onDownloadChallan={(f) =>
            handleDownloadPDF(
              `/finance/challan/${f._id}/pdf`,
              `Challan_${student.studentId || 'Fee'}.pdf`
            )
          }
        />
      )}

      {/* ── TAB 6: DOCUMENTS & VERIFICATION ── */}
      {activeTab === 'documents' && (
        <div className="card-surface p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Official Student Records & Dossier
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Verified admission documents on file with the registrar.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                title: 'Admission Application Form',
                type: 'Registration',
                status: 'Verified',
                date: student.joiningDate,
              },
              {
                title: 'NADRA B-Form / Birth Certificate Copy',
                type: 'Identity',
                status: 'Verified',
                date: student.joiningDate,
              },
              {
                title: 'School Leaving Certificate (Previous School)',
                type: 'Academic',
                status: 'On File',
                date: student.joiningDate,
              },
              {
                title: 'Guardian CNIC Copy',
                type: 'Parental Consent',
                status: 'Verified',
                date: student.joiningDate,
              },
              {
                title: 'Medical Fitness & Blood Group Report',
                type: 'Health',
                status: 'Verified',
                date: student.joiningDate,
              },
              {
                title: 'Passport-size Photographs (4x)',
                type: 'Media',
                status: 'Archived',
                date: student.joiningDate,
              },
            ].map((doc, i) => (
              <div
                key={i}
                className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {doc.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {doc.type} · Submitted {doc.date ? formatDate(doc.date) : '—'}
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {doc.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODALS ── */}
      <StudentIdCardModal
        open={showIdCardModal}
        student={student}
        onClose={() => setShowIdCardModal(false)}
      />

      <StudentStatusModal
        open={showStatusModal}
        student={student}
        onClose={() => setShowStatusModal(false)}
        onUpdated={(updated) => {
          setStudent(updated)
          initEditForm(updated)
        }}
      />

      <ChangeSectionModal
        open={showChangeSectionModal}
        student={student}
        onClose={() => setShowChangeSectionModal(false)}
        onSuccess={(updated) => {
          setStudent(updated)
          initEditForm(updated)
        }}
      />

      <AdjustConcessionModal
        open={Boolean(selectedFeeForConcession)}
        feeRecord={selectedFeeForConcession}
        onClose={() => setSelectedFeeForConcession(null)}
        onSuccess={() => loadAllStudentData()}
      />

      <RecordPaymentModal
        open={Boolean(selectedFeeForPayment)}
        feeRecord={selectedFeeForPayment}
        onClose={() => setSelectedFeeForPayment(null)}
        onSuccess={() => loadAllStudentData()}
        onDownloadReceipt={(paymentId, receiptNo) =>
          handleDownloadPDF(
            `/finance/receipt/${paymentId}`,
            `Receipt_${receiptNo}.pdf`
          )
        }
      />

      <AssignFeeModal
        open={showAssignFeeModal}
        student={student}
        onClose={() => setShowAssignFeeModal(false)}
        onSuccess={() => loadAllStudentData()}
      />
    </div>
  )
}
