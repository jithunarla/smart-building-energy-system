
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AccountContextType {
  balance: number;
  updateBalance: (amount: number, isDeposit: boolean) => void;
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'date' | 'time'>) => void;
}

export interface Transaction {
  date: string;
  time: string;
  type: 'Deposit' | 'Withdraw';
  amount: number;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export const useAccount = () => {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
};

interface AccountProviderProps {
  children: ReactNode;
  initialBalance?: number;
}

export const AccountProvider: React.FC<AccountProviderProps> = ({ 
  children, 
  initialBalance = 39000 
}) => {
  const [balance, setBalance] = useState<number>(initialBalance);
  const [transactions, setTransactions] = useState<Transaction[]>([
    { date: '4/5/2025', time: '7:24:36 pm', type: 'Withdraw', amount: 10000 },
    { date: '4/5/2025', time: '7:24:20 pm', type: 'Withdraw', amount: 1000 },
    { date: '4/5/2025', time: '7:23:38 pm', type: 'Deposit', amount: 50000 }
  ]);

  const updateBalance = (amount: number, isDeposit: boolean) => {
    setBalance(prevBalance => {
      return isDeposit ? prevBalance + amount : prevBalance - amount;
    });
  };

  const addTransaction = (transaction: Omit<Transaction, 'date' | 'time'>) => {
    const now = new Date();
    const date = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }).toLowerCase();
    
    const newTransaction: Transaction = {
      ...transaction,
      date,
      time
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const value = {
    balance,
    updateBalance,
    transactions,
    addTransaction
  };

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
};
