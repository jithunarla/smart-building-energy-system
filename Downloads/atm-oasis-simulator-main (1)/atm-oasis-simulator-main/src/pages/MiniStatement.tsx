
import React from 'react';
import { useNavigate } from 'react-router-dom';
import BankLogo from '@/components/BankLogo';
import { useAccount } from '@/context/AccountContext';

const MiniStatement = () => {
  const navigate = useNavigate();
  const { transactions, balance } = useAccount();
  
  return (
    <div className="min-h-screen bg-bank-dark flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800/30 rounded-lg shadow-lg border border-slate-700/50 p-6">
        <div className="flex justify-center mb-6">
          <BankLogo size="large" className="text-white" />
        </div>
        
        <h1 className="text-2xl font-bold text-center text-white mb-6">
          Mini Statement
        </h1>
        
        {transactions.map((transaction, index) => (
          <div key={index} className="py-3 border-b border-gray-600">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-300">
                {transaction.date}, {transaction.time}
              </div>
              <div className={`font-medium ${transaction.type === 'Deposit' ? 'text-green-400' : 'text-red-400'}`}>
                {transaction.type}
              </div>
              <div className="font-mono font-bold text-white">
                ₹{transaction.amount.toLocaleString()}
              </div>
            </div>
          </div>
        ))}
        
        <div className="mt-6 pt-4 border-t-2 border-gray-600">
          <p className="text-xl font-bold text-white">
            Your total Balance is ₹{balance.toLocaleString()}
          </p>
        </div>
        
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => navigate('/atm')}
            className="bg-bank-teal hover:bg-bank-teal/80 text-white font-medium py-2 px-6 rounded transition-all"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
};

export default MiniStatement;
