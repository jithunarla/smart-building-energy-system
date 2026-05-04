
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAccount } from '@/context/AccountContext';
import BankLogo from '@/components/BankLogo';

const FastCash = () => {
  const navigate = useNavigate();
  const { balance, updateBalance, addTransaction } = useAccount();
  
  const handleFastCash = (amount: number) => {
    if (amount > balance) {
      toast.error('Insufficient balance');
      return;
    }
    
    // Update global balance
    updateBalance(amount, false);
    
    // Add to transaction history
    addTransaction({
      type: 'Withdraw',
      amount
    });
    
    // In a real app, you would make an API call to process the withdrawal
    toast.success(`Successfully withdrew ₹${amount}`);
    navigate('/atm');
  };
  
  const amounts = [1000, 2000, 5000, 10000, 15000, 20000];
  
  return (
    <div className="min-h-screen bg-bank-dark flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-slate-800/30 rounded-lg shadow-lg border border-slate-700/50 p-8">
        <div className="flex justify-center mb-6">
          <BankLogo size="large" className="text-white" />
        </div>
        
        <h1 className="text-2xl font-bold text-center text-white mb-4">
          FAST CASH
        </h1>
        
        <p className="text-center text-green-400 text-lg mb-8">
          Available Balance: ₹{balance.toLocaleString()}
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {amounts.map((amount) => (
            <button
              key={amount}
              onClick={() => handleFastCash(amount)}
              className="bg-bank-teal hover:bg-bank-teal/80 text-white font-medium py-4 px-6 rounded-md transition-all text-lg"
            >
              ₹{amount.toLocaleString()}
            </button>
          ))}
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={() => navigate('/atm')}
            className="bg-bank-teal hover:bg-bank-teal/80 text-white font-medium py-3 px-8 rounded-md transition-all"
          >
            BACK
          </button>
        </div>
      </div>
    </div>
  );
};

export default FastCash;
