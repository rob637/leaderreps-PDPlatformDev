// src/components/ui/FormField.jsx
// Standardized Form Field Layout Component
// Use this for all form inputs with labels, errors, and help text

import React from 'react';
import { cn } from '../../lib/utils';
import { AlertCircle, HelpCircle } from 'lucide-react';

/**
 * FormField - Standardized form field wrapper with label, error, and help text
 * 
 * @example Basic usage
 * <FormField label="Email" required>
 *   <Input type="email" placeholder="you@example.com" />
 * </FormField>
 * 
 * @example With error
 * <FormField label="Password" error="Password must be at least 8 characters">
 *   <Input type="password" />
 * </FormField>
 * 
 * @example With help text
 * <FormField label="Username" help="This will be your public display name">
 *   <Input />
 * </FormField>
 * 
 * @example Horizontal layout
 * <FormField label="Enable notifications" layout="horizontal">
 *   <Checkbox />
 * </FormField>
 */
const FormField = React.forwardRef(({
  // Core props
  label,
  children,
  className,
  
  // Validation
  error,
  required = false,
  
  // Help
  help,
  
  // Layout
  layout = 'vertical',
  labelWidth = 'w-32',
  
  // Accessibility
  htmlFor,
  
  ...props
}, ref) => {
  
  const isHorizontal = layout === 'horizontal';
  
  return (
    <div
      ref={ref}
      className={cn(
        'w-full',
        isHorizontal ? 'flex items-center gap-4' : 'space-y-1.5',
        className
      )}
      {...props}
    >
      {/* Label */}
      {label && (
        <label
          htmlFor={htmlFor}
          className={cn(
            'block text-sm font-medium text-corporate-navy',
            isHorizontal && labelWidth,
            isHorizontal && 'flex-shrink-0'
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      
      {/* Input Container */}
      <div className={cn(isHorizontal && 'flex-1')}>
        {/* Input (children) */}
        <div className={cn(error && '[&>input]:border-red-500 [&>textarea]:border-red-500 [&>select]:border-red-500')}>
          {children}
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-1.5 mt-1.5 text-red-600">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="text-xs font-medium">{error}</span>
          </div>
        )}
        
        {/* Help Text */}
        {help && !error && (
          <div className="flex items-center gap-1.5 mt-1.5 text-slate-500 dark:text-slate-400">
            <HelpCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="text-xs">{help}</span>
          </div>
        )}
      </div>
    </div>
  );
});

FormField.displayName = 'FormField';

/**
 * FormSection - Group related form fields with a title
 * 
 * @example
 * <FormSection title="Personal Information" description="Your basic profile details">
 *   <FormField label="Name"><Input /></FormField>
 *   <FormField label="Email"><Input type="email" /></FormField>
 * </FormSection>
 */
const FormSection = React.forwardRef(({
  title,
  description,
  children,
  className,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn('space-y-4', className)}
      {...props}
    >
      {(title || description) && (
        <div className="pb-2 border-b border-slate-200 dark:border-slate-700">
          {title && (
            <h3 className="text-lg font-bold text-corporate-navy">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
});

FormSection.displayName = 'FormSection';

/**
 * FormActions - Container for form buttons (submit, cancel, etc.)
 * 
 * @example
 * <FormActions>
 *   <Button variant="outline" onClick={onCancel}>Cancel</Button>
 *   <Button type="submit">Save Changes</Button>
 * </FormActions>
 */
const FormActions = React.forwardRef(({
  children,
  align = 'right',
  className,
  ...props
}, ref) => {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-700 mt-6',
        alignClasses[align] || alignClasses.right,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

FormActions.displayName = 'FormActions';

export { FormField, FormSection, FormActions };
