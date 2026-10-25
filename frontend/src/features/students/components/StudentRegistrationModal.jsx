import React, { useState, useEffect } from 'react'
import {
  GraduationCap, User, Shield, BookOpen, HeartPulse, Camera, X, Check, Upload,
  AlertCircle, Phone, Mail, MapPin, Building, Calendar, CheckCircle2,
  CircleDollarSign, Receipt, Percent, Download, CreditCard, DollarSign, Wallet,
  ArrowRight, ArrowLeft, Eye
} from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import api from '../../../lib/axios'
import { formatPKR, formatDate } from '../../../lib/formatters'
import { useToastStore } from '../../../store/toastStore'
import { FALLBACK_GRADES } from '../../../constants/grades'

const INITIAL_STUDENT_STATE = {
  // Step 1: Basic Info
  fullName: '',
  dob: '',
  gender: 'Male',
  photoUrl: '',
  bFormNumber: '',
  nationality: 'Pakistani',
  religion: 'Islam',
  address: '',
  city: 'Karachi',

  // Step 2: Father & Guardian
  fatherName: '',
  fatherStatus: 'Alive', // 'Alive' | 'Deceased'
  fatherPhone: '',
  fatherEmail: '',
  fatherCnic: '',
  fatherOccupation: '',
  guardianName: '',
  guardianRelationship: 'Mother',
  guardianPhone: '',
  guardianEmail: '',
  guardianCnic: '',
  guardianOccupation: '',

  // Step 3: Academic
  classId: '',
  sectionId: 'A',
  joiningDate: new Date().toISOString().split('T')[0],
  previousSchool: '',

  // Step 4: Fee & Concession Setup
  feeSetup: {
    selectedFeeStructureIds: [],
    concessionType: 'None',
    discountType: 'percentage', // 'percentage' | 'fixed'
    discountValue: 0,
    concessionReason: '',
    initialPaymentStatus: 'Pending', // 'Pending' | 'Paid'
    paymentMode: 'Cash',
    paymentRemarks: '',
  },

  // Step 5: Health & Emergency
  bloodGroup: 'O+',
  medicalNotes: 'None reported / General fitness',
  emergencyName: '',
  emergencyPhone: '',
  emergencyRelationship: 'Guardian',
}

const WIZARD_STEPS = [
  { id: 1, label: 'Basic Info', sub: 'Student Demographics', icon: User },
  { id: 2, label: 'Father & Guardian', sub: 'Family & Contacts', icon: Shield },
  { id: 3, label: 'Academics', sub: 'Class & Enrollment', icon: BookOpen },
  { id: 4, label: 'Fee & Concession', sub: 'Structures & Concessions', icon: CircleDollarSign },
  { id: 5, label: 'Health & Extra', sub: 'Medical & Emergency', icon: HeartPulse },
]

