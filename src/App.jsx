import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import * as api from './api'

// Pages
import Login from './pages/Login'
import TeacherDashboard from './pages/TeacherDashboard'
import CoverTeacherDashboard from './pages/CoverTeacherDashboard'
import AdminDashboard from './pages/AdminDashboard'
import RequestHoliday from './pages/RequestHoliday'
import PendingRequests from './pages/PendingRequests'
import LogAbsence from './pages/LogAbsence'
import ManageSchedule from './pages/ManageSchedule'
import ManageStaff from './pages/ManageStaff'
import AssignCover from './pages/AssignCover'
import BlockDates from './pages/BlockDates'
import Reports from './pages/Reports'

function App() {
  const [user, setUser] = useState(null)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [loading, setLoading] = useState(true)

  // Check for saved user on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const handleLogin = async (email) => {
    const userData = await api.login(email)
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('user')
    setCurrentPage('dashboard')
  }

  const navigateTo = (page) => {
    setCurrentPage(page)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  // Page routing
  if (currentPage === 'request-holiday') {
    return <RequestHoliday user={user} onBack={() => setCurrentPage('dashboard')} />
  }
  if (currentPage === 'pending-requests') {
    return <PendingRequests user={user} onBack={() => setCurrentPage('dashboard')} />
  }
  if (currentPage === 'log-absence') {
    return <LogAbsence user={user} onBack={() => setCurrentPage('dashboard')} />
  }
  if (currentPage === 'manage-schedule') {
    return <ManageSchedule user={user} onBack={() => setCurrentPage('dashboard')} />
  }
  if (currentPage === 'manage-staff') {
    return <ManageStaff user={user} onBack={() => setCurrentPage('dashboard')} />
  }
  if (currentPage === 'assign-cover') {
    return <AssignCover user={user} onBack={() => setCurrentPage('dashboard')} />
  }
  if (currentPage === 'block-dates') {
    return <BlockDates user={user} onBack={() => setCurrentPage('dashboard')} />
  }
  if (currentPage === 'reports') {
    return <Reports user={user} onBack={() => setCurrentPage('dashboard')} />
  }

  const getDashboard = () => {
    switch (user.role) {
      case 'ADMIN':
        return <AdminDashboard user={user} onLogout={handleLogout} onNavigate={navigateTo} />
      case 'COVER_TEACHER':
        return <CoverTeacherDashboard user={user} onLogout={handleLogout} onNavigate={navigateTo} />
      case 'TEACHER':
      default:
        return <TeacherDashboard user={user} onLogout={handleLogout} onNavigate={navigateTo} />
    }
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={getDashboard()} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
