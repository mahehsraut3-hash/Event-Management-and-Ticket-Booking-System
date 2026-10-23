# Event Management and Ticket Booking System (TBS)

A full-stack web application for event discovery, ticket reservation, QR-based ticket validation, and organizer event management.

---

## Tech Stack

- **Frontend**: React (Vite) + Tailwind CSS + React Router + Axios + Lucide Icons
- **Backend**: Node.js + Express.js + Mongoose + JWT Auth + Cors + Dotenv
- **Database**: MongoDB
- **Architecture**: Monorepo (`/client` and `/server`)

---

## Project Structure

```
d:\Ai assistsnt/
├── client/                     # Vite + React Frontend
│   ├── src/
│   │   ├── assets/             # Static assets (images, icons)
│   │   ├── components/         # Reusable UI components (Navbar, Footer, etc.)
│   │   ├── context/            # React context providers (AuthContext)
│   │   ├── hooks/              # Custom React hooks (useAuth)
│   │   ├── pages/              # Route pages (HomePage, NotFoundPage, etc.)
│   │   ├── services/           # API services & Axios client
│   │   ├── App.jsx             # Main application component & routes
│   │   ├── index.css           # Tailwind CSS styling entry
│   │   └── main.jsx            # React root mount
│   ├── .env.example            # Client environment template
│   ├── package.json
│   └── vite.config.js          # Vite config with proxy to /api (port 5000)
│
├── server/                     # Node.js + Express Backend
│   ├── src/
│   │   ├── config/             # DB & app configuration (db.js)
│   │   ├── controllers/        # Request handlers & business logic
│   │   ├── middleware/         # Auth, validation & error handling middleware
│   │   ├── models/             # Mongoose schemas & data models
│   │   ├── routes/             # Express API route endpoints
│   │   ├── utils/              # Helper functions & API response formatters
│   │   └── server.js           # Server entry point & Express app setup
│   ├── .env.example            # Server environment template
│   └── package.json
│
├── .gitignore                  # Git ignore rules
├── package.json                # Root package for monorepo coordination
└── README.md                   # Project documentation & run instructions
```

---

## Getting Started

### 1. Prerequisites
- **Node.js**: v18+ (tested on v24)
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017`) or MongoDB Atlas URI

### 2. Environment Variables Configuration

Copy `.env.example` to `.env` in both folders:

**Server (`/server/.env`):**
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/tbs_events
JWT_SECRET=supersecretjwtkey_replace_in_production
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

**Client (`/client/.env`):**
```env
VITE_API_URL=/api
```

### 3. Installation

From the root directory, install all dependencies:
```bash
npm run install:all
```
*(Or individually run `npm install` in both `/client` and `/server`)*

---

## Running the Applications

### Option A: Run Both Simultaneously (Recommended)
From the root directory:
```bash
npm run dev
```

### Option B: Run Individually

**Terminal 1 - Backend Server:**
```bash
cd server
npm run dev
```
Server runs on: [http://localhost:5000](http://localhost:5000)  
Health Check: [http://localhost:5000/api/health](http://localhost:5000/api/health)

**Terminal 2 - Frontend Client:**
```bash
cd client
npm run dev
```
Frontend runs on: [http://localhost:5173](http://localhost:5173)

---

## Roadmap

- [x] **Phase 0**: Project setup, monorepo skeleton, health check & environment configuration
- [ ] **Phase 1**: Database design (User, Event, Booking, Ticket) & JWT Authentication
- [ ] **Phase 2**: Event listing, filtering, search & sample seed script
- [ ] **Phase 3**: Online ticket booking flow & atomic inventory management
- [ ] **Phase 4**: Cryptographic QR code generation & camera ticket validator
- [ ] **Phase 5**: Organizer management dashboard & sales analytics
- [ ] **Phase 6**: Payment gateway integration (Razorpay/Stripe)
- [ ] **Phase 7**: Email notifications, security hardening & toast alerts
- [ ] **Phase 8**: Full testing suite & production deployment guide
