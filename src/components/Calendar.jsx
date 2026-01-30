import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
import * as api from '../api'

function Calendar({ isAdmin = false }) {
  const [expanded, setExpanded] = useState(false)
  const [hoveredDay, setHoveredDay] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [startMonth, setStartMonth] = useState(() => {
    const now = new Date()
    return { month: now.getMonth(), year: now.getFullYear() }
  })
  const [leaveRequests, setLeaveRequests] = useState([])
  const [blockedDates, setBlockedDates] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [requests, blocked] = await Promise.all([
        api.getLeaveRequests(),
        api.getBlockedDates()
      ])
      setLeaveRequests(requests)
      setBlockedDates(blocked)
    } catch (err) {
      console.error('Error loading calendar data:', err)
    }
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  // Get HOLIDAY leave only (for color coding)
  const getHolidaysForDate = (dateStr) => {
    return leaveRequests.filter(r => 
      r.status === 'APPROVED' &&
      r.type === 'HOLIDAY' &&
      r.startDate <= dateStr &&
      r.endDate >= dateStr
    )
  }

  // Get SICK leave (for admin tooltip only)
  const getSickForDate = (dateStr) => {
    return leaveRequests.filter(r => 
      r.status === 'APPROVED' &&
      r.type === 'SICK' &&
      r.startDate <= dateStr &&
      r.endDate >= dateStr
    )
  }

  // Get OTHER leave (for admin tooltip only)
  const getOtherForDate = (dateStr) => {
    return leaveRequests.filter(r => 
      r.status === 'APPROVED' &&
      r.type === 'OTHER' &&
      r.startDate <= dateStr &&
      r.endDate >= dateStr
    )
  }

  // Check if date is blocked
  const isBlocked = (dateStr) => {
    return blockedDates.some(b => b.date === dateStr)
  }

  // Get blocked reason
  const getBlockedReason = (dateStr) => {
    const blocked = blockedDates.find(b => b.date === dateStr)
    return blocked?.reason || 'Blocked'
  }

  // Format date as YYYY-MM-DD
  const formatDate = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  // Handle mouse enter on day
  const handleDayHover = (e, dateStr) => {
    const rect = e.target.getBoundingClientRect()
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 10 })
    setHoveredDay(dateStr)
  }

  // Build tooltip content
  const getTooltipContent = (dateStr) => {
    const holidays = getHolidaysForDate(dateStr)
    const sick = getSickForDate(dateStr)
    const other = getOtherForDate(dateStr)
    const blocked = isBlocked(dateStr)

    if (blocked) {
      return { title: 'Blocked', items: [getBlockedReason(dateStr)] }
    }

    const items = []

    if (holidays.length > 0) {
      items.push({ label: 'On Holiday', names: holidays.map(h => h.userName) })
    }

    if (isAdmin) {
      if (sick.length > 0) {
        items.push({ label: 'Sick Leave', names: sick.map(s => s.userName) })
      }
      if (other.length > 0) {
        items.push({ label: 'Other Leave', names: other.map(o => o.userName) })
      }
    }

    if (items.length === 0) {
      return null
    }

    return { items }
  }

  // Get today's date string
  const getTodayStr = () => {
    const now = new Date()
    return formatDate(now.getFullYear(), now.getMonth(), now.getDate())
  }

  // Generate calendar for a single month
  const renderMonth = (monthOffset) => {
    let month = startMonth.month + monthOffset
    let year = startMonth.year
    
    while (month > 11) {
      month -= 12
      year++
    }
    while (month < 0) {
      month += 12
      year--
    }

    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    const days = []
    const todayStr = getTodayStr()
    
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8" />)
    }
    
    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(year, month, day)
      const holidays = getHolidaysForDate(dateStr)
      const holidayCount = holidays.length
      const blocked = isBlocked(dateStr)
      const isToday = dateStr === todayStr
      
      // Color based on HOLIDAY count only
      let bgColor = 'bg-green-100' // 0 off
      let textColor = 'text-green-800'
      
      if (blocked) {
        bgColor = 'bg-gray-300'
        textColor = 'text-gray-500'
      } else if (holidayCount >= 4) {
        bgColor = 'bg-red-300'
        textColor = 'text-red-900'
      } else if (holidayCount === 3) {
        bgColor = 'bg-orange-300'
        textColor = 'text-orange-900'
      } else if (holidayCount === 2) {
        bgColor = 'bg-yellow-200'
        textColor = 'text-yellow-800'
      } else if (holidayCount === 1) {
        bgColor = 'bg-yellow-100'
        textColor = 'text-yellow-700'
      }
      
      days.push(
        <div
          key={day}
          onMouseEnter={(e) => handleDayHover(e, dateStr)}
          onMouseLeave={() => setHoveredDay(null)}
          className={`h-8 flex items-center justify-center text-sm rounded-md cursor-pointer
            ${bgColor} ${textColor}
            ${isToday ? 'ring-2 ring-blue-500 font-bold' : ''}
            hover:ring-2 hover:ring-gray-400
          `}
        >
          {day}
        </div>
      )
    }
    
    return (
      <div className="bg-white rounded-lg p-3 border border-gray-100">
        <h3 className="font-medium text-gray-800 text-center mb-2">
          {monthNames[month]} {year}
        </h3>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayNames.map((d, i) => (
            <div key={i} className="h-6 flex items-center justify-center text-xs text-gray-400 font-medium">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </div>
    )
  }

  const monthsToShow = expanded ? 12 : 3

  const goToPrevious = () => {
    setStartMonth(prev => {
      let newMonth = prev.month - 3
      let newYear = prev.year
      while (newMonth < 0) {
        newMonth += 12
        newYear--
      }
      return { month: newMonth, year: newYear }
    })
  }

  const goToNext = () => {
    setStartMonth(prev => {
      let newMonth = prev.month + 3
      let newYear = prev.year
      while (newMonth > 11) {
        newMonth -= 12
        newYear++
      }
      return { month: newMonth, year: newYear }
    })
  }

  const goToToday = () => {
    const now = new Date()
    setStartMonth({ month: now.getMonth(), year: now.getFullYear() })
  }

  const tooltipContent = hoveredDay ? getTooltipContent(hoveredDay) : null

  return (
    <div className="bg-white rounded-xl shadow-sm relative">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <h2 className="font-semibold text-gray-800">Calendar</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevious}
            className="p-1 hover:bg-gray-100 rounded"
            title="Previous"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <button
            onClick={goToToday}
            className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1"
          >
            Today
          </button>
          <button
            onClick={goToNext}
            className="p-1 hover:bg-gray-100 rounded"
            title="Next"
          >
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <div className={`grid gap-4 ${expanded ? 'grid-cols-3 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
          {Array.from({ length: monthsToShow }, (_, i) => (
            <div key={i}>{renderMonth(i)}</div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-100 rounded" />
            <span className="text-gray-600">0 off</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-yellow-100 rounded" />
            <span className="text-gray-600">1 off</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-yellow-200 rounded" />
            <span className="text-gray-600">2 off</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-orange-300 rounded" />
            <span className="text-gray-600">3 off (max)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-300 rounded" />
            <span className="text-gray-600">4+ off</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-gray-300 rounded" />
            <span className="text-gray-600">Blocked</span>
          </div>
        </div>
      </div>
      
      {/* Expand/Collapse */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 border-t border-gray-100 flex items-center justify-center gap-1 text-sm text-gray-600 hover:bg-gray-50"
      >
        {expanded ? (
          <>
            <ChevronUp size={16} />
            Show Less
          </>
        ) : (
          <>
            <ChevronDown size={16} />
            Show Full Year
          </>
        )}
      </button>

      {/* Tooltip */}
      {tooltipContent && (
        <div 
          className="fixed z-50 bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg"
          style={{ 
            left: tooltipPos.x, 
            top: tooltipPos.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          {tooltipContent.title && (
            <div className="font-semibold mb-1">{tooltipContent.title}</div>
          )}
          {tooltipContent.items.map((item, i) => (
            <div key={i} className="mb-1 last:mb-0">
              {item.label && <div className="font-semibold text-gray-300">{item.label}:</div>}
              {item.names ? (
                item.names.map((name, j) => (
                  <div key={j} className="pl-2">• {name}</div>
                ))
              ) : (
                <div>{item}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Calendar
