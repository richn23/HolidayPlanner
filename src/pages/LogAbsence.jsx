import { useState, useEffect } from 'react'
import { ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react'
import * as api from '../api'

function LogAbsence({ user, onBack }) {
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [type, setType] = useState('SICK')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const allUsers = await api.getUsers()
      setUsers(allUsers.filter(u => u.role !== 'ADMIN' && u.status === 'ACTIVE'))
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedUser || !startDate) return

    setSubmitting(true)
    try {
      const userData = users.find(u => u._id === selectedUser)
      await api.createLeaveRequest({
        userId: selectedUser,
        userName: userData?.name || 'Unknown',
        startDate,
        endDate: endDate || startDate,
        type,
        status: 'APPROVED',
        approvedBy: user._id,
        note
      })
      setSuccess(true)
      setTimeout(() => onBack(), 2000)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="text-gray-500">Loading...</div></div>

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Absence Logged</h2>
          <p className="text-gray-500">Returning to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} className="text-gray-600" /></button>
          <div><h1 className="text-xl font-bold text-gray-800">Log Absence</h1><p className="text-sm text-gray-500">Record sick day or other absence</p></div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
            <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required>
              <option value="">Select teacher...</option>
              {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.campus})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
              <option value="SICK">Sick Leave</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); if (!endDate) setEndDate(e.target.value) }} className="w-full px-3 py-2 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-lg" placeholder="Optional details..." />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="text-yellow-600 flex-shrink-0" size={20} />
            <p className="text-sm text-yellow-800">This absence will be immediately approved and logged.</p>
          </div>

          <button type="submit" disabled={submitting || !selectedUser || !startDate} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300">
            {submitting ? 'Logging...' : 'Log Absence'}
          </button>
        </form>
      </main>
    </div>
  )
}

export default LogAbsence
