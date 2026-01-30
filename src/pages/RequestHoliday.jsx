import { useState, useEffect } from 'react'
import { ArrowLeft, Calendar, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react'
import * as api from '../api'

function RequestHoliday({ user, onBack }) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submissionResult, setSubmissionResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [leaveRequests, setLeaveRequests] = useState([])
  const [blockedDates, setBlockedDates] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [requests, blocked] = await Promise.all([
        api.getLeaveRequests(),
        api.getBlockedDates()
      ])
      setLeaveRequests(requests)
      setBlockedDates(blocked)
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const daysUsed = api.calculateDaysUsed(leaveRequests, user._id)
  const daysRemaining = user.yearlyQuota - daysUsed

  // FIXED: Only extend to Sunday if end date is Friday
  const getActualEndDate = () => {
    if (!endDate) return null
    const date = new Date(endDate)
    const day = date.getDay() // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
    
    // Only extend if Friday (5)
    if (day === 5) {
      date.setDate(date.getDate() + 2) // Add 2 days to get to Sunday
      return date.toISOString().split('T')[0]
    }
    
    return endDate // Keep as-is for all other days
  }

  // Check if end date is Friday (for showing the note)
  const endsOnFriday = () => {
    if (!endDate) return false
    const date = new Date(endDate)
    return date.getDay() === 5
  }

  const calculateDays = () => {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate)
    const end = new Date(getActualEndDate())
    // End date is return to work, so don't add 1
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24))
  }

  const getPeopleOffOnDate = (dateStr) => {
    return leaveRequests.filter(r =>
      r.status === 'APPROVED' &&
      r.type === 'HOLIDAY' &&
      r.startDate <= dateStr &&
      r.endDate >= dateStr
    ).length
  }

  const getMaxPeopleOff = () => {
    if (!startDate) return 0
    const actualEnd = getActualEndDate() || startDate
    let maxOff = 0
    const current = new Date(startDate)
    const end = new Date(actualEnd)
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0]
      maxOff = Math.max(maxOff, getPeopleOffOnDate(dateStr))
      current.setDate(current.getDate() + 1)
    }
    return maxOff
  }

  const hasBlockedDates = () => {
    if (!startDate) return false
    const actualEnd = getActualEndDate() || startDate
    const current = new Date(startDate)
    const end = new Date(actualEnd)
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0]
      if (blockedDates.some(b => b.date === dateStr)) return true
      current.setDate(current.getDate() + 1)
    }
    return false
  }

  const getBlockedDatesInRange = () => {
    if (!startDate) return []
    const actualEnd = getActualEndDate() || startDate
    const blocked = []
    const current = new Date(startDate)
    const end = new Date(actualEnd)
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0]
      const b = blockedDates.find(x => x.date === dateStr)
      if (b) blocked.push(b)
      current.setDate(current.getDate() + 1)
    }
    return blocked
  }

  const isWithinTwoWeeks = () => {
    if (!startDate) return false
    const diffDays = Math.ceil((new Date(startDate) - new Date()) / (1000 * 60 * 60 * 24))
    return diffDays < 14
  }

  const getDaysUntilStart = () => {
    if (!startDate) return 0
    return Math.ceil((new Date(startDate) - new Date()) / (1000 * 60 * 60 * 24))
  }

  const getApprovalStatus = () => {
    const totalDays = calculateDays()
    const maxOff = getMaxPeopleOff()

    if (!startDate || !endDate) return { status: 'incomplete', message: 'Select your dates' }
    if (totalDays > daysRemaining) return { status: 'blocked', message: `Not enough days. Need ${totalDays}, have ${daysRemaining}.`, icon: XCircle, color: 'red' }
    if (hasBlockedDates()) return { status: 'blocked', message: `Includes blocked dates: ${getBlockedDatesInRange().map(b => b.date).join(', ')}`, icon: XCircle, color: 'red' }
    if (maxOff >= 4) return { status: 'blocked', message: 'Too many people off (4+)', icon: XCircle, color: 'red' }
    if (maxOff === 3) return { status: 'warning', message: 'Pending - 3 people already off', icon: AlertTriangle, color: 'orange' }
    if (maxOff === 2) return { status: 'pending', message: 'Pending - 2 people already off', icon: Clock, color: 'yellow' }
    if (isWithinTwoWeeks()) return { status: 'pending', message: `Pending - ${getDaysUntilStart()} days notice`, icon: Clock, color: 'yellow' }
    return { status: 'auto', message: 'Will be auto-approved ✓', icon: CheckCircle, color: 'green' }
  }

  const approvalStatus = getApprovalStatus()
  const totalDays = calculateDays()
  const actualEndDate = getActualEndDate()

  const handleSubmit = async () => {
    if (approvalStatus.status === 'blocked') return
    setSubmitting(true)
    try {
      await api.createLeaveRequest({
        userId: user._id,
        userName: user.name,
        startDate,
        endDate: actualEndDate,
        type: 'HOLIDAY',
        status: approvalStatus.status === 'auto' ? 'APPROVED' : 'PENDING'
      })
      setSubmissionResult({ autoApproved: approvalStatus.status === 'auto', startDate, endDate: actualEndDate, days: totalDays })
      setSubmitted(true)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const getMinDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  if (loading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="text-gray-500">Loading...</div></div>

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-sm"><div className="max-w-2xl mx-auto px-4 py-4"><h1 className="text-xl font-bold text-gray-800">Leave Planner</h1></div></header>
        <main className="max-w-2xl mx-auto px-4 py-6">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            {submissionResult.autoApproved ? (
              <><div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="text-green-600" size={32} /></div><h2 className="text-xl font-semibold text-gray-800 mb-2">Holiday Approved!</h2><p className="text-gray-600 mb-4">Auto-approved.</p></>
            ) : (
              <><div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4"><Clock className="text-yellow-600" size={32} /></div><h2 className="text-xl font-semibold text-gray-800 mb-2">Request Submitted</h2><p className="text-gray-600 mb-4">Pending admin approval.</p></>
            )}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-500">Start:</span><span className="font-medium">{submissionResult.startDate}</span>
                <span className="text-gray-500">End:</span><span className="font-medium">{submissionResult.endDate}</span>
                <span className="text-gray-500">Days:</span><span className="font-medium">{submissionResult.days}</span>
              </div>
            </div>
            <button onClick={onBack} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Back to Dashboard</button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} className="text-gray-600" /></button>
          <div><h1 className="text-xl font-bold text-gray-800">Request Holiday</h1><p className="text-sm text-gray-500">Select your dates</p></div>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-blue-800">Remaining:</span>
            <span className="text-2xl font-bold text-blue-800">{daysRemaining} days</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Calendar size={20} />Select Dates</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
              <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); if (!endDate || e.target.value > endDate) setEndDate(e.target.value) }} min={getMinDate()} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End (Return to Work)</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate || getMinDate()} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
          {endsOnFriday() && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600"><strong>Note:</strong> Leave extends to Sunday.</div>
          )}
        </div>

        {startDate && endDate && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="font-semibold text-gray-800 mb-4">Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b pb-2"><span>Dates:</span><span className="font-medium">{startDate} → {actualEndDate}</span></div>
              <div className="flex justify-between border-b pb-2"><span>Days:</span><span className="font-bold">{totalDays}</span></div>
              <div className="flex justify-between"><span>After:</span><span className={daysRemaining - totalDays < 0 ? 'text-red-600' : ''}>{daysRemaining - totalDays} days</span></div>
            </div>
          </div>
        )}

        {approvalStatus.status !== 'incomplete' && (
          <div className={`rounded-xl p-4 mb-6 border ${approvalStatus.color === 'green' ? 'bg-green-50 border-green-200' : approvalStatus.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' : approvalStatus.color === 'orange' ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-3">
              {approvalStatus.icon && <approvalStatus.icon size={24} className={approvalStatus.color === 'green' ? 'text-green-600' : approvalStatus.color === 'yellow' ? 'text-yellow-600' : approvalStatus.color === 'orange' ? 'text-orange-600' : 'text-red-600'} />}
              <p className={approvalStatus.color === 'green' ? 'text-green-800' : approvalStatus.color === 'yellow' ? 'text-yellow-800' : approvalStatus.color === 'orange' ? 'text-orange-800' : 'text-red-800'}>{approvalStatus.message}</p>
            </div>
          </div>
        )}

        <button onClick={handleSubmit} disabled={approvalStatus.status === 'incomplete' || approvalStatus.status === 'blocked' || submitting} className={`w-full py-3 rounded-xl font-medium ${approvalStatus.status === 'incomplete' || approvalStatus.status === 'blocked' ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
          {submitting ? 'Submitting...' : approvalStatus.status === 'blocked' ? 'Cannot Submit' : 'Submit Request'}
        </button>
      </main>
    </div>
  )
}

export default RequestHoliday
