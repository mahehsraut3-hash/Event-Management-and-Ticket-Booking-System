import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Ticket, Calendar, LayoutDashboard, QrCode, LogOut, User, Menu, X, Shield } from 'lucide-react';
import useAuth from '../hooks/useAuth';

const Navbar = () => {
  const { isAuthenticated, user, role, isOrganizer, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const roleBadge = () => {
    switch (role) {
      case 'organizer':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-violet-100 text-violet-700 uppercase tracking-wide">
            Organizer
          </span>
        );
      case 'admin':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 uppercase tracking-wide">
            Admin
          </span>
        );
      case 'attendee':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-700 uppercase tracking-wide">
            Attendee
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 font-bold text-xl text-indigo-600 hover:text-indigo-700 transition"
        >
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <Ticket className="w-5 h-5" />
          </div>
          <span className="tracking-tight text-slate-900">
            EventPass <span className="text-xs uppercase px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-semibold tracking-wider">TBS</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link to="/events" className="hover:text-indigo-600 transition flex items-center gap-1.5">
            <Calendar className="w-4 h-4" /> Discover Events
          </Link>

          {isAuthenticated && (
            <>
              {/* Attendee Links */}
              {role === 'attendee' && (
                <Link to="/bookings" className="hover:text-indigo-600 transition flex items-center gap-1.5">
                  <Ticket className="w-4 h-4" /> My Bookings
                </Link>
              )}

              {/* Organizer Links */}
              {isOrganizer && (
                <>
                  <Link
                    to="/organizer/dashboard"
                    className="hover:text-violet-600 transition flex items-center gap-1.5 font-semibold text-slate-700"
                  >
                    <LayoutDashboard className="w-4 h-4 text-violet-600" /> Organizer Dashboard
                  </Link>
                  <Link
                    to="/organizer/scanner"
                    className="hover:text-indigo-600 transition flex items-center gap-1.5 font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl"
                  >
                    <QrCode className="w-4 h-4 text-indigo-600" /> Gate Scanner
                  </Link>
                </>
              )}
            </>
          )}
        </nav>

        {/* Right Section / Auth Actions */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs uppercase">
                  {user?.name ? user.name.charAt(0) : 'U'}
                </div>
                <div className="text-left">
                  <span className="block text-xs font-semibold text-slate-800 leading-tight">
                    {user?.name}
                  </span>
                  {roleBadge()}
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-sm font-medium text-slate-700 hover:text-indigo-600 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl shadow-sm transition"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-5 space-y-3">
          <Link
            to="/events"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 py-2 text-slate-700 font-medium text-sm"
          >
            <Calendar className="w-4 h-4" /> Discover Events
          </Link>

          {isAuthenticated ? (
            <>
              {role === 'attendee' && (
                <Link
                  to="/bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 py-2 text-slate-700 font-medium text-sm"
                >
                  <Ticket className="w-4 h-4 text-indigo-600" /> My Bookings
                </Link>
              )}

              {isOrganizer && (
                <>
                  <Link
                    to="/organizer/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 py-2 text-violet-700 font-medium text-sm"
                  >
                    <LayoutDashboard className="w-4 h-4 text-violet-600" /> Organizer Dashboard
                  </Link>
                  <Link
                    to="/organizer/scanner"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 py-2 text-indigo-700 font-medium text-sm"
                  >
                    <QrCode className="w-4 h-4 text-indigo-600" /> Gate Scanner
                  </Link>
                </>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900">{user?.name}</div>
                  <div className="text-xs text-slate-500">{user?.email}</div>
                  <div className="mt-1">{roleBadge()}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 rounded-lg"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            </>
          ) : (
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-sm font-medium text-slate-700 border border-slate-200 rounded-xl"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-sm font-medium bg-indigo-600 text-white rounded-xl shadow-sm"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
