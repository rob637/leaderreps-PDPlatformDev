import React from 'react';
import { Shield, Target, Users, Lock, ArrowRight } from 'lucide-react';
import { Card } from '../ui';

const PrepWelcomeBanner = () => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-corporate-navy via-[#002E47] to-corporate-teal shadow-xl mb-6">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-corporate-teal rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
      </div>

      <div className="relative p-6 sm:p-8">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          
          {/* Left Content */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 text-corporate-teal font-bold tracking-wider text-xs uppercase">
              <Shield className="w-4 h-4" />
              <span>Welcome to The Arena</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-heading leading-tight">
              Your Journey Begins Now, Leader.
            </h2>
            
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
              You have been selected for a Cohort of high-performing peers. Before Day 1, you have critical preparation to complete. 
              Access to The Arena is earned—as you progress, new zones and capabilities will unlock.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                <Target className="w-4 h-4 text-corporate-teal" />
                <span className="text-xs font-medium text-white">Complete Pre-Work</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                <Users className="w-4 h-4 text-corporate-teal" />
                <span className="text-xs font-medium text-white">Join Your Cohort</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                <Lock className="w-4 h-4 text-corporate-teal" />
                <span className="text-xs font-medium text-white">Unlock Day 1</span>
              </div>
            </div>
          </div>

          {/* Right Action (Visual Only for now) */}
          <div className="hidden md:block">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-corporate-teal to-emerald-600 flex items-center justify-center shadow-lg shadow-corporate-teal/20 animate-pulse-slow">
              <ArrowRight className="w-8 h-8 text-white" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PrepWelcomeBanner;
