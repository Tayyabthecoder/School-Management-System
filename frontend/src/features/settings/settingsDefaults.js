// Default values and helpers for the Settings screens (school profile, academic config, challan layout).
export const ROLE_COLORS = {
  super_admin: 'danger',
  teacher: 'primary',
  accountant: 'success',
  hr_manager: 'warning',
  student: 'secondary',
}

export const DEFAULT_CHALLAN_CONFIG = {
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

export const mergeChallanConfig = (incoming) => {
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

export const DEFAULT_SCHOOL_PROFILE = {
  schoolName: '',
  regNo: '',
  email: '',
  phone: '',
  hotline: '',
  address: '',
  website: '',
  motto: '',
  currency: 'PKR',
  timezone: 'Asia/Karachi (GMT+5)',
  dateFormat: 'DD/MM/YYYY',
}

export const DEFAULT_ACADEMIC_CONFIG = {
  activeTerm: 'Term 1',
  attendanceAlertThreshold: 75,
  providentFundPercent: 0,
}

// ─── Main Settings Page ───────────────────────────────────────────────────────