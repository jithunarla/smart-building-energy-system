
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAccount } from '@/context/AccountContext';
import BankLogo from '@/components/BankLogo';

const Withdraw = () => {
  const [amount, setAmount] = useState('');
  const navigate = useNavigate();
  const { balance, updateBalance, addTransaction } = useAccount();
  
  const handleWithdraw = () => {
    const withdrawAmount = parseFloat(amount);
    
    if (!amount || withdrawAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (withdrawAmount > balance) {
      toast.error('Insufficient balance');
      return;
    }
    
    // Update global balance
    updateBalance(withdrawAmount, false);
    
    // Add to transaction history
    addTransaction({
      type: 'Withdraw',
      amount: withdrawAmount
    });
    
    // In a real app, you would make an API call to process the withdrawal
    toast.success(`Successfully withdrew ₹${amount}`);
    navigate('/atm');
  };
  
  return (
    <div className="min-h-screen bg-bank-dark flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-slate-800/30 rounded-lg shadow-lg border border-slate-700/50 p-8">
        <div className="flex justify-center mb-6">
          <BankLogo size="large" className="text-white" />
        </div>
        
        <h1 className="text-2xl font-bold text-center text-white mb-8">
          ENTER AMOUNT YOU WANT TO WITHDRAW
        </h1>
        
        <div className="space-y-8">
          <p className="text-center text-green-400 text-lg">
            Available Balance: ₹{balance.toLocaleString()}
          </p>
          
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="bank-input text-center text-lg"
          />
          
          <div className="flex justify-end space-x-4">
            <button
              onClick={handleWithdraw}
              className="bg-bank-teal hover:bg-bank-teal/80 text-white font-medium py-3 px-8 rounded-md transition-all"
            >
              WITHDRAW
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

export default Withdraw;