export default function StudentRegistrationModal({
  open,
  onClose,
  classes = [],
  onSuccess,
}) {
  const toast = useToastStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [newStudent, setNewStudent] = useState(INITIAL_STUDENT_STATE)
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [classFeeStructures, setClassFeeStructures] = useState([])
  const [loadingFeeStructures, setLoadingFeeStructures] = useState(false)
  const [registrationSuccessData, setRegistrationSuccessData] = useState(null)

  const displayClasses = classes && classes.length > 0 ? classes : FALLBACK_GRADES


  // Find currently selected class object in modal to populate section choices
  const currentModalClass = displayClasses.find(c => String(c._id) === String(newStudent.classId)) || displayClasses[0]
  const modalClassSections = currentModalClass?.sections && currentModalClass.sections.length > 0
    ? currentModalClass.sections
    : ['A', 'B', 'C']

  // Fee Calculation Helpers for Wizard Step 4
  const selectedFeeStructures = classFeeStructures.filter(s =>
    newStudent.feeSetup?.selectedFeeStructureIds?.includes(s._id)
  )
  const grossFeeTotal = selectedFeeStructures.reduce((sum, s) => sum + (s.amount || 0), 0)
  const discountVal = Number(newStudent.feeSetup?.discountValue) || 0
  const calculatedDiscount = newStudent.feeSetup?.discountType === 'percentage'
    ? Math.round((grossFeeTotal * Math.min(discountVal, 100)) / 100)
    : Math.min(grossFeeTotal, discountVal)
  const netPayableTotal = Math.max(0, grossFeeTotal - calculatedDiscount)

  useEffect(() => {
    if (open) {
      const initialClassId = displayClasses[0]?._id
      setNewStudent(prev => ({
        ...INITIAL_STUDENT_STATE,
        classId: initialClassId || '',
        sectionId: displayClasses[0]?.sections?.[0] || 'A',
      }))
      setCurrentStep(1)
      setFormErrors({})
      if (initialClassId) {
        fetchFeeStructuresForClass(initialClassId)
      }
    }
  }, [open, classes])

  const fetchFeeStructuresForClass = async (classId) => {
    if (!classId) return
    setLoadingFeeStructures(true)
    try {
      const res = await api.get('/finance/structures', { params: { classId } })
      if (res.data?.success) {
        const structures = res.data.data || []
        setClassFeeStructures(structures)
        setNewStudent(prev => {
          const currentSelected = prev.feeSetup?.selectedFeeStructureIds || []
          const validSelected = currentSelected.filter(id => structures.some(s => s._id === id))
          return {
            ...prev,
            feeSetup: {
              ...prev.feeSetup,
              selectedFeeStructureIds: validSelected.length > 0 ? validSelected : structures.map(s => s._id),
            },
          }
        })
      }
    } catch (err) {
      console.error('Failed to fetch fee structures', err)
    } finally {
      setLoadingFeeStructures(false)
    }
  }

  const resetForm = () => {
    const defaultClassId = displayClasses[0]?._id || ''
    setNewStudent({
      ...INITIAL_STUDENT_STATE,
      classId: defaultClassId,
      sectionId: displayClasses[0]?.sections?.[0] || 'A',
    })
    setCurrentStep(1)
    setFormErrors({})
    if (defaultClassId) {
      fetchFeeStructuresForClass(defaultClassId)
    }
  }

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

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        toast.error('Student photo must be under 3MB')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setNewStudent(prev => ({ ...prev, photoUrl: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const clearFieldError = (field) => {
    if (formErrors[field]) {
      setFormErrors(prev => {
        const copy = { ...prev }
        delete copy[field]
        return copy
      })
    }
  }

  const validateStep = (step) => {
    const errors = {}

    if (step === 1) {
      if (!newStudent.fullName?.trim() || newStudent.fullName.trim().length < 2) {
        errors.fullName = 'Full Name is required (minimum 2 characters)'
      }
      if (!newStudent.dob) {
        errors.dob = 'Date of Birth is required'
      }
      if (!newStudent.gender) {
        errors.gender = 'Gender is required'
      }
    }

    if (step === 2) {
      if (!newStudent.fatherName?.trim() || newStudent.fatherName.trim().length < 2) {
        errors.fatherName = "Father's Full Name is required"
      }
      if (newStudent.fatherStatus === 'Alive') {
        if (!newStudent.fatherPhone?.trim() || newStudent.fatherPhone.trim().length < 7) {
          errors.fatherPhone = "Father's contact phone number is required"
        }
      } else {
        if (!newStudent.guardianName?.trim() || newStudent.guardianName.trim().length < 2) {
          errors.guardianName = "Guardian's Full Name is required"
        }
        if (!newStudent.guardianPhone?.trim() || newStudent.guardianPhone.trim().length < 7) {
          errors.guardianPhone = "Guardian's contact phone number is required"
        }
        if (!newStudent.guardianRelationship) {
          errors.guardianRelationship = 'Relationship to student is required'
        }
      }
    }

    if (step === 3) {
      if (!newStudent.classId) {
        errors.classId = 'Class selection is required'
      }
      if (!newStudent.sectionId?.trim()) {
        errors.sectionId = 'Section assignment is required'
      }
    }

    if (step === 4) {
      const numVal = Number(newStudent.feeSetup?.discountValue) || 0
      if (numVal < 0) {
        errors.discountValue = 'Concession discount cannot be negative'
      }
      if (newStudent.feeSetup?.discountType === 'percentage' && numVal > 100) {
        errors.discountValue = 'Percentage discount cannot exceed 100%'
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5))
    } else {
      toast.warning('Please fill in the required fields before proceeding.')
    }
  }

  const handlePrevStep = () => {
    setFormErrors({})
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleCreate = async (e) => {
    if (e) e.preventDefault()
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) {
      toast.error('Please verify all required registration steps before submitting.')
      return
    }

    setSubmitting(true)
    try {
      const isFatherAlive = newStudent.fatherStatus === 'Alive'
      const payload = {
        fullName: newStudent.fullName.trim(),
        dob: new Date(newStudent.dob),
        gender: newStudent.gender,
        classId: newStudent.classId,
        sectionId: newStudent.sectionId.trim().toUpperCase(),
        fatherName: newStudent.fatherName.trim(),
        photoUrl: newStudent.photoUrl || '',
        bFormNumber: newStudent.bFormNumber.trim(),
        nationality: newStudent.nationality.trim() || 'Pakistani',
        religion: newStudent.religion.trim() || 'Islam',
        address: newStudent.address.trim(),
        city: newStudent.city.trim() || 'Karachi',
        joiningDate: newStudent.joiningDate ? new Date(newStudent.joiningDate) : new Date(),
        previousSchool: newStudent.previousSchool.trim(),
        bloodGroup: newStudent.bloodGroup,
        medicalNotes: newStudent.medicalNotes.trim() || 'None reported / General fitness',
        guardian: isFatherAlive ? {
          name: newStudent.fatherName.trim(),
          phone: newStudent.fatherPhone.trim(),
          email: newStudent.fatherEmail.trim(),
          relationship: 'Father',
          cnic: newStudent.fatherCnic.trim(),
          occupation: newStudent.fatherOccupation.trim(),
        } : {
          name: newStudent.guardianName.trim(),
          phone: newStudent.guardianPhone.trim(),
          email: newStudent.guardianEmail.trim(),
          relationship: newStudent.guardianRelationship || 'Guardian',
          cnic: newStudent.guardianCnic.trim(),
          occupation: newStudent.guardianOccupation.trim(),
        },
        emergencyContact: {
          name: newStudent.emergencyName.trim() || (isFatherAlive ? newStudent.fatherName.trim() : newStudent.guardianName.trim()),
          phone: newStudent.emergencyPhone.trim() || (isFatherAlive ? newStudent.fatherPhone.trim() : newStudent.guardianPhone.trim()),
          relationship: newStudent.emergencyRelationship || 'Guardian',
        },
        feeSetup: {
          selectedFeeStructureIds: newStudent.feeSetup.selectedFeeStructureIds,
          concessionType: newStudent.feeSetup.concessionType,
          discountType: newStudent.feeSetup.discountType,
          discountValue: Number(newStudent.feeSetup.discountValue) || 0,
          concessionReason: newStudent.feeSetup.concessionReason || '',
          initialPaymentStatus: newStudent.feeSetup.initialPaymentStatus,
          paymentMode: newStudent.feeSetup.paymentMode,
          paymentRemarks: newStudent.feeSetup.paymentRemarks,
        },
      }

      const res = await api.post('/students', payload)
      if (res.data?.success) {
        toast.success(`Student ${res.data.data?.fullName || 'record'} successfully registered!`)
        onClose()
        setRegistrationSuccessData(res.data)
        resetForm()
        if (onSuccess) onSuccess(res.data.data)
      }
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to register student')
    } finally {
      setSubmitting(false)
    }
  }


  if (!open && !registrationSuccessData) return null

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 p-5 text-white flex items-center justify-between relative flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/80 border border-indigo-400/30 flex items-center justify-center text-white shadow-md">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight">Register New Student</h2>
                  <p className="text-xs text-indigo-200">Complete student identity, family profile, and academic placement.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  resetForm()
                  onClose()
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-indigo-200 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Wizard Step Progress Tracker */}
            <div className="bg-slate-50 border-b border-gray-200 px-4 py-3 flex-shrink-0">
              <div className="grid grid-cols-4 gap-2">
                {WIZARD_STEPS.map((s) => {
                  const Icon = s.icon
                  const isCurrent = currentStep === s.id
                  const isCompleted = currentStep > s.id

                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        if (s.id < currentStep) {
                          setCurrentStep(s.id)
                        } else if (s.id === currentStep + 1 && validateStep(currentStep)) {
                          setCurrentStep(s.id)
                        }
                      }}
                      className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all ${
                        isCurrent
                          ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/20'
                          : isCompleted
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-white text-gray-400 border border-gray-200 cursor-not-allowed opacity-75'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          isCurrent
                            ? 'bg-white text-indigo-700'
                            : isCompleted
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : s.id}
                      </div>
                      <div className="hidden sm:block min-w-0">
                        <p className="text-xs font-bold truncate leading-tight">{s.label}</p>
                        <p className={`text-[10px] truncate leading-tight ${isCurrent ? 'text-indigo-100' : 'text-gray-400'}`}>
                          {s.sub}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Modal Body / Scrollable Form Container */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">

              {/* ══════════════════════════════════════════════════════════════════
                  STEP 1: STUDENT IDENTITY & BASIC INFO
                  ══════════════════════════════════════════════════════════════════ */}
              {currentStep === 1 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100 text-gray-800">
                    <User className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">Student Identity & Demographics</h3>
                  </div>

                  {/* Photo Upload Card */}
                  <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                    <div className="relative group">
                      {newStudent.photoUrl ? (
                        <img
                          src={newStudent.photoUrl}
                          alt="Student Preview"
                          className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-600 shadow-md"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-200 border-2 border-dashed border-indigo-300 flex flex-col items-center justify-center text-indigo-600">
                          <Camera className="w-6 h-6 mb-1" />
                          <span className="text-[10px] font-bold uppercase">No Photo</span>
                        </div>
                      )}
                      {newStudent.photoUrl && (
                        <button
                          type="button"
                          onClick={() => setNewStudent(prev => ({ ...prev, photoUrl: '' }))}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs shadow"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <label className="block text-xs font-bold text-gray-900 mb-0.5">Student Profile Photo</label>
                      <p className="text-[11px] text-gray-500 mb-2">Upload student passport-sized portrait (PNG, JPG under 3MB).</p>
                      <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold rounded-xl cursor-pointer shadow-xs transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{newStudent.photoUrl ? 'Change Photo' : 'Upload Student Photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Full Name & DOB */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newStudent.fullName}
                        onChange={(e) => {
                          setNewStudent({ ...newStudent, fullName: e.target.value })
                          clearFieldError('fullName')
                        }}
                        placeholder="e.g. Muhammad Bilal"
                        className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none transition-all ${
                          formErrors.fullName
                            ? 'border-red-500 bg-red-50/30 focus:ring-2 focus:ring-red-400'
                            : 'border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20'
                        }`}
                      />
                      {formErrors.fullName && (
                        <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {formErrors.fullName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                        Date of Birth <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={newStudent.dob}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(e) => {
                          setNewStudent({ ...newStudent, dob: e.target.value })
                          clearFieldError('dob')
                        }}
                        className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none transition-all ${
                          formErrors.dob
                            ? 'border-red-500 bg-red-50/30 focus:ring-2 focus:ring-red-400'
                            : 'border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20'
                        }`}
                      />
                      {formErrors.dob && (
                        <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {formErrors.dob}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Gender & B-Form */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={newStudent.gender}
                        onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                        B-Form / CNIC Number
                      </label>
                      <input
                        type="text"
                        value={newStudent.bFormNumber}
                        onChange={(e) => setNewStudent({ ...newStudent, bFormNumber: e.target.value })}
                        placeholder="e.g. 42101-1234567-1"
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 font-mono"
                      />
                    </div>
                  </div>

                  {/* Nationality, Religion & City */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Nationality</label>
                      <input
                        type="text"
                        value={newStudent.nationality}
                        onChange={(e) => setNewStudent({ ...newStudent, nationality: e.target.value })}
                        placeholder="Pakistani"
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Religion</label>
                      <input
                        type="text"
                        value={newStudent.religion}
                        onChange={(e) => setNewStudent({ ...newStudent, religion: e.target.value })}
                        placeholder="Islam"
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">City</label>
                      <input
                        type="text"
                        value={newStudent.city}
                        onChange={(e) => setNewStudent({ ...newStudent, city: e.target.value })}
                        placeholder="Karachi"
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  {/* Residential Address */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Residential Address</label>
                    <textarea
                      rows={2}
                      value={newStudent.address}
                      onChange={(e) => setNewStudent({ ...newStudent, address: e.target.value })}
                      placeholder="e.g. House # 12, Block 4, Gulshan-e-Iqbal, Karachi"
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════════════
                  STEP 2: FATHER & GUARDIAN INFORMATION (CONDITIONAL LOGIC)
                  ══════════════════════════════════════════════════════════════════ */}
              {currentStep === 2 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">Father & Guardian Profile</h3>
                    </div>
                    <span className="text-[11px] font-semibold text-gray-400">Father record always archived</span>
                  </div>

                  {/* Father's Full Name & Status Toggle Box */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-gray-200 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                        Father's Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newStudent.fatherName}
                        onChange={(e) => {
                          setNewStudent({ ...newStudent, fatherName: e.target.value })
                          clearFieldError('fatherName')
                        }}
                        placeholder="e.g. Tariq Mehmood"
                        className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none transition-all ${
                          formErrors.fatherName
                            ? 'border-red-500 bg-red-50/30 focus:ring-2 focus:ring-red-400'
                            : 'border-gray-300 bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20'
                        }`}
                      />
                      {formErrors.fatherName && (
                        <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {formErrors.fatherName}
                        </p>
                      )}
                    </div>

                    {/* Status Pill Checkbox/Radio */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                        Father's Status <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-3 max-w-sm">
                        <button
                          type="button"
                          onClick={() => {
                            setNewStudent(prev => ({ ...prev, fatherStatus: 'Alive' }))
                            clearFieldError('fatherPhone')
                          }}
                          className={`py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                            newStudent.fatherStatus === 'Alive'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Alive (Primary Contact)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setNewStudent(prev => ({ ...prev, fatherStatus: 'Deceased' }))
                            clearFieldError('guardianName')
                            clearFieldError('guardianPhone')
                          }}
                          className={`py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                            newStudent.fatherStatus === 'Deceased'
                              ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-200'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          <AlertCircle className="w-4 h-4" />
                          <span>Deceased (Require Guardian)</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ── PANEL A: FATHER ALIVE DETAILS ──────────────────────── */}
                  {newStudent.fatherStatus === 'Alive' && (
                    <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200 space-y-4 animate-in fade-in">
                      <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold pb-2 border-b border-emerald-100">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Father Contact & Professional Details</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                            Father Contact Phone <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            value={newStudent.fatherPhone}
                            onChange={(e) => {
                              setNewStudent({ ...newStudent, fatherPhone: e.target.value })
                              clearFieldError('fatherPhone')
                            }}
                            placeholder="+92 300 1234567"
                            className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none bg-white transition-all ${
                              formErrors.fatherPhone
                                ? 'border-red-500 bg-red-50/30 focus:ring-2 focus:ring-red-400'
                                : 'border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20'
                            }`}
                          />
                          {formErrors.fatherPhone && (
                            <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> {formErrors.fatherPhone}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                            Father Email Address
                          </label>
                          <input
                            type="email"
                            value={newStudent.fatherEmail}
                            onChange={(e) => setNewStudent({ ...newStudent, fatherEmail: e.target.value })}
                            placeholder="father@gmail.com"
                            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                            Father CNIC Number
                          </label>
                          <input
                            type="text"
                            value={newStudent.fatherCnic}
                            onChange={(e) => setNewStudent({ ...newStudent, fatherCnic: e.target.value })}
                            placeholder="42101-7654321-1"
                            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                            Father Occupation / Business
                          </label>
                          <input
                            type="text"
                            value={newStudent.fatherOccupation}
                            onChange={(e) => setNewStudent({ ...newStudent, fatherOccupation: e.target.value })}
                            placeholder="e.g. Software Engineer, Business"
                            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── PANEL B: FATHER DECEASED → GUARDIAN DETAILS ─────────── */}
                  {newStudent.fatherStatus === 'Deceased' && (
                    <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-4 animate-in fade-in">
                      <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
                        <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
                          <Shield className="w-3.5 h-3.5 text-amber-600" />
                          <span>Appointed Guardian Details (Active Contact)</span>
                        </div>
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">
                          Father: {newStudent.fatherName || 'Recorded'} (Deceased)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                            Guardian Full Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={newStudent.guardianName}
                            onChange={(e) => {
                              setNewStudent({ ...newStudent, guardianName: e.target.value })
                              clearFieldError('guardianName')
                            }}
                            placeholder="e.g. Fatima Tariq"
                            className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none bg-white transition-all ${
                              formErrors.guardianName
                                ? 'border-red-500 bg-red-50/30 focus:ring-2 focus:ring-red-400'
                                : 'border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20'
                            }`}
                          />
                          {formErrors.guardianName && (
                            <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> {formErrors.guardianName}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                            Relationship to Student <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={newStudent.guardianRelationship}
                            onChange={(e) => {
                              setNewStudent({ ...newStudent, guardianRelationship: e.target.value })
                              clearFieldError('guardianRelationship')
                            }}
                            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white"
                          >
                            <option value="Mother">Mother</option>
                            <option value="Brother">Brother</option>
                            <option value="Sister">Sister</option>
                            <option value="Uncle">Uncle</option>
                            <option value="Aunt">Aunt</option>
                            <option value="Grandfather">Grandfather</option>
                            <option value="Grandmother">Grandmother</option>
                            <option value="Legal Guardian">Legal Guardian</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                            Guardian Contact Phone <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            value={newStudent.guardianPhone}
                            onChange={(e) => {
                              setNewStudent({ ...newStudent, guardianPhone: e.target.value })
                              clearFieldError('guardianPhone')
                            }}
                            placeholder="+92 300 7654321"
                            className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none bg-white transition-all ${
                              formErrors.guardianPhone
                                ? 'border-red-500 bg-red-50/30 focus:ring-2 focus:ring-red-400'
                                : 'border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20'
                            }`}
                          />
                          {formErrors.guardianPhone && (
                            <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> {formErrors.guardianPhone}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                            Guardian Email
                          </label>
                          <input
                            type="email"
                            value={newStudent.guardianEmail}
                            onChange={(e) => setNewStudent({ ...newStudent, guardianEmail: e.target.value })}
                            placeholder="guardian@gmail.com"
                            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                            Guardian CNIC Number
                          </label>
                          <input
                            type="text"
                            value={newStudent.guardianCnic}
                            onChange={(e) => setNewStudent({ ...newStudent, guardianCnic: e.target.value })}
                            placeholder="42101-9876543-2"
                            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                            Guardian Occupation
                          </label>
                          <input
                            type="text"
                            value={newStudent.guardianOccupation}
                            onChange={(e) => setNewStudent({ ...newStudent, guardianOccupation: e.target.value })}
                            placeholder="e.g. Teacher, Doctor, Business"
                            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════════════
                  STEP 3: ACADEMIC ENROLLMENT & PLACEMENT
                  ══════════════════════════════════════════════════════════════════ */}
              {currentStep === 3 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100 text-gray-800">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">Academic Placement & History</h3>
                  </div>

                  {/* Class Selection & Section Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                        Academic Class / Grade <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={newStudent.classId}
                        onChange={(e) => {
                          const targetCls = displayClasses.find(c => String(c._id) === String(e.target.value))
                          const selectedClassId = e.target.value
                          setNewStudent({
                            ...newStudent,
                            classId: selectedClassId,
                            sectionId: targetCls?.sections?.[0] || 'A',
                          })
                          clearFieldError('classId')
                          fetchFeeStructuresForClass(selectedClassId)
                        }}
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white font-medium"
                      >
                        {displayClasses.map(c => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                        Section Assignment <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        {modalClassSections.map((sec) => (
                          <button
                            key={sec}
                            type="button"
                            onClick={() => {
                              setNewStudent(prev => ({ ...prev, sectionId: sec }))
                              clearFieldError('sectionId')
                            }}
                            className={`flex-1 py-2.5 rounded-xl font-bold text-sm border transition-all ${
                              newStudent.sectionId === sec
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {sec}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={newStudent.sectionId}
                        onChange={(e) => {
                          setNewStudent({ ...newStudent, sectionId: e.target.value.toUpperCase() })
                          clearFieldError('sectionId')
                        }}
                        placeholder="Custom Section (e.g. C, D)"
                        className="w-full mt-2 px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-600/20 uppercase font-bold"
                      />
                    </div>
                  </div>

                  {/* Joining Date & Previous School */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                        Date of Admission / Joining
                      </label>
                      <input
                        type="date"
                        value={newStudent.joiningDate}
                        onChange={(e) => setNewStudent({ ...newStudent, joiningDate: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                        Previous School / Institute
                      </label>
                      <input
                        type="text"
                        value={newStudent.previousSchool}
                        onChange={(e) => setNewStudent({ ...newStudent, previousSchool: e.target.value })}
                        placeholder="e.g. Army Public School, City School"
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════════════
                  STEP 4: FEE STRUCTURE & CONCESSION SETUP
                  ══════════════════════════════════════════════════════════════════ */}
              {currentStep === 4 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100 text-gray-800">
                    <div className="flex items-center gap-2">
                      <CircleDollarSign className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">Fee Schedule & Concession Setup</h3>
                    </div>
                    <span className="text-xs font-semibold text-gray-500">
                      Class: <strong>{currentModalClass?.name}</strong>
                    </span>
                  </div>

                  {/* 1. Fee Structures Selection List */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                          Applicable Fee Heads
                        </p>
                        <p className="text-[11px] text-gray-500">Select active fees for this grade level</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setNewStudent(prev => ({
                              ...prev,
                              feeSetup: {
                                ...prev.feeSetup,
                                selectedFeeStructureIds: classFeeStructures.map(s => s._id),
                              }
                            }))
                          }}
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold"
                        >
                          Select All
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          type="button"
                          onClick={() => {
                            setNewStudent(prev => ({
                              ...prev,
                              feeSetup: {
                                ...prev.feeSetup,
                                selectedFeeStructureIds: [],
                              }
                            }))
                          }}
                          className="text-[11px] text-gray-500 hover:text-gray-700 font-medium"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    {loadingFeeStructures ? (
                      <div className="py-6 text-center text-xs text-gray-500 animate-pulse">
                        Loading class fee structures…
                      </div>
                    ) : classFeeStructures.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {classFeeStructures.map((structure) => {
                          const isSelected = newStudent.feeSetup?.selectedFeeStructureIds?.includes(structure._id)
                          return (
                            <div
                              key={structure._id}
                              onClick={() => {
                                setNewStudent(prev => {
                                  const currentIds = prev.feeSetup?.selectedFeeStructureIds || []
                                  const nextIds = currentIds.includes(structure._id)
                                    ? currentIds.filter(id => id !== structure._id)
                                    : [...currentIds, structure._id]
                                  return {
                                    ...prev,
                                    feeSetup: { ...prev.feeSetup, selectedFeeStructureIds: nextIds }
                                  }
                                })
                              }}
                              className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                                isSelected
                                  ? 'bg-emerald-50/60 border-emerald-300 shadow-xs ring-1 ring-emerald-400'
                                  : 'bg-white border-gray-200 hover:bg-gray-50 opacity-75'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                                  isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-300 bg-white'
                                }`}>
                                  {isSelected && <Check className="w-3.5 h-3.5" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-gray-900 truncate">{structure.title || structure.feeType}</p>
                                  <p className="text-[10px] text-gray-500">Due: {structure.dueDate ? formatDate(structure.dueDate) : '—'}</p>
                                </div>
                              </div>
                              <span className="font-bold text-xs text-emerald-800 ml-2 whitespace-nowrap">
                                {formatPKR(structure.amount)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="p-4 bg-white rounded-xl border border-dashed border-gray-300 text-center text-xs text-gray-500">
                        No active fee structures found for {currentModalClass?.name || 'this class'}. Fees can be assigned later.
                      </div>
                    )}
                  </div>

                  {/* 2. Scholarship & Concession Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                        Scholarship & Concession Waiver
                      </span>
                      <span className="text-[10px] text-gray-400">Optional discount category</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          Concession Category
                        </label>
                        <select
                          value={newStudent.feeSetup?.concessionType || 'None'}
                          onChange={(e) => {
                            const val = e.target.value
                            setNewStudent(prev => ({
                              ...prev,
                              feeSetup: {
                                ...prev.feeSetup,
                                concessionType: val,
                                discountValue: val === 'None' ? 0 : prev.feeSetup.discountValue,
                              }
                            }))
                            clearFieldError('discountValue')
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-600/20 bg-white font-medium"
                        >
                          <option value="None">None (Standard Tuition)</option>
                          <option value="Need-Based Scholarship">Need-Based Scholarship</option>
                          <option value="Merit Scholarship">Merit Scholarship</option>
                          <option value="Sibling Concession">Sibling Concession</option>
                          <option value="Teacher Child Discount">Teacher Child Discount</option>
                          <option value="Staff Concession">Staff Concession</option>
                          <option value="Special Management Concession">Special Management Concession</option>
                          <option value="Orphan Support">Orphan Support</option>
                        </select>
                      </div>

                      {newStudent.feeSetup?.concessionType !== 'None' && (
                        <>
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                              Discount Mode & Value
                            </label>
                            <div className="flex gap-1.5">
                              <div className="flex bg-white rounded-xl border border-gray-300 p-0.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewStudent(prev => ({
                                      ...prev,
                                      feeSetup: { ...prev.feeSetup, discountType: 'percentage' }
                                    }))
                                    clearFieldError('discountValue')
                                  }}
                                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                                    newStudent.feeSetup?.discountType === 'percentage'
                                      ? 'bg-indigo-600 text-white'
                                      : 'text-gray-600 hover:text-gray-900'
                                  }`}
                                >
                                  %
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewStudent(prev => ({
                                      ...prev,
                                      feeSetup: { ...prev.feeSetup, discountType: 'fixed' }
                                    }))
                                    clearFieldError('discountValue')
                                  }}
                                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                                    newStudent.feeSetup?.discountType === 'fixed'
                                      ? 'bg-indigo-600 text-white'
                                      : 'text-gray-600 hover:text-gray-900'
                                  }`}
                                >
                                  PKR
                                </button>
                              </div>
                              <input
                                type="number"
                                min="0"
                                max={newStudent.feeSetup?.discountType === 'percentage' ? 100 : grossFeeTotal}
                                value={newStudent.feeSetup?.discountValue || ''}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? '' : Math.max(0, Number(e.target.value))
                                  setNewStudent(prev => ({
                                    ...prev,
                                    feeSetup: { ...prev.feeSetup, discountValue: val }
                                  }))
                                  clearFieldError('discountValue')
                                }}
                                placeholder={newStudent.feeSetup?.discountType === 'percentage' ? 'e.g. 25' : 'e.g. 2000'}
                                className={`flex-1 px-3 py-2 border rounded-xl text-xs outline-none bg-white font-bold ${
                                  formErrors.discountValue ? 'border-red-500' : 'border-gray-300 focus:ring-2 focus:ring-indigo-600/20'
                                }`}
                              />
                            </div>
                            {formErrors.discountValue && (
                              <p className="text-[10px] text-red-600 mt-1 font-semibold">{formErrors.discountValue}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                              Approval Remarks / Reason
                            </label>
                            <input
                              type="text"
                              value={newStudent.feeSetup?.concessionReason || ''}
                              onChange={(e) => setNewStudent(prev => ({
                                ...prev,
                                feeSetup: { ...prev.feeSetup, concessionReason: e.target.value }
                              }))}
                              placeholder="e.g. Approved on merit rank #1"
                              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-600/20 bg-white"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 3. Live Financial Breakdown Banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md">
                    <div className="grid grid-cols-3 gap-3 text-center divide-x divide-white/10">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300">Gross Total</p>
                        <p className="text-base font-bold mt-0.5">{formatPKR(grossFeeTotal)}</p>
                        <p className="text-[10px] text-gray-400">{selectedFeeStructures.length} fee item(s)</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">Concession</p>
                        <p className="text-base font-bold text-emerald-400 mt-0.5">
                          {calculatedDiscount > 0 ? `- ${formatPKR(calculatedDiscount)}` : 'PKR 0'}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">{newStudent.feeSetup?.concessionType || 'None'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">Net Payable</p>
                        <p className="text-lg font-black text-amber-300 mt-0.5">{formatPKR(netPayableTotal)}</p>
                        <p className="text-[10px] text-indigo-200 font-semibold">Net Enrollment Dues</p>
                      </div>
                    </div>
                  </div>

                  {/* 4. Payment Collection / Challan Status Option */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-gray-200 space-y-3">
                    <label className="block text-xs font-bold text-gray-800 uppercase tracking-wide">
                      Payment Collection & Voucher Issuance
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => setNewStudent(prev => ({
                          ...prev,
                          feeSetup: { ...prev.feeSetup, initialPaymentStatus: 'Pending' }
                        }))}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          newStudent.feeSetup?.initialPaymentStatus === 'Pending'
                            ? 'bg-amber-50/70 border-amber-400 shadow-sm ring-2 ring-amber-400/30'
                            : 'bg-white border-gray-200 hover:bg-gray-50 opacity-80'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Receipt className="w-4 h-4 text-amber-600" />
                          <span className="text-xs font-bold text-gray-900">Mark as Pending (Issue Challan)</span>
                        </div>
                        <p className="text-[11px] text-gray-500">
                          Issues 3-copy student bank fee voucher for counter or bank collection.
                        </p>
                      </div>

                      <div
                        onClick={() => setNewStudent(prev => ({
                          ...prev,
                          feeSetup: { ...prev.feeSetup, initialPaymentStatus: 'Paid' }
                        }))}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          newStudent.feeSetup?.initialPaymentStatus === 'Paid'
                            ? 'bg-emerald-50/70 border-emerald-400 shadow-sm ring-2 ring-emerald-400/30'
                            : 'bg-white border-gray-200 hover:bg-gray-50 opacity-80'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Wallet className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-bold text-gray-900">Collect Upfront (Mark as Paid)</span>
                        </div>
                        <p className="text-[11px] text-gray-500">
                          Record immediate payment at registration desk & generate official receipt.
                        </p>
                      </div>
                    </div>

                    {newStudent.feeSetup?.initialPaymentStatus === 'Paid' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 animate-in fade-in duration-150">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                            Payment Mode <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={newStudent.feeSetup?.paymentMode || 'Cash'}
                            onChange={(e) => setNewStudent(prev => ({
                              ...prev,
                              feeSetup: { ...prev.feeSetup, paymentMode: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-600/20 bg-white font-medium"
                          >
                            <option value="Cash">Cash (Counter Collection)</option>
                            <option value="Bank Transfer">Bank Transfer / Deposit</option>
                            <option value="Online">Online Portal</option>
                            <option value="Cheque">Cheque / Pay Order</option>
                            <option value="JazzCash">JazzCash</option>
                            <option value="EasyPaisa">EasyPaisa</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                            Reference / Remarks
                          </label>
                          <input
                            type="text"
                            value={newStudent.feeSetup?.paymentRemarks || ''}
                            onChange={(e) => setNewStudent(prev => ({
                              ...prev,
                              feeSetup: { ...prev.feeSetup, paymentRemarks: e.target.value }
                            }))}
                            placeholder="e.g. Counter deposit or Bank txn #8942"
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-600/20 bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════════════
                  STEP 5: HEALTH, MEDICAL & EMERGENCY CONTACT
                  ══════════════════════════════════════════════════════════════════ */}
              {currentStep === 5 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100 text-gray-800">
                    <HeartPulse className="w-4 h-4 text-red-500" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">Health, Medical & Emergency Contact</h3>
                  </div>

                  {/* Blood Group Selection Pills */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                      Blood Group
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                        <button
                          key={bg}
                          type="button"
                          onClick={() => setNewStudent({ ...newStudent, bloodGroup: bg })}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                            newStudent.bloodGroup === bg
                              ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-200 scale-105'
                              : 'bg-white text-gray-700 border-gray-200 hover:bg-red-50 hover:text-red-700'
                          }`}
                        >
                          {bg}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Medical Notes / Allergies */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                      Medical Notes, Dietary Allergies, or Special Care
                    </label>
                    <textarea
                      rows={2}
                      value={newStudent.medicalNotes}
                      onChange={(e) => setNewStudent({ ...newStudent, medicalNotes: e.target.value })}
                      placeholder="None reported / General fitness"
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 resize-none"
                    />
                  </div>

                  {/* Secondary Emergency Contact Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between pb-1 border-b border-gray-200">
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                        Alternative Emergency Contact (Optional)
                      </span>
                      <span className="text-[10px] text-gray-400">Defaults to primary guardian if left blank</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Contact Name</label>
                        <input
                          type="text"
                          value={newStudent.emergencyName}
                          onChange={(e) => setNewStudent({ ...newStudent, emergencyName: e.target.value })}
                          placeholder="e.g. Uncle Farhan"
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-600/20 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Contact Phone</label>
                        <input
                          type="tel"
                          value={newStudent.emergencyPhone}
                          onChange={(e) => setNewStudent({ ...newStudent, emergencyPhone: e.target.value })}
                          placeholder="+92 300 0000000"
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-600/20 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Relationship</label>
                        <input
                          type="text"
                          value={newStudent.emergencyRelationship}
                          onChange={(e) => setNewStudent({ ...newStudent, emergencyRelationship: e.target.value })}
                          placeholder="Guardian / Uncle"
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-600/20 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Summary Review Box */}
                  <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-indigo-900">
                    <div>
                      <p className="font-bold">Ready to Register:</p>
                      <p className="text-indigo-700">
                        {newStudent.fullName || 'Student'} · {currentModalClass?.name} ({newStudent.sectionId}) · Net Fee: <strong>{formatPKR(netPayableTotal)}</strong> ({newStudent.feeSetup?.initialPaymentStatus === 'Paid' ? 'Paid Upfront' : 'Pending Challan'})
                      </p>
                    </div>
                    <Badge variant="indigo">Step 5 of 5</Badge>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer / Navigation Controls */}
            <div className="p-4 bg-slate-50 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
              <div>
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Previous Step
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      resetForm()
                      onClose()
                    }}
                    className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-600 text-xs font-semibold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {currentStep < 5 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200 flex items-center gap-1.5 transition-all"
                  >
                    <span>Next: {WIZARD_STEPS[currentStep]?.label}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleCreate}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-200 flex items-center gap-2 transition-all disabled:opacity-60"
                  >
                    {submitting ? (
                      <span>Registering Student…</span>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Complete Registration</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {registrationSuccessData && (
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100">
            <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-center relative">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-black">Student Registered Successfully!</h3>
              <p className="text-xs text-emerald-100 mt-1 font-medium">
                Enrollment and fee structure initialized in the system database.
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Student Identification Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200 flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-gray-900">
                    {registrationSuccessData.data?.fullName || 'Enrolled Student'}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    ID: <strong className="text-indigo-700 font-mono font-bold">{registrationSuccessData.data?.studentId}</strong>
                  </p>
                </div>
                <Badge variant={registrationSuccessData.payment ? 'success' : 'warning'}>
                  {registrationSuccessData.payment ? 'Fee Paid' : 'Challan Pending'}
                </Badge>
              </div>

              {/* Financial Snapshot */}
              <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-1.5 text-xs text-indigo-950">
                {registrationSuccessData.payment ? (
                  <div className="flex justify-between items-center">
                    <span>Payment Receipt No:</span>
                    <strong className="font-mono text-emerald-700">{registrationSuccessData.receiptNo || 'REC-XXXXX'}</strong>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <span>Generated Invoices:</span>
                    <strong>{registrationSuccessData.fees?.length || 1} Fee Item(s)</strong>
                  </div>
                )}
                {registrationSuccessData.payment && (
                  <div className="flex justify-between items-center">
                    <span>Amount Collected Upfront:</span>
                    <strong className="text-emerald-800 text-sm font-black">{formatPKR(registrationSuccessData.payment?.amountPaid)}</strong>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                {registrationSuccessData.paymentId && (
                  <button
                    type="button"
                    onClick={() => handleDownloadPDF(
                      `/finance/receipt/${registrationSuccessData.paymentId}`,
                      `Receipt_${registrationSuccessData.receiptNo || 'Payment'}.pdf`
                    )}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-200 flex items-center justify-center gap-2 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Payment Receipt (.pdf)</span>
                  </button>
                )}

                {registrationSuccessData.firstFeeId && !registrationSuccessData.paymentId && (
                  <button
                    type="button"
                    onClick={() => handleDownloadPDF(
                      `/finance/challan/${registrationSuccessData.firstFeeId}/pdf`,
                      `Fee_Challan_${registrationSuccessData.data?.studentId || 'Challan'}.pdf`
                    )}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Fee Challan Voucher (.pdf)</span>
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2.5">
                  <a
                    href={`/students/${registrationSuccessData.data?._id}`}
                    className="py-2.5 bg-slate-100 hover:bg-slate-200 text-gray-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-4 h-4 text-indigo-600" />
                    <span>View Profile</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => { setRegistrationSuccessData(null); onClose(); }}
                    className="py-2.5 border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-xl transition-colors"
                  >
                    Done / Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
  )
}
