// src/components/ui/ListItem.jsx
// Standardized List Item Component
// Use this for all list displays

import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronRight, MoreVertical } from 'lucide-react';

/**
 * List - Container for list items
 * 
 * @example Basic usage
 * <List>
 *   <ListItem title="Item 1" description="Description" />
 *   <ListItem title="Item 2" description="Description" />
 * </List>
 * 
 * @example With dividers
 * <List divided>
 *   <ListItem title="Item 1" />
 *   <ListItem title="Item 2" />
 * </List>
 */
const List = React.forwardRef(({
  children,
  divided = false,
  className,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn(
      'space-y-1',
      divided && 'divide-y divide-slate-100 space-y-0',
      className
    )}
    {...props}
  >
    {children}
  </div>
));

List.displayName = 'List';

/**
 * ListItem - Individual list row
 * 
 * @example Basic
 * <ListItem title="Task Name" description="Due tomorrow" />
 * 
 * @example With icon and action
 * <ListItem 
 *   icon={CheckCircle}
 *   title="Completed Task"
 *   description="Finished 2 hours ago"
 *   onClick={() => viewTask(id)}
 *   trailing={<Badge>Done</Badge>}
 * />
 * 
 * @example With avatar
 * <ListItem 
 *   avatar={{ src: user.avatar, alt: user.name }}
 *   title={user.name}
 *   description={user.email}
 * />
 */
const ListItem = React.forwardRef(({
  // Content
  title,
  description,
  
  // Leading
  icon: Icon,
  iconColor = 'text-corporate-teal',
  avatar,
  leading,
  
  // Trailing
  trailing,
  showChevron = false,
  
  // Interaction
  onClick,
  selected = false,
  disabled = false,
  
  // Styling
  variant = 'default',
  compact = false,
  className,
  
  children,
  ...props
}, ref) => {
  const Component = onClick ? 'button' : 'div';
  
  const variants = {
    default: '',
    card: 'bg-white border border-slate-200 rounded-xl shadow-sm',
    ghost: '',
  };

  const padding = compact ? 'p-2' : 'p-3';

  return (
    <Component
      ref={ref}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-3 text-left transition-colors',
        padding,
        variants[variant],
        onClick && !disabled && 'cursor-pointer hover:bg-slate-50',
        selected && 'bg-corporate-teal/5 border-l-2 border-l-corporate-teal',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {/* Leading: Icon, Avatar, or custom */}
      {leading}
      {!leading && Icon && (
        <div className={cn(
          'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
          'bg-slate-100'
        )}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
      )}
      {!leading && avatar && (
        <div className="flex-shrink-0">
          {avatar.src ? (
            <img
              src={avatar.src}
              alt={avatar.alt || ''}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-corporate-teal/10 flex items-center justify-center">
              <span className="text-sm font-bold text-corporate-teal">
                {avatar.initials || avatar.alt?.charAt(0) || '?'}
              </span>
            </div>
          )}
        </div>
      )}
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <p className={cn(
            'font-medium text-corporate-navy truncate',
            compact ? 'text-sm' : 'text-base'
          )}>
            {title}
          </p>
        )}
        {description && (
          <p className={cn(
            'text-slate-500 truncate',
            compact ? 'text-xs' : 'text-sm'
          )}>
            {description}
          </p>
        )}
        {children}
      </div>
      
      {/* Trailing */}
      {trailing}
      {showChevron && (
        <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
      )}
    </Component>
  );
});

ListItem.displayName = 'ListItem';

/**
 * ListItemAction - Action button for list items
 */
const ListItemAction = React.forwardRef(({
  icon: Icon = MoreVertical,
  onClick,
  className,
  ...props
}, ref) => (
  <button
    ref={ref}
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onClick?.(e);
    }}
    className={cn(
      'p-1.5 rounded-lg text-slate-400 hover:text-corporate-navy hover:bg-slate-100 transition-colors',
      className
    )}
    {...props}
  >
    <Icon className="w-5 h-5" />
  </button>
));

ListItemAction.displayName = 'ListItemAction';

/**
 * ListSection - Group list items with a header
 */
const ListSection = React.forwardRef(({
  title,
  action,
  children,
  className,
  ...props
}, ref) => (
  <div ref={ref} className={cn('space-y-2', className)} {...props}>
    {(title || action) && (
      <div className="flex items-center justify-between px-1">
        {title && (
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {title}
          </h3>
        )}
        {action}
      </div>
    )}
    {children}
  </div>
));

ListSection.displayName = 'ListSection';

export { List, ListItem, ListItemAction, ListSection };
