import React from 'react'
import { Users, ChevronRight, ArrowLeft } from 'lucide-react'
import Badge from '../../../components/ui/Badge'

/** Level 2 of the Finance page: pick a section of the chosen grade. */
export default function FeeSectionPicker({
  handleSelectSection,
  sectionsToDisplay,
  students,
  setNavLevel,
  selectedGrade,
}) {
  return (
          <div>
            <div className="mb-4">
              <button
                onClick={() => setNavLevel('grades')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to All Grades
              </button>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <div>
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                    GRADE LEVEL {selectedGrade.level}
                  </span>
                  <h2 className="text-2xl font-extrabold text-gray-900">
                    {selectedGrade.name} - Select Section
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Select a section to inspect student accounts, concessions, and download 3-part bank deposit vouchers.
                  </p>
                </div>
                <Badge variant="indigo">{sectionsToDisplay.length} Sections</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {sectionsToDisplay.map((sec) => {
                  const secStudentsCount = students.filter(
                    (s) =>
                      s.classId &&
                      (s.classId._id === selectedGrade._id ||
                        s.classId === selectedGrade._id ||
                        s.classId?.name === selectedGrade.name) &&
                      s.sectionId === sec
                  ).length

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
                        <Users className="w-3.5 h-3.5 text-gray-500" /> {secStudentsCount} Enrolled Students
                      </p>

                      <div className="w-full py-2 bg-white group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white font-semibold text-xs rounded-lg text-center border border-indigo-200 group-hover:border-indigo-600 transition-all flex items-center justify-center gap-1">
                        Open Fee Ledger <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
  )
}
