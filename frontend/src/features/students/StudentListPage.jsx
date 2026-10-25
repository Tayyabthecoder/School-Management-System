import React, { useEffect, useState } from 'react'
import {
  Plus, Search, Eye, ArrowLeft, ArrowRight, ArrowRightLeft, GraduationCap, Users, Sparkles,
  ChevronRight, LayoutGrid, Table, FileSpreadsheet
} from 'lucide-react'
import Breadcrumb from '../../components/layout/Breadcrumb'
import DataTable from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import api from '../../lib/axios'
import { formatPKR, formatDate } from '../../lib/formatters'
import { useToastStore } from '../../store/toastStore'
import { GRADE_THEMES, FALLBACK_GRADES } from '../../constants/grades'
import ChangeSectionModal from './components/ChangeSectionModal'
import ImportStudentsModal from './components/ImportStudentsModal'
import StudentRegistrationModal from './components/StudentRegistrationModal'

export default function StudentListPage() {
  const toast = useToastStore()
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tableClassFilter, setTableClassFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [genderFilter, setGenderFilter] = useState('ALL')
  const [viewMode, setViewMode] = useState('interactive')

  // Hierarchical drill-down state
  const [navLevel, setNavLevel] = useState('grades')
  const [selectedGrade, setSelectedGrade] = useState(null)
  const [selectedSection, setSelectedSection] = useState(null)

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [changeSectionStudent, setChangeSectionStudent] = useState(null)

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const res = await api.get('/students', { params: { limit: 1000 } })
      if (res.data?.success) {
        setStudents(res.data.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes')
      if (res.data?.success && res.data.data.length > 0) {
        setClasses(res.data.data)
      } else {
        setClasses(FALLBACK_GRADES)
      }
    } catch (err) {
      setClasses(FALLBACK_GRADES)
    }
  }

  useEffect(() => {
    fetchStudents()
    fetchClasses()
  }, [])

  const displayClasses = classes && classes.length > 0 ? classes : FALLBACK_GRADES

  const handleSelectGrade = (cls) => {
    setSelectedGrade(cls)
    setSelectedSection(null)
    setNavLevel('sections')
  }

  const handleSelectSection = (sectionId) => {
    setSelectedSection(sectionId)
    setNavLevel('students')
  }

  const handleResetToGrades = () => {
    setNavLevel('grades')
    setSelectedGrade(null)
    setSelectedSection(null)
  }

  const handleResetToSections = () => {
    setNavLevel('sections')
    setSelectedSection(null)
  }

  const isStudentInGrade = (s, targetGrade) => {
    if (!s || !s.classId || !targetGrade) return false
    const sId = String(s.classId._id || s.classId)
    const tId = String(targetGrade._id || '')
    if (sId && tId && sId === tId) return true

    const sName = String(s.classId?.name || '').trim().toLowerCase()
    const tName = String(targetGrade.name || '').trim().toLowerCase()
    if (sName && tName && sName === tName) return true

    if (targetGrade.level !== undefined && s.classId?.level !== undefined && Number(targetGrade.level) === Number(s.classId.level)) {
      return true
    }

    return false
  }

  const filteredStudents = students.filter(s => {
    if (search) {
      const q = search.toLowerCase()
      const match = (
        s.fullName?.toLowerCase().includes(q) ||
        s.studentId?.toLowerCase().includes(q)
      )
      if (!match) return false
    }
    if (tableClassFilter) {
      const targetCls = displayClasses.find(c => String(c._id) === tableClassFilter || c.name === tableClassFilter)
      if (targetCls && !isStudentInGrade(s, targetCls)) return false
    }
    if (navLevel === 'students' && selectedGrade && selectedSection) {
      return (
        isStudentInGrade(s, selectedGrade) &&
        String(s.sectionId || '').toUpperCase() === String(selectedSection || '').toUpperCase()
      )
    }
    if (navLevel === 'sections' && selectedGrade) {
      return isStudentInGrade(s, selectedGrade)
    }
    return true
  })

  const columns = [
    { header: 'Student ID', accessorKey: 'studentId' },
    { header: 'Full Name', accessorKey: 'fullName' },
    {
      header: 'Class & Section',
      cell: (row) => `${row.classId ? (row.classId.name || row.classId) : 'N/A'} - ${row.sectionId}`,
    },
    {
      header: 'Guardian Contact',
      cell: (row) => `${row.guardian?.name || 'N/A'} (${row.guardian?.phone || 'N/A'})`,
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge variant={row.status === 'Active' ? 'success' : 'danger'}>
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <a
            href={`/students/${row._id}`}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg inline-flex items-center gap-1 text-xs font-semibold transition-colors"
          >
            <Eye className="w-4 h-4" /> View Profile
          </a>
          <button
            type="button"
            onClick={() => setChangeSectionStudent(row)}
            className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg inline-flex items-center gap-1 text-xs font-semibold transition-colors"
            title="Change Section within Class"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" /> Change Section
          </button>
        </div>
      ),
    },
  ]

  // Dynamic Section Resolution for StudentListPage
  const getSectionsForGrade = (grade) => {
    if (!grade) return ['A', 'B']
    const definedSections = Array.isArray(grade.sections) && grade.sections.length > 0 ? grade.sections : ['A', 'B']
    const studentSections = students
      .filter(s => isStudentInGrade(s, grade))
      .map(s => s.sectionId)
      .filter(Boolean)
    return Array.from(new Set([...definedSections, ...studentSections])).sort()
  }

  const sectionsToDisplay = getSectionsForGrade(selectedGrade)


  return (
    <div>
      <Breadcrumb
        title="Student Management & Exploration"
        subtitle="Vibrant multi-level grade and section visual navigation roster."
      />

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 items-center w-full sm:w-auto flex-1">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                if (e.target.value && navLevel !== 'students') {
                  setViewMode('table')
                }
              }}
              placeholder="Search student ID or name globally..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
            />
          </div>

          <select
            value={tableClassFilter}
            onChange={(e) => {
              setTableClassFilter(e.target.value)
              if (e.target.value && navLevel !== 'students') {
                setViewMode('table')
              }
            }}
            className="w-full sm:w-48 px-3 py-2 text-xs font-semibold border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-600 bg-white text-gray-800"
          >
            <option value="">All Classes ({students.length})</option>
            {displayClasses.map((c) => {
              const count = students.filter((s) => isStudentInGrade(s, c)).length
              return (
                <option key={c._id || c.name} value={c._id || c.name}>
                  {c.name} ({count})
                </option>
              )
            })}
          </select>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
            <button
              onClick={() => {
                setViewMode('interactive')
                setNavLevel('grades')
                setSelectedGrade(null)
                setSelectedSection(null)
                setSearch('')
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'interactive' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Card Flow
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" /> Directory Table
            </button>
          </div>

          <button
            onClick={() => setShowImportModal(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors"
            title="Import student roster from Excel (.xlsx, .xls, .csv)"
          >
            <FileSpreadsheet className="w-4 h-4" /> Import Excel
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Student
          </button>
        </div>
      </div>

      {viewMode === 'interactive' && !search && (
        <div className="space-y-6">

          {/* Level 1: 12 Vibrant Grade Cards */}
          {navLevel === 'grades' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" /> Select Class / Academic Grade
                  </h2>
                  <p className="text-xs text-gray-500">Click on any class or grade to explore available sections and student rosters.</p>
                </div>
                <Badge variant="indigo">{displayClasses.length} Classes Active</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {displayClasses.map((cls, index) => {
                  const theme = GRADE_THEMES[index % GRADE_THEMES.length]
                  const gradeStudentsCount = students.filter(s => isStudentInGrade(s, cls)).length
                  const classSections = getSectionsForGrade(cls)

                  return (
                    <div
                      key={cls._id || cls.name}
                      onClick={() => handleSelectGrade(cls)}
                      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${theme.gradient} p-5 text-white shadow-lg ${theme.shadow} hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer group`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold tracking-wide uppercase">
                          {cls.level === 0 || cls.name.toLowerCase().includes('play') ? 'Pre-School' : `Level ${cls.level}`}
                        </span>
                        <div className="p-2 rounded-xl bg-white/10 group-hover:bg-white/20 transition-colors">
                          <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                      </div>

                      <h3 className="text-2xl font-extrabold tracking-tight mb-1">{cls.name}</h3>
                      <p className="text-xs text-white/80 font-medium mb-4">
                        Sections: {classSections.join(', ')}
                      </p>

                      <div className="pt-3 border-t border-white/20 flex items-center justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> {gradeStudentsCount} Students
                        </span>
                        <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Explore <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Level 2: Section Cards Tailored to Selected Grade */}
          {navLevel === 'sections' && selectedGrade && (
            <div>
              <div className="mb-4">
                <button
                  onClick={handleResetToGrades}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to All Grades
                </button>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-6">
                <div className="flex items-center justify-between mb-6 pb-4 border-b">
                  <div>
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">GRADE LEVEL {selectedGrade.level}</span>
                    <h2 className="text-2xl font-extrabold text-gray-900">{selectedGrade.name} - Select Section</h2>
                    <p className="text-xs text-gray-500 mt-1">Choose a section to view its assigned student roster.</p>
                  </div>
                  <Badge variant="indigo">{sectionsToDisplay.length} Sections Available</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {sectionsToDisplay.map((sec) => {
                    const secCount = students.filter(s => s.classId && (s.classId._id === selectedGrade._id || s.classId === selectedGrade._id || s.classId?.name === selectedGrade.name) && s.sectionId === sec).length

                    return (
                      <div
                        key={sec}
                        onClick={() => handleSelectSection(sec)}
                        className="bg-gray-50 hover:bg-indigo-50/60 p-6 rounded-2xl border-2 border-gray-200 hover:border-indigo-500 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-md shadow-indigo-600/30">
                            {sec}
                          </div>
                          <span className="text-xs font-semibold bg-white px-2.5 py-1 rounded-full border text-gray-600">
                            Section {sec}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {selectedGrade.name} - Section {sec}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 mb-4 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-gray-400" /> {secCount} Enrolled Students
                        </p>

                        <div className="w-full py-2 bg-white group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white font-semibold text-xs rounded-lg text-center border border-indigo-200 group-hover:border-indigo-600 transition-all flex items-center justify-center gap-1">
                          View Roster <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Level 3: Detailed Student List Filtered by Grade & Section */}
          {navLevel === 'students' && selectedGrade && selectedSection && (
            <div>
              <div className="mb-4 flex items-center gap-3">
                <button
                  onClick={handleResetToSections}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Sections
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={handleResetToGrades}
                  className="text-xs text-gray-500 hover:text-gray-800 font-medium"
                >
                  All Grades
                </button>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-indigo-600 uppercase">{selectedGrade.name}</span>
                  <h3 className="text-lg font-bold text-gray-900">Section {selectedSection} Roster</h3>
                </div>
                <Badge variant="success">{filteredStudents.length} Students Active</Badge>
              </div>

              <DataTable
                columns={columns}
                data={filteredStudents}
                loading={loading}
                emptyMessage={`No students found in ${selectedGrade.name} - Section ${selectedSection}.`}
              />
            </div>
          )}

        </div>
      )}

      {(viewMode === 'table' || search) && (
        <DataTable
          columns={columns}
          data={filteredStudents}
          loading={loading}
          emptyMessage="No students found matching your query."
        />
      )}

      {/* 4-Step Comprehensive Student Registration Wizard & Post-Registration Modal */}
      <StudentRegistrationModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        classes={classes}
        onSuccess={() => {
          fetchStudents()
        }}
      />

      {/* Change Section Modal */}
      <ChangeSectionModal
        open={Boolean(changeSectionStudent)}
        student={changeSectionStudent}
        classes={classes}
        onClose={() => setChangeSectionStudent(null)}
        onSuccess={(updatedStudent) => {
          setStudents((prev) =>
            prev.map((s) => (s._id === updatedStudent._id ? updatedStudent : s))
          )
        }}
      />

      {/* Excel Bulk Import Modal */}
      <ImportStudentsModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          fetchStudents()
          fetchClasses()
        }}
      />
    </div>
  )
}

