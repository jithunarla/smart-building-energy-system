
import React from 'react';

interface BankLogoProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

const BankLogo: React.FC<BankLogoProps> = ({ className = '', size = 'medium' }) => {
  const dimensions = {
    small: 'h-6 w-6',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`relative ${dimensions[size]}`}>
        <div className="absolute inset-0 bg-blue-600 rounded-md transform rotate-45"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-1/2 w-3/4 bg-yellow-500 rounded-sm"></div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1/5 bg-yellow-500 rounded-b-sm"></div>
      </div>
      <span className="ml-2 font-bold text-xl text-gray-900">SafeBank</span>
    </div>
  );
};

export default BankLogo;
