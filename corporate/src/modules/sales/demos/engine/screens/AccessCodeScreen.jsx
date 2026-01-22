import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowRight } from 'lucide-react';
import { validateAccessCode } from '../config/accessCode';

const AccessCodeScreen = ({ onAccessGranted }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    if (validateAccessCode(code)) {
      onAccessGranted();
    } else {
      setError('Invalid access code. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-500 via-navy-600 to-teal-600 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md">
        
        <div className="text-center mb-8">
          <motion.img src="/logo-full.png" alt="LeaderReps"
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="h-14 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white mb-2">Product Demo</h1>
          <p className="text-white/80">Experience the leadership development platform</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-navy-100 rounded-lg">
              <Lock className="w-5 h-5 text-navy-600" />
            </div>
            <div>
              <h2 className="font-semibold text-navy-500">Enter Access Code</h2>
              <p className="text-sm text-gray-500">Contact us to get your demo code</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input type="text" value={code} onChange={(e) => setCode(e.target.value)}
                placeholder="Enter your access code"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-center text-lg font-medium tracking-wider"
                autoFocus />
            </div>

            {error && (
              <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-sm text-center">
                {error}
              </motion.p>
            )}

            <button type="submit" disabled={!code || isLoading}
              className="w-full bg-teal-500 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Start Demo</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </motion.div>

        <p className="text-center text-white/60 text-sm mt-6">
          Need an access code? Contact us at info@leaderreps.com
        </p>
      </motion.div>
    </div>
  );
};

export default AccessCodeScreen;
