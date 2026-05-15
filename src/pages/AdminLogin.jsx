import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock,FaEye,FaEyeSlash } from 'react-icons/fa';
import ApiService from '../components/ApiService';
import { saveUserData } from '../data/localStorage';
import { useAuth } from '../contest/AuthContest';

const AdminLogin = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const {fetchUserData}=useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.clear();
  }, [])
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const loginPayload = {
      email,
      password
    }
    try {
      const response = await ApiService.post('/auth/login', loginPayload, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
      });

      if (!response) {
        throw new Error(response.message || 'Login failed');
      }

      // ✅ Store token & user in localStorage
      await saveUserData(response.user, response.token)
const userID=response.user.id;
console.log("userID:::",userID);
      fetchUserData(userID);
    } catch (err) {
      setError(err.data.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src="/images/image1.jpg"
          alt="Login Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-blue-900/40 flex items-center justify-center p-12">
          <div className="text-white text-center max-w-xl">
            <h1 className="text-5xl font-bold mb-6">InventoryPro</h1>
            <p className="text-xl mb-8 opacity-90">
              Streamline your inventory management with our powerful dashboard
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaUser className="text-white text-2xl" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Sign in to access your inventory system
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Email */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                   name="password"
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter password"
                  required
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* <div className="mt-6 text-center text-sm text-gray-600">
            <p className="font-medium">
              superadmin@gmail.com / Admin@123
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
