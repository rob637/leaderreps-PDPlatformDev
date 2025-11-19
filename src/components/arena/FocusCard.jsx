import React from 'react';

const FocusCard = ({ block = 1, focus = "Feedback" }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-300 p-6 mb-6">
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Training Revolution: Foundation</h3>
          <div className="text-2xl font-bold text-corporate-navy font-serif mt-1">
            Block: {block}
          </div>
        </div>
        
        <div className="pt-4 border-t border-gray-100">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Focus</h3>
          <div className="text-2xl font-bold text-corporate-orange font-serif mt-1">
            {focus}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FocusCard;
