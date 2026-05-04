
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bank-dark p-4">
      <div className="max-w-md w-full bg-slate-800/50 rounded-lg shadow-lg border border-slate-700/50 p-8 text-center">
        <h1 className="text-5xl font-bold text-white mb-4">404</h1>
        <p className="text-xl text-slate-300 mb-6">Oops! Page not found</p>
        <p className="text-slate-400 mb-8">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <button
          onClick={() => navigate('/')}
          className="bg-bank-teal hover:bg-bank-teal/80 text-white font-medium py-3 px-8 rounded-md transition-all"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;
