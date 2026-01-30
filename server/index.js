import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import { User, LeaveRequest, TeachingSchedule, CoverAssignment, BlockedDate, Task } from './models.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err))

// ============== AUTH ROUTES ==============

// Login (simple email lookup)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email } = req.body
    const user = await User.findOne({ email, status: 'ACTIVE' })
    if (!user) {
      return res.status(404).json({ error: 'User not found or inactive' })
    }
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ============== USER ROUTES ==============

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().sort({ name: 1 })
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get single user
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Create user
app.post('/api/users', async (req, res) => {
  try {
    const user = new User(req.body)
    await user.save()
    res.status(201).json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Update user
app.put('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Delete user
app.delete('/api/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ============== LEAVE REQUEST ROUTES ==============

// Get all leave requests
app.get('/api/leave-requests', async (req, res) => {
  try {
    const { status, userId } = req.query
    const filter = {}
    if (status) filter.status = status
    if (userId) filter.userId = userId
    const requests = await LeaveRequest.find(filter).sort({ startDate: -1 })
    res.json(requests)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Create leave request
app.post('/api/leave-requests', async (req, res) => {
  try {
    const request = new LeaveRequest(req.body)
    await request.save()
    res.status(201).json(request)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Update leave request (approve/reject)
app.put('/api/leave-requests/:id', async (req, res) => {
  try {
    const request = await LeaveRequest.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!request) return res.status(404).json({ error: 'Request not found' })
    res.json(request)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Delete leave request
app.delete('/api/leave-requests/:id', async (req, res) => {
  try {
    await LeaveRequest.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ============== TEACHING SCHEDULE ROUTES ==============

// Get all schedules
app.get('/api/schedules', async (req, res) => {
  try {
    const schedules = await TeachingSchedule.find()
    res.json(schedules)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get schedule for user
app.get('/api/schedules/:userId', async (req, res) => {
  try {
    const schedule = await TeachingSchedule.findOne({ userId: req.params.userId })
    res.json(schedule || { userId: req.params.userId, session1: false, session2: false, session3: false, notes: '' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Update/Create schedule
app.put('/api/schedules/:userId', async (req, res) => {
  try {
    const schedule = await TeachingSchedule.findOneAndUpdate(
      { userId: req.params.userId },
      req.body,
      { new: true, upsert: true }
    )
    res.json(schedule)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Bulk update schedules
app.post('/api/schedules/bulk', async (req, res) => {
  try {
    const { schedules } = req.body
    const operations = schedules.map(s => ({
      updateOne: {
        filter: { userId: s.userId },
        update: s,
        upsert: true
      }
    }))
    await TeachingSchedule.bulkWrite(operations)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ============== COVER ASSIGNMENT ROUTES ==============

// Get all cover assignments
app.get('/api/cover-assignments', async (req, res) => {
  try {
    const { date, coverUserId, absentUserId } = req.query
    const filter = {}
    if (date) filter.date = date
    if (coverUserId) filter.coverUserId = coverUserId
    if (absentUserId) filter.absentUserId = absentUserId
    const assignments = await CoverAssignment.find(filter).sort({ date: -1 })
    res.json(assignments)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Create cover assignment
app.post('/api/cover-assignments', async (req, res) => {
  try {
    const assignment = new CoverAssignment(req.body)
    await assignment.save()
    res.status(201).json(assignment)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Delete cover assignment
app.delete('/api/cover-assignments/:id', async (req, res) => {
  try {
    await CoverAssignment.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ============== BLOCKED DATES ROUTES ==============

// Get all blocked dates
app.get('/api/blocked-dates', async (req, res) => {
  try {
    const dates = await BlockedDate.find().sort({ date: 1 })
    res.json(dates)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Create blocked date(s)
app.post('/api/blocked-dates', async (req, res) => {
  try {
    const { dates } = req.body // Array of { date, reason }
    const results = await BlockedDate.insertMany(dates, { ordered: false }).catch(err => {
      // Ignore duplicate key errors
      if (err.code === 11000) return err.insertedDocs || []
      throw err
    })
    res.status(201).json(results)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Delete blocked date
app.delete('/api/blocked-dates/:id', async (req, res) => {
  try {
    await BlockedDate.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ============== TASK ROUTES ==============

// Get all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const { userId } = req.query
    const filter = userId ? { userId } : {}
    const tasks = await Task.find(filter).sort({ date: -1 })
    res.json(tasks)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Create task
app.post('/api/tasks', async (req, res) => {
  try {
    const task = new Task(req.body)
    await task.save()
    res.status(201).json(task)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Delete task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ============== SEED DATA ROUTE (for initial setup) ==============

app.post('/api/seed', async (req, res) => {
  try {
    // Clear existing data
    await User.deleteMany({})
    await LeaveRequest.deleteMany({})
    await TeachingSchedule.deleteMany({})
    await CoverAssignment.deleteMany({})
    await BlockedDate.deleteMany({})
    await Task.deleteMany({})

    // Seed users
    const users = await User.insertMany([
      { name: 'Sarah Johnson', email: 'sarah@school.com', role: 'TEACHER', campus: 'JBR', yearlyQuota: 30, status: 'ACTIVE' },
      { name: 'Mike Chen', email: 'mike@school.com', role: 'TEACHER', campus: 'JLT', yearlyQuota: 30, status: 'ACTIVE' },
      { name: 'Emma Wilson', email: 'emma@school.com', role: 'COVER_TEACHER', campus: 'COVER', yearlyQuota: 30, status: 'ACTIVE' },
      { name: 'James Brown', email: 'james@school.com', role: 'COVER_TEACHER', campus: 'COVER', yearlyQuota: 30, status: 'ACTIVE' },
      { name: 'Admin User', email: 'admin@school.com', role: 'ADMIN', campus: 'JBR', yearlyQuota: 30, status: 'ACTIVE' },
      { name: 'Lisa Taylor', email: 'lisa@school.com', role: 'TEACHER', campus: 'JBR', yearlyQuota: 30, status: 'ACTIVE' },
      { name: 'David Park', email: 'david@school.com', role: 'TEACHER', campus: 'JLT', yearlyQuota: 30, status: 'ACTIVE' },
      { name: 'Rachel Adams', email: 'rachel@school.com', role: 'COVER_TEACHER', campus: 'COVER', yearlyQuota: 30, status: 'ACTIVE' },
      { name: 'Tom Wilson', email: 'tom@school.com', role: 'TEACHER', campus: 'JBR', yearlyQuota: 30, status: 'INACTIVE' },
      { name: 'Nina Patel', email: 'nina@school.com', role: 'TEACHER', campus: 'JLT', yearlyQuota: 30, status: 'ACTIVE' },
    ])

    // Create a map for easy lookup
    const userMap = {}
    users.forEach(u => { userMap[u.email] = u })

    // Seed leave requests
    await LeaveRequest.insertMany([
      { userId: userMap['sarah@school.com']._id, userName: 'Sarah Johnson', startDate: '2026-02-15', endDate: '2026-02-17', type: 'HOLIDAY', status: 'APPROVED', approvedBy: userMap['admin@school.com']._id },
      { userId: userMap['mike@school.com']._id, userName: 'Mike Chen', startDate: '2026-02-20', endDate: '2026-02-20', type: 'SICK', status: 'APPROVED', approvedBy: userMap['admin@school.com']._id },
      { userId: userMap['lisa@school.com']._id, userName: 'Lisa Taylor', startDate: '2026-03-01', endDate: '2026-03-05', type: 'HOLIDAY', status: 'PENDING' },
      { userId: userMap['david@school.com']._id, userName: 'David Park', startDate: '2026-03-01', endDate: '2026-03-02', type: 'HOLIDAY', status: 'PENDING' },
      { userId: userMap['sarah@school.com']._id, userName: 'Sarah Johnson', startDate: '2026-01-10', endDate: '2026-01-12', type: 'HOLIDAY', status: 'APPROVED', approvedBy: userMap['admin@school.com']._id },
    ])

    // Seed teaching schedules
    await TeachingSchedule.insertMany([
      { userId: userMap['sarah@school.com']._id, session1: true, session2: true, session3: false },
      { userId: userMap['mike@school.com']._id, session1: true, session2: false, session3: true },
      { userId: userMap['emma@school.com']._id, session1: false, session2: true, session3: true },
      { userId: userMap['james@school.com']._id, session1: true, session2: true, session3: true },
      { userId: userMap['lisa@school.com']._id, session1: true, session2: false, session3: true },
      { userId: userMap['david@school.com']._id, session1: false, session2: true, session3: true },
      { userId: userMap['rachel@school.com']._id, session1: true, session2: true, session3: false },
      { userId: userMap['nina@school.com']._id, session1: true, session2: true, session3: false },
    ])

    // Seed cover assignments
    await CoverAssignment.insertMany([
      { date: '2026-02-15', session: 1, absentUserId: userMap['sarah@school.com']._id, absentUserName: 'Sarah Johnson', coverUserId: userMap['emma@school.com']._id, coverUserName: 'Emma Wilson', reason: 'HOLIDAY' },
      { date: '2026-02-15', session: 2, absentUserId: userMap['sarah@school.com']._id, absentUserName: 'Sarah Johnson', coverUserId: userMap['rachel@school.com']._id, coverUserName: 'Rachel Adams', reason: 'HOLIDAY' },
      { date: '2026-02-20', session: 1, absentUserId: userMap['mike@school.com']._id, absentUserName: 'Mike Chen', coverUserId: userMap['james@school.com']._id, coverUserName: 'James Brown', reason: 'SICK' },
    ])

    // Seed blocked dates
    await BlockedDate.insertMany([
      { date: '2026-04-10', reason: 'School Event' },
      { date: '2026-04-11', reason: 'School Event' },
      { date: '2026-06-15', reason: 'Exam Period' },
      { date: '2026-06-16', reason: 'Exam Period' },
      { date: '2026-06-17', reason: 'Exam Period' },
    ])

    // Seed tasks
    await Task.insertMany([
      { userId: userMap['emma@school.com']._id, userName: 'Emma Wilson', date: '2026-02-15', description: 'Prepared lesson materials for Year 5 Maths' },
      { userId: userMap['emma@school.com']._id, userName: 'Emma Wilson', date: '2026-02-16', description: 'Updated student attendance records' },
      { userId: userMap['james@school.com']._id, userName: 'James Brown', date: '2026-02-20', description: 'Covered playground duty' },
    ])

    res.json({ success: true, message: 'Database seeded successfully!' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Start server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
