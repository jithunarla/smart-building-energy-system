
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const PinChange = () => {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const navigate = useNavigate();
  
  const handlePinChange = () => {
    // Simple validation
    if (!currentPin || !newPin || !confirmNewPin) {
      toast.error('All fields are required');
      return;
    }
    
    if (newPin !== confirmNewPin) {
      toast.error('New PIN and confirmation do not match');
      return;
    }
    
    if (newPin.length !== 4) {
      toast.error('PIN must be 4 digits');
      return;
    }
    
    // In a real app, you would validate the current PIN against the stored value
    // and then update the PIN via an API call
    toast.success('PIN successfully changed');
    navigate('/atm');
  };
  
  return (
    <div className="min-h-screen bg-bank-dark flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-slate-800/30 rounded-lg shadow-lg border border-slate-700/50 p-8">
        <h1 className="text-2xl font-bold text-center text-white mb-8">
          PIN CHANGE
        </h1>
        
        <div className="space-y-8">
          <div>
            <label className="block text-white mb-2">Current PIN:</label>
            <input
              type="password"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              placeholder="Enter current PIN"
              className="bank-input text-center"
              maxLength={4}
            />
          </div>
          
          <div>
            <label className="block text-white mb-2">New PIN:</label>
            <input
              type="password"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="Enter new PIN"
              className="bank-input text-center"
              maxLength={4}
            />
          </div>
          
          <div>
            <label className="block text-white mb-2">Confirm New PIN:</label>
            <input
              type="password"
              value={confirmNewPin}
              onChange={(e) => setConfirmNewPin(e.target.value)}
              placeholder="Confirm new PIN"
              className="bank-input text-center"
              maxLength={4}
            />
          </div>
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={handlePinChange}
              className="bg-bank-teal hover:bg-bank-teal/80 text-white font-medium py-3 px-8 rounded-md transition-all"
            >
              CHANGE PIN
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

export default PinChange;
