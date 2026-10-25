import React, { useEffect, useState, useCallback } from 'react'
import {
  School,
  Shield,
  Users,
  Calendar,
  FileSpreadsheet,
  GraduationCap,
  Download,
  Upload,
} from 'lucide-react'
import Breadcrumb from '../../components/layout/Breadcrumb'
import api from '../../lib/axios'
import { useToastStore } from '../../store/toastStore'
import { useAuthStore } from '../../store/authStore'

import {
  CreateUserModal,
  ResetPasswordModal,
  CreateAcademicYearModal,
  AddPaymentMethodModal,
  AddParticularModal,
} from './components/SettingsModals'
import SchoolProfileTab from './components/SchoolProfileTab'
import AcademicSessionsTab from './components/AcademicSessionsTab'
import GradingScaleTab from './components/GradingScaleTab'
import ChallanBuilderTab from './components/ChallanBuilderTab'
import UserManagementTab from './components/UserManagementTab'
import SecuritySystemTab from './components/SecuritySystemTab'

// ─── Constants ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'profile', label: 'School Profile', icon: School },
  { id: 'academic', label: 'Academic Sessions', icon: Calendar },
  { id: 'grading', label: 'Grading Scale', icon: GraduationCap },
  { id: 'challan', label: 'Fee Challan Settings', icon: FileSpreadsheet },
  { id: 'users', label: 'User & RBAC Management', icon: Users },
  { id: 'security', label: 'Security & System', icon: Shield },
]

const ROLE_COLORS = {
  super_admin: 'danger',
  teacher: 'primary',
  accountant: 'success',
  hr_manager: 'warning',
  student: 'secondary',
}

const DEFAULT_CHALLAN_CONFIG = {
  layout: '3-part',
  instituteName: 'AL-HAQ MODEL ACADEMY & COLLEGE',
  subHeader: 'BANK & DIGITAL PAYMENT FEE CHALLAN - ACADEMIC 2026',
  copies: [
    { name: 'Outer Office Copy', subtitle: '(Bank / External Clearing Copy)', badgeColor: '#1E3A8A' },
    { name: 'Inner Office Copy', subtitle: '(School Administration & Accounts Record)', badgeColor: '#065F46' },
    { name: 'Student Copy', subtitle: '(Student & Parent Personal Record)', badgeColor: '#581C87' },
  ],
  paymentMethods: [
    {
      id: 'pm-1',
      type: 'bank',
      name: 'Habib Bank Limited (HBL) / Meezan Bank',
      accountTitle: 'SMS Educational Trust Fee Collection',
      accountNumber: '0142-79012345-03',
      branchCode: '0142',
      branchName: 'Campus Main Branch',
      iban: 'PK36MEZN0001427901234503',
      isEnabled: true,
      isPrimary: true,
    },
    {
      id: 'pm-2',
      type: 'easypaisa',
      name: 'Easypaisa Merchant',
      accountTitle: 'SMS School Fee A/C',
      accountNumber: 'Till ID: 789012 (0300-1234567)',
      branchCode: '',
      branchName: '',
      iban: '',
      isEnabled: true,
      isPrimary: false,
    },
    {
      id: 'pm-3',
      type: 'jazzcash',
      name: 'JazzCash Direct',
      accountTitle: 'SMS School Fee A/C',
      accountNumber: 'Till ID: 654321',
      branchCode: '',
      branchName: '',
      iban: '',
      isEnabled: true,
      isPrimary: false,
    },
    {
      id: 'pm-4',
      type: 'raast',
      name: 'Raast Instant Pay / 1Bill',
      accountTitle: 'SMS Academy Trust',
      accountNumber: 'Raast ID: 03001234567',
      branchCode: '',
      branchName: '',
      iban: '',
      isEnabled: true,
      isPrimary: false,
    },
  ],
  particulars: [
    { id: 'part-1', name: 'Monthly Tuition Fee', type: 'tuition', defaultAmount: 8000, isEnabled: true, isDeduction: false },
    { id: 'part-2', name: 'Examination & Assessment Fee', type: 'fixed', defaultAmount: 500, isEnabled: true, isDeduction: false },
    { id: 'part-3', name: 'Library & Computer Lab Charges', type: 'fixed', defaultAmount: 300, isEnabled: true, isDeduction: false },
    { id: 'part-4', name: 'Sports & Student Development', type: 'fixed', defaultAmount: 200, isEnabled: false, isDeduction: false },
  ],
  lateFeeSurcharge: 500,
  instructions: [
    '1. Fee can be deposited at any online branch of designated banks.',
    '2. Pay via Easypaisa / JazzCash / Banking Apps using student ID / Till ID.',
    '3. Late fee surcharge of PKR 500 applies strictly after the due date.',
    '4. Fees once deposited are non-refundable and non-transferable.',
  ],
  signatories: {
    leftTitle: 'Depositor / Student Sign',
    rightTitle: 'Bank / Cashier Stamp',
    middleTitle: 'Accounts Officer',
  },
}

