import React from 'react';

const FocusCard = ({ block = 1, focus = "Feedback" }) => {
  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-baseline md:justify-between mb-2 gap-1">
        <h3 className="text-lg md:text-xl font-bold text-corporate-navy font-serif leading-tight">
          Training Revolution: <span className="font-normal block md:inline">Foundation</span>
        </h3>
        <div className="text-lg md:text-xl font-bold text-corporate-navy font-serif">
          Block: {block}
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-2">
        <h3 className="text-lg md:text-xl font-bold text-corporate-navy font-serif">Focus:</h3>
        <div className="text-lg md:text-xl text-corporate-navy font-serif">
          {focus}
        </div>
      </div>
    </div>
  );
};

export default FocusCard;
