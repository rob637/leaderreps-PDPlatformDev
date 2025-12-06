import React from 'react';

export const DashboardCard = ({ title, description, icon: Icon, onClick, color, bgColor }) => {
  return (
    <button
      onClick={onClick}
      className="w-full text-left transition-all duration-300 rounded-2xl border p-6 h-full flex flex-col group
        bg-white hover:shadow-xl hover:-translate-y-1 cursor-pointer border-slate-200 hover:border-corporate-teal/50"
    >
      <div className="text-center mb-4 w-full">
        <div
          className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors
            ${bgColor || 'bg-corporate-teal/10'} ${color || 'text-corporate-teal'} group-hover:bg-opacity-80`}
        >
          <Icon className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold mb-3 text-corporate-navy">
          {title}
        </h3>
      </div>
      <div className="flex-1 flex flex-col w-full">
        <p className="text-slate-600 text-center mb-4 flex-1">
          {description}
        </p>
      </div>
    </button>
  );
};

export default DashboardCard;
