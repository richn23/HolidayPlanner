// Mock data for development - will be replaced with real API calls later

export const users = [
  { id: '1', name: 'Sarah Johnson', email: 'sarah@school.com', role: 'TEACHER', campus: 'JBR', yearlyQuota: 30, status: 'ACTIVE' },
  { id: '2', name: 'Mike Chen', email: 'mike@school.com', role: 'TEACHER', campus: 'JLT', yearlyQuota: 30, status: 'ACTIVE' },
  { id: '3', name: 'Emma Wilson', email: 'emma@school.com', role: 'COVER_TEACHER', campus: 'COVER', yearlyQuota: 30, status: 'ACTIVE' },
  { id: '4', name: 'James Brown', email: 'james@school.com', role: 'COVER_TEACHER', campus: 'COVER', yearlyQuota: 30, status: 'ACTIVE' },
  { id: '5', name: 'Admin User', email: 'admin@school.com', role: 'ADMIN', campus: 'JBR', yearlyQuota: 30, status: 'ACTIVE' },
  { id: '6', name: 'Lisa Taylor', email: 'lisa@school.com', role: 'TEACHER', campus: 'JBR', yearlyQuota: 30, status: 'ACTIVE' },
  { id: '7', name: 'David Park', email: 'david@school.com', role: 'TEACHER', campus: 'JLT', yearlyQuota: 30, status: 'ACTIVE' },
  { id: '8', name: 'Rachel Adams', email: 'rachel@school.com', role: 'COVER_TEACHER', campus: 'COVER', yearlyQuota: 30, status: 'ACTIVE' },
  { id: '9', name: 'Tom Wilson', email: 'tom@school.com', role: 'TEACHER', campus: 'JBR', yearlyQuota: 30, status: 'INACTIVE' },
]

export const leaveRequests = [
  { id: '1', userId: '1', userName: 'Sarah Johnson', startDate: '2026-02-15', endDate: '2026-02-17', type: 'HOLIDAY', status: 'APPROVED', requestedAt: '2026-01-20', approvedBy: '5', approvedAt: '2026-01-21' },
  { id: '2', userId: '2', userName: 'Mike Chen', startDate: '2026-02-20', endDate: '2026-02-20', type: 'SICK', status: 'APPROVED', requestedAt: '2026-02-20', approvedBy: '5', approvedAt: '2026-02-20' },
  { id: '3', userId: '6', userName: 'Lisa Taylor', startDate: '2026-03-01', endDate: '2026-03-05', type: 'HOLIDAY', status: 'PENDING', requestedAt: '2026-02-10' },
  { id: '4', userId: '7', userName: 'David Park', startDate: '2026-03-01', endDate: '2026-03-02', type: 'HOLIDAY', status: 'PENDING', requestedAt: '2026-02-12' },
  { id: '5', userId: '1', userName: 'Sarah Johnson', startDate: '2026-01-10', endDate: '2026-01-12', type: 'HOLIDAY', status: 'APPROVED', requestedAt: '2025-12-20', approvedBy: '5', approvedAt: '2025-12-21' },
]

export const coverAssignments = [
  { id: '1', date: '2026-02-15', session: 1, absentUserId: '1', absentUserName: 'Sarah Johnson', coverUserId: '3', coverUserName: 'Emma Wilson', reason: 'HOLIDAY' },
  { id: '2', date: '2026-02-15', session: 2, absentUserId: '1', absentUserName: 'Sarah Johnson', coverUserId: '8', coverUserName: 'Rachel Adams', reason: 'HOLIDAY' },
  { id: '3', date: '2026-02-20', session: 1, absentUserId: '2', absentUserName: 'Mike Chen', coverUserId: '4', coverUserName: 'James Brown', reason: 'SICK' },
]

// Teaching schedule - who teaches which sessions
// This gets overwritten every ~6 weeks by admin
export const teachingSchedule = [
  { userId: '1', session1: true, session2: true, session3: false },
  { userId: '2', session1: true, session2: false, session3: true },
  { userId: '3', session1: false, session2: true, session3: true },
  { userId: '4', session1: true, session2: true, session3: true },
  { userId: '6', session1: true, session2: false, session3: true },
  { userId: '7', session1: false, session2: true, session3: true },
  { userId: '8', session1: true, session2: true, session3: false },
]

export const blockedDates = [
  { id: '1', date: '2026-04-10', reason: 'School Event' },
  { id: '2', date: '2026-04-11', reason: 'School Event' },
  { id: '3', date: '2026-06-15', reason: 'Exam Period' },
  { id: '4', date: '2026-06-16', reason: 'Exam Period' },
  { id: '5', date: '2026-06-17', reason: 'Exam Period' },
]

export const tasks = [
  { id: '1', userId: '3', userName: 'Emma Wilson', date: '2026-02-15', description: 'Prepared lesson materials for Year 5 Maths', createdAt: '2026-02-15' },
  { id: '2', userId: '3', userName: 'Emma Wilson', date: '2026-02-16', description: 'Updated student attendance records', createdAt: '2026-02-16' },
  { id: '3', userId: '4', userName: 'James Brown', date: '2026-02-20', description: 'Covered playground duty', createdAt: '2026-02-20' },
]

// Helper function to get current user (simulates login)
export const getCurrentUser = (userId) => {
  return users.find(u => u.id === userId)
}

// Helper to calculate days used
export const getDaysUsed = (userId) => {
  const approved = leaveRequests.filter(r => 
    r.userId === userId && 
    r.status === 'APPROVED' &&
    r.startDate.startsWith('2026') // Current year
  )
  
  let total = 0
  approved.forEach(r => {
    const start = new Date(r.startDate)
    const end = new Date(r.endDate)
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
    total += days
  })
  return total
}

// Helper to get user's schedule
export const getUserSchedule = (userId) => {
  return teachingSchedule.find(s => s.userId === userId) || { userId, session1: false, session2: false, session3: false }
}
