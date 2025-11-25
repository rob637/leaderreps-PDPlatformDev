// src/components/ui/index.js
// Canonical UI Component Library - Barrel Exports
// All UI components should be imported from this file

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

// Typography Components
export { Heading, Text, PageHeader } from './Typography';

// Layout Components
export { PageLayout, PageEmptyState, PageSection, PageGrid } from './PageLayout';

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

// Feature Components
export { default as MembershipGate } from './MembershipGate';
export { default as PWAInstall } from './PWAInstall';
export { default as ScrollingQuotes } from './ScrollingQuotes';
export { default as UpdateNotification } from './UpdateNotification';

// Re-export cn utility for consistency
export { cn } from '../../lib/utils';