const mergeChallanConfig = (incoming) => {
  if (!incoming || typeof incoming !== 'object') return DEFAULT_CHALLAN_CONFIG
  const targetLayout = incoming.layout || DEFAULT_CHALLAN_CONFIG.layout
  let mergedCopies = Array.isArray(incoming.copies) && incoming.copies.length > 0 
    ? [...incoming.copies] 
    : [...DEFAULT_CHALLAN_CONFIG.copies]

  if (targetLayout === '2-part') {
    if (mergedCopies.length > 2) {
      mergedCopies = mergedCopies.slice(0, 2)
    }
    if (mergedCopies.length < 2) {
      mergedCopies = [
        { name: 'Office Copy', subtitle: '(School Administration & Accounts Record)', badgeColor: '#1E3A8A' },
        { name: 'Student Copy', subtitle: '(Student & Parent Personal Record)', badgeColor: '#065F46' },
      ]
    }
  } else {
    // 3-part
    if (mergedCopies.length > 3) {
      mergedCopies = mergedCopies.slice(0, 3)
    }
    if (mergedCopies.length < 3) {
      mergedCopies = [...DEFAULT_CHALLAN_CONFIG.copies]
    }
  }

  return {
    ...DEFAULT_CHALLAN_CONFIG,
    ...incoming,
    layout: targetLayout,
    instituteName: incoming.instituteName || DEFAULT_CHALLAN_CONFIG.instituteName,
    subHeader: incoming.subHeader || DEFAULT_CHALLAN_CONFIG.subHeader,
    copies: mergedCopies,
    paymentMethods: Array.isArray(incoming.paymentMethods) 
      ? incoming.paymentMethods 
      : DEFAULT_CHALLAN_CONFIG.paymentMethods,
    particulars: Array.isArray(incoming.particulars) 
      ? incoming.particulars.map((p, idx) => ({
          id: p.id || `part-${idx}`,
          name: p.name || 'Fee Head',
          type: p.type || 'fixed',
          defaultAmount: typeof p.defaultAmount === 'number' ? p.defaultAmount : Number(p.defaultAmount) || 0,
          isEnabled: p.isEnabled !== false,
          isDeduction: Boolean(p.isDeduction),
        }))
      : DEFAULT_CHALLAN_CONFIG.particulars,
    instructions: Array.isArray(incoming.instructions) 
      ? incoming.instructions 
      : DEFAULT_CHALLAN_CONFIG.instructions,
    signatories: {
      ...DEFAULT_CHALLAN_CONFIG.signatories,
      ...(incoming.signatories || {}),
    },
    lateFeeSurcharge: typeof incoming.lateFeeSurcharge === 'number' ? incoming.lateFeeSurcharge : DEFAULT_CHALLAN_CONFIG.lateFeeSurcharge,
  }
}

