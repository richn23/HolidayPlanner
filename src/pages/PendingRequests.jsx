import { useState, useEffect } from 'react'
import { ArrowLeft, Check, X, AlertTriangle, Clock, Calendar } from 'lucide-react'
import * as api from '../api'

function PendingRequests({ user, onBack }) {
  const [leaveRequests, setLeaveRequests] = useState([])
  const [allLeaveRequests, setAllLeaveRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const requests = await api.getLeaveRequests()
      setAllLeaveRequests(requests)
      setLeaveRequests(requests.filter(r => r.status === 'PENDING'))
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getPeopleOffOnDate = (dateStr) => {
    return allLeaveRequests.filter(r =>
      r.status === 'APPROVED' &&
      r.type === 'HOLIDAY' &&
      r.startDate <= dateStr &&
      r.endDate >= dateStr
    ).length
  }

  const getDatesInRange = (start, end) => {
    const dates = []
    const current = new Date(start)
    const endDate = new Date(end)
    while (current <= endDate) {
      dates.push(current.toISOString().split('T')[0])
      current.setDate(current.getDate() + 1)
    }
    return dates
  }

  const handleApprove = async (request) => {
    setProcessing(request._id)
    try {
      await api.updateLeaveRequest(request._id, { status: 'APPROVED', approvedBy: user._id, approvedAt: new Date() })
      loadData()
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (request) => {
    setProcessing(request._id)
    try {
      await api.updateLeaveRequest(request._id, { status: 'REJECTED' })
      loadData()
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setProcessing(null)
    }
  }

  const getTypeBadge = (type) => {
    switch (type) {
      case 'HOLIDAY': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">Holiday</span>
      case 'SICK': return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">Sick</span>
      case 'OTHER': return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">Other</span>
      default: return null
    }
  }

  if (loading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="text-gray-500">Loading...</div></div>

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} className="text-gray-600" /></button>
          <div><h1 className="text-xl font-bold text-gray-800">Pending Requests</h1><p className="text-sm text-gray-500">{leaveRequests.length} requests</p></div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {leaveRequests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Clock className="mx-auto text-gray-400 mb-4" size={48} />
            <h2 className="text-lg font-semibold text-gray-800 mb-2">No Pending Requests</h2>
            <p className="text-gray-500">All caught up!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {leaveRequests.map(request => {
              const dates = getDatesInRange(request.startDate, request.endDate)
              return (
                <div key={request._id} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-800">{request.userName}</h3>
                      <p className="text-sm text-gray-500">{request.startDate} → {request.endDate}</p>
                    </div>
                    {getTypeBadge(request.type)}
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Daily breakdown:</p>
                    <div className="flex flex-wrap gap-2">
                      {dates.map(date => {
                        const offCount = getPeopleOffOnDate(date)
                        let bg = 'bg-green-100 text-green-700'
                        if (offCount >= 3) bg = 'bg-red-100 text-red-700'
                        else if (offCount === 2) bg = 'bg-yellow-100 text-yellow-700'
                        return (
                          <div key={date} className={`px-2 py-1 rounded text-xs ${bg}`}>
                            {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} ({offCount} off)
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => handleApprove(request)} disabled={processing === request._id} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 disabled:bg-gray-300">
                      <Check size={18} />{processing === request._id ? 'Processing...' : 'Approve'}
                    </button>
                    <button onClick={() => handleReject(request)} disabled={processing === request._id} className="flex-1 border border-red-300 text-red-600 py-2 rounded-lg hover:bg-red-50 flex items-center justify-center gap-2 disabled:bg-gray-100">
                      <X size={18} />Reject
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

export default PendingRequests
