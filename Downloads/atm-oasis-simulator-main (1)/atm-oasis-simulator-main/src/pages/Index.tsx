import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center text-center pt-12 pb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Bank Management System
          </h1>
          <p className="text-xl text-blue-200 mb-8 max-w-3xl">
            A complete ATM simulator with account management, transactions, and financial tools
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-md transition-all"
            >
              Login to ATM
            </button>
            <button 
              onClick={() => navigate('/signup')}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-8 rounded-md transition-all"
            >
              Create New Account
            </button>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-12">
          <h2 className="text-3xl font-bold text-center text-white mb-12">Key Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-3">Account Management</h3>
              <p className="text-blue-100">
                Create new accounts, view account details, and manage personal information securely.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-3">ATM Operations</h3>
              <p className="text-blue-100">
                Perform cash withdrawals, deposits, check balance, pin changes, and view mini statements.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-3">Financial Tools</h3>
              <p className="text-blue-100">
                Calculate interest on savings, visualize growth projections, and manage your finances.
              </p>
            </div>
          </div>
        </div>
        
        {/* Demo Instructions */}
        <div className="py-12">
          <h2 className="text-3xl font-bold text-center text-white mb-6">How to Use the Demo</h2>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 max-w-3xl mx-auto">
            <ol className="list-decimal pl-6 text-blue-100 space-y-4">
              <li>
                <span className="font-semibold">Create an Account</span>: Start by creating a new account through the signup process.
              </li>
              <li>
                <span className="font-semibold">Login to ATM</span>: Use your generated account number and PIN to access ATM features.
              </li>
              <li>
                <span className="font-semibold">Explore Features</span>: Try deposit, withdrawal, balance inquiry, and other ATM operations.
              </li>
              <li>
                <span className="font-semibold">Check Database</span>: Visit /database to see how your transactions are recorded.
              </li>
            </ol>
            
            <div className="mt-8 text-center">
              <button 
                onClick={() => navigate('/login')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-md transition-all"
              >
                Start Demo Now
              </button>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="border-t border-blue-800/50 mt-12 pt-8 text-center text-blue-300 text-sm">
          <p>Bank Management System & ATM Simulator © 2025</p>
          <p className="mt-2">For demonstration purposes only</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
