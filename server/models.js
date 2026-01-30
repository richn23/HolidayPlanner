import mongoose from 'mongoose'

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['TEACHER', 'COVER_TEACHER', 'ADMIN'], default: 'TEACHER' },
  campus: { type: String, enum: ['JBR', 'JLT', 'COVER'], required: true },
  yearlyQuota: { type: Number, default: 30 },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
}, { timestamps: true })

// Leave Request Schema
const leaveRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  type: { type: String, enum: ['HOLIDAY', 'SICK', 'OTHER'], required: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  requestedAt: { type: Date, default: Date.now },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  note: { type: String },
}, { timestamps: true })

// Teaching Schedule Schema
const teachingScheduleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  session1: { type: Boolean, default: false },
  session2: { type: Boolean, default: false },
  session3: { type: Boolean, default: false },
  notes: { type: String, default: '' },
}, { timestamps: true })

// Cover Assignment Schema
const coverAssignmentSchema = new mongoose.Schema({
  date: { type: String, required: true },
  session: { type: Number, required: true },
  absentUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  absentUserName: { type: String, required: true },
  coverUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coverUserName: { type: String, required: true },
  reason: { type: String },
}, { timestamps: true })

// Blocked Date Schema
const blockedDateSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true },
  reason: { type: String, required: true },
}, { timestamps: true })

// Task Schema (Cover Teacher admin tasks)
const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  date: { type: String, required: true },
  description: { type: String, required: true },
}, { timestamps: true })

// Export models
export const User = mongoose.model('User', userSchema)
export const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema)
export const TeachingSchedule = mongoose.model('TeachingSchedule', teachingScheduleSchema)
export const CoverAssignment = mongoose.model('CoverAssignment', coverAssignmentSchema)
export const BlockedDate = mongoose.model('BlockedDate', blockedDateSchema)
export const Task = mongoose.model('Task', taskSchema)
