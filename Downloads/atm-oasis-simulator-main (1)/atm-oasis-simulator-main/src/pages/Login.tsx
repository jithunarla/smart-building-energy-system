
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import BankLogo from '@/components/BankLogo';

const Login = () => {
  const [accountNumber, setAccountNumber] = useState('');
  const [pin, setPin] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accountNumber || !pin) {
      toast.error('Please enter both account number and PIN');
      return;
    }

    // Mock login logic - in a real app, you would validate against a backend
    if (accountNumber && pin) {
      toast.success('Login successful');
      navigate('/atm');
    }
  };

  const handleSignup = () => {
    navigate('/signup');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-100 to-sky-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <BankLogo size="large" />
          </div>
          
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">WELCOME TO ATM</h2>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="cardNo" className="block text-sm font-medium text-gray-700 mb-1">
                Card No:
              </label>
              <input
                id="cardNo"
                type="text"
                className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Enter your account number"
              />
            </div>
            
            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-1">
                PIN:
              </label>
              <input
                id="pin"
                type="password"
                className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter your PIN"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <button
                type="submit"
                className="bg-black text-white py-2.5 px-4 rounded-md hover:bg-gray-800 transition-colors"
              >
                SIGN IN
              </button>
              <button
                type="button"
                onClick={() => {
                  setAccountNumber('');
                  setPin('');
                }}
                className="bg-white text-black border border-gray-300 py-2.5 px-4 rounded-md hover:bg-gray-100 transition-colors"
              >
                CLEAR
              </button>
            </div>
          </form>
          
          <button
            onClick={handleSignup}
            className="w-full mt-4 bg-black text-white py-2.5 px-4 rounded-md hover:bg-gray-800 transition-colors"
          >
            SIGN UP
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
