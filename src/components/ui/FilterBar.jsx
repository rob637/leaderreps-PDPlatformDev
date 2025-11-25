// src/components/ui/FilterBar.jsx
// Standardized Filter Bar Component
// Use this for all search/filter interfaces

import React from 'react';
import { cn } from '../../lib/utils';
import { Search, X, Filter, ChevronDown } from 'lucide-react';

/**
 * FilterBar - Standardized search and filter container
 * 
 * @example Basic usage with search
 * <FilterBar>
 *   <FilterSearch 
 *     value={search} 
 *     onChange={setSearch} 
 *     placeholder="Search items..." 
 *   />
 * </FilterBar>
 * 
 * @example With multiple filters
 * <FilterBar>
 *   <FilterSearch value={search} onChange={setSearch} />
 *   <FilterSelect 
 *     value={category} 
 *     onChange={setCategory}
 *     options={[
 *       { value: 'all', label: 'All Categories' },
 *       { value: 'active', label: 'Active' }
 *     ]}
 *   />
 *   <FilterChips 
 *     options={tags} 
 *     selected={selectedTags} 
 *     onChange={setSelectedTags} 
 *   />
 * </FilterBar>
 */
const FilterBar = React.forwardRef(({
  children,
  className,
  direction = 'row',
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex gap-3 flex-wrap items-center',
      direction === 'column' && 'flex-col items-stretch',
      className
    )}
    {...props}
  >
    {children}
  </div>
));

FilterBar.displayName = 'FilterBar';

/**
 * FilterSearch - Search input with icon
 */
const FilterSearch = React.forwardRef(({
  value,
  onChange,
  placeholder = 'Search...',
  className,
  onClear,
  ...props
}, ref) => (
  <div className={cn('relative flex-1 min-w-[200px] max-w-md', className)}>
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
    <input
      ref={ref}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        'w-full pl-10 pr-8 py-2 text-sm',
        'border border-slate-200 rounded-lg',
        'focus:outline-none focus:ring-2 focus:ring-corporate-teal/20 focus:border-corporate-teal',
        'placeholder:text-slate-400'
      )}
      {...props}
    />
    {value && (
      <button
        type="button"
        onClick={() => {
          onChange('');
          onClear?.();
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
      >
        <X className="w-4 h-4" />
      </button>
    )}
  </div>
));

FilterSearch.displayName = 'FilterSearch';

/**
 * FilterSelect - Dropdown filter
 */
const FilterSelect = React.forwardRef(({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  label,
  icon: Icon,
  className,
  ...props
}, ref) => (
  <div className={cn('relative', className)}>
    {label && (
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
    )}
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      )}
      <select
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'appearance-none py-2 pr-8 text-sm',
          Icon ? 'pl-10' : 'pl-3',
          'border border-slate-200 rounded-lg bg-white',
          'focus:outline-none focus:ring-2 focus:ring-corporate-teal/20 focus:border-corporate-teal',
          'cursor-pointer'
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>
  </div>
));

FilterSelect.displayName = 'FilterSelect';

/**
 * FilterChips - Chip-based filter selection
 */
const FilterChips = React.forwardRef(({
  options = [],
  selected = [],
  onChange,
  multiple = true,
  label,
  className,
  ...props
}, ref) => {
  const handleClick = (value) => {
    if (multiple) {
      const newSelected = selected.includes(value)
        ? selected.filter(v => v !== value)
        : [...selected, value];
      onChange(newSelected);
    } else {
      onChange(selected.includes(value) ? [] : [value]);
    }
  };

  return (
    <div ref={ref} className={cn('flex flex-col gap-2', className)} {...props}>
      {label && (
        <span className="text-xs font-medium text-slate-500">{label}</span>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleClick(opt.value)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-full transition-all',
                isSelected
                  ? 'bg-corporate-teal text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {opt.label}
              {opt.count !== undefined && (
                <span className={cn(
                  'ml-1.5 text-xs',
                  isSelected ? 'text-white/70' : 'text-slate-400'
                )}>
                  ({opt.count})
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});

FilterChips.displayName = 'FilterChips';

/**
 * FilterToggle - Toggle button group filter
 */
const FilterToggle = React.forwardRef(({
  options = [],
  value,
  onChange,
  className,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn(
      'inline-flex rounded-lg bg-slate-100 p-1',
      className
    )}
    {...props}
  >
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        className={cn(
          'px-4 py-1.5 text-sm font-medium rounded-md transition-all',
          value === opt.value
            ? 'bg-white text-corporate-navy shadow-sm'
            : 'text-slate-600 hover:text-corporate-navy'
        )}
      >
        {opt.icon && <opt.icon className="w-4 h-4 mr-1.5 inline" />}
        {opt.label}
      </button>
    ))}
  </div>
));

FilterToggle.displayName = 'FilterToggle';

/**
 * ActiveFilters - Display and clear active filters
 */
const ActiveFilters = React.forwardRef(({
  filters = [],
  onRemove,
  onClearAll,
  className,
  ...props
}, ref) => {
  if (filters.length === 0) return null;

  return (
    <div
      ref={ref}
      className={cn('flex items-center gap-2 flex-wrap', className)}
      {...props}
    >
      <Filter className="w-4 h-4 text-slate-400" />
      {filters.map((filter, index) => (
        <span
          key={index}
          className="inline-flex items-center gap-1 px-2 py-1 bg-corporate-teal/10 text-corporate-teal text-sm rounded-md"
        >
          {filter.label}: {filter.value}
          <button
            type="button"
            onClick={() => onRemove(filter)}
            className="ml-1 hover:text-corporate-navy"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      {filters.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-sm text-slate-500 hover:text-corporate-navy"
        >
          Clear all
        </button>
      )}
    </div>
  );
});

ActiveFilters.displayName = 'ActiveFilters';

export { 
  FilterBar, 
  FilterSearch, 
  FilterSelect, 
  FilterChips, 
  FilterToggle,
  ActiveFilters 
};
