import React from 'react';
import { FaSearch, FaCog, FaBell, FaUserCircle } from 'react-icons/fa';

const Header = ({ title, showSearch = true }) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <p className="text-sm text-gray-600">{currentDate}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {showSearch && (
            <div className="relative">
              <input
                type="text"
                placeholder="Type here to search..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          )}
          
          <button className="p-2 hover:bg-gray-100 rounded-lg relative">
            <FaBell className="text-gray-600 text-lg" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <FaCog className="text-gray-600 text-lg" />
          </button>
          
          <div className="flex items-center space-x-3">
            <FaUserCircle className="text-gray-600 text-2xl" />
            <div>
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-6">
          <span>ENG</span>
          <span>26°C</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span>{new Date().toLocaleDateString('en-GB').split('/').join('-')}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;