// ─── Main Settings Page ───────────────────────────────────────────────────────
export default function SettingsPage() {
  const toast = useToastStore()
  const { user } = useAuthStore()

  const [activeTab, setActiveTab] = useState('profile')

  // School Profile state
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('sms_school_profile')
    return saved
      ? JSON.parse(saved)
      : {
          schoolName: 'Al-Haq Model Academy & College',
          regNo: 'SMS-REG-2026-994',
          email: 'admin@alhaqacademy.edu.pk',
          phone: '+92 300 1234567',
          hotline: '+92 21 34567890',
          address: 'Campus Plot 42, Block 6, Gulshan-e-Iqbal, Karachi',
          website: 'https://alhaqacademy.edu.pk',
          motto: 'Knowledge, Integrity, Excellence',
          currency: 'PKR',
          timezone: 'Asia/Karachi (GMT+5)',
          dateFormat: 'DD/MM/YYYY',
        }
  })

  // Academic Sessions state
  const [academicYears, setAcademicYears] = useState([])
  const [loadingAY, setLoadingAY] = useState(true)
  const [showAYModal, setShowAYModal] = useState(false)
  const [academicConfig, setAcademicConfig] = useState(() => {
    const saved = localStorage.getItem('sms_academic_config')
    return saved
      ? JSON.parse(saved)
      : {
          activeTerm: 'Term 1',
          passingPercentage: 50,
          minAttendancePercentage: 75,
          maxStudentsPerSection: 35,
          attendanceAlertThreshold: 75,
          autoFeeOverdueAlerts: true,
        }
  })

  // Grading Scale state
  const [gradingScale, setGradingScale] = useState([
    { label: 'A+', minPercent: 90, maxPercent: 100 },
    { label: 'A', minPercent: 80, maxPercent: 89 },
    { label: 'B', minPercent: 70, maxPercent: 79 },
    { label: 'C', minPercent: 60, maxPercent: 69 },
    { label: 'D', minPercent: 50, maxPercent: 59 },
    { label: 'F', minPercent: 0, maxPercent: 49 },
  ])
  const [savingGradingScale, setSavingGradingScale] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingAcademic, setSavingAcademic] = useState(false)

  // Users state
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('all')
  const [showCreateUserModal, setShowCreateUserModal] = useState(false)
  const [selectedUserForReset, setSelectedUserForReset] = useState(null)

  // Challan Customization state
  const [challanConfig, setChallanConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('sms_challan_config')
      return saved ? mergeChallanConfig(JSON.parse(saved)) : DEFAULT_CHALLAN_CONFIG
    } catch {
      return DEFAULT_CHALLAN_CONFIG
    }
  })
  const safeChallanConfig = mergeChallanConfig(challanConfig)
  const [savingChallan, setSavingChallan] = useState(false)
  const [newInstructionText, setNewInstructionText] = useState('')
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false)
  const [showAddParticularModal, setShowAddParticularModal] = useState(false)

  // Security state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [systemHealth, setSystemHealth] = useState({ status: 'checking', timestamp: '' })

  // Fetch Academic Years
  const fetchAcademicYears = useCallback(async () => {
    setLoadingAY(true)
    try {
      const res = await api.get('/classes/academic-years')
      if (res.data?.success) setAcademicYears(res.data.data)
    } catch {
      setAcademicYears([
        {
          _id: 'ay-2026',
          year: 2026,
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          isActive: true,
          terms: [{ name: 'Term 1' }, { name: 'Term 2' }],
        },
      ])
    } finally {
      setLoadingAY(false)
    }
  }, [])

  // Fetch Challan Settings
  const fetchChallanSettings = useCallback(async () => {
    try {
      const res = await api.get('/finance/challan-settings')
      if (res.data?.success && res.data.data) {
        const merged = mergeChallanConfig(res.data.data)
        setChallanConfig(merged)
        localStorage.setItem('sms_challan_config', JSON.stringify(merged))
      }
    } catch {
      // Use existing localStorage fallback
    }
  }, [])

  // Fetch Users (Super Admin Only)
  const fetchUsers = useCallback(async () => {
    if (user?.roleName !== 'super_admin' && user?.role !== 'super_admin') {
      setLoadingUsers(false)
      return
    }
    setLoadingUsers(true)
    try {
      const res = await api.get('/users?limit=100')
      if (res.data?.success) setUsers(res.data.data)
    } catch {
      toast.error('Could not load user accounts (admin privileges required)')
    } finally {
      setLoadingUsers(false)
    }
  }, [user, toast])

  // Check System Health
  const checkHealth = useCallback(async () => {
    try {
      const res = await api.get('/health')
      setSystemHealth({
        status: res.data?.status === 'ok' ? 'Online & Healthy' : 'Degraded',
        timestamp: res.data?.timestamp || new Date().toISOString(),
        env: res.data?.env || 'development',
      })
    } catch {
      setSystemHealth({ status: 'Backend Offline / Error', timestamp: new Date().toISOString(), env: 'unknown' })
    }
  }, [])

  // Fetch School Settings from backend
  const fetchSchoolSettings = useCallback(async () => {
    try {
      const res = await api.get('/settings')
      if (res.data?.success && res.data.data) {
        const s = res.data.data
        setProfile(prev => ({
          ...prev,
          schoolName: s.schoolName ?? prev.schoolName,
          motto: s.schoolTagline ?? prev.motto,
          regNo: s.regNo ?? prev.regNo,
          primaryColor: s.primaryColor ?? prev.primaryColor,
          address: s.schoolAddress ?? prev.address,
          phone: s.schoolPhone ?? prev.phone,
          email: s.schoolEmail ?? prev.email,
          hotline: s.hotline ?? prev.hotline,
          website: s.website ?? prev.website,
          currency: s.currency ?? prev.currency,
          timezone: s.timezone ?? prev.timezone,
          dateFormat: s.dateFormat ?? prev.dateFormat,
        }))
        setAcademicConfig(prev => ({
          ...prev,
          activeTerm: s.activeTerm || prev.activeTerm,
          passingPercentage: s.passingPercentage !== undefined ? s.passingPercentage : prev.passingPercentage,
          minAttendancePercentage: s.minAttendancePercentage !== undefined ? s.minAttendancePercentage : prev.minAttendancePercentage,
          maxStudentsPerSection: s.maxStudentsPerSection !== undefined ? s.maxStudentsPerSection : prev.maxStudentsPerSection,
          attendanceAlertThreshold: s.attendanceAlertThreshold !== undefined ? s.attendanceAlertThreshold : 75,
          autoFeeOverdueAlerts: s.autoFeeOverdueAlerts !== undefined ? s.autoFeeOverdueAlerts : true,
        }))
        if (Array.isArray(s.gradingScale) && s.gradingScale.length > 0) {
          setGradingScale(s.gradingScale)
        }
      }
    } catch {
      // Fall back to local state
    }
  }, [])

  useEffect(() => {
    fetchAcademicYears()
    fetchChallanSettings()
    fetchUsers()
    checkHealth()
    fetchSchoolSettings()
  }, [fetchAcademicYears, fetchChallanSettings, fetchUsers, checkHealth, fetchSchoolSettings])

  // Save Challan Settings Handler
  const handleSaveChallanConfig = async (e) => {
    if (e) e.preventDefault()
    setSavingChallan(true)
    const payload = mergeChallanConfig(challanConfig)
    try {
      const res = await api.put('/finance/challan-settings', payload)
      if (res.data?.success) {
        const merged = mergeChallanConfig(res.data.data || payload)
        setChallanConfig(merged)
        localStorage.setItem('sms_challan_config', JSON.stringify(merged))
        toast.success('Fee Challan PDF settings and payment channels saved successfully!')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save challan settings to server')
    } finally {
      setSavingChallan(false)
    }
  }

  // Save Profile Handler
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault()
    setSavingProfile(true)
    try {
      const res = await api.patch('/settings', {
        schoolName: profile.schoolName,
        schoolTagline: profile.motto,
        regNo: profile.regNo,
        primaryColor: profile.primaryColor || '#3730A3',
        schoolAddress: profile.address,
        schoolPhone: profile.phone,
        schoolEmail: profile.email,
        hotline: profile.hotline,
        website: profile.website,
        currency: profile.currency,
        timezone: profile.timezone,
        dateFormat: profile.dateFormat,
      })
      if (res.data?.success) {
        localStorage.setItem('sms_school_profile', JSON.stringify(profile))
        toast.success('Institution profile settings saved successfully to server!')
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to update school profile')
    } finally {
      setSavingProfile(false)
    }
  }

  // Save Academic Config
  const handleSaveAcademicConfig = async (e) => {
    if (e) e.preventDefault()
    setSavingAcademic(true)
    try {
      const res = await api.patch('/settings', {
        activeTerm: academicConfig.activeTerm,
        passingPercentage: academicConfig.passingPercentage,
        minAttendancePercentage: academicConfig.minAttendancePercentage,
        maxStudentsPerSection: academicConfig.maxStudentsPerSection,
        attendanceAlertThreshold: academicConfig.attendanceAlertThreshold,
        autoFeeOverdueAlerts: academicConfig.autoFeeOverdueAlerts,
      })
      if (res.data?.success) {
        localStorage.setItem('sms_academic_config', JSON.stringify(academicConfig))
        toast.success('Academic policies and operational thresholds saved to server!')
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to update academic policy')
    } finally {
      setSavingAcademic(false)
    }
  }

  // Save Grading Scale
  const handleSaveGradingScale = async () => {
    setSavingGradingScale(true)
    try {
      const res = await api.patch('/settings', { gradingScale })
      if (res.data?.success) {
        toast.success('Grading scale thresholds saved successfully to server!')
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to save grading scale')
    } finally {
      setSavingGradingScale(false)
    }
  }

  // Export / Backup Configuration
  const handleExportConfig = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      schoolProfile: profile,
      academicConfig,
      gradingScale,
      challanConfig,
    }
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `SMS_Configuration_Backup_${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Configuration backup exported successfully!')
  }

  // Import / Restore Configuration
  const handleImportConfig = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const imported = JSON.parse(text)
      if (!imported.schoolProfile && !imported.challanConfig) {
        toast.error('Invalid configuration backup file.')
        return
      }
      if (imported.schoolProfile) {
        setProfile(imported.schoolProfile)
        await api.patch('/settings', {
          schoolName: imported.schoolProfile.schoolName,
          schoolTagline: imported.schoolProfile.motto,
          regNo: imported.schoolProfile.regNo,
          primaryColor: imported.schoolProfile.primaryColor,
          schoolAddress: imported.schoolProfile.address,
          schoolPhone: imported.schoolProfile.phone,
          schoolEmail: imported.schoolProfile.email,
          hotline: imported.schoolProfile.hotline,
          website: imported.schoolProfile.website,
          currency: imported.schoolProfile.currency,
          timezone: imported.schoolProfile.timezone,
          dateFormat: imported.schoolProfile.dateFormat,
        })
      }
      if (imported.academicConfig) {
        setAcademicConfig(imported.academicConfig)
        await api.patch('/settings', {
          activeTerm: imported.academicConfig.activeTerm,
          passingPercentage: imported.academicConfig.passingPercentage,
          minAttendancePercentage: imported.academicConfig.minAttendancePercentage,
          maxStudentsPerSection: imported.academicConfig.maxStudentsPerSection,
          attendanceAlertThreshold: imported.academicConfig.attendanceAlertThreshold,
          autoFeeOverdueAlerts: imported.academicConfig.autoFeeOverdueAlerts,
        })
      }
      if (Array.isArray(imported.gradingScale)) {
        setGradingScale(imported.gradingScale)
        await api.patch('/settings', { gradingScale: imported.gradingScale })
      }
      if (imported.challanConfig) {
        setChallanConfig(imported.challanConfig)
        await api.put('/finance/challan-settings', imported.challanConfig)
      }
      toast.success('Configuration restored successfully from backup!')
    } catch {
      toast.error('Failed to parse or restore configuration file.')
    } finally {
      e.target.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Breadcrumb
          title="System Settings & Administration"
          subtitle="Manage school identity, academic calendars, role access controls, and security."
        />
        <div className="flex items-center gap-2 self-start md:self-auto">
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer shadow-sm">
            <Upload className="w-3.5 h-3.5" />
            Import Backup
            <input type="file" accept=".json" onChange={handleImportConfig} className="hidden" />
          </label>
          <button
            type="button"
            onClick={handleExportConfig}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Export Backup
          </button>
        </div>
      </div>

      {/* ── Tabs Navigation ─────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-slate-800 pb-3">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none'
                  : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── Active Tab Content ──────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <SchoolProfileTab
          profile={profile}
          setProfile={setProfile}
          onSave={handleSaveProfile}
          savingProfile={savingProfile}
        />
      )}

      {activeTab === 'academic' && (
        <AcademicSessionsTab
          academicYears={academicYears}
          loadingAY={loadingAY}
          academicConfig={academicConfig}
          setAcademicConfig={setAcademicConfig}
          onOpenAYModal={() => setShowAYModal(true)}
          onSaveAcademicConfig={handleSaveAcademicConfig}
          savingAcademic={savingAcademic}
        />
      )}

      {activeTab === 'grading' && (
        <GradingScaleTab
          gradingScale={gradingScale}
          setGradingScale={setGradingScale}
          onSaveGradingScale={handleSaveGradingScale}
          savingGradingScale={savingGradingScale}
        />
      )}

      {activeTab === 'challan' && (
        <ChallanBuilderTab
          challanConfig={challanConfig}
          setChallanConfig={setChallanConfig}
          safeChallanConfig={safeChallanConfig}
          savingChallan={savingChallan}
          onSaveChallanConfig={handleSaveChallanConfig}
          onOpenAddPayment={() => setShowAddPaymentModal(true)}
          onOpenAddParticular={() => setShowAddParticularModal(true)}
          newInstructionText={newInstructionText}
          setNewInstructionText={setNewInstructionText}
          DEFAULT_CHALLAN_CONFIG={DEFAULT_CHALLAN_CONFIG}
          mergeChallanConfig={mergeChallanConfig}
        />
      )}

      {activeTab === 'users' && (
        <UserManagementTab
          users={users}
          loadingUsers={loadingUsers}
          userSearch={userSearch}
          setUserSearch={setUserSearch}
          userRoleFilter={userRoleFilter}
          setUserRoleFilter={setUserRoleFilter}
          onRefreshUsers={fetchUsers}
          onOpenCreateUser={() => setShowCreateUserModal(true)}
          onSelectUserForReset={setSelectedUserForReset}
          ROLE_COLORS={ROLE_COLORS}
        />
      )}

      {activeTab === 'security' && (
        <SecuritySystemTab
          user={user}
          passwordForm={passwordForm}
          setPasswordForm={setPasswordForm}
          systemHealth={systemHealth}
          onCheckHealth={checkHealth}
        />
      )}

      {/* ── Modals ─────────────────────────────────────────────────── */}
      <CreateUserModal
        open={showCreateUserModal}
        onClose={() => setShowCreateUserModal(false)}
        onCreated={(newUser) => setUsers((prev) => [newUser, ...prev])}
      />

      <ResetPasswordModal
        open={!!selectedUserForReset}
        user={selectedUserForReset}
        onClose={() => setSelectedUserForReset(null)}
      />

      <CreateAcademicYearModal
        open={showAYModal}
        onClose={() => setShowAYModal(false)}
        onCreated={(newAY) => setAcademicYears((prev) => [newAY, ...prev])}
      />

      <AddPaymentMethodModal
        open={showAddPaymentModal}
        onClose={() => setShowAddPaymentModal(false)}
        onAdd={(newMethod) => {
          setChallanConfig((prev) => ({
            ...prev,
            paymentMethods: [...prev.paymentMethods, newMethod],
          }))
          toast.success(`Payment channel "${newMethod.name}" added.`)
        }}
      />

      <AddParticularModal
        open={showAddParticularModal}
        onClose={() => setShowAddParticularModal(false)}
        onAdd={(newParticular) => {
          setChallanConfig((prev) => ({
            ...prev,
            particulars: [...prev.particulars, newParticular],
          }))
          toast.success(`Fee Head "${newParticular.name}" added.`)
        }}
      />
    </div>
  )
}
