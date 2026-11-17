import React from 'react'
import { SUBJECT_COLORS } from '../subjectColors'
import { Search, Mail, Phone, Clock, LayoutGrid, List } from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import { SkeletonCard } from '../../../components/ui/Skeleton'

/** Directory tab of the Teachers page. */
export default function TeacherDirectoryTab({
  isAdmin,
  filteredTeachers,
  viewMode,
  setViewMode,
  classes,
  loading,
  search,
  setSearch,
  filterDepartment,
  setFilterDepartment,
  setSelectedTeacherForAssign,
  setSelectedTeacherForSchedule,
}) {
  return (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-slate-400" />
                  <input aria-label="Search faculty by name, subject, ID…"
                    type="text"
                    placeholder="Search faculty by name, subject, ID…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <select
                  aria-label="Filter by department"
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900"
                >
                  <option value="all">All Departments</option>
                  <option value="Academics">Academics</option>
                  <option value="Sciences">Sciences</option>
                  <option value="Languages">Languages</option>
                  <option value="Social Studies">Social Studies</option>
                  <option value="Computer Science">Computer Science</option>
                </select>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg border text-sm transition-colors ${
                    viewMode === 'grid' ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400' : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg border text-sm transition-colors ${
                    viewMode === 'list' ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400' : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Directory Content */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredTeachers.map((teacher, idx) => (
                  <div
                    key={teacher._id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                            {teacher.fullName?.charAt(0) || 'T'}
                          </div>
                          <div>
                            <h2 className="font-bold text-gray-900 dark:text-slate-100 text-base leading-tight">{teacher.fullName}</h2>
                            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">{teacher.designation}</p>
                            <p className="text-[11px] text-gray-500 dark:text-slate-400">ID: {teacher.staffId}</p>
                          </div>
                        </div>
                        <Badge variant={teacher.isActive ? 'success' : 'secondary'}>
                          {teacher.isActive ? 'Active' : 'On Leave'}
                        </Badge>
                      </div>

                      {/* Contact details */}
                      <div className="space-y-1 text-xs text-gray-600 dark:text-slate-400 mb-4 bg-gray-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" />
                          <span>{teacher.phone || '+92 300 0000000'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" />
                          <span className="truncate">{teacher.email || 'teacher@school.edu.pk'}</span>
                        </div>
                      </div>

                      {/* Assigned Subjects & Classes */}
                      <div className="mb-4">
                        <p className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                          Subjects Taught ({teacher.assignedSubjects?.length || 0})
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {teacher.assignedSubjects?.length > 0 ? (
                            teacher.assignedSubjects.map((sub, sIdx) => (
                              <span
                                key={sub._id || sIdx}
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                                  SUBJECT_COLORS[sIdx % SUBJECT_COLORS.length]
                                }`}
                              >
                                {sub.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-500 dark:text-slate-400 italic">No subject allocations yet</span>
                          )}
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                          Assigned Grades ({teacher.assignedClasses?.length || 0})
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {teacher.assignedClasses?.length > 0 ? (
                            teacher.assignedClasses.map((cls, cIdx) => (
                              <span
                                key={cls._id || cIdx}
                                className="text-[11px] bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 px-2 py-0.5 rounded font-medium"
                              >
                                {cls.name} ({cls.section})
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-500 dark:text-slate-400 italic">No classes assigned</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer Stats & Actions */}
                    <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{teacher.weeklyPeriodsCount || 0} periods/wk</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedTeacherForSchedule(teacher)}
                          className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Timetable
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => setSelectedTeacherForAssign(teacher)}
                            className="px-2.5 py-1 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                          >
                            + Assign
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="grid grid-cols-12 px-6 py-3 bg-gray-50 dark:bg-slate-800/50 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                  <div className="col-span-4">Faculty Member</div>
                  <div className="col-span-3">Department & Role</div>
                  <div className="col-span-2 text-center">Workload</div>
                  <div className="col-span-1 text-center">Status</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-slate-800">
                  {filteredTeachers.map((teacher) => (
                    <div key={teacher._id} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="col-span-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-sm">
                          {teacher.fullName?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-slate-100 text-sm">{teacher.fullName}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">ID: {teacher.staffId} · {teacher.phone}</p>
                        </div>
                      </div>
                      <div className="col-span-3">
                        <p className="text-sm text-gray-800 dark:text-slate-100 font-medium">{teacher.designation}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{teacher.department || 'Academics'}</p>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-full">
                          {teacher.weeklyPeriodsCount || 0} periods/wk
                        </span>
                      </div>
                      <div className="col-span-1 text-center">
                        <Badge variant={teacher.isActive ? 'success' : 'secondary'}>
                          {teacher.isActive ? 'Active' : 'Leave'}
                        </Badge>
                      </div>
                      <div className="col-span-2 flex justify-end gap-2">
                        <button
                          onClick={() => setSelectedTeacherForSchedule(teacher)}
                          className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold"
                        >
                          Schedule
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => setSelectedTeacherForAssign(teacher)}
                            className="px-2.5 py-1 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
                          >
                            Assign
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
  )
}
