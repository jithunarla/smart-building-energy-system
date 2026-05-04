
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const InterestCalculator = () => {
  const navigate = useNavigate();
  const [calculationMethod, setCalculationMethod] = useState('simple');
  const [principal, setPrincipal] = useState(39000);
  const [rate, setRate] = useState(5);
  const [time, setTime] = useState(12);
  const [maturityAmount, setMaturityAmount] = useState(0);
  const [interestAmount, setInterestAmount] = useState(0);
  const [chartData, setChartData] = useState<Array<{ month: number; amount: number }>>([]);

  useEffect(() => {
    calculateInterest();
  }, [principal, rate, time, calculationMethod]);

  const calculateInterest = () => {
    let maturityAmt = 0;
    let interestAmt = 0;
    const newChartData = [] as Array<{ month: number; amount: number }>;
    
    if (calculationMethod === 'simple') {
      interestAmt = (principal * rate * time) / (100 * 12);
      maturityAmt = principal + interestAmt;
      
      // Generate chart data
      for (let i = 0; i <= time; i++) {
        const monthlyInterest = (principal * rate * i) / (100 * 12);
        newChartData.push({
          month: i,
          amount: principal + monthlyInterest
        });
      }
    } else {
      // Compound interest calculation (monthly compounding)
      const monthlyRate = rate / 100 / 12;
      maturityAmt = principal * Math.pow(1 + monthlyRate, time);
      interestAmt = maturityAmt - principal;
      
      // Generate chart data
      for (let i = 0; i <= time; i++) {
        newChartData.push({
          month: i,
          amount: principal * Math.pow(1 + monthlyRate, i)
        });
      }
    }
    
    setMaturityAmount(maturityAmt);
    setInterestAmount(interestAmt);
    setChartData(newChartData);
  };

  return (
    <div className="min-h-screen bg-bank-dark p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center text-white text-2xl font-bold">
            <Calculator className="mr-2" size={28} /> Interest Calculator
          </div>
          <button
            onClick={() => navigate('/atm')}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Back to ATM
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Calculate Interest
            </h2>
            <p className="text-slate-400 mb-4">
              Choose calculation method and enter details
            </p>
            
            <div className="flex mb-6">
              <button
                className={`px-6 py-2 ${
                  calculationMethod === 'simple' 
                    ? 'bg-white text-slate-800 font-semibold' 
                    : 'bg-slate-700 text-white'
                } rounded-l-md transition-all`}
                onClick={() => setCalculationMethod('simple')}
              >
                Simple Interest
              </button>
              <button
                className={`px-6 py-2 ${
                  calculationMethod === 'compound' 
                    ? 'bg-white text-slate-800 font-semibold' 
                    : 'bg-slate-700 text-white'
                } rounded-r-md transition-all`}
                onClick={() => setCalculationMethod('compound')}
              >
                Compound Interest
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white mb-1">Principal Amount (₹)</label>
                <input
                  type="number"
                  value={principal}
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                  className="bank-input"
                />
              </div>
              
              <div>
                <label className="block text-white mb-1">Interest Rate (% per annum)</label>
                <input
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="bank-input"
                />
              </div>
              
              <div>
                <label className="block text-white mb-1">Time Period (months)</label>
                <input
                  type="number"
                  value={time}
                  onChange={(e) => setTime(Number(e.target.value))}
                  className="bank-input"
                />
              </div>
            </div>
            
            <div className="mt-8 bg-purple-900/30 rounded-lg p-5 border border-purple-800/50">
              <h3 className="text-purple-400 mb-2">Maturity Amount</h3>
              <div className="text-2xl font-bold text-white">
                ₹{maturityAmount.toFixed(2)}
              </div>
              <div className="text-sm text-purple-300 mt-1">
                Interest: ₹{interestAmount.toFixed(2)}
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-2">
              Interest Growth Projection
            </h2>
            <p className="text-slate-400 mb-6">
              {calculationMethod === 'simple' ? 'Simple' : 'Compound'} Interest over time
            </p>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="month" 
                    label={{ value: 'Months', position: 'insideBottomRight', offset: -10 }}
                    stroke="#9CA3AF" 
                  />
                  <YAxis 
                    label={{ value: 'Amount (₹)', angle: -90, position: 'insideLeft' }}
                    stroke="#9CA3AF" 
                  />
                  <Tooltip 
                    formatter={(value) => [`₹${Number(value).toFixed(2)}`, 'Amount']}
                    labelFormatter={(value) => `Month: ${value}`}
                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#4B5563' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#9b87f5" 
                    strokeWidth={2}
                    dot={{ r: 4 }} 
                    activeDot={{ r: 8, fill: '#9b87f5' }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {chartData.length > 0 && (
              <div className="mt-4 bg-indigo-900/30 rounded-md p-3 border border-indigo-800/50">
                <div className="text-indigo-300">Month: 5</div>
                <div className="text-white font-semibold">
                  Amount : ₹{chartData[5] ? chartData[5].amount.toFixed(2) : ''}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterestCalculator;
