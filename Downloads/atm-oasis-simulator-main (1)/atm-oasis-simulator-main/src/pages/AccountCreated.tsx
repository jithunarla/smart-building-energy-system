
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AccountCreated = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { accountNumber, pin } = location.state || { accountNumber: '1137229872541244', pin: '1275' };

  return (
    <div className="min-h-screen bg-bank-dark flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800/50 rounded-lg shadow-lg border border-slate-700/50 p-6">
        <h1 className="text-green-400 text-2xl font-bold text-center mb-6">
          Account Created Successfully!
        </h1>
        
        <div className="bg-slate-900 p-4 rounded-md mb-4 text-white">
          <p className="text-slate-400 mb-1">Your Account Number</p>
          <p className="text-xl font-mono">{accountNumber}</p>
        </div>
        
        <div className="bg-slate-900 p-4 rounded-md mb-6 text-white">
          <p className="text-slate-400 mb-1">Your PIN</p>
          <p className="text-xl font-mono">{pin}</p>
        </div>
        
        <div className="bg-amber-900/50 p-4 rounded-md border border-amber-700/50 mb-6">
          <p className="text-yellow-400 text-sm">
            Please save these details securely. You will need them to log in.
          </p>
        </div>
        
        <button
          onClick={() => navigate('/login')}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-md transition-all"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
};

export default AccountCreated;
