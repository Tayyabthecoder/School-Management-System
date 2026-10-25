const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const env = require('../src/config/env')
const connectDB = require('../src/config/database')

const Role = require('../src/models/Role.model')
const User = require('../src/models/User.model')
const AcademicYear = require('../src/models/AcademicYear.model')
const Class = require('../src/models/Class.model')
const Subject = require('../src/models/Subject.model')
const Student = require('../src/models/Student.model')
const Staff = require('../src/models/Staff.model')
const FeeStructure = require('../src/models/FeeStructure.model')
const StudentFee = require('../src/models/StudentFee.model')
const Payment = require('../src/models/Payment.model')
const StudentAttendance = require('../src/models/StudentAttendance.model')
const StaffAttendance = require('../src/models/StaffAttendance.model')
const Exam = require('../src/models/Exam.model')
const Grade = require('../src/models/Grade.model')
const LeaveRequest = require('../src/models/LeaveRequest.model')
const PayrollRecord = require('../src/models/PayrollRecord.model')

// Realistic Names Datasets
const FIRST_NAMES_MALE = ['Ahmed', 'Muhammad', 'Ali', 'Hamza', 'Usman', 'Bilal', 'Omar', 'Zain', 'Tariq', 'Mustafa', 'Saad', 'Hassan', 'Hussein', 'Fahad', 'Waqas', 'Haris', 'Daniyal', 'Rayan', 'Asad', 'Shahzaib', 'Kamran', 'Ibrahim', 'Youssef', 'Taha', 'Omer']
const FIRST_NAMES_FEMALE = ['Fatima', 'Ayesha', 'Zahra', 'Maryam', 'Sana', 'Hira', 'Laiba', 'Anum', 'Zoya', 'Khadija', 'Mahnoor', 'Iqra', 'Amna', 'Noor', 'Sara', 'Eman', 'Nimra', 'Bisma', 'Sadia', 'Rabia', 'Farah', 'Sidra', 'Zubaida', 'Sumaira', 'Nida']
const LAST_NAMES = ['Khan', 'Hassan', 'Mahmood', 'Malik', 'Raza', 'Chaudhry', 'Bhatti', 'Shah', 'Qureshi', 'Siddiqui', 'Sheikh', 'Javed', 'Akram', 'Iqbal', 'Tariq', 'Farooq', 'Mirza', 'Baig', 'Abbasi', 'Ansari', 'Ghafoor', 'Nawaz', 'Rahman', 'Aziz', 'Zubairi']
const CITIES = ['Model Town, Lahore', 'Gulberg III, Lahore', 'DHA Phase 5, Lahore', 'F-7/2, Islamabad', 'PECHS, Karachi', 'Satellite Town, Rawalpindi', 'Cantt, Multan', 'Faisal Town, Lahore']

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)]
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

