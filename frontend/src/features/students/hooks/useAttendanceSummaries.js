import { useMemo } from 'react'

export function useAttendanceSummaries({ attendanceRecords, id }) {
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

  return { attendanceStats, flatAttendanceList, attendanceDateMap }
}
