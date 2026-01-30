import { useState, useEffect } from 'react'
import { LogOut, Users, Calendar as CalendarIcon, Clock, AlertTriangle, UserPlus, ClipboardList, CalendarOff, FileText } from 'lucide-react'
import Calendar from '../components/Calendar'
import * as api from '../api'

function AdminDashboard({ user, onLogout, onNavigate }) {
  const [leaveRequests, setLeaveRequests] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [requests, allUsers] = await Promise.all([api.getLeaveRequests(), api.getUsers()])
      setLeaveRequests(requests)
      setUsers(allUsers)
    } catch (err) { console.error('Error:', err) }
    finally { setLoading(false) }
  }

  const pendingRequests = leaveRequests.filter(r => r.status === 'PENDING')
  const todayStr = new Date().toISOString().split('T')[0]
  const offToday = leaveRequests.filter(r => r.status === 'APPROVED' && r.startDate <= todayStr && r.endDate >= todayStr)
  const activeStaff = users.filter(u => u.role !== 'ADMIN' && u.status === 'ACTIVE')

  if (loading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="text-gray-500">Loading...</div></div>

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div><h1 className="text-xl font-bold text-gray-800">Leave Planner</h1><p className="text-sm text-gray-500">Admin Dashboard</p></div>
          <button onClick={onLogout} className="flex items-center gap-2 text-gray-600 hover:text-gray-800"><LogOut size={18} /><span className="text-sm">Sign Out</span></button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3"><div className="p-3 bg-yellow-100 rounded-lg"><Clock className="text-yellow-600" size={24} /></div><div><p className="text-sm text-gray-500">Pending</p><p className="text-2xl font-bold text-gray-800">{pendingRequests.length}</p></div></div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3"><div className="p-3 bg-orange-100 rounded-lg"><AlertTriangle className="text-orange-600" size={24} /></div><div><p className="text-sm text-gray-500">Off Today</p><p className="text-2xl font-bold text-gray-800">{offToday.length}</p></div></div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3"><div className="p-3 bg-blue-100 rounded-lg"><Users className="text-blue-600" size={24} /></div><div><p className="text-sm text-gray-500">Active Staff</p><p className="text-2xl font-bold text-gray-800">{activeStaff.length}</p></div></div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3"><div className="p-3 bg-green-100 rounded-lg"><CalendarIcon className="text-green-600" size={24} /></div><div><p className="text-sm text-gray-500">This Month</p><p className="text-2xl font-bold text-gray-800">{leaveRequests.filter(r => r.status === 'APPROVED' && r.startDate.startsWith(todayStr.slice(0, 7))).length}</p></div></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><Calendar isAdmin={true} /></div>

          <div className="space-y-6">
            {pendingRequests.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <h3 className="font-semibold text-yellow-800 mb-3">{pendingRequests.length} Pending Request{pendingRequests.length !== 1 ? 's' : ''}</h3>
                <button onClick={() => onNavigate('pending-requests')} className="w-full bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700">Review Now</button>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => onNavigate('pending-requests')} className="p-4 border rounded-lg hover:bg-gray-50 flex flex-col items-center gap-2"><Clock size={20} className="text-gray-600" /><span className="text-sm text-gray-700">Pending</span></button>
                <button onClick={() => onNavigate('log-absence')} className="p-4 border rounded-lg hover:bg-gray-50 flex flex-col items-center gap-2"><AlertTriangle size={20} className="text-gray-600" /><span className="text-sm text-gray-700">Log Absence</span></button>
                <button onClick={() => onNavigate('assign-cover')} className="p-4 border rounded-lg hover:bg-gray-50 flex flex-col items-center gap-2"><Users size={20} className="text-gray-600" /><span className="text-sm text-gray-700">Assign Cover</span></button>
                <button onClick={() => onNavigate('manage-staff')} className="p-4 border rounded-lg hover:bg-gray-50 flex flex-col items-center gap-2"><UserPlus size={20} className="text-gray-600" /><span className="text-sm text-gray-700">Manage Staff</span></button>
                <button onClick={() => onNavigate('manage-schedule')} className="p-4 border rounded-lg hover:bg-gray-50 flex flex-col items-center gap-2"><ClipboardList size={20} className="text-gray-600" /><span className="text-sm text-gray-700">Schedule</span></button>
                <button onClick={() => onNavigate('block-dates')} className="p-4 border rounded-lg hover:bg-gray-50 flex flex-col items-center gap-2"><CalendarOff size={20} className="text-gray-600" /><span className="text-sm text-gray-700">Block Dates</span></button>
                <button onClick={() => onNavigate('reports')} className="p-4 border rounded-lg hover:bg-gray-50 flex flex-col items-center gap-2 col-span-2"><FileText size={20} className="text-gray-600" /><span className="text-sm text-gray-700">Reports</span></button>
              </div>
            </div>

            {offToday.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Off Today</h3>
                <div className="space-y-2">
                  {offToday.map(r => (
                    <div key={r._id} className="flex justify-between items-center py-2 border-b last:border-0">
                      <span className="text-gray-800">{r.userName}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${r.type === 'HOLIDAY' ? 'bg-blue-100 text-blue-700' : r.type === 'SICK' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>{r.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard
