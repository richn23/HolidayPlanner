import { useState, useEffect } from 'react'
import { ArrowLeft, Users, Calendar, Award, ClipboardList, TrendingUp, User } from 'lucide-react'
import * as api from '../api'

function Reports({ user, onBack }) {
  const [activeTab, setActiveTab] = useState('balances')
  const [selectedTeacher, setSelectedTeacher] = useState(null)
  const [users, setUsers] = useState([])
  const [leaveRequests, setLeaveRequests] = useState([])
  const [coverAssignments, setCoverAssignments] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [allUsers, requests, covers, allTasks] = await Promise.all([
        api.getUsers(), api.getLeaveRequests(), api.getCoverAssignments(), api.getTasks()
      ])
      setUsers(allUsers.filter(u => u.role !== 'ADMIN'))
      setLeaveRequests(requests)
      setCoverAssignments(covers)
      setTasks(allTasks)
    } catch (err) { console.error('Error:', err) }
    finally { setLoading(false) }
  }

  const tabs = [
    { id: 'balances', label: 'Holiday Balances', icon: Calendar },
    { id: 'cover-leaderboard', label: 'Cover Leaderboard', icon: Award },
    { id: 'absence-leaderboard', label: 'Absence Leaderboard', icon: Users },
    { id: 'tasks', label: 'Tasks', icon: ClipboardList },
    { id: 'monthly', label: 'Monthly Summary', icon: TrendingUp },
    { id: 'teacher-profile', label: 'Teacher Profile', icon: User },
  ]

  const getDaysUsedByUser = (userId) => {
    return leaveRequests.filter(r => r.userId === userId && r.status === 'APPROVED' && r.type === 'HOLIDAY')
      .reduce((sum, r) => sum + Math.ceil((new Date(r.endDate) - new Date(r.startDate)) / (1000 * 60 * 60 * 24)) + 1, 0)
  }

  const getCampusBadge = (campus) => campus === 'JBR' ? 'bg-blue-100 text-blue-700' : campus === 'JLT' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'

  const balancesData = users.map(u => ({ ...u, used: getDaysUsedByUser(u._id), remaining: u.yearlyQuota - getDaysUsedByUser(u._id) })).sort((a, b) => b.used - a.used)

  const coverLeaderboard = Object.entries(coverAssignments.reduce((acc, c) => {
    if (!acc[c.coverUserId]) acc[c.coverUserId] = { name: c.coverUserName, sessions: 0 }
    acc[c.coverUserId].sessions++
    return acc
  }, {})).map(([id, data]) => ({ userId: id, ...data, user: users.find(u => u._id === id) })).sort((a, b) => b.sessions - a.sessions)

  const absenceLeaderboard = Object.entries(leaveRequests.filter(r => r.status === 'APPROVED').reduce((acc, r) => {
    if (!acc[r.userId]) acc[r.userId] = { name: r.userName, days: 0, holidays: 0, sick: 0, other: 0 }
    const days = Math.ceil((new Date(r.endDate) - new Date(r.startDate)) / (1000 * 60 * 60 * 24)) + 1
    acc[r.userId].days += days
    if (r.type === 'HOLIDAY') acc[r.userId].holidays += days
    if (r.type === 'SICK') acc[r.userId].sick += days
    if (r.type === 'OTHER') acc[r.userId].other += days
    return acc
  }, {})).map(([id, data]) => ({ userId: id, ...data, user: users.find(u => u._id === id) })).sort((a, b) => b.days - a.days)

  const getTeacherProfile = (teacherId) => {
    const teacher = users.find(u => u._id === teacherId)
    if (!teacher) return null
    const today = new Date()
    const teacherLeave = leaveRequests.filter(r => r.userId === teacherId && r.status === 'APPROVED')
    const leaveTaken = teacherLeave.filter(r => new Date(r.endDate) < today)
    const upcomingLeave = teacherLeave.filter(r => new Date(r.startDate) >= today)
    const pendingRequests = leaveRequests.filter(r => r.userId === teacherId && r.status === 'PENDING')
    const sessionsCovered = coverAssignments.filter(c => c.coverUserId === teacherId)
    const tasksLogged = tasks.filter(t => t.userId === teacherId)
    return { teacher, leaveTaken, upcomingLeave, pendingRequests, sessionsCovered, tasksLogged, stats: { holidayDays: getDaysUsedByUser(teacherId), sickDays: leaveTaken.filter(r => r.type === 'SICK').reduce((s, r) => s + Math.ceil((new Date(r.endDate) - new Date(r.startDate)) / 86400000) + 1, 0), sessionsCoveredCount: sessionsCovered.length, remaining: teacher.yearlyQuota - getDaysUsedByUser(teacherId) } }
  }

  const teacherProfile = selectedTeacher ? getTeacherProfile(selectedTeacher) : null

  if (loading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="text-gray-500">Loading...</div></div>

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} className="text-gray-600" /></button>
          <div><h1 className="text-xl font-bold text-gray-800">Reports</h1></div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (tab.id !== 'teacher-profile') setSelectedTeacher(null) }} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}>
              <tab.icon size={18} />{tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'balances' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b"><h2 className="font-semibold text-gray-800">Holiday Balances</h2></div>
            <div className="divide-y">
              {balancesData.map(p => (
                <div key={p._id} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3"><span className="font-medium text-gray-800">{p.name}</span><span className={`text-xs px-2 py-0.5 rounded-full ${getCampusBadge(p.campus)}`}>{p.campus}</span></div>
                    <div><span className="font-semibold text-gray-800">{p.remaining}</span><span className="text-gray-500 text-sm"> / {p.yearlyQuota}</span></div>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full ${p.used / p.yearlyQuota > 0.9 ? 'bg-red-500' : p.used / p.yearlyQuota > 0.7 ? 'bg-orange-500' : 'bg-green-500'}`} style={{ width: `${(p.used / p.yearlyQuota) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'cover-leaderboard' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b"><h2 className="font-semibold text-gray-800">Cover Leaderboard</h2></div>
            <div className="divide-y">
              {coverLeaderboard.map((p, i) => (
                <div key={p.userId} className="px-6 py-4 flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-200 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>{i + 1}</div>
                  <div className="flex-1"><span className="font-medium text-gray-800">{p.name}</span>{p.user?.role === 'COVER_TEACHER' && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Cover</span>}</div>
                  <div><span className="text-2xl font-bold text-gray-800">{p.sessions}</span><span className="text-sm text-gray-500 ml-1">sessions</span></div>
                </div>
              ))}
              {coverLeaderboard.length === 0 && <div className="p-8 text-center text-gray-500">No cover assignments yet</div>}
            </div>
          </div>
        )}

        {activeTab === 'absence-leaderboard' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b"><h2 className="font-semibold text-gray-800">Absence Leaderboard</h2></div>
            <div className="divide-y">
              {absenceLeaderboard.map((p, i) => (
                <div key={p.userId} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-sm text-gray-500">{i + 1}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2"><span className="font-medium text-gray-800">{p.name}</span>{p.user && <span className={`text-xs px-2 py-0.5 rounded-full ${getCampusBadge(p.user.campus)}`}>{p.user.campus}</span>}</div>
                    <div className="flex gap-3 mt-1 text-xs">{p.holidays > 0 && <span className="text-blue-600">{p.holidays} holiday</span>}{p.sick > 0 && <span className="text-orange-600">{p.sick} sick</span>}{p.other > 0 && <span className="text-purple-600">{p.other} other</span>}</div>
                  </div>
                  <div><span className="text-2xl font-bold text-gray-800">{p.days}</span><span className="text-sm text-gray-500 ml-1">days</span></div>
                </div>
              ))}
              {absenceLeaderboard.length === 0 && <div className="p-8 text-center text-gray-500">No absences recorded</div>}
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b"><h2 className="font-semibold text-gray-800">Cover Teacher Tasks</h2></div>
            <div className="divide-y">
              {tasks.sort((a, b) => b.date.localeCompare(a.date)).map(t => (
                <div key={t._id} className="px-6 py-4 flex justify-between">
                  <div><p className="text-gray-800">{t.description}</p><p className="text-sm text-gray-500">By {t.userName}</p></div>
                  <span className="text-sm text-gray-500">{new Date(t.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                </div>
              ))}
              {tasks.length === 0 && <div className="p-8 text-center text-gray-500">No tasks logged</div>}
            </div>
          </div>
        )}

        {activeTab === 'monthly' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b"><h2 className="font-semibold text-gray-800">Monthly Summary</h2></div>
            <div className="divide-y">
              {Object.entries(leaveRequests.filter(r => r.status === 'APPROVED').reduce((acc, r) => {
                const monthKey = r.startDate.slice(0, 7)
                if (!acc[monthKey]) acc[monthKey] = { absences: 0, holidays: 0, sick: 0, other: 0 }
                acc[monthKey].absences++
                if (r.type === 'HOLIDAY') acc[monthKey].holidays++
                if (r.type === 'SICK') acc[monthKey].sick++
                if (r.type === 'OTHER') acc[monthKey].other++
                return acc
              }, {})).sort(([a], [b]) => b.localeCompare(a)).map(([month, data]) => (
                <div key={month} className="px-6 py-4">
                  <h3 className="font-semibold text-gray-800 mb-3">{new Date(month + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3 text-center"><div className="text-2xl font-bold text-gray-800">{data.absences}</div><div className="text-xs text-gray-500">Total</div></div>
                    <div className="bg-blue-50 rounded-lg p-3 text-center"><div className="text-2xl font-bold text-blue-700">{data.holidays}</div><div className="text-xs text-blue-600">Holidays</div></div>
                    <div className="bg-orange-50 rounded-lg p-3 text-center"><div className="text-2xl font-bold text-orange-700">{data.sick}</div><div className="text-xs text-orange-600">Sick</div></div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center"><div className="text-2xl font-bold text-purple-700">{data.other}</div><div className="text-xs text-purple-600">Other</div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'teacher-profile' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Teacher</label>
              <select value={selectedTeacher || ''} onChange={(e) => setSelectedTeacher(e.target.value || null)} className="w-full md:w-64 px-3 py-2 border rounded-lg">
                <option value="">Choose...</option>
                {users.sort((a, b) => a.name.localeCompare(b.name)).map(u => <option key={u._id} value={u._id}>{u.name} ({u.campus})</option>)}
              </select>
            </div>

            {!selectedTeacher && <div className="bg-white rounded-xl shadow-sm p-8 text-center"><User className="mx-auto text-gray-400 mb-4" size={48} /><p className="text-gray-500">Select a teacher above</p></div>}

            {teacherProfile && (
              <>
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center"><User className="text-blue-600" size={32} /></div>
                    <div><h2 className="text-xl font-bold text-gray-800">{teacherProfile.teacher.name}</h2><span className={`text-xs px-2 py-0.5 rounded-full ${getCampusBadge(teacherProfile.teacher.campus)}`}>{teacherProfile.teacher.campus}</span></div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-3 text-center"><div className="text-2xl font-bold text-blue-700">{teacherProfile.stats.holidayDays}</div><div className="text-xs text-blue-600">Holiday</div></div>
                    <div className="bg-orange-50 rounded-lg p-3 text-center"><div className="text-2xl font-bold text-orange-700">{teacherProfile.stats.sickDays}</div><div className="text-xs text-orange-600">Sick</div></div>
                    <div className="bg-green-50 rounded-lg p-3 text-center"><div className="text-2xl font-bold text-green-700">{teacherProfile.stats.sessionsCoveredCount}</div><div className="text-xs text-green-600">Covered</div></div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center"><div className="text-2xl font-bold text-purple-700">{teacherProfile.stats.remaining}</div><div className="text-xs text-purple-600">Remaining</div></div>
                  </div>
                </div>

                {teacherProfile.upcomingLeave.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b"><h3 className="font-semibold text-gray-800">Upcoming Leave</h3></div>
                    <div className="divide-y">{teacherProfile.upcomingLeave.map(l => <div key={l._id} className="px-6 py-3 flex justify-between"><span>{l.startDate} → {l.endDate}</span><span className={`text-xs px-2 py-1 rounded-full ${l.type === 'HOLIDAY' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{l.type}</span></div>)}</div>
                  </div>
                )}

                {teacherProfile.leaveTaken.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b"><h3 className="font-semibold text-gray-800">Leave History</h3></div>
                    <div className="divide-y">{teacherProfile.leaveTaken.map(l => <div key={l._id} className="px-6 py-3 flex justify-between"><span>{l.startDate} → {l.endDate}</span><span className={`text-xs px-2 py-1 rounded-full ${l.type === 'HOLIDAY' ? 'bg-blue-100 text-blue-700' : l.type === 'SICK' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>{l.type}</span></div>)}</div>
                  </div>
                )}

                {teacherProfile.sessionsCovered.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b"><h3 className="font-semibold text-gray-800">Sessions Covered</h3></div>
                    <div className="divide-y">{teacherProfile.sessionsCovered.map(c => <div key={c._id} className="px-6 py-3 flex justify-between"><span>Covered {c.absentUserName} - Session {c.session}</span><span className="text-sm text-gray-500">{new Date(c.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span></div>)}</div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default Reports