const seedComprehensiveDatabase = async () => {
  try {
    await connectDB()
    console.log('[Seed Engine] Cleaning existing database collections...')
    await Promise.all([
      Role.deleteMany({}),
      User.deleteMany({}),
      AcademicYear.deleteMany({}),
      Class.deleteMany({}),
      Subject.deleteMany({}),
      Student.deleteMany({}),
      Staff.deleteMany({}),
      FeeStructure.deleteMany({}),
      StudentFee.deleteMany({}),
      Payment.deleteMany({}),
      StudentAttendance.deleteMany({}),
      StaffAttendance.deleteMany({}),
      Exam.deleteMany({}),
      Grade.deleteMany({}),
      LeaveRequest.deleteMany({}),
      PayrollRecord.deleteMany({}),
    ])

    console.log('[Seed Engine] 1. Seeding System Roles...')
    const rolesData = [
      {
        name: 'super_admin',
        displayName: 'Super Admin',
        description: 'Full administrative and configuration privileges',
        permissions: [
          { module: 'students', actions: ['create', 'read', 'update', 'delete'] },
          { module: 'classes', actions: ['create', 'read', 'update', 'delete'] },
          { module: 'academics', actions: ['create', 'read', 'update', 'delete'] },
          { module: 'attendance', actions: ['create', 'read', 'update', 'delete'] },
          { module: 'grades', actions: ['create', 'read', 'update', 'delete'] },
          { module: 'finance', actions: ['create', 'read', 'update', 'delete'] },
          { module: 'hr', actions: ['create', 'read', 'update', 'delete'] },
          { module: 'payroll', actions: ['create', 'read', 'update', 'delete'] },
          { module: 'staff', actions: ['create', 'read', 'update', 'delete'] },
          { module: 'reports', actions: ['create', 'read', 'update', 'delete'] },
          { module: 'timetable', actions: ['create', 'read', 'update', 'delete'] },
          { module: 'settings', actions: ['create', 'read', 'update', 'delete'] },
        ],
      },
      {
        name: 'teacher',
        displayName: 'Teacher',
        description: 'Academic rosters, attendance, and grade management',
        permissions: [
          { module: 'attendance', actions: ['create', 'read', 'update'] },
          { module: 'grades', actions: ['create', 'read', 'update'] },
          { module: 'academics', actions: ['read'] },
          { module: 'students', actions: ['read'] },
          { module: 'timetable', actions: ['read'] },
        ],
      },
      {
        name: 'student',
        displayName: 'Student',
        description: 'Personal academic history, timetable, and announcements',
        permissions: [
          { module: 'grades', actions: ['read'] },
          { module: 'timetable', actions: ['read'] },
          { module: 'attendance', actions: ['read'] },
          { module: 'finance', actions: ['read'] },
        ],
      },
      {
        name: 'guardian',
        displayName: 'Guardian / Parent',
        description: 'Child academic progress, attendance, and fee status',
        permissions: [
          { module: 'attendance', actions: ['read', 'create'] },
          { module: 'grades', actions: ['read'] },
          { module: 'finance', actions: ['read'] },
        ],
      },
      {
        name: 'accountant',
        displayName: 'Accountant',
        description: 'Fee structure, payments, and financial ledger management',
        permissions: [
          { module: 'finance', actions: ['create', 'read', 'update', 'delete'] },
          { module: 'reports', actions: ['read'] },
          { module: 'students', actions: ['read'] },
        ],
      },
      {
        name: 'hr_manager',
        displayName: 'HR Manager',
        description: 'Staff profiles, leave approvals, and monthly payroll processing',
        permissions: [
          { module: 'hr', actions: ['create', 'read', 'update', 'delete'] },
          { module: 'payroll', actions: ['create', 'read', 'update'] },
          { module: 'staff', actions: ['create', 'read', 'update', 'delete'] },
          { module: 'attendance', actions: ['create', 'read', 'update'] },
          { module: 'reports', actions: ['read'] },
        ],
      },
    ]
    const createdRoles = await Role.insertMany(rolesData)
    const roleMap = {}
    createdRoles.forEach(r => { roleMap[r.name] = r._id })

    console.log('[Seed Engine] 2. Seeding Default Super Admin Account...')
    const adminPasswordHash = await bcrypt.hash('Admin@1234', 10)
    const adminUser = await User.create({
      username: 'admin',
      passwordHash: adminPasswordHash,
      role: roleMap['super_admin'],
      roleName: 'super_admin',
    })

    console.log('[Seed Engine] 3. Seeding Academic Year 2026...')
    const ay = await AcademicYear.create({
      year: 2026,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      terms: [
        { name: 'Term 1', startDate: new Date('2026-01-01'), endDate: new Date('2026-04-30'), isCurrent: true },
        { name: 'Term 2 (Midterm)', startDate: new Date('2026-05-01'), endDate: new Date('2026-08-31'), isCurrent: false },
        { name: 'Term 3 (Final)', startDate: new Date('2026-09-01'), endDate: new Date('2026-12-31'), isCurrent: false },
      ],
      isActive: true,
    })

    console.log('[Seed Engine] 4. Seeding Grades 1 through 12 and Subjects...')
    const classes = []
    const subjectList = []

    for (let level = 1; level <= 12; level++) {
      const cls = await Class.create({
        name: `Grade ${level}`,
        level,
        sections: ['A', 'B'],
      })
      classes.push(cls)

      // Subjects per grade
      const coreSubjects = [
        { name: 'English Language', code: `ENG-${level}` },
        { name: 'Mathematics', code: `MATH-${level}` },
        { name: 'General Science', code: `SCI-${level}` },
        { name: 'Computer Studies', code: `CS-${level}` },
        { name: 'Urdu Literature', code: `URD-${level}` },
      ]

      if (level >= 9) {
        coreSubjects.push({ name: 'Physics', code: `PHY-${level}` })
        coreSubjects.push({ name: 'Chemistry', code: `CHEM-${level}` })
        coreSubjects.push({ name: 'Biology', code: `BIO-${level}` })
      }

      const createdSubjects = []
      for (const s of coreSubjects) {
        const sub = await Subject.create({
          name: s.name,
          code: s.code,
          classId: cls._id,
          description: `${s.name} curriculum for ${cls.name}`,
        })
        createdSubjects.push(sub)
        subjectList.push(sub)
      }

      cls.subjects = createdSubjects.map(s => s._id)
      await cls.save()
    }

    console.log('[Seed Engine] 5. Seeding 10 Staff Members across Academic, Finance, and HR Departments...')
    const staffPasswordHash = await bcrypt.hash('Staff@1234', 10)
    const staffMembers = []

    const staffDataSpecs = [
      { name: 'Tariq Mahmood', designation: 'Senior Mathematics Teacher', dept: 'Academics', role: 'teacher', salary: 85000 },
      { name: 'Sobia Naz', designation: 'Head of Science Department', dept: 'Academics', role: 'teacher', salary: 92000 },
      { name: 'Zainab Bibi', designation: 'English Literature Lecturer', dept: 'Academics', role: 'teacher', salary: 80000 },
      { name: 'Kashif Ali', designation: 'Computer Science Instructor', dept: 'Academics', role: 'teacher', salary: 88000 },
      { name: 'Asif Chaudhry', designation: 'Physics Department Head', dept: 'Academics', role: 'teacher', salary: 95000 },
      { name: 'Noreen Akhtar', designation: 'Chemistry Teacher', dept: 'Academics', role: 'teacher', salary: 82000 },
      { name: 'Bilal Tanveer', designation: 'Urdu & Islamiat Lecturer', dept: 'Academics', role: 'teacher', salary: 78000 },
      { name: 'Zubair Khan', designation: 'Chief Accountant', dept: 'Finance', role: 'accountant', salary: 95000 },
      { name: 'Usman Ghani', designation: 'Assistant Finance Officer', dept: 'Finance', role: 'accountant', salary: 75000 },
      { name: 'Ayesha Raza', designation: 'Head of Human Resources', dept: 'Human Resources', role: 'hr_manager', salary: 90000 },
    ]

    for (let i = 0; i < staffDataSpecs.length; i++) {
      const spec = staffDataSpecs[i]
      const staffId = `STF-2026-${String(i + 1).padStart(3, '0')}`

      const st = await Staff.create({
        staffId,
        fullName: spec.name,
        cnic: `35202-${getRandomInt(1000000, 9999999)}-${getRandomInt(1, 9)}`,
        phone: `+92300${getRandomInt(1000000, 9999999)}`,
        email: `${spec.name.toLowerCase().replace(/\s+/g, '.')}@school.edu.pk`,
        designation: spec.designation,
        department: spec.dept,
        joiningDate: new Date('2023-01-15'),
        salary: spec.salary,
        allowances: 5000,
        deductions: 0,
      })
      staffMembers.push(st)

      // User account
      const username = spec.role === 'teacher' ? `teacher${i + 1}` : spec.role === 'accountant' ? `accountant${i - 6}` : 'hr_manager'
      await User.create({
        username: username.replace(/[^a-z0-9_]/gi, '').toLowerCase(),
        passwordHash: staffPasswordHash,
        role: roleMap[spec.role],
        roleName: spec.role,
        staffId: st._id,
      })
    }

    console.log('[Seed Engine] 6. Seeding 50 Students across Grades 1 to 12...')
    const studentPasswordHash = await bcrypt.hash('Student@1234', 10)
    const students = []

    for (let i = 1; i <= 50; i++) {
      const gender = i % 2 === 0 ? 'Female' : 'Male'
      const firstName = gender === 'Male' ? getRandomItem(FIRST_NAMES_MALE) : getRandomItem(FIRST_NAMES_FEMALE)
      const lastName = getRandomItem(LAST_NAMES)
      const fullName = `${firstName} ${lastName}`
      const studentId = `STU-2026-${String(i).padStart(4, '0')}`

      // Distribute across classes (1 to 12)
      const targetClass = classes[(i - 1) % 12]
      const sectionId = i % 3 === 0 ? 'B' : 'A'

      const birthYear = 2026 - (targetClass.level + 5)
      const dob = new Date(`${birthYear}-0${getRandomInt(1, 9)}-${getRandomInt(10, 28)}`)

      const studentDoc = await Student.create({
        studentId,
        fullName,
        dob,
        gender,
        classId: targetClass._id,
        sectionId,
        guardian: {
          name: `Guardian of ${firstName}`,
          phone: `+92300${getRandomInt(1000000, 9999999)}`,
          email: `guardian.${i}@example.com`,
          relationship: 'Parent',
        },
        bloodGroup: getRandomItem(['A+', 'B+', 'O+', 'AB+', 'O-']),
        address: getRandomItem(CITIES),
        status: 'Active',
      })
      students.push(studentDoc)

      // User account for student
      await User.create({
        username: studentId.toLowerCase(),
        passwordHash: studentPasswordHash,
        role: roleMap['student'],
        roleName: 'student',
        studentId: studentDoc._id,
      })
    }

    console.log('[Seed Engine] 7. Seeding Fee Structures & Student Fee Records...')
    for (const cls of classes) {
      const monthlyAmount = 8000 + (cls.level * 500)
      const feeStructure = await FeeStructure.create({
        title: `${cls.name} Monthly Tuition Fee (Term 1)`,
        feeType: 'Tuition',
        classId: cls._id,
        amount: monthlyAmount,
        dueDate: new Date('2026-09-10'),
        academicYearId: ay._id,
      })

      // Assign to students in this class
      const classStudents = students.filter(s => s.classId.toString() === cls._id.toString())
      for (const st of classStudents) {
        const discount = (st.studentId.endsWith('01') || st.studentId.endsWith('05')) ? 2000 : 0
        const netAmount = monthlyAmount - discount
        const isPaid = (parseInt(st.studentId.slice(-2), 10) % 2 === 0)
        const amountPaid = isPaid ? netAmount : 0
        const outstandingAmount = netAmount - amountPaid
        const status = isPaid ? 'Paid' : 'Pending'

        const sf = await StudentFee.create({
          studentId: st._id,
          feeStructureId: feeStructure._id,
          amountDue: monthlyAmount,
          discount,
          netAmount,
          amountPaid,
          outstandingAmount,
          dueDate: new Date('2026-09-10'),
          status,
        })

        if (isPaid) {
          const receiptNo = `REC-2026-${String(getRandomInt(1000, 9999))}`
          await Payment.create({
            receiptNo,
            studentFeeId: sf._id,
            studentId: st._id,
            amountPaid: netAmount,
            paymentDate: new Date('2026-08-20'),
            paymentMode: 'Cash',
            recordedBy: adminUser._id,
            remarks: 'Term 1 tuition cleared in full',
          })
        }
      }
    }

    console.log('[Seed Engine] 8. Seeding Attendance Records...')
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const grade10 = classes.find(c => c.level === 10)
    if (grade10) {
      const g10Students = students.filter(s => s.classId.toString() === grade10._id.toString())
      const attendanceRecords = g10Students.map((st, idx) => ({
        studentId: st._id,
        status: idx === 1 ? 'Absent' : idx === 3 ? 'Late' : 'Present',
      }))

      await StudentAttendance.create({
        classId: grade10._id,
        sectionId: 'A',
        date: today,
        periodNumber: 1,
        records: attendanceRecords,
        markedBy: adminUser._id,
      })
    }

    // Staff Attendance
    for (const st of staffMembers) {
      await StaffAttendance.create({
        staffId: st._id,
        date: today,
        status: 'Present',
        markedBy: adminUser._id,
      })
    }

    console.log('[Seed Engine] 9. Seeding Exam Schedules and Grades for Grade 9, 10, 11, 12...')
    const upperClasses = classes.filter(c => c.level >= 9)
    for (const cls of upperClasses) {
      const clsSubjects = subjectList.filter(s => s.classId.toString() === cls._id.toString())
      if (clsSubjects.length > 0) {
        const sub = clsSubjects[0]
        const exam = await Exam.create({
          title: `Midterm Assessment 2026 - ${sub.name}`,
          academicYearId: ay._id,
          termName: 'Term 1',
          classId: cls._id,
          subjectId: sub._id,
          examDate: new Date('2026-08-15'),
          maxMarks: 100,
          passMarks: 40,
          isPublished: true,
        })

        const clsStudents = students.filter(s => s.classId.toString() === cls._id.toString())
        for (const st of clsStudents) {
          const marksObtained = getRandomInt(55, 98)
          const percentage = marksObtained
          const gradeLetter = marksObtained >= 90 ? 'A+' : marksObtained >= 80 ? 'A' : marksObtained >= 70 ? 'B' : 'C'

          await Grade.create({
            examId: exam._id,
            studentId: st._id,
            marksObtained,
            percentage,
            gradeLetter,
            remarks: 'Good academic performance',
            enteredBy: adminUser._id,
          })
        }
      }
    }

    console.log('===================================================')
    console.log('🎉 REALISTIC LARGE DATABASE SEEDING COMPLETED SUCCESSFULLY!')
    console.log('📊 Summary:')
    console.log(`   - Academic Years: 1 (2026)`)
    console.log(`   - Classes Created: 12 (Grade 1 through Grade 12)`)
    console.log(`   - Subjects Created: ${subjectList.length}`)
    console.log(`   - Staff Members: 10 (Teachers, Accountants, HR)`)
    console.log(`   - Students Enrolled: 50 (With full user accounts)`)
    console.log(`   - Fee Structures & Ledgers: Generated for all grades`)
    console.log(`   - Attendance & Grades: Populated for testing`)
    console.log('🔑 Logins Available:')
    console.log('   - Super Admin: admin / Admin@1234')
    console.log('   - Teachers:    teacher1, teacher2 ... / Staff@1234')
    console.log('   - Accountant:  accountant1 / Staff@1234')
    console.log('   - HR Manager:  hr_manager / Staff@1234')
    console.log('   - Students:    stu-2026-0001 to stu-2026-0050 / Student@1234')
    console.log('===================================================')
    process.exit(0)
  } catch (error) {
    console.error('[Seed Error]:', error)
    process.exit(1)
  }
}

seedComprehensiveDatabase()
