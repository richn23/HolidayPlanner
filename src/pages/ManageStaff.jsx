import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Edit2, Trash2, UserX, UserCheck, CheckCircle } from 'lucide-react'
import * as api from '../api'

function ManageStaff({ user, onBack }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('active')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({ name: '', email: '', role: 'TEACHER', campus: 'JBR', yearlyQuota: 30 })
  const [success, setSuccess] = useState('')

  useEffect(() => { loadUsers() }, [])

  const loadUsers = async () => {
    try {
      const allUsers = await api.getUsers()
      setUsers(allUsers.filter(u => u.role !== 'ADMIN'))
    } catch (err) { console.error('Error:', err) }
    finally { setLoading(false) }
  }

  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingUser) {
        await api.updateUser(editingUser._id, formData)
        showSuccess('Staff updated')
      } else {
        await api.createUser({ ...formData, status: 'ACTIVE' })
        showSuccess('Staff added')
      }
      loadUsers()
      setShowModal(false)
      setEditingUser(null)
      setFormData({ name: '', email: '', role: 'TEACHER', campus: 'JBR', yearlyQuota: 30 })
    } catch (err) { console.error('Error:', err) }
  }

  const handleEdit = (u) => {
    setEditingUser(u)
    setFormData({ name: u.name, email: u.email, role: u.role, campus: u.campus, yearlyQuota: u.yearlyQuota })
    setShowModal(true)
  }

  const handleToggleStatus = async (u) => {
    try {
      await api.updateUser(u._id, { status: u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })
      showSuccess(u.status === 'ACTIVE' ? 'Staff deactivated' : 'Staff reactivated')
      loadUsers()
    } catch (err) { console.error('Error:', err) }
  }

  const handleDelete = async (u) => {
    if (!confirm(`Delete ${u.name}? This cannot be undone.`)) return
    try {
      await api.deleteUser(u._id)
      showSuccess('Staff deleted')
      loadUsers()
    } catch (err) { console.error('Error:', err) }
  }

  const filteredUsers = users.filter(u => {
    if (filter === 'active') return u.status === 'ACTIVE'
    if (filter === 'inactive') return u.status === 'INACTIVE'
    return true
  })

  if (loading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="text-gray-500">Loading...</div></div>

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} className="text-gray-600" /></button>
            <div><h1 className="text-xl font-bold text-gray-800">Manage Staff</h1></div>
          </div>
          <button onClick={() => { setEditingUser(null); setFormData({ name: '', email: '', role: 'TEACHER', campus: 'JBR', yearlyQuota: 30 }); setShowModal(true) }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Plus size={18} />Add Staff
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {success && <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3"><CheckCircle className="text-green-600" size={20} /><span className="text-green-700">{success}</span></div>}

        <div className="flex gap-2 mb-4">
          {['active', 'inactive', 'all'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}>{f}</button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Role</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Campus</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredUsers.map(u => (
                <tr key={u._id} className={u.status === 'INACTIVE' ? 'bg-gray-50 opacity-60' : ''}>
                  <td className="px-4 py-3"><div className="font-medium text-gray-800">{u.name}</div><div className="text-xs text-gray-500">{u.email}</div></td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${u.role === 'COVER_TEACHER' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{u.role === 'COVER_TEACHER' ? 'Cover' : 'Teacher'}</span></td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${u.campus === 'JBR' ? 'bg-emerald-100 text-emerald-700' : u.campus === 'JLT' ? 'bg-amber-100 text-amber-700' : 'bg-violet-100 text-violet-700'}`}>{u.campus}</span></td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${u.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.status}</span></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEdit(u)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                      <button onClick={() => handleToggleStatus(u)} className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg">{u.status === 'ACTIVE' ? <UserX size={16} /> : <UserCheck size={16} />}</button>
                      <button onClick={() => handleDelete(u)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{editingUser ? 'Edit Staff' : 'Add Staff'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Role</label><select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value, campus: e.target.value === 'COVER_TEACHER' ? 'COVER' : formData.campus })} className="w-full px-3 py-2 border rounded-lg"><option value="TEACHER">Teacher</option><option value="COVER_TEACHER">Cover Teacher</option></select></div>
              {formData.role !== 'COVER_TEACHER' && <div><label className="block text-sm font-medium text-gray-700 mb-1">Campus</label><select value={formData.campus} onChange={(e) => setFormData({ ...formData, campus: e.target.value })} className="w-full px-3 py-2 border rounded-lg"><option value="JBR">JBR</option><option value="JLT">JLT</option></select></div>}
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Yearly Quota</label><input type="number" value={formData.yearlyQuota} onChange={(e) => setFormData({ ...formData, yearlyQuota: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => { setShowModal(false); setEditingUser(null) }} className="flex-1 px-4 py-2 border text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingUser ? 'Save' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManageStaff
