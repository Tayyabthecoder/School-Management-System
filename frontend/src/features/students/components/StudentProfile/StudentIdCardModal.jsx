import React, { useState } from 'react'
import {
  GraduationCap,
  Printer,
  X,
  RotateCcw,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT: Front Card
// ─────────────────────────────────────────────────────────────────────────────
export function FrontCard({
  student,
  fatherOrGuardianLabel,
  fatherOrGuardianValue,
  phoneDisplay,
  formattedDob,
  formattedDoa,
  sessionYear,
}) {
  return (
    <div
      id="student-id-front"
      className="relative w-[440px] h-[278px] bg-white rounded-[16px] overflow-hidden shadow-2xl border border-slate-300 flex flex-col justify-between select-none print:shadow-none"
      style={{
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      {/* ── TOP HEADER SECTION ── */}
      <div>
        <div className="flex items-center gap-2.5 px-3.5 pt-2.5 pb-1 bg-white">
          {/* Authentic Multi-Color Logo */}
          <div className="w-11 h-11 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-11 h-11 drop-shadow-xs">
              {/* Teal Base Book */}
              <path
                d="M50 58 C35 46 15 50 10 58 L10 76 C15 68 35 64 50 76 C65 64 85 68 90 76 L90 58 C85 50 65 46 50 58 Z"
                fill="#008080"
              />
              {/* Maroon Upper Pages */}
              <path
                d="M50 48 C36 36 20 40 16 48 L16 64 C20 56 36 52 50 64 C64 52 80 56 84 64 L84 48 C80 40 64 36 50 48 Z"
                fill="#7a0c2e"
              />
              {/* Gold Torch / Rising Sun Emblem */}
              <circle cx="50" cy="24" r="9" fill="#e5a93c" />
              <path d="M50 33 L46 47 L54 47 Z" fill="#e5a93c" />
              <circle cx="34" cy="30" r="4.5" fill="#008080" />
              <circle cx="66" cy="30" r="4.5" fill="#7a0c2e" />
            </svg>
          </div>

          {/* School Name & Certifications */}
          <div className="flex-1 min-w-0">
            <h3 className="text-[13px] font-black tracking-tight text-slate-900 uppercase leading-[15px]">
              AL-HAQ MODEL ACADEMY
            </h3>
            <p className="text-[9.5px] font-black text-[#006666] uppercase tracking-wide leading-tight mt-0.5">
              HIGHER SECONDARY EDUCATION SYSTEM
            </p>
            <p className="text-[7.5px] font-bold text-[#800020] italic tracking-tight leading-tight mt-0.5">
              An ISO 9001:2015 Certified Educational Institution
            </p>
          </div>
        </div>

        {/* ── ANGLED GEOMETRIC RIBBON BAR ── */}
        <div className="relative h-[25px] flex items-center bg-[#f3b33d] shadow-xs">
          {/* Teal Angled Badge */}
          <div
            className="h-full bg-[#007a78] text-white flex flex-col justify-center px-3 z-10"
            style={{ clipPath: 'polygon(0 0, 100% 0, 86% 100%, 0 100%)', width: '38%' }}
          >
            <span className="text-[7px] font-black uppercase tracking-widest text-teal-200 leading-none">
              Reg. No.
            </span>
            <span className="text-[9.5px] font-black tracking-wider uppercase leading-tight font-mono text-white">
              {student.studentId || 'AHMA-2026'}
            </span>
          </div>

          {/* Main Title Center */}
          <div className="flex-1 text-center pr-6">
            <span className="text-[12.5px] font-black uppercase tracking-[0.2em] text-slate-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]">
              IDENTITY CARD
            </span>
          </div>
        </div>
      </div>

      {/* ── CARD BODY SECTION ── */}
      <div className="flex gap-3 px-3.5 py-2 flex-1 items-center">
        {/* Left Column: Photo */}
        <div className="flex flex-col items-center shrink-0 w-[96px]">
          <div className="w-[94px] h-[120px] rounded-[8px] border-2 border-slate-400 overflow-hidden bg-slate-100 shadow-xs flex items-center justify-center relative">
            {student.photoUrl ? (
              <img
                src={student.photoUrl}
                alt={student.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-b from-teal-700 via-teal-800 to-slate-900 text-white flex flex-col items-center justify-center p-1 text-center">
                <div className="w-11 h-11 rounded-full bg-teal-600 border border-teal-300 flex items-center justify-center text-xl font-black shadow-inner">
                  {student.fullName?.charAt(0) || 'S'}
                </div>
                <span className="text-[8.5px] uppercase font-bold text-teal-200 mt-1.5 tracking-wider">
                  Passport
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Key-Value Details */}
        <div className="flex-1 min-w-0 pr-1 text-[10.5px]">
          <div className="grid grid-cols-[76px_8px_1fr] gap-y-1 items-baseline font-semibold text-slate-800">
            <span className="font-extrabold text-slate-900">Name</span>
            <span className="font-bold text-slate-500">:</span>
            <span className="font-black text-[#7a0c2e] uppercase text-[11.5px] truncate drop-shadow-[0_0.5px_0_rgba(122,12,46,0.2)]">
              {student.fullName || '—'}
            </span>

            <span className="font-extrabold text-slate-900">Class / Sec</span>
            <span className="font-bold text-slate-500">:</span>
            <span className="font-black text-[#006666] truncate text-[10.5px]">
              {student.classId?.name || 'Class'} ({student.sectionId || 'A'})
            </span>

            <span className="font-extrabold text-slate-900">{fatherOrGuardianLabel}</span>
            <span className="font-bold text-slate-500">:</span>
            <span className="truncate text-slate-800">{fatherOrGuardianValue}</span>

            <span className="font-extrabold text-slate-900">D.O.B.</span>
            <span className="font-bold text-slate-500">:</span>
            <span className="text-slate-800 font-mono text-[10px]">{formattedDob}</span>

            <span className="font-extrabold text-slate-900">Blood Group</span>
            <span className="font-bold text-slate-500">:</span>
            <span className="font-black text-red-600 text-[10.5px]">{student.bloodGroup || 'B+'}</span>

            <span className="font-extrabold text-slate-900">Mobile No.</span>
            <span className="font-bold text-slate-500">:</span>
            <span className="font-bold text-slate-950 font-mono text-[10.5px]">
              {phoneDisplay}
            </span>
          </div>
        </div>
      </div>

      {/* ── BOTTOM MAROON FOOTER ── */}
      <div
        className="h-[18px] bg-[#7a0c2e] flex items-center justify-between px-3.5"
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
      >
        <span className="text-[8px] font-bold text-white tracking-wider uppercase">
          Academic Session: {sessionYear}
        </span>
        <span className="text-[8px] font-bold text-amber-300 uppercase tracking-widest">
          Al-Haq Model Academy
        </span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT: Back Card
// ─────────────────────────────────────────────────────────────────────────────
export function BackCard({
  student,
  fatherOrGuardianValue,
  relationPrefix,
  studentAddress,
  phoneDisplay,
}) {
  return (
    <div
      id="student-id-back"
      className="relative w-[440px] h-[278px] bg-white rounded-[16px] overflow-hidden shadow-2xl border border-slate-300 flex flex-col justify-between select-none print:shadow-none"
      style={{
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      {/* ── TOP GEOMETRIC RIBBON ── */}
      <div className="relative h-[25px] bg-[#f3b33d] shadow-xs">
        <div
          className="h-full bg-[#007a78] text-white flex items-center px-3.5 z-10"
          style={{ clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)', width: '42%' }}
        >
          <span className="text-[9.5px] font-black uppercase tracking-wider text-white">
            Student Verification
          </span>
        </div>
      </div>

      {/* ── BACK CONTENT BODY ── */}
      <div className="grid grid-cols-[1.15fr_0.85fr] gap-3 px-3.5 py-1.5 flex-1 items-start">
        {/* Left Column: Campus & Residential Address */}
        <div className="space-y-2 pr-2">
          <div>
            <h4 className="text-[10.5px] font-black text-slate-900 uppercase tracking-tight">
              Authorised Campus Address
            </h4>
            <p className="text-[9px] font-bold text-[#006666] leading-tight mt-0.5">
              Main Campus, Sector 4-B, Near Jamia Masjid, Karachi, Pakistan
            </p>
          </div>

          <div className="h-0.5 bg-[#f3b33d] w-full" />

          <div>
            <h4 className="text-[10.5px] font-black text-slate-900 uppercase tracking-tight">
              Student Residential Address
            </h4>
            <p className="text-[9px] font-bold text-[#006666] leading-tight mt-0.5">
              {relationPrefix} {fatherOrGuardianValue}
              <br />
              <span className="font-semibold text-slate-700">{studentAddress}</span>
            </p>
          </div>
        </div>

        {/* Right Column: Note, Rules & Stamp */}
        <div className="border-l border-amber-300/80 pl-3 flex flex-col h-full justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-[11.5px] font-black text-slate-900 uppercase">
                Note
              </h4>
              {/* Miniature Crest */}
              <svg viewBox="0 0 100 100" className="w-5 h-5">
                <polygon points="50,15 15,35 50,55 85,35" fill="#008080" />
                <polygon points="50,60 25,46 25,65 50,78 75,65 75,46" fill="#7a0c2e" />
                <circle cx="50" cy="30" r="10" fill="#e5a93c" />
              </svg>
            </div>

            <ol className="text-[8px] font-semibold text-slate-800 leading-[12px] space-y-1 mt-1 list-decimal list-inside">
              <li>This Identity Card must be worn / produced at the time of school entry.</li>
              <li>If the card is lost, kindly contact the helpline or center director.</li>
              <li>Another will be issued on paying Rs. 150/- only.</li>
            </ol>
          </div>

          {/* Stamp & Authority Endorsement */}
          <div className="flex items-end justify-between pt-1 border-t border-slate-200">
            {/* Simulated Official Seal Stamp */}
            <div className="w-11 h-11 rounded-full border-2 border-red-700/80 flex flex-col items-center justify-center text-[5.5px] font-extrabold text-red-700 uppercase tracking-tighter transform -rotate-12 select-none opacity-85">
              <span>AL-HAQ</span>
              <span className="text-[6.5px] font-black leading-none">SEAL</span>
              <span>VERIFIED</span>
            </div>

            <div className="text-right">
              <p className="text-[8px] font-black text-slate-800">Principal Signature</p>
              <p className="text-[7px] text-slate-500 font-bold">Al-Haq Model Academy</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM HELPLINE STRIP ── */}
      <div className="h-[24px] bg-[#7a0c2e] text-white flex items-center justify-between px-3.5">
        <div className="flex items-center gap-2">
          <span className="text-[8.5px] font-medium text-amber-200">Helpline No.</span>
          <span className="text-[9.5px] font-black tracking-wider font-mono text-white">
            021-34567890 / {phoneDisplay}
          </span>
        </div>
        <span className="text-[8.5px] font-black text-amber-300 uppercase tracking-wider">
          www.alhaqacademy.edu.pk
        </span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN: Modal: Digital Student ID Card (High-Fidelity Reference Design)
// ─────────────────────────────────────────────────────────────────────────────
export default function StudentIdCardModal({ open, student, onClose }) {
  const [viewMode, setViewMode] = useState('both') // 'both' | 'front' | 'back' | '3d-flip'
  const [isFlipped, setIsFlipped] = useState(false)

  if (!open || !student) return null

  const admissionYear = student.admissionDate
    ? new Date(student.admissionDate).getFullYear()
    : new Date().getFullYear()
  const currentYear = new Date().getFullYear()
  const sessionYear = `${currentYear}–${currentYear + 1}`

  const fatherOrGuardianLabel =
    student.fatherStatus === 'Deceased' ? 'Guardian' : 'Father Name'
  const fatherOrGuardianValue =
    student.fatherStatus === 'Deceased'
      ? student.guardian?.name || '—'
      : student.fatherName || student.guardian?.name || '—'

  const phoneDisplay =
    student.guardian?.phone ||
    student.emergencyContact?.phone ||
    student.phone ||
    '0300-1234567'
  const studentAddress =
    student.address ||
    student.guardian?.address ||
    'House No. 14-B, Block 6, Gulshan-e-Iqbal, Karachi'
  const relationPrefix = student.gender === 'Female' ? 'D/o' : 'S/o'

  const formattedDob = student.dob
    ? new Date(student.dob).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '15/05/2012'

  const formattedDoa = student.admissionDate
    ? new Date(student.admissionDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : `01/04/${admissionYear}`

  return (
    <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-md overflow-y-auto print:bg-white print:p-0 print:static">
      <div className="relative w-full max-w-5xl animate-in fade-in zoom-in-95 duration-200 my-auto print:max-w-none print:w-auto">
        {/* Control Header / Toolbar */}
        <div className="print:hidden flex flex-wrap items-center justify-between gap-3 mb-5 bg-slate-900/95 p-3.5 px-5 rounded-2xl border border-slate-700/70 shadow-2xl text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white shadow-md">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-slate-100">
                  Official Student Identity Card
                </h3>
                <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/40 rounded-full text-[10px] font-bold">
                  PVC Format (CR80)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                {student.studentId || 'AHMA-2026-001'} · {student.fullName}
              </p>
            </div>
          </div>

          {/* View Mode Buttons */}
          <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 text-xs font-semibold">
            <button
              onClick={() => setViewMode('both')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'both'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Side-by-Side
            </button>
            <button
              onClick={() => setViewMode('3d-flip')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === '3d-flip'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              3D Flip Card
            </button>
            <button
              onClick={() => setViewMode('front')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'front'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Front
            </button>
            <button
              onClick={() => setViewMode('back')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'back'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Back
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all hover:scale-[1.02]"
            >
              <Printer className="w-4 h-4" /> Print ID Card
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Interactive Flip Helper (Only in 3D Flip mode) */}
        {viewMode === '3d-flip' && (
          <div className="print:hidden text-center mb-3">
            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-900/60 text-teal-200 border border-teal-500/40 rounded-full text-xs font-bold hover:bg-teal-800/80 transition-all shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Click to Flip Card (
              {isFlipped ? 'Showing Back' : 'Showing Front'})
            </button>
          </div>
        )}

        {/* Main Printable Deck Container */}
        <div className="p-6 sm:p-8 bg-slate-300/70 rounded-3xl border border-slate-300/80 shadow-2xl print:bg-white print:p-0 print:border-none print:shadow-none">
          <div className="flex flex-wrap justify-center items-center gap-8">
            {viewMode === '3d-flip' ? (
              <div
                className="cursor-pointer select-none"
                style={{ perspective: 1200 }}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div
                  className="relative transition-transform duration-700"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    width: 440,
                    height: 278,
                  }}
                >
                  {/* Front Face */}
                  <div
                    className="absolute inset-0"
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                    }}
                  >
                    <FrontCard
                      student={student}
                      fatherOrGuardianLabel={fatherOrGuardianLabel}
                      fatherOrGuardianValue={fatherOrGuardianValue}
                      phoneDisplay={phoneDisplay}
                      formattedDob={formattedDob}
                      formattedDoa={formattedDoa}
                      sessionYear={sessionYear}
                    />
                  </div>

                  {/* Back Face */}
                  <div
                    className="absolute inset-0"
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                    }}
                  >
                    <BackCard
                      student={student}
                      fatherOrGuardianValue={fatherOrGuardianValue}
                      relationPrefix={relationPrefix}
                      studentAddress={studentAddress}
                      phoneDisplay={phoneDisplay}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                {(viewMode === 'both' || viewMode === 'front') && (
                  <div className="transition-all hover:scale-[1.01]">
                    <FrontCard
                      student={student}
                      fatherOrGuardianLabel={fatherOrGuardianLabel}
                      fatherOrGuardianValue={fatherOrGuardianValue}
                      phoneDisplay={phoneDisplay}
                      formattedDob={formattedDob}
                      formattedDoa={formattedDoa}
                      sessionYear={sessionYear}
                    />
                  </div>
                )}

                {(viewMode === 'both' || viewMode === 'back') && (
                  <div className="transition-all hover:scale-[1.01]">
                    <BackCard
                      student={student}
                      fatherOrGuardianValue={fatherOrGuardianValue}
                      relationPrefix={relationPrefix}
                      studentAddress={studentAddress}
                      phoneDisplay={phoneDisplay}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
