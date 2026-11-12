import React, { useState, useEffect, useRef } from 'react'
import {
  GraduationCap,
  User,
  Shield,
  BookOpen,
  CircleDollarSign,
  HeartPulse,
  X,
  Check,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react'
import api from '../../../lib/axios'
import { announceCredentials } from '../../../lib/credentials'
import { useToast } from '../../../store/toastStore'
import { formatPKR, toLocalDateInput } from '../../../lib/formatters'
import Badge from '../../../components/ui/Badge'
import { FALLBACK_GRADES } from '../../../constants/grades'
import { downloadBlobResponse } from '../../../lib/download'
import StepBasicInfo from './RegistrationSteps/StepBasicInfo'
import StepFatherGuardian from './RegistrationSteps/StepFatherGuardian'
import StepAcademics from './RegistrationSteps/StepAcademics'
import StepFeeConcession from './RegistrationSteps/StepFeeConcession'
import StepHealthEmergency from './RegistrationSteps/StepHealthEmergency'
import RegistrationSuccessDialog from './RegistrationSteps/RegistrationSuccessDialog'
import { logError } from '../../../lib/logger'

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
  joiningDate: toLocalDateInput(),
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
  const toast = useToast()
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
      logError('Failed to fetch fee structures', err)
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
      downloadBlobResponse(res, filename)
      toast.success('Document downloaded successfully')
    } catch (err) {
      logError(err)
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

  const copyFatherToGuardian = () => {
    setNewStudent(prev => ({
      ...prev,
      guardianName: prev.fatherName || '',
      guardianRelationship: 'Father',
      guardianPhone: prev.fatherPhone || '',
      guardianEmail: prev.fatherEmail || '',
      guardianCnic: prev.fatherCnic || '',
      guardianOccupation: prev.fatherOccupation || '',
    }))
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
        announceCredentials(res.data.initialCredentials)
        onClose()
        setRegistrationSuccessData(res.data)
        resetForm()
        if (onSuccess) onSuccess(res.data.data)
      }
    } catch (err) {
      logError(err)
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
              <div className="grid grid-cols-5 gap-2">
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
                        <p className={`text-[11px] font-bold leading-tight truncate ${isCurrent ? 'text-white' : 'text-gray-800'}`}>
                          {s.label}
                        </p>
                        <p className={`text-[9px] truncate ${isCurrent ? 'text-indigo-200' : 'text-gray-400'}`}>
                          {s.sub}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step Content Area */}
            <div className="p-6 overflow-y-auto flex-1">
              {currentStep === 1 && (
                <StepBasicInfo
                  newStudent={newStudent}
                  setNewStudent={setNewStudent}
                  formErrors={formErrors}
                  clearFieldError={clearFieldError}
                  handlePhotoUpload={handlePhotoUpload}
                />
              )}

              {currentStep === 2 && (
                <StepFatherGuardian
                  newStudent={newStudent}
                  setNewStudent={setNewStudent}
                  formErrors={formErrors}
                  clearFieldError={clearFieldError}
                  copyFatherToGuardian={copyFatherToGuardian}
                />
              )}

              {currentStep === 3 && (
                <StepAcademics
                  newStudent={newStudent}
                  setNewStudent={setNewStudent}
                  formErrors={formErrors}
                  clearFieldError={clearFieldError}
                  displayClasses={displayClasses}
                  modalClassSections={modalClassSections}
                  fetchFeeStructuresForClass={fetchFeeStructuresForClass}
                />
              )}

              {currentStep === 4 && (
                <StepFeeConcession
                  newStudent={newStudent}
                  setNewStudent={setNewStudent}
                  formErrors={formErrors}
                  clearFieldError={clearFieldError}
                  currentModalClass={currentModalClass}
                  classFeeStructures={classFeeStructures}
                  loadingFeeStructures={loadingFeeStructures}
                  selectedFeeStructures={selectedFeeStructures}
                  grossFeeTotal={grossFeeTotal}
                  calculatedDiscount={calculatedDiscount}
                  netPayableTotal={netPayableTotal}
                />
              )}

              {currentStep === 5 && (
                <StepHealthEmergency
                  newStudent={newStudent}
                  setNewStudent={setNewStudent}
                  formErrors={formErrors}
                  currentModalClass={currentModalClass}
                  netPayableTotal={netPayableTotal}
                />
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
        <RegistrationSuccessDialog
          registrationSuccessData={registrationSuccessData}
          onClose={onClose}
          handleDownloadPDF={handleDownloadPDF}
          setRegistrationSuccessData={setRegistrationSuccessData}
        />
      )}
    </>
  )
}
