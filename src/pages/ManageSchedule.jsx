import { useState, useEffect } from 'react'
import { ArrowLeft, Save, CheckCircle } from 'lucide-react'
import * as api from '../api'

function ManageSchedule({ user, onBack }) {
  const [users, setUsers] = useState([])
  const [schedules, setSchedules] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [success, setSuccess] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [allUsers, allSchedules] = await Promise.all([api.getUsers(), api.getSchedules()])
      const staff = allUsers.filter(u => u.role !== 'ADMIN' && u.status === 'ACTIVE')
      setUsers(staff)
      const scheduleMap = {}
      allSchedules.forEach(s => { scheduleMap[s.userId] = s })
      staff.forEach(u => {
        if (!scheduleMap[u._id]) {
          scheduleMap[u._id] = { userId: u._id, session1: false, session2: false, session3: false, notes: '' }
        }
      })
      setSchedules(scheduleMap)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (userId, session) => {
    setSchedules(prev => ({
      ...prev,
      [userId]: { ...prev[userId], [session]: !prev[userId][session] }
    }))
    setHasChanges(true)
  }

  const handleNoteChange = (userId, notes) => {
    setSchedules(prev => ({
      ...prev,
      [userId]: { ...prev[userId], notes }
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.bulkUpdateSchedules(Object.values(schedules))
      setSuccess(true)
      setHasChanges(false)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setSaving(false)
    }
  }

  const filteredUsers = users.filter(u => {
    if (filter === 'all') return true
    if (filter === 'cover') return u.campus === 'COVER'
    return u.campus === filter
  })

  if (loading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="text-gray-500">Loading...</div></div>

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} className="text-gray-600" /></button>
            <div><h1 className="text-xl font-bold text-gray-800">Manage Schedule</h1><p className="text-sm text-gray-500">Set teaching sessions</p></div>
          </div>
          <button onClick={handleSave} disabled={!hasChanges || saving} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 flex items-center gap-2">
            <Save size={18} />{saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <CheckCircle className="text-green-600" size={20} /><span className="text-green-700">Schedule saved!</span>
          </div>
        )}

        <div className="flex gap-2 mb-4">
          {['all', 'JBR', 'JLT', 'cover'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}>
              {f === 'all' ? 'All Staff' : f === 'cover' ? 'Cover Teachers' : f}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Teacher</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Session 1</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Session 2</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Session 3</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredUsers.map(u => {
                const schedule = schedules[u._id] || {}
                return (
                  <tr key={u._id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{u.name}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.campus === 'JBR' ? 'bg-blue-100 text-blue-700' : u.campus === 'JLT' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>{u.campus}</span>
                    </td>
                    {['session1', 'session2', 'session3'].map(s => (
                      <td key={s} className="px-4 py-3 text-center">
                        <input type="checkbox" checked={schedule[s] || false} onChange={() => handleToggle(u._id, s)} className="w-5 h-5 text-blue-600 rounded" />
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <input type="text" value={schedule.notes || ''} onChange={(e) => handleNoteChange(u._id, e.target.value)} placeholder="e.g. Year 5 Maths" className="w-full px-2 py-1 border rounded text-sm" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}

export default ManageSchedule
