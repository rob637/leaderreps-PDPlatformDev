import { useState } from 'react';
import { motion } from 'framer-motion';

const EmailCapture = ({ onSubmit, isLoading }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!email || !email.includes('@')) return;
    onSubmit(email.trim());
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6"
      >
        <h2 className="text-xl font-bold text-[#002E47]">Email capture</h2>
        <p className="text-sm text-slate-600 mt-1">
          This component is retained for compatibility and not used in the current flow.
        </p>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Work email"
          className="w-full mt-4 rounded-xl border border-slate-300 px-3 py-2"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-3 rounded-xl px-4 py-2 bg-[#B84825] text-white"
        >
          {isLoading ? 'Sending...' : 'Submit'}
        </button>
      </form>
    </motion.div>
  );
};

export default EmailCapture;
