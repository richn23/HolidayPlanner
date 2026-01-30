import { useState, useEffect } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, Check, X, Users } from 'lucide-react'
import * as api from '../api'

function AssignCover({ user, onBack }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [users, setUsers] = useState([])
  const [leaveRequests, setLeaveRequests] = useState([])
  const [coverAssignments, setCoverAssignments] = useState([])
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [allUsers, requests, covers, allSchedules] = await Promise.all([
        api.getUsers(), api.getLeaveRequests(), api.getCoverAssignments(), api.getSchedules()
      ])
      setUsers(allUsers.filter(u => u.role !== 'ADMIN'))
      setLeaveRequests(requests)
      setCoverAssignments(covers)
      setSchedules(allSchedules)
    } catch (err) { console.error('Error:', err) }
    finally { setLoading(false) }
  }

  const getAbsencesForDate = (dateStr) => leaveRequests.filter(r => r.status === 'APPROVED' && r.startDate <= dateStr && r.endDate >= dateStr)
  const getCoversForDate = (dateStr) => coverAssignments.filter(c => c.date === dateStr)
  const getUserSchedule = (userId) => schedules.find(s => s.userId === userId) || { session1: false, session2: false, session3: false }

  const getAvailableTeachers = (absentUser, session, dateStr) => {
    const absences = getAbsencesForDate(dateStr)
    const absentIds = absences.map(a => a.userId)
    const covers = getCoversForDate(dateStr)
    const alreadyAssignedIds = covers.filter(c => c.session === session).map(c => c.coverUserId)
    const sessionKey = `session${session}`

    return users.filter(u => {
      if (u._id === absentUser.userId) return false
      if (absentIds.includes(u._id)) return false
      if (alreadyAssignedIds.includes(u._id)) return false
      const schedule = getUserSchedule(u._id)
      if (schedule[sessionKey]) return false
      if (u.campus === 'COVER') return true
      const absent = users.find(x => x._id === absentUser.userId)
      return absent && u.campus === absent.campus
    })
  }

  const handleAssign = async (absentUser, session, coverUser) => {
    try {
      await api.createCoverAssignment({
        date: selectedDate,
        session,
        absentUserId: absentUser.userId,
        absentUserName: absentUser.userName,
        coverUserId: coverUser._id,
        coverUserName: coverUser.name,
        reason: absentUser.type
      })
      loadData()
    } catch (err) { console.error('Error:', err) }
  }

  const handleRemove = async (coverId) => {
    try {
      await api.deleteCoverAssignment(coverId)
      loadData()
    } catch (err) { console.error('Error:', err) }
  }

  const absences = getAbsencesForDate(selectedDate)
  const covers = getCoversForDate(selectedDate)

  // Calendar helpers
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return { firstDay, daysInMonth, year, month }
  }

  const { firstDay, daysInMonth, year, month } = getDaysInMonth()

  if (loading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="text-gray-500">Loading...</div></div>

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} className="text-gray-600" /></button>
          <div><h1 className="text-xl font-bold text-gray-800">Assign Cover</h1><p className="text-sm text-gray-500">Manage cover for absences</p></div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-1 hover:bg-gray-100 rounded"><ChevronLeft size={20} /></button>
              <span className="font-semibold">{monthNames[month]} {year}</span>
              <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-1 hover:bg-gray-100 rounded"><ChevronRight size={20} /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const dayAbsences = getAbsencesForDate(dateStr)
                const dayCovers = getCoversForDate(dateStr)
                const isSelected = dateStr === selectedDate
                const hasAbsences = dayAbsences.length > 0
                const allCovered = hasAbsences && dayAbsences.every(a => {
                  const schedule = getUserSchedule(a.userId)
                  const sessions = [schedule.session1, schedule.session2, schedule.session3].filter(Boolean).length
                  const covered = dayCovers.filter(c => c.absentUserId === a.userId).length
                  return covered >= sessions
                })

                let bg = 'bg-gray-100'
                if (hasAbsences) bg = allCovered ? 'bg-green-100' : 'bg-orange-100'
                if (isSelected) bg = 'bg-blue-500 text-white'

                return (
                  <button key={day} onClick={() => setSelectedDate(dateStr)} className={`h-8 rounded text-sm ${bg} hover:ring-2 hover:ring-blue-300`}>
                    {day}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Assignments */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">{new Date(selectedDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>

            {absences.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <Users className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-500">No absences on this date</p>
              </div>
            ) : (
              absences.map(absence => {
                const schedule = getUserSchedule(absence.userId)
                const sessions = [
                  { num: 1, teaching: schedule.session1 },
                  { num: 2, teaching: schedule.session2 },
                  { num: 3, teaching: schedule.session3 }
                ].filter(s => s.teaching)

                return (
                  <div key={absence._id} className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-800">{absence.userName}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${absence.type === 'HOLIDAY' ? 'bg-blue-100 text-blue-700' : absence.type === 'SICK' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>{absence.type}</span>
                      </div>
                    </div>

                    {sessions.length === 0 ? (
                      <p className="text-sm text-gray-500">No teaching sessions</p>
                    ) : (
                      <div className="space-y-3">
                        {sessions.map(({ num }) => {
                          const cover = covers.find(c => c.absentUserId === absence.userId && c.session === num)
                          const available = getAvailableTeachers(absence, num, selectedDate)

                          return (
                            <div key={num} className="border rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-700">Session {num}</span>
                                {cover ? (
                                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Covered</span>
                                ) : (
                                  <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full">Needs Cover</span>
                                )}
                              </div>

                              {cover ? (
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">{cover.coverUserName}</span>
                                  <button onClick={() => handleRemove(cover._id)} className="text-red-500 hover:text-red-700"><X size={16} /></button>
                                </div>
                              ) : (
                                <div className="flex flex-wrap gap-2">
                                  {available.length === 0 ? (
                                    <span className="text-sm text-red-500">No teachers available</span>
                                  ) : (
                                    available.map(t => (
                                      <button key={t._id} onClick={() => handleAssign(absence, num, t)} className={`text-xs px-3 py-1 rounded-full border hover:bg-gray-50 ${t.campus === 'COVER' ? 'border-purple-300 text-purple-700' : 'border-gray-300'}`}>
                                        {t.name}
                                      </button>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default AssignCover
