// src/components/ui/index.js
// Canonical UI Component Library - Barrel Exports
// All UI components should be imported from this file

// Design Tokens (Single Source of Truth for design values)
export { default as designTokens } from './design-tokens';

// Core Components
export { Button } from './Button';
export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from './Card';
export { Input, Textarea } from './Input';
export { Checkbox } from './Checkbox';
export { Badge } from './Badge';
export { Tooltip } from './Tooltip';
export { ProgressBar } from './ProgressBar';
export { LoadingSpinner } from './LoadingSpinner';
export { Select } from './Select';
export { Alert } from './Alert';
export { 
  Modal, 
  ModalOverlay, 
  ModalContent, 
  ModalHeader, 
  ModalTitle, 
  ModalBody, 
  ModalFooter, 
  ModalClose 
} from './Modal';
export { BottomSheet, BottomSheetActions } from './BottomSheet';

// Mobile Components
export {
  MobileCard,
  MobileCardHeader,
  MobileCardTitle,
  MobileCardDescription,
  MobileCardContent,
  MobileCardFooter,
  MobileCardIcon,
  MobileCardBadge,
  MobileCardChevron,
  MobileCardMenu,
  MobileCardRow,
  MobileCardStack,
} from './MobileCard';

// Typography Components
export { Heading, Text, PageHeader } from './Typography';

// Layout Components
export { PageLayout, PageEmptyState, PageSection, PageGrid, NoWidgetsEnabled } from './PageLayout';
export { BreadcrumbNav } from './BreadcrumbNav';
export { LayoutToggle } from './LayoutToggle';

// Widget Components
export { WidgetCard, WidgetHeader, WidgetGrid } from './WidgetCard';
export { StatWidget, StatWidgetGrid } from './StatWidget';

// Form Components
export { FormField, FormSection, FormActions } from './FormField';

// Loading Components
export { 
  LoadingState, 
  Skeleton, 
  SkeletonCard, 
  SkeletonStat, 
  SkeletonList 
} from './LoadingState';

// Tab Components
export { Tabs, TabsList, TabsTrigger, TabsContent, TabButton } from './Tabs';

// Data Display Components
export { DataTable, TableCellText, TableCellBadge } from './DataTable';

// Filter Components
export { 
  FilterBar, 
  FilterSearch, 
  FilterSelect, 
  FilterChips, 
  FilterToggle,
  ActiveFilters 
} from './FilterBar';

// Content Metadata Components
export { 
  DifficultyBadge, 
  DurationBadge, 
  TierBadge, 
  SkillTag, 
  EnrollmentBadge, 
  LockedBadge,
  MetadataRow 
} from './ContentBadges';
export { default as SkillFilter } from './SkillFilter';

// List Components
export { List, ListItem, ListItemAction, ListSection } from './ListItem';

// Feature Components
export { default as PWAInstall } from './PWAInstall';
export { default as ScrollingQuotes } from './ScrollingQuotes';
export { default as UpdateNotification } from './UpdateNotification';
export { FloatingActionButton, SpeedDial } from './FloatingActionButton';
export { SwipeableRow, SwipeActions } from './SwipeableRow';
export { PullToRefresh } from './PullToRefresh';

// Re-export cn utility for consistency
export { cn } from '../../lib/utils';
