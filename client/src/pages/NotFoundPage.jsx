import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-7xl font-extrabold text-slate-300">404</h1>
      <h2 className="text-2xl font-bold text-slate-800 mt-4">Page Not Found</h2>
      <p className="text-slate-600 mt-2 max-w-md">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition"
      >
        <Home className="w-4 h-4" />
        Return Home
      </Link>
    </div>
  );
};

export default NotFoundPage;
