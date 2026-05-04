
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAccount } from '@/context/AccountContext';
import BankLogo from '@/components/BankLogo';

const Deposit = () => {
  const [amount, setAmount] = useState('');
  const navigate = useNavigate();
  const { updateBalance, addTransaction } = useAccount();
  
  const handleDeposit = () => {
    const depositAmount = parseFloat(amount);
    
    if (!amount || depositAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    // Update global balance
    updateBalance(depositAmount, true);
    
    // Add to transaction history
    addTransaction({
      type: 'Deposit',
      amount: depositAmount
    });
    
    // In a real app, you would make an API call to process the deposit
    toast.success(`Successfully deposited ₹${amount}`);
    navigate('/atm');
  };
  
  return (
    <div className="min-h-screen bg-bank-dark flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-slate-800/30 rounded-lg shadow-lg border border-slate-700/50 p-8">
        <div className="flex justify-center mb-6">
          <BankLogo size="large" className="text-white" />
        </div>
        
        <h1 className="text-2xl font-bold text-center text-white mb-8">
          ENTER AMOUNT YOU WANT TO DEPOSIT
        </h1>
        
        <div className="space-y-8">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="bank-input text-center text-lg"
          />
          
          <div className="flex justify-end space-x-4">
            <button
              onClick={handleDeposit}
              className="bg-bank-teal hover:bg-bank-teal/80 text-white font-medium py-3 px-8 rounded-md transition-all"
            >
              DEPOSIT
            </button>
            
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

export default Deposit;
