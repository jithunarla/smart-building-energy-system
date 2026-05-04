
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import BankLogo from '@/components/BankLogo';

const Database = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('bank');

  // Data for database tables with the provided values
  const data = {
    bank: [
      { bank_ID: 1, bank_name: "State Bank", bank_branch: "New York" },
      { bank_ID: 2, bank_name: "Bank of America", bank_branch: "Los Angeles" },
      { bank_ID: 3, bank_name: "Citibank", bank_branch: "Chicago" },
      { bank_ID: 4, bank_name: "Wells Fargo", bank_branch: "Houston" },
      { bank_ID: 5, bank_name: "Chase Bank", bank_branch: "San Francisco" }
    ],
    atm: [
      { atm_ID: 101, bank_ID: 1, location: "NY Downtown" },
      { atm_ID: 102, bank_ID: 2, location: "LA Central" },
      { atm_ID: 103, bank_ID: 3, location: "Chicago Loop" },
      { atm_ID: 104, bank_ID: 4, location: "Houston Metro" },
      { atm_ID: 105, bank_ID: 5, location: "SF Bay Area" }
    ],
    customer: [
      { customer_ID: 201, customer_name: "John Doe", phone_number: "1234567890", address: "123 Main St, NY" },
      { customer_ID: 202, customer_name: "Jane Smith", phone_number: "2345678901", address: "456 Elm St, LA" },
      { customer_ID: 203, customer_name: "Alice Brown", phone_number: "3456789012", address: "789 Oak St, Chicago" },
      { customer_ID: 204, customer_name: "Bob Wilson", phone_number: "4567890123", address: "321 Pine St, Houston" },
      { customer_ID: 205, customer_name: "Emma Johnson", phone_number: "5678901234", address: "654 Cedar St, SF" }
    ],
    account: [
      { account_ID: 301, customer_ID: 201, bank_ID: 1, account_type: "Savings", balance: 5000.00 },
      { account_ID: 302, customer_ID: 202, bank_ID: 2, account_type: "Current", balance: 7000.50 },
      { account_ID: 303, customer_ID: 203, bank_ID: 3, account_type: "Savings", balance: 4500.75 },
      { account_ID: 304, customer_ID: 204, bank_ID: 4, account_type: "Current", balance: 8200.30 },
      { account_ID: 305, customer_ID: 205, bank_ID: 5, account_type: "Savings", balance: 9100.60 }
    ],
    atm_card: [
      { card_ID: 401, account_ID: 301, card_number: "1234567812345678", expiry_date: "2027-05-01", pin_code: 1234 },
      { card_ID: 402, account_ID: 302, card_number: "2345678923456789", expiry_date: "2026-08-15", pin_code: 2345 },
      { card_ID: 403, account_ID: 303, card_number: "3456789034567890", expiry_date: "2028-12-10", pin_code: 3456 },
      { card_ID: 404, account_ID: 304, card_number: "4567890145678901", expiry_date: "2025-06-20", pin_code: 4567 },
      { card_ID: 405, account_ID: 305, card_number: "5678901256789012", expiry_date: "2029-09-25", pin_code: 5678 }
    ],
    deposit: [
      { deposit_ID: 501, account_ID: 301, amount: 1000.00, deposit_date: "2025-05-04 10:15:23" },
      { deposit_ID: 502, account_ID: 302, amount: 1500.50, deposit_date: "2025-05-04 11:30:45" },
      { deposit_ID: 503, account_ID: 303, amount: 2000.75, deposit_date: "2025-05-04 12:45:12" },
      { deposit_ID: 504, account_ID: 304, amount: 2500.30, deposit_date: "2025-05-04 13:20:38" },
      { deposit_ID: 505, account_ID: 305, amount: 3000.60, deposit_date: "2025-05-04 14:35:55" }
    ],
    fast_cash: [
      { transaction_ID: 601, atm_ID: 101, account_ID: 301, amount: 200.00, transaction_date: "2025-05-04 09:10:33" },
      { transaction_ID: 602, atm_ID: 102, account_ID: 302, amount: 300.50, transaction_date: "2025-05-04 10:25:18" },
      { transaction_ID: 603, atm_ID: 103, account_ID: 303, amount: 150.75, transaction_date: "2025-05-04 11:40:42" },
      { transaction_ID: 604, atm_ID: 104, account_ID: 304, amount: 400.30, transaction_date: "2025-05-04 12:15:09" },
      { transaction_ID: 605, atm_ID: 105, account_ID: 305, amount: 500.60, transaction_date: "2025-05-04 13:30:27" }
    ],
    withdraw: [
      { withdraw_ID: 701, atm_ID: 101, account_ID: 301, amount: 500.00, withdraw_date: "2025-05-04 15:15:23" },
      { withdraw_ID: 702, atm_ID: 102, account_ID: 302, amount: 700.50, withdraw_date: "2025-05-04 16:30:45" },
      { withdraw_ID: 703, atm_ID: 103, account_ID: 303, amount: 450.75, withdraw_date: "2025-05-04 17:45:12" },
      { withdraw_ID: 704, atm_ID: 104, account_ID: 304, amount: 820.30, withdraw_date: "2025-05-04 18:20:38" },
      { withdraw_ID: 705, atm_ID: 105, account_ID: 305, amount: 910.60, withdraw_date: "2025-05-04 19:35:55" }
    ],
    signup: [
      { id: 1, name: "Ganesh", email: "ganesh@example.com", gender: "Male", dob: "1990-05-15", address: "123 Main St", city: "Mumbai", state: "Maharashtra" },
      { id: 2, name: "Priya", email: "priya@example.com", gender: "Female", dob: "1995-08-22", address: "456 Park Ave", city: "Delhi", state: "Delhi" },
      { id: 3, name: "Amit", email: "amit@example.com", gender: "Male", dob: "1985-10-20", address: "789 Lake Rd", city: "Bangalore", state: "Karnataka" },
      { id: 4, name: "Sunita", email: "sunita@example.com", gender: "Female", dob: "1992-03-12", address: "234 Hill St", city: "Chennai", state: "Tamil Nadu" }
    ],
    login: [
      { id: 1, account_number: "1131837109915363", last_login: "2025-05-04 19:20:15", status: "Active" },
      { id: 2, account_number: "1137229872541244", last_login: "2025-05-03 14:30:22", status: "Active" },
      { id: 3, account_number: "1140876543210987", last_login: "2025-05-04 08:45:33", status: "Active" },
      { id: 4, account_number: "1159876543211234", last_login: "2025-05-02 16:20:45", status: "Inactive" }
    ],
    signup2: [
      { id: 1, account_id: 1, religion: "Hindu", category: "General", income: "Null", education: "Non-Graduate", occupation: "Salaried" },
      { id: 2, account_id: 2, religion: "Hindu", category: "OBC", income: "<2,50,000", education: "Graduate", occupation: "Business" },
      { id: 3, account_id: 3, religion: "Muslim", category: "General", income: "2,50,000-5,00,000", education: "Post-Graduate", occupation: "Self-Employed" },
      { id: 4, account_id: 4, religion: "Christian", category: "SC", income: ">5,00,000", education: "Graduate", occupation: "Government" }
    ],
    signup3: [
      { id: 1, account_id: 1, account_type: "Saving Account", services: "ATM Card, Mobile Banking, Email Alerts" },
      { id: 2, account_id: 2, account_type: "Current Account", services: "ATM Card, Cheque Book, Internet Banking, E-Statement" },
      { id: 3, account_id: 3, account_type: "Fixed Deposit", services: "ATM Card, Internet Banking, Email Alerts" },
      { id: 4, account_id: 4, account_type: "Salary Account", services: "ATM Card, Cheque Book, Mobile Banking, SMS Alerts" }
    ],
    mini_statement: [
      { id: 1, account_number: "1131837109915363", transaction_type: "Withdraw", amount: 10000, date: "2025-05-04", time: "19:24:36" },
      { id: 2, account_number: "1131837109915363", transaction_type: "Withdraw", amount: 1000, date: "2025-05-04", time: "19:24:20" },
      { id: 3, account_number: "1131837109915363", transaction_type: "Deposit", amount: 50000, date: "2025-05-04", time: "19:23:38" },
      { id: 4, account_number: "1137229872541244", transaction_type: "Deposit", amount: 20000, date: "2025-05-03", time: "15:10:22" },
      { id: 5, account_number: "1137229872541244", transaction_type: "Withdraw", amount: 5000, date: "2025-05-03", time: "16:45:12" }
    ],
    balance_enquiry: [
      { id: 1, account_number: "1131837109915363", holder_name: "Ganesh", account_type: "Saving Account", balance: 39000, last_updated: "2025-05-04 19:24:36" },
      { id: 2, account_number: "1137229872541244", holder_name: "Priya", account_type: "Current Account", balance: 125000, last_updated: "2025-05-03 14:30:22" },
      { id: 3, account_number: "1140876543210987", holder_name: "Amit", account_type: "Fixed Deposit", balance: 200000, last_updated: "2025-05-04 08:45:33" },
      { id: 4, account_number: "1159876543211234", holder_name: "Sunita", account_type: "Salary Account", balance: 75000, last_updated: "2025-05-02 16:20:45" }
    ]
  };

  // Helper function to generate table headers
  const getTableHeaders = (table: string) => {
    if (data[table as keyof typeof data] && data[table as keyof typeof data].length > 0) {
      return Object.keys(data[table as keyof typeof data][0]);
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-bank-dark p-6">
      <div className="max-w-7xl mx-auto bg-slate-800/30 rounded-lg shadow-lg border border-slate-700/50 p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <BankLogo className="text-white mr-4" />
            <h1 className="text-2xl font-bold text-white">
              Bank Database
            </h1>
          </div>
          <button
            onClick={() => navigate('/')}
            className="bg-bank-teal hover:bg-bank-teal/80 text-white px-4 py-2 rounded"
          >
            Back to Home
          </button>
        </div>

        <Tabs defaultValue="bank" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 mb-6 overflow-x-auto bg-slate-700/50">
            <TabsTrigger value="bank">Bank</TabsTrigger>
            <TabsTrigger value="atm">ATM</TabsTrigger>
            <TabsTrigger value="customer">Customer</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="atm_card">ATM Card</TabsTrigger>
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
            <TabsTrigger value="fast_cash">Fast Cash</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
            <TabsTrigger value="signup">Signup</TabsTrigger>
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup2">Signup2</TabsTrigger>
            <TabsTrigger value="signup3">Signup3</TabsTrigger>
            <TabsTrigger value="mini_statement">Mini Statement</TabsTrigger>
            <TabsTrigger value="balance_enquiry">Balance</TabsTrigger>
          </TabsList>

          {Object.keys(data).map(table => (
            <TabsContent key={table} value={table} className="border border-slate-700 rounded-lg p-4 bg-slate-900/50">
              <h2 className="text-xl font-semibold mb-4 text-white capitalize">
                {table.replace('_', ' ')} Table
              </h2>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      {getTableHeaders(table).map(header => (
                        <TableHead key={header} className="py-2 px-4 font-medium text-white capitalize">
                          {header.replace('_', ' ')}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data[table as keyof typeof data]?.map((row, index) => (
                      <TableRow key={index} className="hover:bg-slate-800/50 border-slate-700">
                        {getTableHeaders(table).map(header => (
                          <TableCell key={`${index}-${header}`} className="py-2 px-4 text-slate-300">
                            {row[header as keyof typeof row]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default Database;
