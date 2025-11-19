import React, { useState } from 'react';
import { ToggleLeft, ToggleRight, FlaskConical } from 'lucide-react';

const FeatureManager = () => {
  const [features, setFeatures] = useState([
    { id: 'daily-reps', name: 'Daily Reps Module', enabled: false, description: 'Track daily leadership repetitions.' },
    { id: 'upcoming-events', name: 'Upcoming Events', enabled: false, description: 'Calendar integration for coaching sessions.' },
    { id: 'community-v2', name: 'Community V2', enabled: false, description: 'Enhanced forum with rich text and media.' },
    { id: 'ai-coach', name: 'AI Coach Assistant', enabled: true, description: 'Beta version of the AI coaching bot.' },
  ]);

  const toggleFeature = (id) => {
    setFeatures(prev => prev.map(f => 
      f.id === id ? { ...f, enabled: !f.enabled } : f
    ));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-corporate-navy font-serif">Feature Lab</h2>
          <p className="text-gray-500 text-sm">Toggle experimental features and modules.</p>
        </div>
        <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
          <FlaskConical className="w-6 h-6" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {features.map((feature) => (
          <div key={feature.id} className="flex items-center justify-between p-6 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-corporate-navy text-lg">{feature.name}</h3>
                {feature.enabled ? (
                  <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded-full uppercase">Active</span>
                ) : (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-full uppercase">Disabled</span>
                )}
              </div>
              <p className="text-gray-500 mt-1">{feature.description}</p>
            </div>
            
            <button 
              onClick={() => toggleFeature(feature.id)}
              className={`
                transition-colors duration-200
                ${feature.enabled ? 'text-corporate-teal' : 'text-gray-300 hover:text-gray-400'}
              `}
            >
              {feature.enabled ? (
                <ToggleRight className="w-10 h-10" />
              ) : (
                <ToggleLeft className="w-10 h-10" />
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm text-yellow-800">
        <strong>Note:</strong> Feature toggles currently only affect your local session in this demo. To persist these globally, we need to connect this to a Firestore 'config' collection.
      </div>
    </div>
  );
};

export default FeatureManager;
