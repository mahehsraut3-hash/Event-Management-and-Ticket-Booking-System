# Event Management & Ticket Booking System (TBS)

[![Full Integration Tests](https://img.shields.io/badge/tests-31%20passing-emerald)](file:///d:/Ai%20assistsnt/server/test_suite.js)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-blue)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-19-cyan)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/tailwindcss-v4-teal)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-ISC-slate)](LICENSE)

An end-to-end, full-stack event discovery, atomic ticket reservation, and cryptographic QR gate check-in platform. Built as a monorepo with high performance, tamper-proof gate ticket validation, Razorpay payment processing, transactional emails with embedded QR passes, and role-based access control for attendees, organizers, and administrators.

---

## 🌟 Key Features

### 1. 🔍 Event Discovery & Real-Time Filtering
- **Multi-parameter Search**: Full-text keyword search across titles, venues, and descriptions.
- **Categorical & Geospatial Filters**: Instant filtering by category (Technology, Music, Sports, Workshops, etc.) and cities.
- **Date & Price Range Sliders**: Dynamic min/max price range sliders and date bounds.
- **Sorting & Pagination**: Sort by date, price, or popularity with responsive pagination.
- **Pre-seeded Dataset**: Comes pre-loaded with 16 realistic events across major categories.

### 2. ⚡ Atomic Ticket Reservation & Overselling Prevention
- **Atomic Concurrency Control**: Increments sold counts using atomic updates to prevent overselling even under heavy concurrent load.
- **Multi-tier Pricing**: Supports diverse ticket tiers (e.g. *General Admission*, *VIP Backstage*, *Student Pass*).
- **15-Minute Expiry Locks**: Holds reservations for 15 minutes while awaiting payment.
- **Auto-Expiry Background Worker**: Automatically cancels abandoned reservations and restores held capacity back to the event pool.

### 3. 🛡️ Cryptographic QR Gate Scanner Terminal
- **Tamper-Proof Digital Passports**: Every reserved seat receives a unique alphanumeric ticket code and an HMAC-SHA256 / JWT signed QR token containing the ticket ID, event ID, and user ID.
- **Camera-Based Gate Scanner**: Real-time camera scanner (`html5-qrcode`) with a manual entry fallback.
- **Audio & Visual Feedback**: Instant green/red confirmation screens with synthesized Web Audio chimes.
- **State Machine Protection**:
  - `VALID`: Marked as used with check-in timestamp.
  - `ALREADY_USED`: Rejects duplicate entry attempts with exact previous check-in time.
  - `WRONG_EVENT`: Alerts staff if the ticket belongs to a different event.
  - `INVALID`: Blocks counterfeit or tampered QR tokens.

### 4. 💳 Razorpay Payment Gateway & Test Mode Simulation
- **Official Razorpay Checkout**: Integrated with Razorpay Node SDK and standard checkout modal supporting UPI, Cards, Netbanking, and Wallets.
- **Cryptographic Webhook Processing**: Handles `payment.captured`, `order.paid`, and `payment.failed` with signature verification.
- **Zero-Friction Test Mode**: Includes an instant 1-click test simulation button for development and grading without requiring live merchant account credentials.
- **Live Status & Receipt Page**: Dedicated payment status receipt screen displaying order ID, transaction ID, ticket breakdown, and QR links.

### 5. 📧 Transactional Emails with Embedded QR Passes (Nodemailer)
- **Automatic Dispatch**: Generates and sends a confirmation email immediately upon payment verification.
- **Inline QR Attachments**: Uses inline CID MIME attachments (`cid:ticket_qr_X`) generated on the server using `qrcode`, ensuring tickets render directly in the recipient's inbox.
- **Ethereal Email Preview**: Automatically initializes an Ethereal SMTP test account in local development with clickable preview URLs logged in the console.

### 6. 📊 Organizer Management Dashboard
- **Analytics & Sales Charts**: Built with **Recharts** displaying revenue and ticket distribution across events.
- **Event Lifecycle CRUD**: Create, edit, unpublish, and delete events with multipart banner image uploads (`multer`).
- **Attendee Management & CSV Export**: Real-time attendee gate status with search and one-click RFC-4180 compliant CSV spreadsheet export.

### 7. 🛡️ Admin Platform Moderation
- **System KPIs**: Platform-wide metrics for total users, active events, gross revenue volume, and check-in rates.
- **Organizer Approvals**: Approve or suspend event organizer accounts.
- **Event Moderation**: Unpublish, draft, or cancel flagged events across any organizer.

### 8. 🔒 Security & Resilience
- **Helmet Security Headers**: Injects `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and strict resource policies.
- **IP Rate Limiting**: General API limiter (300 req / 15m) and strict auth limiter (30 req / 15m) to defend against brute-force attacks.
- **Dual-Mode Data Layer**: Seamlessly connects to MongoDB when available, and automatically activates an in-memory dual-mode fallback repository when offline.

---

## 🗂️ Monorepo Architecture

```
d:\Ai assistsnt/
├── client/                     # Vite + React 19 Frontend
│   ├── public/
│   │   └── _redirects          # Netlify SPA routing rules
│   ├── src/
│   │   ├── components/         # Navbar, Footer, TicketCard, EventCard, ProtectedRoute
│   │   ├── context/            # AuthContext, ThemeContext, ToastContext
│   │   ├── hooks/              # useAuth
│   │   ├── pages/              # 12 Full application pages
│   │   │   ├── HomePage.jsx
│   │   │   ├── EventsPage.jsx
│   │   │   ├── EventDetailsPage.jsx
│   │   │   ├── CheckoutPage.jsx
│   │   │   ├── BookingConfirmationPage.jsx
│   │   │   ├── PaymentStatusPage.jsx
│   │   │   ├── BookingsPage.jsx
│   │   │   ├── TicketViewPage.jsx
│   │   │   ├── ScannerPage.jsx
│   │   │   ├── OrganizerDashboardPage.jsx
│   │   │   ├── CreateEditEventPage.jsx
│   │   │   ├── EventAttendeesPage.jsx
│   │   │   ├── AdminDashboardPage.jsx
│   │   │   └── LoginPage.jsx / RegisterPage.jsx
│   │   ├── services/           # Axios API client with JWT interceptor
│   │   └── utils/              # Razorpay CDN loader
│   ├── vercel.json             # Vercel SPA rewrite rules
│   ├── vite.config.js          # Vite config with API & upload proxies
│   └── package.json
│
├── server/                     # Node.js + Express Backend
│   ├── public/uploads/         # Uploaded event banner images
│   ├── src/
│   │   ├── config/             # Database & Razorpay SDK configuration
│   │   ├── controllers/        # Auth, Event, Booking, Ticket, Organizer, Payment, Admin
│   │   ├── middleware/         # Auth JWT, Role RBAC, Rate Limiting, Multer, Error Handlers
│   │   ├── models/             # User, Event, Booking, Ticket (with in-memory fallback)
│   │   ├── routes/             # Health, Auth, Events, Bookings, Tickets, Organizer, Payments, Admin
│   │   ├── utils/              # QR Token Crypto, Email Service, Expiry Job, Ticket Generator
│   │   └── server.js           # Express app bootstrap & background workers
│   ├── test_suite.js           # 31-test integration suite
│   ├── .env.example
│   └── package.json
│
├── package.json                # Root monorepo orchestration
└── README.md                   # Full platform documentation
```

---

## 🔑 Demo User Accounts

All demo accounts are pre-seeded and accessible via 1-click quick login buttons on the `/login` page:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Attendee** | `attendee@example.com` | `password123` | Event browsing, online ticket booking, QR pass access, booking cancellation |
| **Organizer** | `organizer@example.com` | `password123` | Event CRUD, image uploads, sales charts, attendee CSV export, gate scanner |
| **Admin** | `admin@example.com` | `password123` | Platform KPIs, organizer approvals, event moderation, full override access |

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 2. Installation
From the project root:
```bash
npm run install:all
```

### 3. Environment Variables
Copy `.env.example` in both folders:

**Server (`server/.env`):**
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/tbs_events
JWT_SECRET=supersecretjwtkey_replace_in_production
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173

# Razorpay (Test Mode)
RAZORPAY_KEY_ID=rzp_test_tbs_demo
RAZORPAY_KEY_SECRET=tbs_test_secret_demo_key_12345
RAZORPAY_WEBHOOK_SECRET=tbs_webhook_secret_key_12345
BOOKING_EXPIRATION_MINUTES=15

# Nodemailer SMTP (Optional - Ethereal test account activates automatically if blank)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
FROM_EMAIL="TBS Ticket System" <noreply@tbs-events.com>
```

**Client (`client/.env`):**
```env
VITE_API_URL=/api
```

### 4. Running the Monorepo
Start both the backend server and frontend client concurrently with a single command:
```bash
npm run dev
```

- **Frontend Client**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🧪 Running Automated Tests

Run the full 31-assertion integration and security test suite covering Auth, Booking, Gate Scanner, Admin, and Nodemailer:
```bash
npm test
```

---

## 📡 REST API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new attendee or organizer |
| `POST` | `/api/auth/login` | Public | Login with email & password, returns JWT token |
| `GET` | `/api/auth/me` | Private | Get profile of currently logged-in user |

### Events Discovery (`/api/events`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/events` | Public | Search, filter by category/city/price, sort, paginate |
| `GET` | `/api/events/:id` | Public | Get single event details with ticket tiers |
| `GET` | `/api/events/categories` | Public | List available event categories |
| `GET` | `/api/events/cities` | Public | List active event cities |

### Bookings (`/api/bookings`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/bookings` | Private | Atomically reserve tickets & create pending booking |
| `GET` | `/api/bookings/my` | Private | Get current user's booking history |
| `GET` | `/api/bookings/:id` | Private | Get single booking details & payment status |
| `PATCH` | `/api/bookings/:id/pay` | Private | Complete payment & generate tickets |
| `PATCH` | `/api/bookings/:id/cancel` | Private | Cancel booking & release reserved inventory |

### Digital Tickets & Gate Validation (`/api/tickets`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tickets/my` | Private | Get all tickets belonging to logged-in user |
| `GET` | `/api/tickets/booking/:id` | Private | Get tickets for a specific booking |
| `GET` | `/api/tickets/:id` | Private | Get single ticket with cryptographic QR data |
| `POST` | `/api/tickets/validate` | Organizer / Admin | Validate QR token at gate (`VALID`, `ALREADY_USED`, `WRONG_EVENT`, `INVALID`) |

### Organizer Dashboard (`/api/organizer`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/organizer/stats` | Organizer / Admin | Revenue, sold tickets, check-in count & Recharts dataset |
| `GET` | `/api/organizer/events` | Organizer / Admin | List organizer's events with status filter |
| `POST` | `/api/organizer/events` | Organizer / Admin | Create event with multi-tier tickets & image upload |
| `PUT` | `/api/organizer/events/:id` | Organizer / Admin | Update event details with ownership verification |
| `DELETE` | `/api/organizer/events/:id` | Organizer / Admin | Delete event (safely blocked if tickets sold) |
| `PATCH` | `/api/organizer/events/:id/status`| Organizer / Admin | Toggle `published` / `draft` status |
| `GET` | `/api/organizer/events/:id/attendees`| Organizer / Admin | Attendee check-in list with search |
| `GET` | `/api/organizer/events/:id/attendees/export`| Organizer / Admin | Stream RFC-4180 CSV export of attendees |

### Payments (`/api/payments`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/payments/config` | Private | Returns public Razorpay key ID & gateway mode |
| `POST` | `/api/payments/create-order` | Private | Create Razorpay order for pending booking |
| `POST` | `/api/payments/verify` | Private | Verify HMAC-SHA256 signature, mark paid, issue tickets |
| `POST` | `/api/payments/webhook` | Public | Asynchronous Razorpay webhook handler |

### Admin Moderation (`/api/admin`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/stats` | Admin Only | System-wide user, event, revenue, and check-in metrics |
| `GET` | `/api/admin/organizers` | Admin Only | List organizers with approval status & event count |
| `PATCH` | `/api/admin/organizers/:id/status`| Admin Only | Approve or suspend organizer (`approved`/`suspended`) |
| `GET` | `/api/admin/events` | Admin Only | List all events across all organizers for moderation |
| `PATCH` | `/api/admin/events/:id/moderate` | Admin Only | Publish, draft, or cancel flagged events |

---

## 🌐 Production Deployment Guide

### Target Architecture
- **Database**: MongoDB Atlas
- **Backend API**: Render (or Railway)
- **Frontend SPA**: Vercel (or Netlify)

---

### Step 1: Database Setup (MongoDB Atlas)
1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free **M0 Sandbox Cluster**.
3. Under **Security > Database Access**:
   - Create a database user with Read and Write permissions.
4. Under **Security > Network Access**:
   - Add IP Address `0.0.0.0/0` (Allow Access from Anywhere) to permit Render/Railway backend connections.
5. Under **Deployment > Database**:
   - Click **Connect** > **Drivers** > **Node.js**.
   - Copy your connection string (format: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/tbs_events?retryWrites=true&w=majority`).

---

### Step 2: Backend Deployment (Render)
1. Log in to [Render](https://render.com/) and click **New > Web Service**.
2. Connect your Git repository.
3. Configure the service settings:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add Environment Variables under the **Environment** tab:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `MONGO_URI`: `mongodb+srv://<user>:<password>@cluster0.mongodb.net/tbs_events`
   - `JWT_SECRET`: *(Generate a strong 64-character random string)*
   - `JWT_EXPIRE`: `7d`
   - `CLIENT_URL`: `https://your-frontend-app.vercel.app`
   - `RAZORPAY_KEY_ID`: *(Your Razorpay Live/Test Key ID)*
   - `RAZORPAY_KEY_SECRET`: *(Your Razorpay Live/Test Secret)*
   - `RAZORPAY_WEBHOOK_SECRET`: *(Your Webhook Secret)*
   - `BOOKING_EXPIRATION_MINUTES`: `15`
   - `SMTP_HOST`: *(e.g. `smtp.sendgrid.net` or `smtp.gmail.com`)*
   - `SMTP_PORT`: `587`
   - `SMTP_USER`: *(Your SMTP user)*
   - `SMTP_PASS`: *(Your SMTP password/API key)*
   - `FROM_EMAIL`: `"TBS Events" <tickets@yourdomain.com>`
5. Click **Deploy Web Service**.
6. Note your live backend URL: `https://tbs-backend.onrender.com`.

---

### Step 3: Frontend Deployment (Vercel)
1. Log in to [Vercel](https://vercel.com/) and click **Add New > Project**.
2. Import your Git repository.
3. Configure the project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   - `VITE_API_URL`: `https://tbs-backend.onrender.com/api`
5. Click **Deploy**.
6. The included [`vercel.json`](file:///d:/Ai%20assistsnt/client/vercel.json) automatically routes all SPA paths (e.g. `/events/:id`, `/organizer/dashboard`) without 404 errors.

---

### Step 4: Webhook & CORS Finalization
1. Update `CLIENT_URL` on Render to match your exact Vercel production domain: `https://your-app.vercel.app`.
2. In your [Razorpay Dashboard](https://dashboard.razorpay.com/) under **Settings > Webhooks**:
   - Add Webhook URL: `https://tbs-backend.onrender.com/api/payments/webhook`
   - Select events: `payment.captured`, `order.paid`, `payment.failed`
   - Copy the secret and set it as `RAZORPAY_WEBHOOK_SECRET` on Render.

---

## 📄 License
Licensed under the [ISC License](LICENSE).
