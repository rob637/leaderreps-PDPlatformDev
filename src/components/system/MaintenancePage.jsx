// src/components/system/MaintenancePage.jsx
import React from 'react';
import { Wrench, Clock, Mail } from 'lucide-react';

/**
 * Maintenance mode page shown when the app is under maintenance.
 * Only bypassed for allowed admin emails.
 */
export default function MaintenancePage({ message }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-corporate-navy via-slate-800 to-corporate-navy flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="mb-8">
          <img 
            src="/images/lr_logo_teal__1_.png" 
            alt="LeaderReps" 
            className="h-16 mx-auto mb-4"
          />
        </div>
        
        {/* Icon */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-corporate-teal/20 mb-4">
            <Wrench className="w-10 h-10 text-corporate-teal animate-pulse" />
          </div>
        </div>
        
        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-4">
          Under Maintenance
        </h1>
        
        {/* Message */}
        <p className="text-slate-300 text-lg mb-6">
          {message || "We're performing scheduled maintenance to improve your experience. We'll be back shortly!"}
        </p>
        
        {/* Status indicator */}
        <div className="flex items-center justify-center gap-2 text-corporate-teal mb-8">
          <Clock className="w-5 h-5" />
          <span className="text-sm font-medium">Estimated downtime: Brief</span>
        </div>
        
        {/* Contact info */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-slate-400 text-sm mb-2">Need immediate assistance?</p>
          <a 
            href="mailto:support@leaderreps.com" 
            className="inline-flex items-center gap-2 text-corporate-teal hover:text-corporate-teal/80 transition-colors"
          >
            <Mail className="w-4 h-4" />
            support@leaderreps.com
          </a>
        </div>
        
        {/* Footer */}
        <p className="text-slate-500 text-xs mt-8">
          Thank you for your patience.
        </p>
      </div>
    </div>
  );
}
