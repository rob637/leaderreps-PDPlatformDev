// src/components/shared/StyledButton.jsx
// PERFORMANCE FIX: Button component without template literal CSS issues

import React from 'react';

const StyledButton = ({ children, onClick, disabled = false, variant = 'primary', className = '', ...rest }) => {
    // Use standard Tailwind classes - no template literals
    let variantClasses = '';
    
    if (variant === 'primary') {
        variantClasses = 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-500 text-white';
    } else if (variant === 'secondary') {
        variantClasses = 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500 text-white';
    } else if (variant === 'outline') {
        variantClasses = 'border-2 border-teal-600 text-teal-600 hover:bg-teal-600 hover:text-white focus:ring-teal-500 bg-gray-50';
    }
    
    const baseClasses = 'px-6 py-3 rounded-xl font-semibold transition-all shadow-xl focus:outline-none focus:ring-4 flex items-center justify-center';
    const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
    
    const finalClasses = `${baseClasses} ${variantClasses} ${disabledClasses} ${className}`.trim();

    return (
        <button 
            onClick={onClick} 
            disabled={disabled} 
            className={finalClasses}
            {...rest}
        >
            {children}
        </button>
    );
};

export default StyledButton;