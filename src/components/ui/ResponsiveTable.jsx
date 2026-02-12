import * as React from "react";
import { cn } from "../../lib/utils";
import { MobileCard, MobileCardStack } from "./MobileCard";

/**
 * ResponsiveTable - Table that transforms to cards on mobile
 * 
 * Desktop: Traditional table layout
 * Mobile: Stack of cards with key-value pairs
 */

const ResponsiveTable = React.forwardRef(({
  columns = [],
  data = [],
  onRowClick,
  emptyMessage = "No data available",
  className,
  mobileBreakpoint = "md", // md = 768px
  renderMobileCard,
  keyField = "id",
  ...props
}, ref) => {
  
  // Default mobile card renderer
  const defaultRenderMobileCard = (row, index) => (
    <MobileCard 
      key={row[keyField] || index}
      onClick={onRowClick ? () => onRowClick(row) : undefined}
      className="bg-white dark:bg-slate-800"
    >
      <div className="space-y-2">
        {columns.map((col, colIndex) => {
          const value = typeof col.accessor === 'function' 
            ? col.accessor(row) 
            : row[col.accessor];
          
          // Skip if no value and column is hideable on mobile
          if (!value && col.hideOnMobileIfEmpty) return null;
          
          // Use custom cell renderer if provided
          const cellContent = col.Cell 
            ? col.Cell({ value, row }) 
            : value;
          
          return (
            <div key={col.accessor || colIndex} className="flex justify-between items-start gap-4">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {col.Header}
              </span>
              <span className="text-sm text-slate-900 dark:text-white text-right">
                {cellContent}
              </span>
            </div>
          );
        })}
      </div>
    </MobileCard>
  );

  const cardRenderer = renderMobileCard || defaultRenderMobileCard;

  return (
    <div ref={ref} className={className} {...props}>
      {/* Mobile View - Cards */}
      <div className={`block ${mobileBreakpoint}:hidden`}>
        {data.length > 0 ? (
          <MobileCardStack gap="sm">
            {data.map((row, index) => cardRenderer(row, index))}
          </MobileCardStack>
        ) : (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
            {emptyMessage}
          </div>
        )}
      </div>

      {/* Desktop View - Table */}
      <div className={`hidden ${mobileBreakpoint}:block`}>
        <div className="overflow-x-auto border border-gray-300 dark:border-gray-600 rounded-lg">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                {columns.map((col, index) => (
                  <th 
                    key={col.accessor || index}
                    className={cn(
                      "border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider whitespace-nowrap",
                      col.headerClassName
                    )}
                    style={col.width ? { width: col.width } : undefined}
                  >
                    {col.Header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800">
              {data.length > 0 ? (
                data.map((row, rowIndex) => (
                  <tr 
                    key={row[keyField] || rowIndex}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      onRowClick && "cursor-pointer hover:bg-slate-50 transition-colors"
                    )}
                  >
                    {columns.map((col, colIndex) => {
                      const value = typeof col.accessor === 'function'
                        ? col.accessor(row)
                        : row[col.accessor];
                      
                      const cellContent = col.Cell
                        ? col.Cell({ value, row })
                        : value;

                      return (
                        <td 
                          key={col.accessor || colIndex}
                          className={cn(
                            "border border-gray-300 dark:border-gray-600 px-3 py-2",
                            col.cellClassName
                          )}
                        >
                          {cellContent}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td 
                    colSpan={columns.length} 
                    className="border border-gray-300 dark:border-gray-600 px-3 py-8 text-center text-slate-500 dark:text-slate-400"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

ResponsiveTable.displayName = "ResponsiveTable";

/**
 * MobileHistoryCard - Specialized card for history items
 * Date-based entries with status and details
 */
const MobileHistoryCard = React.forwardRef(({
  date,
  title,
  subtitle,
  status,
  statusColor = "slate",
  icon: Icon,
  details = [],
  onClick,
  className,
  children,
  ...props
}, ref) => {
  const statusColors = {
    success: "bg-green-100 dark:bg-green-900/30 text-green-700",
    warning: "bg-orange-100 dark:bg-orange-900/30 text-orange-700",
    error: "bg-red-100 dark:bg-red-900/30 text-red-700",
    info: "bg-blue-100 dark:bg-blue-900/30 text-blue-700",
    slate: "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200",
  };

  return (
    <MobileCard ref={ref} onClick={onClick} className={className} {...props}>
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
            <Icon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {title || date}
            </span>
            {status && (
              <span className={cn(
                "px-2 py-0.5 rounded-md text-xs font-medium flex-shrink-0",
                statusColors[statusColor]
              )}>
                {status}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{subtitle}</p>
          )}
          {details.length > 0 && (
            <div className="space-y-1">
              {details.map((detail, index) => (
                <div key={index} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  {detail.icon && <detail.icon className="w-3 h-3 text-slate-400" />}
                  <span className="text-slate-400">{detail.label}:</span>
                  <span className="text-slate-700 dark:text-slate-200">{detail.value}</span>
                </div>
              ))}
            </div>
          )}
          {children}
        </div>
      </div>
    </MobileCard>
  );
});

MobileHistoryCard.displayName = "MobileHistoryCard";

export { ResponsiveTable, MobileHistoryCard };
