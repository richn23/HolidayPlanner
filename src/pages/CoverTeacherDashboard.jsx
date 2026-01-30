import { useState, useEffect } from 'react'
import { LogOut, Calendar as CalendarIcon, Clock, CheckCircle, ClipboardList, Plus } from 'lucide-react'
import Calendar from '../components/Calendar'
import * as api from '../api'

function CoverTeacherDashboard({ user, onLogout, onNavigate }) {
  const [coverAssignments, setCoverAssignments] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [newTask, setNewTask] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [covers, allTasks] = await Promise.all([api.getCoverAssignments(), api.getTasks(user._id)])
      setCoverAssignments(covers.filter(c => c.coverUserId === user._id))
      setTasks(allTasks)
    } catch (err) { console.error('Error:', err) }
    finally { setLoading(false) }
  }

  const handleAddTask = async () => {
    if (!newTask.trim()) return
    setSubmitting(true)
    try {
      await api.createTask({ userId: user._id, userName: user.name, date: new Date().toISOString().split('T')[0], description: newTask })
      setNewTask('')
      setShowTaskModal(false)
      loadData()
    } catch (err) { console.error('Error:', err) }
    finally { setSubmitting(false) }
  }

  const upcomingCover = coverAssignments.filter(c => new Date(c.date) >= new Date()).sort((a, b) => a.date.localeCompare(b.date))

  if (loading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="text-gray-500">Loading...</div></div>

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div><h1 className="text-xl font-bold text-gray-800">Leave Planner</h1><p className="text-sm text-gray-500">Welcome, {user.name}</p></div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 bg-purple-100 text-purple-700 px-3 py-1 rounded-full">Cover Teacher</span>
            <button onClick={onLogout} className="flex items-center gap-2 text-gray-600 hover:text-gray-800"><LogOut size={18} /><span className="text-sm">Sign Out</span></button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3"><div className="p-3 bg-green-100 rounded-lg"><CheckCircle className="text-green-600" size={24} /></div><div><p className="text-sm text-gray-500">Sessions Covered</p><p className="text-2xl font-bold text-gray-800">{coverAssignments.length}</p></div></div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3"><div className="p-3 bg-blue-100 rounded-lg"><CalendarIcon className="text-blue-600" size={24} /></div><div><p className="text-sm text-gray-500">Upcoming Cover</p><p className="text-2xl font-bold text-gray-800">{upcomingCover.length}</p></div></div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3"><div className="p-3 bg-purple-100 rounded-lg"><ClipboardList className="text-purple-600" size={24} /></div><div><p className="text-sm text-gray-500">Tasks Logged</p><p className="text-2xl font-bold text-gray-800">{tasks.length}</p></div></div>
          </div>
        </div>

        <div className="mb-6 flex gap-3">
          <button onClick={() => onNavigate('request-holiday')} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"><CalendarIcon size={20} />Request Holiday</button>
          <button onClick={() => setShowTaskModal(true)} className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-medium flex items-center gap-2"><Plus size={20} />Log Task</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-2"><Calendar isAdmin={false} /></div>

          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b"><h2 className="font-semibold text-gray-800">Upcoming Cover</h2></div>
            <div className="p-4">
              {upcomingCover.length === 0 ? <p className="text-gray-500 text-sm">No upcoming cover</p> : (
                <div className="space-y-3">
                  {upcomingCover.slice(0, 5).map(c => (
                    <div key={c._id} className="border rounded-lg p-3">
                      <div className="flex justify-between"><span className="font-medium text-gray-800">{c.date}</span><span className="text-sm text-gray-500">Session {c.session}</span></div>
                      <p className="text-sm text-gray-600">Covering {c.absentUserName}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b"><h2 className="font-semibold text-gray-800">Recent Tasks</h2></div>
            <div className="p-4">
              {tasks.length === 0 ? <p className="text-gray-500 text-sm">No tasks logged</p> : (
                <div className="space-y-3">
                  {tasks.slice(0, 5).map(t => (
                    <div key={t._id} className="border rounded-lg p-3">
                      <p className="text-gray-800">{t.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{t.date}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Log Task</h3>
            <textarea value={newTask} onChange={(e) => setNewTask(e.target.value)} rows={4} className="w-full px-3 py-2 border rounded-lg mb-4" placeholder="What did you do today?" />
            <div className="flex gap-3">
              <button onClick={() => { setShowTaskModal(false); setNewTask('') }} className="flex-1 px-4 py-2 border text-gray-700 rounded-lg">Cancel</button>
              <button onClick={handleAddTask} disabled={!newTask.trim() || submitting} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg disabled:bg-gray-300">{submitting ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CoverTeacherDashboard
