import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search, Clock } from 'lucide-react';

const PageNotFoundCompound = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.length > 1 && document.referrer.includes(window.location.origin)) {
      navigate(-1);
    } else {
      navigate('/user/dashboard', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative mb-8"
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-100 rounded-full opacity-20 blur-3xl"></div>
          </div>

          <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-8 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-transparent to-purple-50 opacity-50" />

            <div className="relative z-10">
              <div className="flex items-center justify-center gap-4 mb-6">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center shadow-sm"
                >
                  <Search className="w-8 h-8 text-indigo-600" />
                </motion.div>
              </div>

              <h1 className="text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-4">
                404
              </h1>

              <h2 className="text-3xl font-bold text-slate-800 mb-3">
                Page Not Found
              </h2>

              <p className="text-lg text-slate-600 mb-2">
                Oops! Looks like you've wandered into uncharted territory.
              </p>

              <div className="flex items-center justify-center gap-2 text-slate-500 bg-slate-50 p-3 rounded-xl max-w-md mx-auto">
                <Clock className="w-4 h-4 text-indigo-500" />
                <p className="text-sm">
                  The page you're looking for doesn't exist or has been moved.
                </p>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
        >
          <Link
            to="/user/dashboard"
            className="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <Home className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span>Return Home</span>
          </Link>

          <button
            onClick={handleGoBack}
            className="group flex items-center gap-3 px-6 py-3 bg-white border border-indigo-200 text-indigo-700 rounded-xl font-medium hover:bg-indigo-50 transition-all duration-300 shadow-sm hover:shadow transform hover:-translate-y-1"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Go Back</span>
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-sm text-slate-400"
        >
          If the back button doesn't work, just click "Return Home" to get back on track.
        </motion.p>
      </div>
    </div>
  );
};

export default PageNotFoundCompound;
