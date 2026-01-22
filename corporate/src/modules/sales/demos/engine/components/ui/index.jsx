import React from 'react';

// Card Component
export const Card = ({ children, className = '', onClick, ...props }) => (
  <div 
    className={`bg-white rounded-xl shadow-sm border border-gray-100 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
    onClick={onClick}
    {...props}
  >
    {children}
  </div>
);

// Button Component
export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '', 
  ...props 
}) => {
  const variants = {
    primary: 'bg-navy-500 hover:bg-navy-600 text-white',
    secondary: 'bg-teal-500 hover:bg-teal-600 text-white',
    accent: 'bg-orange-500 hover:bg-orange-600 text-white',
    outline: 'border-2 border-navy-500 text-navy-500 hover:bg-navy-50',
    ghost: 'text-navy-500 hover:bg-navy-50',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button 
      className={`font-medium rounded-lg transition-colors ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Progress Bar Component
export const ProgressBar = ({ value, max = 100, className = '', color = 'teal' }) => {
  const percentage = Math.min((value / max) * 100, 100);
  const colors = {
    teal: 'bg-teal-500',
    navy: 'bg-navy-500',
    orange: 'bg-orange-500',
  };
  
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <div 
        className={`h-2 rounded-full transition-all duration-500 ${colors[color]}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

// Badge Component
export const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-teal-100 text-teal-700',
    warning: 'bg-orange-100 text-orange-700',
    info: 'bg-navy-100 text-navy-700',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Avatar Component
export const Avatar = ({ src, name, size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-xl',
    xl: 'w-20 h-20 text-2xl',
  };

  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  if (src) {
    return <img src={src} alt={name} className={`rounded-full object-cover ${sizes[size]} ${className}`} />;
  }

  return (
    <div className={`rounded-full bg-teal-500 text-white flex items-center justify-center font-semibold ${sizes[size]} ${className}`}>
      {initials}
    </div>
  );
};

// Section Header
export const SectionHeader = ({ title, subtitle, icon, action }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-3">
      {icon && <span className="text-2xl">{icon}</span>}
      <div>
        <h2 className="text-xl font-semibold text-navy-500">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

// Stat Card
export const StatCard = ({ icon, value, label, color = 'teal' }) => {
  const colors = {
    teal: 'bg-teal-50 text-teal-600',
    navy: 'bg-navy-50 text-navy-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </div>
    </Card>
  );
};

// Pillar Card for 3 Pillars
export const PillarCard = ({ icon, title, description, color, items }) => {
  const colors = {
    teal: 'from-teal-500 to-teal-600 border-teal-200',
    navy: 'from-navy-500 to-navy-600 border-navy-200',
    orange: 'from-orange-500 to-orange-600 border-orange-200',
  };

  return (
    <Card className={`p-6 border-t-4 ${colors[color].split(' ')[2]}`}>
      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colors[color].split(' ').slice(0, 2).join(' ')} flex items-center justify-center text-white text-2xl mb-4`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-navy-500 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm mb-4">{description}</p>
      {items && (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              {item}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};
