import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, User, Lock, Sparkles, ChevronRight, Loader2 } from 'lucide-react';
import { READINESS_DIMENSIONS } from '../data/questions';

const EmailCapture = ({ results, onSubmit, isLoading }) => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [error, setError] = useState('');

  const topDimension = results?.topDimensions?.[0];
  const topDimensionData = READINESS_DIMENSIONS[topDimension];
  
  // Display readiness level for teaser
  const readinessLevel = results?.readinessLevel || 'Developing';
  const overallScore = results?.overallScore || 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (!firstName.trim()) {
      setError('Please enter your first name');
      return;
    }
    
    setError('');
    onSubmit(email, firstName.trim());
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <div className="max-w-lg w-full">
        {/* Teaser card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-6 md:p-8 mb-6 text-center relative overflow-hidden"
        >
          {/* Background glow */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              background: `radial-gradient(circle at 50% 0%, ${topDimensionData?.color || '#47A88D'} 0%, transparent 70%)`,
            }}
          />
          
          <div className="relative">
            {/* Score circle */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-24 h-24 rounded-full mx-auto mb-4 flex flex-col items-center justify-center relative"
              style={{ backgroundColor: `${topDimensionData?.color || '#47A88D'}30` }}
            >
              <span className="text-3xl font-bold text-white">{overallScore}</span>
              <span className="text-xs text-white/60">/ 100</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl md:text-2xl font-bold text-white mb-2"
            >
              Your Readiness Level:
            </motion.h2>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="inline-block px-4 py-2 rounded-full text-white font-bold text-lg mb-4"
              style={{ backgroundColor: topDimensionData?.color || '#47A88D' }}
            >
              {readinessLevel}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="text-white/80 text-sm mb-4"
            >
              Top Strength: <span className="font-semibold">{topDimensionData?.name || 'Leadership'}</span> {topDimensionData?.icon}
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-white/60 text-sm"
            >
              Your complete Leadership Readiness Profile is ready...
            </motion.p>
          </div>
        </motion.div>

        {/* Email form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-3xl p-6 md:p-8"
        >
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal/20 text-teal text-sm mb-4">
              <Sparkles className="w-4 h-4" />
              <span>Unlock Your Full Results</span>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">
              Where should we send your results?
            </h3>
            <p className="text-white/60 text-sm">
              Get your personalized AI coaching insights, detailed breakdown, and actionable development strategies.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Work email"
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition"
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-sm text-center"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-4 bg-teal hover:bg-teal/90 text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Analyzing with AI...</span>
                </>
              ) : (
                <>
                  <span>Get My Full Results</span>
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 text-white/40 text-xs">
            <Lock className="w-3 h-3" />
            <span>We respect your privacy. No spam, ever.</span>
          </div>
        </motion.div>

        {/* What's included */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 grid grid-cols-3 gap-4 text-center"
        >
          {[
            { label: 'Full Profile', icon: '📊' },
            { label: 'AI Insights', icon: '🤖' },
            { label: 'Growth Plan', icon: '🚀' },
          ].map((item) => (
            <div key={item.label} className="glass rounded-xl p-3">
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="text-white/60 text-xs">{item.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default EmailCapture;
