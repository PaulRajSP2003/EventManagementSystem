import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api/AuthAPI';

// --- Reusable Floating Label Component ---
const FloatingInput = ({
  id,
  label,
  type,
  value,
  onChange,
  isLoading,
  autoComplete = "off"
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
  autoComplete?: string;
}) => {
  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        disabled={isLoading}
        autoComplete={autoComplete}
        placeholder=" " // Required for the peer-placeholder-shown trick
        className="block px-4 pb-2.5 pt-6 w-full text-gray-900 bg-white rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer transition-all"
      />
      <label
        htmlFor={id}
        className="absolute text-gray-500 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] start-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 peer-focus:text-blue-600 cursor-text"
      >
        {label}
      </label>
    </div>
  );
};

// --- Main Page Component ---
export default function OwnerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { isAuthenticated, login, validateAndSetAuth } = useAuth();

  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated) {
        navigate('/owner/dashboard', { replace: true });
      } else {
        const isValid = await validateAndSetAuth();
        if (isValid) {
          navigate('/owner/dashboard', { replace: true });
        }
      }
    };
    checkAuth();
  }, [isAuthenticated, navigate, validateAndSetAuth]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!email || !password) {
        throw new Error('Please enter both email and password');
      }

      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      const response = await authAPI.login({ email, password });
      const isValid = await authAPI.validateToken();

      if (isValid) {
        login(response.email, response.ownerId, response.role);
        setSuccess('Login successful! Redirecting...');
        setTimeout(() => {
          navigate('/owner/dashboard', { replace: true });
        }, 500);
      } else {
        throw new Error('Token validation failed after login');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Owner Login</h1>
            <p className="text-gray-500">Access your event management panel</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm rounded">
              {success}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <FloatingInput
              id="email"
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              isLoading={isLoading}
            />

            <FloatingInput
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              isLoading={isLoading}
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all disabled:bg-blue-400 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center uppercase tracking-widest">
              Secure Access
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}