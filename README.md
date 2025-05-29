Advanced Calendar Event Manager
A powerful and interactive web calendar application built with Next.js and TypeScript, designed for intuitive event planning, recurring schedules, and drag-and-drop event management. This project demonstrates complex state handling, dynamic interactions, and modern frontend design patterns.

🚀 Getting Started
📦 Installation

git clone https://github.com/amarnadh3399/Event-Horizon
cd calendar-app

# Install dependencies
npm install

# Build the project
npm run build

# Start the production server
npm start
For development mode:


npm run dev
Then open http://localhost:3000 in your browser.

🔧 Tech Stack
Framework: Next.js + React

Language: TypeScript

State Management: React Context API / useReducer

Styling: Tailwind CSS

Date Utilities: date-fns

Drag and Drop: @dnd-kit/core

Data Persistence: LocalStorage (or IndexedDB)

UI Components: Headless UI, Radix UI (optional)

✨ Features
📆 1. Monthly View Calendar
Displays a full monthly grid.

Highlights the current day.

Navigation between months.

📝 2. Event Management
Add Event:

Click a day to add a new event.

Event form includes:

Title

Date and time

Description

Recurrence (daily, weekly, monthly, custom)

Color / Category tag

Edit Event:

Click an event to edit.

Modify title, time, description, or recurrence.

Delete Event:

Easily remove any event.

🔁 3. Recurring Events
Support for:

Daily

Weekly (select days of the week)

Monthly (e.g., every 15th)

Custom intervals (e.g., every 2 weeks)

Automatically rendered on all relevant days.

🧲 4. Drag-and-Drop Rescheduling
Drag events to a new date.

Updates the event date instantly.

Handles potential conflicts and multiple events on the same day.

⚠️ 5. Conflict Management
Prevent overlapping events with warnings or validations.

Highlights scheduling conflicts.

🔍 6. Event Filtering and Search (Optional)
Filter by category.

Live search for title or description.

💾 7. Event Persistence
Save events using:

localStorage or IndexedDB

All data is retained across sessions and page refreshes.

📱 8. Responsive Design (Optional)
Fully responsive calendar layout.

Adaptive views for mobile, tablet, and desktop.

Optionally switch to daily/weekly view on small screens.



<img width="1430" alt="Screenshot 2025-05-26 at 2 33 06 PM" src="https://github.com/user-attachments/assets/f3b812fc-debf-4762-9f9f-5d6b407b988d" />
<img width="1430" alt="Screenshot 2025-05-26 at 2 33 33 PM" src="https://github.com/user-attachments/assets/dcc07bee-0fa2-4df0-b9e8-de54dccf905f" />
<img width="1430" alt="Screenshot 2025-05-26 at 2 33 50 PM" src="https://github.com/user-attachments/assets/129e357d-0a1e-427b-9089-defe73638d4a" />
