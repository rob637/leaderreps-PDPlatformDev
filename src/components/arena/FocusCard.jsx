import React from 'react';

const FocusCard = ({ block = 1, focus = "Feedback" }) => {
  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-xl font-bold text-corporate-navy font-serif">
          Training Revolution: <span className="font-normal">Foundation</span>
        </h3>
        <div className="text-xl font-bold text-corporate-navy font-serif">
          Block: {block}
        </div>
      </div>
      
      <div className="flex items-baseline gap-2">
        <h3 className="text-xl font-bold text-corporate-navy font-serif">Focus:</h3>
        <div className="text-xl text-corporate-navy font-serif">
          {focus}
        </div>
      </div>
    </div>
  );
};

export default FocusCard;
