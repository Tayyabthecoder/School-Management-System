import React, { useEffect, useState, useCallback } from 'react'
import {
  Calendar,
  Trash2,
  Printer,
} from 'lucide-react'
import Breadcrumb from '../../components/layout/Breadcrumb'
import { SkeletonTable } from '../../components/ui/Skeleton'
import api from '../../lib/axios'
import { useToastStore } from '../../store/toastStore'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8]
const PERIOD_TIMES = [
  { start: '08:00', end: '08:45' },
  { start: '08:45', end: '09:30' },
  { start: '09:30', end: '10:15' },
  { start: '10:15', end: '11:00' },
  { start: '11:30', end: '12:15' },
  { start: '12:15', end: '01:00' },
  { start: '01:00', end: '01:45' },
  { start: '01:45', end: '02:30' },
]

export default function TimetablePage() {
  const toast = useToastStore()

  const [classes, setClasses] = useState([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSection, setSelectedSection] = useState('A')

  const [subjects, setSubjects] = useState([])
  const [teachers, setTeachers] = useState([])
  const [timetableEntries, setTimetableEntries] = useState([])
  const [loading, setLoading] = useState(true)

  // Load Classes, Teachers & initial timetable
  const loadInitialData = useCallback(async () => {
    setLoading(true)
    try {
      const [clsRes, tchRes] = await Promise.all([
        api.get('/classes'),
        api.get('/teachers').catch(() => ({ data: { data: [] } })),
      ])

      if (clsRes.data?.success && clsRes.data.data.length > 0) {
        setClasses(clsRes.data.data)
        setSelectedClassId(clsRes.data.data[0]._id)
        if (clsRes.data.data[0].sections?.length > 0) {
          setSelectedSection(clsRes.data.data[0].sections[0])
        }
      }
      if (tchRes.data?.success) setTeachers(tchRes.data.data)
    } catch {
      toast.error('Failed to load classes')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  // Load timetable & subjects when class or section changes
  const loadSchedule = useCallback(async () => {
    if (!selectedClassId) return
    setLoading(true)
    try {
      const [ttRes, subRes] = await Promise.all([
        api.get('/timetable', { params: { classId: selectedClassId, sectionId: selectedSection } }),
        api.get('/classes/subjects', { params: { classId: selectedClassId } }),
      ])

      if (ttRes.data?.success) setTimetableEntries(ttRes.data.data)
      if (subRes.data?.success) setSubjects(subRes.data.data)
    } catch {
      console.error('Failed to load timetable')
    } finally {
      setLoading(false)
    }
  }, [selectedClassId, selectedSection])

  useEffect(() => {
    loadSchedule()
  }, [loadSchedule])

  const selectedClass = classes.find((c) => c._id === selectedClassId)
  const availableSections = selectedClass?.sections || ['A', 'B']

  // Clear a period
  const handleDeletePeriod = async (id) => {
    try {
      await api.delete(`/timetable/${id}`)
      toast.info('Period slot cleared')
      loadSchedule()
    } catch {
      toast.error('Failed to clear slot')
    }
  }

  // Map entries by Day and Period
  const scheduleMap = {}
  timetableEntries.forEach((entry) => {
    const key = `${entry.dayOfWeek}-${entry.periodNumber}`
    scheduleMap[key] = entry
  })

  return (
    <div>
      <Breadcrumb
        title="Weekly Class Timetable Matrix"
        subtitle="View, manage, and inspect weekly class period rosters."
      />

      {/* Selector & Actions Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Class & Section Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Select Grade</label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value)
                const c = classes.find((cl) => cl._id === e.target.value)
                if (c && c.sections?.length > 0) setSelectedSection(c.sections[0])
              }}
              className="px-3.5 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-800 bg-white shadow-xs focus:ring-2 focus:ring-indigo-500"
            >
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>{cls.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Section</label>
            <div className="flex gap-1">
              {availableSections.map((sec) => (
                <button
                  key={sec}
                  onClick={() => setSelectedSection(sec)}
                  className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
                    selectedSection === sec
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Section {sec}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs rounded-xl shadow-xs"
          >
            <Printer className="w-4 h-4 text-gray-500" /> Print Schedule
          </button>
        </div>
      </div>

      {/* Timetable Table */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900 text-base">
              {selectedClass?.name || 'Class'} — Section {selectedSection} Schedule
            </h3>
          </div>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full">
            {timetableEntries.length} / 48 Periods Scheduled
          </span>
        </div>

        {loading ? (
          <SkeletonTable rows={6} />
        ) : (
          <div className="border border-gray-200 rounded-2xl overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs border-collapse min-w-[750px]">
              <thead>
                <tr className="bg-indigo-900 text-white">
                  <th className="p-3.5 font-bold w-28 border-r border-indigo-800">Day / Period</th>
                  {PERIODS.map((p) => (
                    <th key={p} className="p-3 font-bold text-center border-r border-indigo-800 last:border-0">
                      Period {p}
                      <span className="block text-[10px] font-normal text-indigo-300 mt-0.5">
                        {PERIOD_TIMES[p - 1].start} - {PERIOD_TIMES[p - 1].end}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {DAYS.map((day) => (
                  <tr key={day} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3.5 font-bold text-gray-800 bg-gray-50 border-r border-gray-200">
                      {day}
                    </td>
                    {PERIODS.map((p) => {
                      const entry = scheduleMap[`${day}-${p}`]
                      return (
                        <td key={p} className="p-2 border-r border-gray-200 last:border-0 group relative">
                          {entry ? (
                            <div className="p-2.5 bg-indigo-50/80 border border-indigo-100 rounded-xl text-left hover:border-indigo-300 transition-all">
                              <div className="flex items-start justify-between gap-1">
                                <p className="font-bold text-indigo-950 text-xs leading-tight">
                                  {entry.subjectId?.name || 'Subject'}
                                </p>
                                <button
                                  onClick={() => handleDeletePeriod(entry._id)}
                                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-opacity p-0.5"
                                  title="Clear slot"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              <p className="text-[11px] text-indigo-700 font-semibold mt-1 truncate">
                                {entry.teacherId?.fullName || 'Faculty'}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-0.5">{entry.room || 'Room 101'}</p>
                            </div>
                          ) : (
                            <div className="w-full h-full min-h-[60px] p-2 bg-gray-50/60 border border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-300 text-[10px] font-mono">
                              — Empty —
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
