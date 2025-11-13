// src/components/system/ConfigError.jsx

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { CORPORATE_COLORS } from '../../styles/corporate-colors';

function ConfigError({ message }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: CORPORATE_COLORS['corporate-light-gray'] }}
    >
      <div className="p-6 max-w-xl mx-auto bg-red-50 border border-red-200 rounded-xl text-red-700 shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <h3 className="font-bold text-lg">Configuration Error</h3>
        </div>
        <p className="text-sm">
          {message || 'An unknown initialization error occurred.'}
        </p>
      </div>
    </div>
  );
}

export default ConfigError;
