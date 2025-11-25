import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Heading Component
 * Standardized heading with corporate styling
 * 
 * @param {string} level - h1, h2, h3, h4, h5, h6 (default: h2)
 * @param {string} variant - default, page, section, card (controls size)
 * @param {string} className - additional classes
 */
const Heading = React.forwardRef(({ 
  level = 'h2', 
  variant = 'default',
  className, 
  children, 
  ...props 
}, ref) => {
  const Component = level;
  
  const variants = {
    // Page title - largest
    page: 'text-2xl sm:text-3xl font-extrabold text-corporate-navy',
    // Section headers
    section: 'text-xl sm:text-2xl font-bold text-corporate-navy',
    // Card titles
    card: 'text-lg font-bold text-corporate-navy',
    // Default - standard heading
    default: 'font-bold text-corporate-navy',
    // Subtle - for secondary headings
    subtle: 'font-semibold text-slate-700',
  };

  return (
    <Component
      ref={ref}
      className={cn(variants[variant], className)}
      {...props}
    >
      {children}
    </Component>
  );
});
Heading.displayName = 'Heading';

/**
 * Text Component
 * Standardized text with consistent styling
 * 
 * @param {string} variant - default, muted, lead, small, label
 * @param {string} as - HTML element (default: p)
 * @param {string} className - additional classes
 */
const Text = React.forwardRef(({ 
  variant = 'default',
  as: Component = 'p',
  className, 
  children, 
  ...props 
}, ref) => {
  const variants = {
    // Default body text
    default: 'text-slate-700',
    // Muted/subtle text
    muted: 'text-slate-500',
    // Lead paragraph - larger intro text
    lead: 'text-lg text-slate-600',
    // Small text - captions, footnotes
    small: 'text-sm text-slate-500',
    // Label text - form labels, badges
    label: 'text-sm font-semibold text-slate-700',
    // Error text
    error: 'text-sm text-red-600',
    // Success text
    success: 'text-sm text-green-600',
    // Teal accent text
    accent: 'text-corporate-teal',
    // Orange accent text
    highlight: 'text-corporate-orange font-semibold',
  };

  return (
    <Component
      ref={ref}
      className={cn(variants[variant], className)}
      {...props}
    >
      {children}
    </Component>
  );
});
Text.displayName = 'Text';

/**
 * PageHeader Component
 * Standardized page header with title and optional description
 */
const PageHeader = React.forwardRef(({ 
  title, 
  description,
  className, 
  children,
  ...props 
}, ref) => {
  return (
    <header ref={ref} className={cn("mb-8", className)} {...props}>
      <Heading level="h1" variant="page">{title}</Heading>
      {description && (
        <Text variant="muted" className="mt-1">{description}</Text>
      )}
      {children}
    </header>
  );
});
PageHeader.displayName = 'PageHeader';

export { Heading, Text, PageHeader };
