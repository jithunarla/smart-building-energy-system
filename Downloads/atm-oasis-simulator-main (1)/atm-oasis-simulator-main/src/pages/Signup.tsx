import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import BankLogo from '@/components/BankLogo';

const Signup = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    fathersName: '',
    gender: 'Male',
    dob: '',
    email: '',
    maritalStatus: 'Unmarried',
    address: '',
    city: '',
    state: '',
    pinCode: '',
    religion: 'Hindu',
    category: 'General',
    income: 'Null',
    education: 'Non-Graduate',
    occupation: 'Salaried',
    panNumber: '',
    aadhaarNumber: '',
    seniorCitizen: 'No',
    existingAccount: 'No',
    accountType: 'Saving Account',
    services: {
      atmCard: false,
      mobileBanking: false,
      chequeBook: false,
      internetBanking: false,
      emailAlerts: false,
      eStatement: false,
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        services: {
          ...formData.services,
          [name]: checked
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (currentPage === 1) {
      // Check if required fields are filled in page 1
      if (!formData.name || !formData.email || !formData.address) {
        toast.error('Please fill all required fields');
        return;
      }
      setCurrentPage(2);
    } else if (currentPage === 2) {
      // Check if required fields are filled in page 2
      if (!formData.panNumber || !formData.aadhaarNumber) {
        toast.error('Please fill all required fields');
        return;
      }
      setCurrentPage(3);
    } else {
      // Final submission
      // Generate random account number and PIN
      const accountNumber = Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString();
      const pin = Math.floor(1000 + Math.random() * 9000).toString();
      
      // In a real application, you would send this data to the backend
      // For now, we'll just show the account creation success page
      navigate('/account-created', { state: { accountNumber, pin } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-sky-50 p-4 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="mb-6">
          <BankLogo className="mx-auto" size="large" />
          
          {currentPage === 1 && (
            <>
              <h2 className="text-xl font-bold text-gray-800 text-center mt-4">APPLICATION FORM NO. 8999</h2>
              <p className="text-center text-gray-600 mb-6">Page 1: Personal Details</p>
            </>
          )}
          
          {currentPage === 2 && (
            <>
              <h2 className="text-xl font-bold text-gray-800 text-center mt-4">Page 2: Additional Details</h2>
              <p className="text-center text-gray-600 mb-6">Form No: 8999</p>
            </>
          )}
          
          {currentPage === 3 && (
            <>
              <h2 className="text-xl font-bold text-gray-800 text-center mt-4">Account Details</h2>
              <p className="text-center text-gray-600 mb-6">Select account type and services</p>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          {currentPage === 1 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name:
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label htmlFor="fathersName" className="block text-sm font-medium text-gray-700 mb-1">
                  Father's Name:
                </label>
                <input
                  id="fathersName"
                  name="fathersName"
                  type="text"
                  className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
                  value={formData.fathersName}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender:</label>
                <div className="flex gap-4">
                  <div className="flex items-center">
                    <input
                      id="male"
                      name="gender"
                      type="radio"
                      value="Male"
                      checked={formData.gender === 'Male'}
                      onChange={handleRadioChange}
                      className="h-4 w-4 text-bank-teal"
                    />
                    <label htmlFor="male" className="ml-2 text-sm text-gray-700">
                      Male
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="female"
                      name="gender"
                      type="radio"
                      value="Female"
                      checked={formData.gender === 'Female'}
                      onChange={handleRadioChange}
                      className="h-4 w-4 text-bank-teal"
                    />
                    <label htmlFor="female" className="ml-2 text-sm text-gray-700">
                      Female
                    </label>
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth:
                </label>
                <input
                  id="dob"
                  name="dob"
                  type="date"
                  className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
                  value={formData.dob}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address:
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status:</label>
                <div className="flex gap-4">
                  <div className="flex items-center">
                    <input
                      id="married"
                      name="maritalStatus"
                      type="radio"
                      value="Married"
                      checked={formData.maritalStatus === 'Married'}
                      onChange={handleRadioChange}
                      className="h-4 w-4 text-bank-teal"
                    />
                    <label htmlFor="married" className="ml-2 text-sm text-gray-700">
                      Married
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="unmarried"
                      name="maritalStatus"
                      type="radio"
                      value="Unmarried"
                      checked={formData.maritalStatus === 'Unmarried'}
                      onChange={handleRadioChange}
                      className="h-4 w-4 text-bank-teal"
                    />
                    <label htmlFor="unmarried" className="ml-2 text-sm text-gray-700">
                      Unmarried
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="other"
                      name="maritalStatus"
                      type="radio"
                      value="Other"
                      checked={formData.maritalStatus === 'Other'}
                      onChange={handleRadioChange}
                      className="h-4 w-4 text-bank-teal"
                    />
                    <label htmlFor="other" className="ml-2 text-sm text-gray-700">
                      Other
                    </label>
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address:
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    City:
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                    State:
                  </label>
                  <input
                    id="state"
                    name="state"
                    type="text"
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
                    value={formData.state}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="pinCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Pin Code:
                </label>
                <input
                  id="pinCode"
                  name="pinCode"
                  type="text"
                  className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
                  value={formData.pinCode}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}
          
          {currentPage === 2 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="religion" className="block text-sm font-medium text-gray-700 mb-1">
                  Religion:
                </label>
                <select
                  id="religion"
                  name="religion"
                  className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
                  value={formData.religion}
                  onChange={handleChange}
                >
                  <option value="Hindu">Hindu</option>
                  <option value="Muslim">Muslim</option>
                  <option value="Christian">Christian</option>
                  <option value="Sikh">Sikh</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category:
                </label>
                <select
                  id="category"
                  name="category"
                  className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="General">General</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="income" className="block text-sm font-medium text-gray-700 mb-1">
                  Income:
                </label>
                <select
                  id="income"
                  name="income"
                  className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
                  value={formData.income}
                  onChange={handleChange}
                >
                  <option value="Null">Null</option>
                  <option value="<1,50,000">&lt;1,50,000</option>
                  <option value="<2,50,000">&lt;2,50,000</option>
                  <option value="<5,00,000">&lt;5,00,000</option>
                  <option value="Upto 10,00,000">Upto 10,00,000</option>
                  <option value=">10,00,000">&gt;10,00,000</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="education" className="block text-sm font-medium text-gray-700 mb-1">
                  Educational Qualification:
                </label>
                <select
                  id="education"
                  name="education"
                  className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
                  value={formData.education}
                  onChange={handleChange}
                >
                  <option value="Non-Graduate">Non-Graduate</option>
                  <option value="Graduate">Graduate</option>
                  <option value="Post-Graduate">Post-Graduate</option>
                  <option value="Doctrate">Doctrate</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 mb-1">
                  Occupation:
                </label>
                <select
                  id="occupation"
                  name="occupation"
                  className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
                  value={formData.occupation}
                  onChange={handleChange}
                >
                  <option value="Salaried">Salaried</option>
                  <option value="Self-Employed">Self-Employed</option>
                  <option value="Business">Business</option>
                  <option value="Student">Student</option>
                  <option value="Retired">Retired</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="panNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  PAN Number:
                </label>
                <input
                  id="panNumber"
                  name="panNumber"
                  type="text"
                  className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
                  value={formData.panNumber}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label htmlFor="aadhaarNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Aadhaar Number:
                </label>
                <input
                  id="aadhaarNumber"
                  name="aadhaarNumber"
                  type="text"
                  className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
                  value={formData.aadhaarNumber}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senior Citizen:</label>
                <div className="flex gap-4">
                  <div className="flex items-center">
                    <input
                      id="seniorYes"
                      name="seniorCitizen"
                      type="radio"
                      value="Yes"
                      checked={formData.seniorCitizen === 'Yes'}
                      onChange={handleRadioChange}
                      className="h-4 w-4 text-bank-teal"
                    />
                    <label htmlFor="seniorYes" className="ml-2 text-sm text-gray-700">
                      Yes
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="seniorNo"
                      name="seniorCitizen"
                      type="radio"
                      value="No"
                      checked={formData.seniorCitizen === 'No'}
                      onChange={handleRadioChange}
                      className="h-4 w-4 text-bank-teal"
                    />
                    <label htmlFor="seniorNo" className="ml-2 text-sm text-gray-700">
                      No
                    </label>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Existing Account:</label>
                <div className="flex gap-4">
                  <div className="flex items-center">
                    <input
                      id="existingYes"
                      name="existingAccount"
                      type="radio"
                      value="Yes"
                      checked={formData.existingAccount === 'Yes'}
                      onChange={handleRadioChange}
                      className="h-4 w-4 text-bank-teal"
                    />
                    <label htmlFor="existingYes" className="ml-2 text-sm text-gray-700">
                      Yes
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="existingNo"
                      name="existingAccount"
                      type="radio"
                      value="No"
                      checked={formData.existingAccount === 'No'}
                      onChange={handleRadioChange}
                      className="h-4 w-4 text-bank-teal"
                    />
                    <label htmlFor="existingNo" className="ml-2 text-sm text-gray-700">
                      No
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {currentPage === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-3">Account Type</label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      id="saving"
                      name="accountType"
                      type="radio"
                      value="Saving Account"
                      checked={formData.accountType === 'Saving Account'}
                      onChange={handleRadioChange}
                      className="h-4 w-4 text-bank-teal"
                    />
                    <label htmlFor="saving" className="ml-2 text-sm text-gray-700">
                      Saving Account
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="current"
                      name="accountType"
                      type="radio"
                      value="Current Account"
                      checked={formData.accountType === 'Current Account'}
                      onChange={handleRadioChange}
                      className="h-4 w-4 text-bank-teal"
                    />
                    <label htmlFor="current" className="ml-2 text-sm text-gray-700">
                      Current Account
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="fixed"
                      name="accountType"
                      type="radio"
                      value="Fixed Deposit Account"
                      checked={formData.accountType === 'Fixed Deposit Account'}
                      onChange={handleRadioChange}
                      className="h-4 w-4 text-bank-teal"
                    />
                    <label htmlFor="fixed" className="ml-2 text-sm text-gray-700">
                      Fixed Deposit Account
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="recurring"
                      name="accountType"
                      type="radio"
                      value="Recurring Deposit Account"
                      checked={formData.accountType === 'Recurring Deposit Account'}
                      onChange={handleRadioChange}
                      className="h-4 w-4 text-bank-teal"
                    />
                    <label htmlFor="recurring" className="ml-2 text-sm text-gray-700">
                      Recurring Deposit Account
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-lg font-medium text-gray-700 mb-3">Services Required</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center">
                    <input
                      id="atmCard"
                      name="atmCard"
                      type="checkbox"
                      checked={formData.services.atmCard}
                      onChange={handleChange}
                      className="h-4 w-4 text-bank-teal rounded"
                    />
                    <label htmlFor="atmCard" className="ml-2 text-sm text-gray-700">
                      ATM Card
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="internetBanking"
                      name="internetBanking"
                      type="checkbox"
                      checked={formData.services.internetBanking}
                      onChange={handleChange}
                      className="h-4 w-4 text-bank-teal rounded"
                    />
                    <label htmlFor="internetBanking" className="ml-2 text-sm text-gray-700">
                      Internet Banking
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="mobileBanking"
                      name="mobileBanking"
                      type="checkbox"
                      checked={formData.services.mobileBanking}
                      onChange={handleChange}
                      className="h-4 w-4 text-bank-teal rounded"
                    />
                    <label htmlFor="mobileBanking" className="ml-2 text-sm text-gray-700">
                      Mobile Banking
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="emailAlerts"
                      name="emailAlerts"
                      type="checkbox"
                      checked={formData.services.emailAlerts}
                      onChange={handleChange}
                      className="h-4 w-4 text-bank-teal rounded"
                    />
                    <label htmlFor="emailAlerts" className="ml-2 text-sm text-gray-700">
                      Email Alerts
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="chequeBook"
                      name="chequeBook"
                      type="checkbox"
                      checked={formData.services.chequeBook}
                      onChange={handleChange}
                      className="h-4 w-4 text-bank-teal rounded"
                    />
                    <label htmlFor="chequeBook" className="ml-2 text-sm text-gray-700">
                      Cheque Book
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="eStatement"
                      name="eStatement"
                      type="checkbox"
                      checked={formData.services.eStatement}
                      onChange={handleChange}
                      className="h-4 w-4 text-bank-teal rounded"
                    />
                    <label htmlFor="eStatement" className="ml-2 text-sm text-gray-700">
                      E-Statement
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-8 flex justify-between">
            {currentPage > 1 && (
              <button
                type="button"
                onClick={() => setCurrentPage(currentPage - 1)}
                className="bg-gray-200 text-gray-800 py-2 px-6 rounded-md hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
            )}
            
            {currentPage < 3 ? (
              <button
                type="submit"
                className="bg-black text-white py-2 px-6 rounded-md hover:bg-gray-800 transition-colors ml-auto"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 transition-colors ml-auto"
              >
                Submit
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
