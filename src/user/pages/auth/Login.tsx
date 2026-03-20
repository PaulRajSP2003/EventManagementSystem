// D:\Project\campmanagementsystem\src\user\pages\auth\Login.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useUserAuth } from './UserAuthContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, loginError: authError } = useUserAuth();
  const { eventId } = useParams<{ eventId: string }>();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({
    eventId: '',
    email: '',
    password: ''
  });

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/user/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (eventId && eventId !== credentials.eventId) {
      setCredentials(prev => ({ ...prev, eventId: eventId }));
    }
  }, [eventId, credentials.eventId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!credentials.eventId || !credentials.email || !credentials.password) {
        throw new Error('All fields are required');
      }

      const eventIdNum = parseInt(credentials.eventId, 10);
      if (isNaN(eventIdNum) || eventIdNum <= 0) {
        throw new Error('Invalid Event ID');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(credentials.email)) {
        throw new Error('Invalid email format');
      }

      const success = await login({
        eventId: eventIdNum,
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
        deviceInfo: navigator.userAgent
      });

      if (!success) {
        throw new Error(authError || 'Login failed');
      }

      // Navigate will happen automatically when isAuthenticated becomes true

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(errorMessage);
      setCredentials(prev => ({ ...prev, password: '' }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* Left Pane - Branding Section */}
      <div className="hidden md:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 items-center justify-center p-6 md:p-8 lg:p-12 text-white flex-col relative overflow-hidden min-h-[300px] md:min-h-screen">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-1/4 left-1/4 w-32 md:w-48 lg:w-64 h-32 md:h-48 lg:h-64 bg-white rounded-full blur-2xl md:blur-3xl"></div>
          <div className="absolute bottom-1/3 right-1/4 w-48 md:w-72 lg:w-96 h-48 md:h-72 lg:h-96 bg-white rounded-full blur-2xl md:blur-3xl"></div>
          <div className="absolute top-1/3 right-1/3 w-32 md:w-40 lg:w-48 h-32 md:h-40 lg:h-48 bg-white rounded-full blur-2xl md:blur-3xl"></div>
        </div>

        <div className="relative z-10 text-center max-w-xl lg:max-w-2xl">
          <div className="mb-6 md:mb-8 lg:mb-12">
            <div className="w-16 h-16 md:w-20 md:h-20 lg:w-28 lg:h-28 bg-white/20 backdrop-blur-lg rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-4 md:mb-6 lg:mb-8 shadow-xl md:shadow-2xl border border-white/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-10 md:w-10 lg:h-14 lg:w-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-6xl font-black mb-2 md:mb-3 lg:mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">
              EMS
            </h1>
            <p className="text-sm md:text-base lg:text-xl text-indigo-100 max-w-md mx-auto leading-relaxed px-4">
              Your all-in-one solution for managing camp activities, staff, and attendees efficiently.
            </p>
          </div>
        </div>
      </div>

      {/* Right Pane - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-gradient-to-br from-indigo-50 to-purple-50 min-h-screen">
        <div className="w-full max-w-sm sm:max-w-md space-y-4 sm:space-y-6 md:space-y-8 bg-white/80 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl p-6 sm:p-8 md:p-10 border border-white/50">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 md:mb-6 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Welcome Back</h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-600">Sign in to your account to continue</p>
          </div>

          <form className="mt-4 sm:mt-6 md:mt-8 space-y-4 sm:space-y-5 md:space-y-6" onSubmit={handleLogin}>
            {error && (
              <div id="login-error" className="bg-red-50 border-l-4 border-red-500 rounded-lg p-3 sm:p-4 flex items-start gap-2 sm:gap-3" role="alert">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-red-800">Login Failed</h3>
                  <p className="text-xs sm:text-sm text-red-600 mt-1">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-3 sm:space-y-4 md:space-y-5">
              <div>
                <label htmlFor="eventId" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                  Event ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <input
                    id="eventId"
                    name="eventId"
                    type="text"
                    required
                    value={credentials.eventId}
                    onChange={handleInputChange}
                    className="appearance-none block w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-3 text-sm sm:text-base border rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/50 border-gray-200"
                    placeholder="Enter event ID"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={credentials.email}
                    onChange={handleInputChange}
                    className="appearance-none block w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-3 text-sm sm:text-base border rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/50 border-gray-200"
                    placeholder="Enter your email"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={credentials.password}
                    onChange={handleInputChange}
                    className="appearance-none block w-full pl-9 sm:pl-10 pr-12 py-2 sm:py-3 text-sm sm:text-base border rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/50 border-gray-200"
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <FiEyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <FiEye className="h-4 w-4 sm:h-5 sm:w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2.5 sm:py-3.5 px-4 border border-transparent text-sm sm:text-base font-bold rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  "Sign In"
                )}
              </button>
            </div>

            <div className="w-full text-center pt-3 sm:pt-4 border-t border-gray-100">
              <p className="text-xs sm:text-sm text-gray-600">
                <span className="font-semibold">Don't have an account?</span>
                <br />
                Contact your admin to get access.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;