// API Helper - connects frontend to backend

const API_URL = 'http://localhost:5001/api'

// Generic fetch wrapper
async function fetchAPI(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'API request failed')
  }
  
  return response.json()
}

// ============== AUTH ==============

export const login = (email) => 
  fetchAPI('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })

// ============== USERS ==============

export const getUsers = () => 
  fetchAPI('/users')

export const getUser = (id) => 
  fetchAPI(`/users/${id}`)

export const createUser = (data) => 
  fetchAPI('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const updateUser = (id, data) => 
  fetchAPI(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })

export const deleteUser = (id) => 
  fetchAPI(`/users/${id}`, {
    method: 'DELETE',
  })

// ============== LEAVE REQUESTS ==============

export const getLeaveRequests = (params = {}) => {
  const query = new URLSearchParams(params).toString()
  return fetchAPI(`/leave-requests${query ? `?${query}` : ''}`)
}

export const createLeaveRequest = (data) => 
  fetchAPI('/leave-requests', {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const updateLeaveRequest = (id, data) => 
  fetchAPI(`/leave-requests/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })

export const deleteLeaveRequest = (id) => 
  fetchAPI(`/leave-requests/${id}`, {
    method: 'DELETE',
  })

// ============== SCHEDULES ==============

export const getSchedules = () => 
  fetchAPI('/schedules')

export const getSchedule = (userId) => 
  fetchAPI(`/schedules/${userId}`)

export const updateSchedule = (userId, data) => 
  fetchAPI(`/schedules/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })

export const bulkUpdateSchedules = (schedules) => 
  fetchAPI('/schedules/bulk', {
    method: 'POST',
    body: JSON.stringify({ schedules }),
  })

// ============== COVER ASSIGNMENTS ==============

export const getCoverAssignments = (params = {}) => {
  const query = new URLSearchParams(params).toString()
  return fetchAPI(`/cover-assignments${query ? `?${query}` : ''}`)
}

export const createCoverAssignment = (data) => 
  fetchAPI('/cover-assignments', {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const deleteCoverAssignment = (id) => 
  fetchAPI(`/cover-assignments/${id}`, {
    method: 'DELETE',
  })

// ============== BLOCKED DATES ==============

export const getBlockedDates = () => 
  fetchAPI('/blocked-dates')

export const createBlockedDates = (dates) => 
  fetchAPI('/blocked-dates', {
    method: 'POST',
    body: JSON.stringify({ dates }),
  })

export const deleteBlockedDate = (id) => 
  fetchAPI(`/blocked-dates/${id}`, {
    method: 'DELETE',
  })

// ============== TASKS ==============

export const getTasks = (userId) => {
  const query = userId ? `?userId=${userId}` : ''
  return fetchAPI(`/tasks${query}`)
}

export const createTask = (data) => 
  fetchAPI('/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const deleteTask = (id) => 
  fetchAPI(`/tasks/${id}`, {
    method: 'DELETE',
  })

// ============== SEED (for initial setup) ==============

export const seedDatabase = () => 
  fetchAPI('/seed', {
    method: 'POST',
  })

// ============== HELPER: Calculate days used ==============

export const calculateDaysUsed = (leaveRequests, userId) => {
  const approved = leaveRequests.filter(r => 
    r.userId === userId && 
    r.status === 'APPROVED' &&
    r.startDate.startsWith(new Date().getFullYear().toString())
  )
  
  let total = 0
  approved.forEach(r => {
    const start = new Date(r.startDate)
    const end = new Date(r.endDate)
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
    total += days
  })
  return total
}
