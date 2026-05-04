
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Calculator } from 'lucide-react';
import BankLogo from '@/components/BankLogo';

const ATM = () => {
  const navigate = useNavigate();

  const handleTransaction = (type: string) => {
    switch(type) {
      case 'deposit':
        navigate('/deposit');
        break;
      case 'withdraw':
        navigate('/withdraw');
        break;
      case 'fast-cash':
        navigate('/fast-cash');
        break;
      case 'mini-statement':
        navigate('/mini-statement');
        break;
      case 'pin-change':
        navigate('/pin-change');
        break;
      case 'balance-enquiry':
        navigate('/balance-enquiry');
        break;
      case 'interest-calculator':
        navigate('/interest-calculator');
        break;
      case 'exit':
        toast.info('Logging out...');
        navigate('/login');
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-bank-dark flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-slate-800/30 rounded-lg shadow-lg border border-slate-700/50 p-8">
        <h1 className="text-2xl font-bold text-center text-white mb-8">
          Please Select Your Transaction
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => handleTransaction('deposit')}
            className="bg-bank-teal hover:bg-bank-teal/80 text-white font-medium py-4 px-6 rounded-md transition-all text-lg"
          >
            DEPOSIT
          </button>
          
          <button
            onClick={() => handleTransaction('withdraw')}
            className="bg-bank-teal hover:bg-bank-teal/80 text-white font-medium py-4 px-6 rounded-md transition-all text-lg"
          >
            CASH WITHDRAWAL
          </button>
          
          <button
            onClick={() => handleTransaction('fast-cash')}
            className="bg-bank-teal hover:bg-bank-teal/80 text-white font-medium py-4 px-6 rounded-md transition-all text-lg"
          >
            FAST CASH
          </button>
          
          <button
            onClick={() => handleTransaction('mini-statement')}
            className="bg-bank-teal hover:bg-bank-teal/80 text-white font-medium py-4 px-6 rounded-md transition-all text-lg"
          >
            MINI STATEMENT
          </button>
          
          <button
            onClick={() => handleTransaction('pin-change')}
            className="bg-bank-teal hover:bg-bank-teal/80 text-white font-medium py-4 px-6 rounded-md transition-all text-lg"
          >
            PIN CHANGE
          </button>
          
          <button
            onClick={() => handleTransaction('balance-enquiry')}
            className="bg-bank-teal hover:bg-bank-teal/80 text-white font-medium py-4 px-6 rounded-md transition-all text-lg"
          >
            BALANCE ENQUIRY
          </button>
          
          <button
            onClick={() => handleTransaction('interest-calculator')}
            className="flex items-center justify-center gap-2 bg-bank-teal hover:bg-bank-teal/80 text-white font-medium py-4 px-6 rounded-md transition-all text-lg col-span-full"
          >
            <Calculator size={20} /> INTEREST CALCULATOR
          </button>
        </div>
        
        <div className="mt-8 flex justify-end">
          <button
            onClick={() => handleTransaction('exit')}
            className="bg-bank-teal hover:bg-bank-teal/80 text-white font-medium py-2 px-6 rounded-md transition-all"
          >
            EXIT
          </button>
        </div>
      </div>
    </div>
  );
};

export default ATM;
