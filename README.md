# Interactive Dynamic Task Dashboard Platform

## Project Overview
A full-stack task management application that allows users to create, view, edit, complete, and delete tasks.

## Technologies Used
- **Frontend:** React, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Database:** SQLite
- **API:** REST API using Fetch and async/await
- **Security Middleware:** Helmet and CORS

## Features
- Create new tasks with titles and descriptions
- View all saved tasks
- Edit existing tasks
- Mark tasks as completed or pending
- Delete tasks with confirmation
- Display total, completed, and remaining task counts
- Show All and Show Less task controls
- Input validation and error messages
- Persistent local database storage
- Responsive user interface

## Project Structure
- `backend/` — Express API and SQLite database
- `task-dashboard/frontend/` — React frontend
- `README.md` — Project documentation

## How to Run

### 1. Start the Backend
Open a terminal and run:

```bash
cd "C:\Users\User\Desktop\task dashboard\backend"
node server.js
```

Backend URL: `http://localhost:5000`

### 2. Start the Frontend
Open a second terminal and run:

```bash
cd "C:\Users\User\Desktop\task dashboard\task-dashboard\frontend"
npm run dev
```

Open the localhost URL displayed in the terminal.

## Database
The application uses SQLite. Task records are stored locally in `backend/tasks.db`.

## Note
This project is configured for local development. Authentication and production deployment configuration are not included.
