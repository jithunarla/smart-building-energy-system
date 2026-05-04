
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from '@/context/AccountContext';
import BankLogo from '@/components/BankLogo';

const BalanceEnquiry = () => {
  const navigate = useNavigate();
  const { balance } = useAccount();
  
  // Mock account data - in a real app this would come from an API call
  const accountData = {
    accountHolder: 'ganesh',
    accountNumber: '1131837109915363',
    accountType: 'Saving Account',
    balance
  };
  
  return (
    <div className="min-h-screen bg-bank-dark flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-slate-800/30 rounded-lg shadow-lg border border-slate-700/50 p-8">
        <div className="flex justify-center mb-6">
          <BankLogo size="large" className="text-white" />
        </div>
        
        <h1 className="text-2xl font-bold text-center text-white mb-8">
          BALANCE ENQUIRY
        </h1>
        
        <div className="space-y-6">
          <div className="bg-slate-800/50 p-4 rounded-md">
            <div className="flex items-center justify-between">
              <p className="text-slate-400">Account Holder:</p>
              <p className="text-white text-xl">{accountData.accountHolder}</p>
            </div>
          </div>
          
          <div className="bg-slate-800/50 p-4 rounded-md">
            <div className="flex items-center justify-between">
              <p className="text-slate-400">Account Number:</p>
              <p className="text-white text-xl font-mono">{accountData.accountNumber}</p>
            </div>
          </div>
          
          <div className="bg-slate-800/50 p-4 rounded-md">
            <div className="flex items-center justify-between">
              <p className="text-slate-400">Account Type:</p>
              <p className="text-white text-xl">{accountData.accountType}</p>
            </div>
          </div>
          
          <div className="bg-slate-800/50 p-4 rounded-md">
            <div className="flex items-center justify-between">
              <p className="text-slate-400">Available Balance:</p>
              <p className="text-green-400 text-2xl font-bold">₹{accountData.balance.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="flex justify-center mt-8">
            <button
              onClick={() => navigate('/atm')}
              className="bg-bank-teal hover:bg-bank-teal/80 text-white font-medium py-3 px-8 rounded-md transition-all"
            >
              BACK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceEnquiry;
