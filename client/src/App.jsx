import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import EventDetailsPage from './pages/EventDetailsPage';
import CheckoutPage from './pages/CheckoutPage';
import BookingConfirmationPage from './pages/BookingConfirmationPage';
import TicketViewPage from './pages/TicketViewPage';
import ScannerPage from './pages/ScannerPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BookingsPage from './pages/BookingsPage';
import PaymentStatusPage from './pages/PaymentStatusPage';
import OrganizerDashboardPage from './pages/OrganizerDashboardPage';
import CreateEditEventPage from './pages/CreateEditEventPage';
import EventAttendeesPage from './pages/EventAttendeesPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
              <Navbar />
              <main className="flex-1">
            <Routes>
              {/* Public Event Discovery Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:id" element={<EventDetailsPage />} />

              {/* Public Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Booking & Checkout Routes (Protected) */}
              <Route
                path="/checkout/:eventId"
                element={
                  <ProtectedRoute allowedRoles={['attendee', 'organizer', 'admin']}>
                    <CheckoutPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bookings/confirmation/:id"
                element={
                  <ProtectedRoute allowedRoles={['attendee', 'organizer', 'admin']}>
                    <BookingConfirmationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payments/status/:id"
                element={
                  <ProtectedRoute allowedRoles={['attendee', 'organizer', 'admin']}>
                    <PaymentStatusPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bookings"
                element={
                  <ProtectedRoute allowedRoles={['attendee', 'organizer', 'admin']}>
                    <BookingsPage />
                  </ProtectedRoute>
                }
              />

              {/* Individual Ticket Pass View */}
              <Route
                path="/tickets/:id"
                element={
                  <ProtectedRoute allowedRoles={['attendee', 'organizer', 'admin']}>
                    <TicketViewPage />
                  </ProtectedRoute>
                }
              />

              {/* Organizer Gate Scanner Route (Organizer & Admin Only) */}
              <Route
                path="/organizer/scanner"
                element={
                  <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                    <ScannerPage />
                  </ProtectedRoute>
                }
              />

              {/* Organizer Protected Routes */}
              <Route
                path="/organizer/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                    <OrganizerDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/organizer/events/new"
                element={
                  <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                    <CreateEditEventPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/organizer/events/edit/:id"
                element={
                  <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                    <CreateEditEventPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/organizer/events/:id/attendees"
                element={
                  <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                    <EventAttendeesPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Protected Route */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* 404 Catch All */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  </ToastProvider>
</ThemeProvider>
  );
}

export default App;
