# CampusConnect - Campus Events & Clubs Portal

Mini project for **CSN371 - Front End Engineering** (DIT University, B.Tech CSE, 2024-28 batch).

CampusConnect lets students discover campus events, search and filter them, and RSVP in one click.
Club organizers can create, edit and delete their own events.

## Tech Stack
| Layer | Technology |
|---|---|
| Front end | HTML5, CSS3 (Flexbox, Grid, media queries), JavaScript ES6+ (Fetch, async/await, DOM, localStorage) |
| Back end | Node.js, Express.js |
| Database | MongoDB with Mongoose |
| Auth | JWT + bcrypt password hashing |

## Features
- Register / login with roles: **student** and **organizer**
- Browse events in a responsive card grid
- Search (MongoDB text index), category filter, upcoming-only filter
- RSVP / cancel RSVP with capacity check
- Organizers: full CRUD on their own events
- XSS-safe rendering, input validation, protected API routes

## Getting Started
```bash
git clone <your-repo-url>
cd campusconnect
npm install
cp .env.example .env      # then edit JWT_SECRET / MONGO_URI
npm run seed              # optional: demo data
npm start                 # http://localhost:3000
```
Requires Node.js 18+ and a running MongoDB (local or Atlas).

Demo logins after seeding (password `password123`): `club@campus.edu` (organizer), `student@campus.edu` (student).

## REST API
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | - | Create account |
| POST | /api/auth/login | - | Login, returns JWT |
| GET | /api/events?q=&category=&upcoming= | - | List / search events |
| GET | /api/events/:id | - | Single event |
| POST | /api/events | Organizer | Create event |
| PUT | /api/events/:id | Owner | Update event |
| DELETE | /api/events/:id | Owner | Delete event |
| POST | /api/events/:id/rsvp | Logged in | Toggle RSVP |

## Project Structure
```
campusconnect/
├── server.js          # Express app + MongoDB connection
├── seed.js            # demo data
├── models/            # User.js, Event.js (Mongoose schemas)
├── routes/            # auth.js, events.js
├── middleware/auth.js # JWT verify + role check
└── public/            # index.html, css/style.css, js/app.js
```

## Team
| Name | ERP ID |
|---|---|
| Member 1 | |
| Member 2 | |
| Member 3 | |
| Member 4 | |

## License
MIT
