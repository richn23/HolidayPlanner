import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Trash2, Calendar, CheckCircle, AlertTriangle } from 'lucide-react'
import * as api from '../api'

function BlockDates({ user, onBack }) {
  const [blockedDates, setBlockedDates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [newEndDate, setNewEndDate] = useState('')
  const [newReason, setNewReason] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const dates = await api.getBlockedDates()
      setBlockedDates(dates)
    } catch (err) { console.error('Error:', err) }
    finally { setLoading(false) }
  }

  const showSuccessMsg = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }

  const handleAdd = async () => {
    if (!newDate || !newReason) return
    const endDate = newEndDate || newDate
    const start = new Date(newDate)
    const end = new Date(endDate)
    const newDates = []
    const current = new Date(start)
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0]
      if (!blockedDates.some(b => b.date === dateStr)) {
        newDates.push({ date: dateStr, reason: newReason })
      }
      current.setDate(current.getDate() + 1)
    }
    if (newDates.length > 0) {
      try {
        await api.createBlockedDates(newDates)
        showSuccessMsg(`${newDates.length} date(s) blocked`)
        loadData()
      } catch (err) { console.error('Error:', err) }
    }
    setNewDate(''); setNewEndDate(''); setNewReason(''); setShowAdd(false)
  }

  const handleRemove = async (id) => {
    try {
      await api.deleteBlockedDate(id)
      showSuccessMsg('Date unblocked')
      loadData()
    } catch (err) { console.error('Error:', err) }
  }

  const sortedDates = [...blockedDates].sort((a, b) => a.date.localeCompare(b.date))
  const groupedByMonth = sortedDates.reduce((acc, item) => {
    const date = new Date(item.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const monthName = date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    if (!acc[monthKey]) acc[monthKey] = { name: monthName, dates: [] }
    acc[monthKey].dates.push(item)
    return acc
  }, {})

  if (loading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="text-gray-500">Loading...</div></div>

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} className="text-gray-600" /></button>
            <div><h1 className="text-xl font-bold text-gray-800">Block Dates</h1><p className="text-sm text-gray-500">{blockedDates.length} dates blocked</p></div>
          </div>
          <button onClick={() => setShowAdd(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"><Plus size={18} />Block Dates</button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {success && <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3"><CheckCircle className="text-green-600" size={20} /><span className="text-green-700">{success}</span></div>}

        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-yellow-800"><strong>Blocked dates</strong> prevent teachers from requesting holiday on these days.</div>
        </div>

        {Object.keys(groupedByMonth).length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
            <h2 className="text-lg font-semibold text-gray-800 mb-2">No Blocked Dates</h2>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByMonth).map(([monthKey, month]) => (
              <div key={monthKey} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b"><h3 className="font-semibold text-gray-700">{month.name}</h3></div>
                <div className="divide-y">
                  {month.dates.map(blocked => (
                    <div key={blocked._id} className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 text-center">
                          <div className="text-lg font-bold text-gray-800">{new Date(blocked.date).getDate()}</div>
                          <div className="text-xs text-gray-500">{new Date(blocked.date).toLocaleDateString('en-GB', { weekday: 'short' })}</div>
                        </div>
                        <span className="font-medium text-gray-800">{blocked.reason}</span>
                      </div>
                      <button onClick={() => handleRemove(blocked._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Block Dates</h3>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label><input type="date" value={newDate} onChange={(e) => { setNewDate(e.target.value); if (!newEndDate || e.target.value > newEndDate) setNewEndDate(e.target.value) }} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">End Date (optional)</label><input type="date" value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)} min={newDate} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Reason</label><input type="text" value={newReason} onChange={(e) => setNewReason(e.target.value)} placeholder="e.g. School Event" className="w-full px-3 py-2 border rounded-lg" /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowAdd(false); setNewDate(''); setNewEndDate(''); setNewReason('') }} className="flex-1 px-4 py-2 border text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleAdd} disabled={!newDate || !newReason} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300">Block</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BlockDates
