import React from 'react';
import { Users, MessageCircle } from 'lucide-react';

const MastermindGroups = () => (
  <div className="p-8 max-w-6xl mx-auto">
    <header className="mb-8">
      <h1 className="text-3xl font-bold text-corporate-navy">Peer Mastermind Groups</h1>
      <p className="text-slate-500">Connect with your accountability squad.</p>
    </header>
    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-8 text-center">
      <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <Users className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-corporate-navy mb-2">Find Your Squad</h2>
      <p className="text-slate-600 max-w-lg mx-auto mb-6">
        We match you with 4-5 other leaders at your level for monthly accountability calls and private chat.
      </p>
      <button className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">
        Join Waitlist
      </button>
    </div>
  </div>
);
export default MastermindGroups;
