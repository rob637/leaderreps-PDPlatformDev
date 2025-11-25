// src/components/ui/DataTable.jsx
// Standardized Data Table Component
// Use this for all table displays (admin screens, history, lists)

import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown, Loader } from 'lucide-react';

/**
 * DataTable - Standardized table for data display
 * 
 * @example Basic usage
 * <DataTable
 *   columns={[
 *     { key: 'name', header: 'Name' },
 *     { key: 'email', header: 'Email' },
 *     { key: 'status', header: 'Status', render: (row) => <Badge>{row.status}</Badge> }
 *   ]}
 *   data={users}
 * />
 * 
 * @example With sorting and empty state
 * <DataTable
 *   columns={columns}
 *   data={items}
 *   sortable
 *   sortKey={sortKey}
 *   sortDirection={sortDirection}
 *   onSort={handleSort}
 *   emptyMessage="No items found"
 *   isLoading={loading}
 * />
 */
const DataTable = React.forwardRef(({
  // Data
  columns = [],
  data = [],
  keyField = 'id',
  
  // Sorting
  sortable = false,
  sortKey,
  sortDirection = 'asc',
  onSort,
  
  // States
  isLoading = false,
  emptyMessage = 'No data available',
  emptyIcon: EmptyIcon,
  
  // Interaction
  onRowClick,
  selectedRow,
  
  // Styling
  variant = 'default',
  compact = false,
  striped = false,
  className,
  
  ...props
}, ref) => {
  
  const handleSort = (key) => {
    if (!sortable || !onSort) return;
    const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(key, newDirection);
  };

  const getSortIcon = (key) => {
    if (!sortable) return null;
    if (sortKey !== key) return <ChevronsUpDown className="w-4 h-4 text-slate-300" />;
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-corporate-teal" />
      : <ChevronDown className="w-4 h-4 text-corporate-teal" />;
  };

  const variants = {
    default: 'border border-slate-200 rounded-xl overflow-hidden',
    flat: '',
    card: 'bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden',
  };

  const cellPadding = compact ? 'px-3 py-2' : 'px-4 py-3';
  const headerPadding = compact ? 'px-3 py-2' : 'px-4 py-3';

  return (
    <div 
      ref={ref}
      className={cn(variants[variant], className)}
      {...props}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          {/* Header */}
          <thead className="bg-slate-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    headerPadding,
                    'text-left text-xs font-bold text-slate-500 uppercase tracking-wider',
                    sortable && col.sortable !== false && 'cursor-pointer hover:bg-slate-100 select-none',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right',
                    col.width && `w-${col.width}`,
                    col.className
                  )}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <div className={cn(
                    'flex items-center gap-1',
                    col.align === 'center' && 'justify-center',
                    col.align === 'right' && 'justify-end'
                  )}>
                    {col.header}
                    {sortable && col.sortable !== false && getSortIcon(col.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          {/* Body */}
          <tbody className="bg-white divide-y divide-slate-200">
            {/* Loading State */}
            {isLoading && (
              <tr>
                <td colSpan={columns.length} className={cn(cellPadding, 'text-center py-8')}>
                  <div className="flex items-center justify-center gap-2 text-slate-500">
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Loading...</span>
                  </div>
                </td>
              </tr>
            )}
            
            {/* Empty State */}
            {!isLoading && data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className={cn(cellPadding, 'text-center py-8')}>
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    {EmptyIcon && <EmptyIcon className="w-8 h-8" />}
                    <span className="text-sm italic">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            )}
            
            {/* Data Rows */}
            {!isLoading && data.map((row, rowIndex) => (
              <tr
                key={row[keyField] ?? rowIndex}
                onClick={() => onRowClick?.(row, rowIndex)}
                className={cn(
                  'transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-slate-50',
                  striped && rowIndex % 2 === 1 && 'bg-slate-25',
                  selectedRow === row[keyField] && 'bg-corporate-teal/5 border-l-2 border-l-corporate-teal'
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      cellPadding,
                      'text-sm',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right',
                      col.cellClassName
                    )}
                  >
                    {col.render 
                      ? col.render(row, rowIndex)
                      : row[col.key] ?? '-'
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

DataTable.displayName = 'DataTable';

/**
 * TableCell - Styled cell content helpers
 */
const TableCellText = ({ children, className, muted = false }) => (
  <span className={cn(
    'text-sm',
    muted ? 'text-slate-500' : 'text-slate-900 font-medium',
    className
  )}>
    {children}
  </span>
);

const TableCellBadge = ({ children, variant = 'default', className }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-orange-100 text-orange-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
};

export { DataTable, TableCellText, TableCellBadge };
