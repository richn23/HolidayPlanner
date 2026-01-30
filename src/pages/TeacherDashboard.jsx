import { useState, useEffect } from 'react'
import { LogOut, Calendar as CalendarIcon, Clock, CheckCircle, XCircle, Users } from 'lucide-react'
import Calendar from '../components/Calendar'
import * as api from '../api'

function TeacherDashboard({ user, onLogout, onNavigate }) {
  const [leaveRequests, setLeaveRequests] = useState([])
  const [coverAssignments, setCoverAssignments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [requests, covers] = await Promise.all([
        api.getLeaveRequests(),
        api.getCoverAssignments()
      ])
      setLeaveRequests(requests)
      setCoverAssignments(covers)
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const daysUsed = api.calculateDaysUsed(leaveRequests, user._id)
  const daysRemaining = user.yearlyQuota - daysUsed

  // Get my leave requests
  const myRequests = leaveRequests
    .filter(r => r.userId === user._id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  // Get upcoming approved leave
  const upcomingLeave = myRequests.filter(r => 
    r.status === 'APPROVED' && 
    new Date(r.startDate) >= new Date()
  )

  // Get cover assignments where someone covers for me
  const myCoverReceived = coverAssignments.filter(c => c.absentUserId === user._id)

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Approved</span>
      case 'PENDING':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Pending</span>
      case 'REJECTED':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Rejected</span>
      default:
        return null
    }
  }

  const getTypeBadge = (type) => {
    switch (type) {
      case 'HOLIDAY':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Holiday</span>
      case 'SICK':
        return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Sick</span>
      case 'OTHER':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Other</span>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Leave Planner</h1>
            <p className="text-sm text-gray-500">Welcome, {user.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {user.campus}
            </span>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <LogOut size={18} />
              <span className="text-sm">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <CalendarIcon className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Days Remaining</p>
                <p className="text-2xl font-bold text-gray-800">{daysRemaining}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">{daysUsed} of {user.yearlyQuota} used this year</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Upcoming Leave</p>
                <p className="text-2xl font-bold text-gray-800">{upcomingLeave.length}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Approved requests coming up</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Clock className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending Requests</p>
                <p className="text-2xl font-bold text-gray-800">
                  {myRequests.filter(r => r.status === 'PENDING').length}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Awaiting approval</p>
          </div>
        </div>

        {/* Request Holiday Button */}
        <div className="mb-6">
          <button 
            onClick={() => onNavigate('request-holiday')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
          >
            <CalendarIcon size={20} />
            Request Holiday
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <Calendar isAdmin={false} />
          </div>

          {/* My Requests */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">My Leave Requests</h2>
            </div>
            <div className="p-4">
              {myRequests.length === 0 ? (
                <p className="text-gray-500 text-sm">No requests yet</p>
              ) : (
                <div className="space-y-3">
                  {myRequests.map(request => (
                    <div key={request._id} className="border border-gray-100 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-800">
                            {request.startDate} → {request.endDate}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {getTypeBadge(request.type)}
                          {getStatusBadge(request.status)}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">
                        Requested on {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cover Received */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">My Cover Arrangements</h2>
            </div>
            <div className="p-4">
              {myCoverReceived.length === 0 ? (
                <p className="text-gray-500 text-sm">No cover arrangements yet</p>
              ) : (
                <div className="space-y-3">
                  {myCoverReceived.map(cover => (
                    <div key={cover._id} className="border border-gray-100 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">{cover.date}</p>
                          <p className="text-sm text-gray-500">Session {cover.session}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Users size={14} />
                            <span>{cover.coverUserName}</span>
                          </div>
                          <p className="text-xs text-gray-400">covering for you</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default TeacherDashboard
