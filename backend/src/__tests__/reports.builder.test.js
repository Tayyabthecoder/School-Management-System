const reportsBuilder = require('../modules/reports/reports.builder')
const Student = require('../models/Student.model')
const Staff = require('../models/Staff.model')
const StudentFee = require('../models/StudentFee.model')
const StudentAttendance = require('../models/StudentAttendance.model')
const Grade = require('../models/Grade.model')
const Exam = require('../models/Exam.model')

jest.mock('../models/Student.model')
jest.mock('../models/Staff.model')
jest.mock('../models/StudentFee.model')
jest.mock('../models/StudentAttendance.model')
jest.mock('../models/Grade.model')
jest.mock('../models/Exam.model')

describe('Reports Builder Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('compileDynamicCustomReport - Students Entity', () => {
    it('applies class, section, status filters and projects chosen columns', async () => {
      const mockStudents = [
        {
          studentId: 'STD-101',
          fullName: 'Ahmed Ali',
          gender: 'Male',
          classId: { _id: 'c1', name: 'Grade 9' },
          sectionId: 'A',
          guardian: { name: 'Ali', phone: '03001112233' },
          cnic: '12345-6789012-3',
          bloodGroup: 'B+',
          joiningDate: new Date('2025-01-10'),
          status: 'Active',
        },
      ]

      Student.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockStudents),
        }),
      })

      const result = await reportsBuilder.compileDynamicCustomReport({
        entity: 'students',
        fields: ['studentId', 'fullName', 'className', 'sectionId'],
        filters: {
          classId: 'c1',
          sectionId: 'A',
          status: 'Active',
        },
      })

      expect(Student.find).toHaveBeenCalledWith(
        expect.objectContaining({
          classId: 'c1',
          sectionId: 'A',
          status: 'Active',
        })
      )
      expect(result.columns).toHaveLength(4)
      expect(result.rows[0]).toEqual({
        studentId: 'STD-101',
        fullName: 'Ahmed Ali',
        className: 'Grade 9',
        sectionId: 'A',
      })
      expect(result.rows.length).toBe(1)
    })
  })

  describe('compileDynamicCustomReport - Fees Entity', () => {
    it('filters fees at database level by student class/section and status', async () => {
      Student.find.mockReturnValue({
        distinct: jest.fn().mockResolvedValue(['stu_1', 'stu_2']),
      })

      const mockFees = [
        {
          studentId: {
            studentId: 'STD-101',
            fullName: 'Ahmed Ali',
            classId: { name: 'Grade 9' },
            sectionId: 'A',
          },
          amountDue: 5000,
          amountPaid: 3000,
          outstandingAmount: 2000,
          status: 'Partial',
          dueDate: new Date('2026-05-10'),
        },
      ]

      StudentFee.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockFees),
        }),
      })

      const result = await reportsBuilder.compileDynamicCustomReport({
        entity: 'fees',
        fields: ['studentId', 'fullName', 'amountDue', 'amountPaid', 'outstandingAmount', 'status'],
        filters: {
          classId: 'c1',
          status: 'Partial',
        },
      })

      expect(Student.find).toHaveBeenCalledWith(
        expect.objectContaining({ classId: 'c1' })
      )
      expect(StudentFee.find).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: { $in: ['stu_1', 'stu_2'] },
          status: 'Partial',
        })
      )
      expect(result.rows[0].outstandingAmount).toBe(2000)
      expect(result.rows[0].status).toBe('Partial')
    })
  })

  describe('compileDynamicCustomReport - Attendance Entity', () => {
    it('flattens student attendance records with correct fields', async () => {
      const mockAttendance = [
        {
          date: new Date('2026-10-01'),
          classId: { name: 'Grade 10' },
          sectionId: 'B',
          records: [
            {
              studentId: { studentId: 'STD-200', fullName: 'Sara Khan' },
              status: 'Present',
            },
            {
              studentId: { studentId: 'STD-201', fullName: 'Bilal Khan' },
              status: 'Absent',
            },
          ],
        },
      ]

      StudentAttendance.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockAttendance),
          }),
        }),
      })

      const result = await reportsBuilder.compileDynamicCustomReport({
        entity: 'attendance',
        fields: ['date', 'className', 'sectionId', 'studentId', 'fullName', 'status'],
        filters: {},
      })

      expect(result.rows.length).toBe(2)
      expect(result.rows[0].studentId).toBe('STD-200')
      expect(result.rows[0].status).toBe('Present')
      expect(result.rows[1].studentId).toBe('STD-201')
      expect(result.rows[1].status).toBe('Absent')
    })
  })

  describe('compileDynamicCustomReport - Grades Entity', () => {
    it('queries exam grades and formats results', async () => {
      const mockGrades = [
        {
          studentId: { studentId: 'STD-301', fullName: 'Fatima' },
          examId: {
            termName: 'Midterm 2026',
            classId: { name: 'Grade 8' },
            subjectId: { name: 'Mathematics' },
            totalMarks: 100,
          },
          marksObtained: 85,
          percentage: 85,
          gradeLetter: 'A',
        },
      ]

      Grade.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockGrades),
          }),
        }),
      })

      const result = await reportsBuilder.compileDynamicCustomReport({
        entity: 'grades',
        fields: ['studentId', 'fullName', 'className', 'subjectName', 'percentage', 'gradeLetter'],
        filters: {},
      })

      expect(result.rows.length).toBe(1)
      expect(result.rows[0]).toEqual({
        studentId: 'STD-301',
        fullName: 'Fatima',
        className: 'Grade 8',
        subjectName: 'Mathematics',
        percentage: '85%',
        gradeLetter: 'A',
      })
    })
  })
})
