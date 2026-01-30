# Leave Planner

A simple staff leave management system for schools.

## Features

- **Teachers**: Request holidays, view leave balance, see cover arrangements
- **Cover Teachers**: Same as teachers + log admin tasks
- **Admins**: Approve/reject requests, assign cover, manage schedules, view reports

## Setup

1. Open this folder in VS Code (or Cursor)

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open http://localhost:3000 in your browser

## Demo Accounts

- **Teacher**: sarah@school.com
- **Cover Teacher**: emma@school.com  
- **Admin**: admin@school.com

## Project Structure

```
leave-planner/
├── src/
│   ├── data/
│   │   └── mockData.js      # Fake data for development
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── TeacherDashboard.jsx
│   │   ├── CoverTeacherDashboard.jsx
│   │   └── AdminDashboard.jsx
│   ├── components/          # Reusable UI components (to be added)
│   ├── App.jsx              # Main app with routing
│   ├── main.jsx             # Entry point
│   └── index.css            # Tailwind styles
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Tech Stack

- React 18
- Vite (fast build tool)
- Tailwind CSS (styling)
- React Router (navigation)
- Lucide React (icons)

## Next Steps

Pages still to build:
- [ ] Request Holiday form
- [ ] Pending Requests (full page)
- [ ] Log Absence
- [ ] Assign Cover
- [ ] Manage Schedule
- [ ] Manage Staff
- [ ] Reports
- [ ] Calendar View
