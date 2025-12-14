/**
 * Motion Components - Native-feeling animations for mobile
 * Phase 4: Motion & Animation System
 * 
 * Provides spring physics, micro-interactions, and meaningful motion
 * that makes the app feel alive and responsive.
 */

export { default as AnimatedList } from './AnimatedList';
export { default as AnimatedCard } from './AnimatedCard';
export { default as PageTransition, PageTransitionWrapper } from './PageTransition';
export { default as FadeIn } from './FadeIn';
export { default as ScaleIn } from './ScaleIn';
export { default as SlideIn } from './SlideIn';
export { default as Stagger, StaggerItem } from './Stagger';
export { default as AnimatedNumber, AnimatedPercentage, AnimatedCounter } from './AnimatedNumber';
export { default as PressableScale, PressableOpacity, PressableHighlight } from './PressableScale';
export { default as ShimmerEffect, ShimmerCard, ShimmerList, ShimmerText, ShimmerCircle } from './ShimmerEffect';
export { default as AnimatedToast, ToastProvider, useToast } from './AnimatedToast';
export * from './useAnimations';
export * from './springPresets';
