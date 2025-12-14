/**
 * Spring Presets - Carefully tuned spring configurations
 * 
 * These presets create natural, iOS/Android-like motion
 * that feels responsive without being jarring.
 */

// iOS-style spring (default for most interactions)
export const springDefault = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 1,
};

// Snappy response for buttons and quick interactions
export const springSnappy = {
  type: 'spring',
  stiffness: 500,
  damping: 30,
  mass: 0.8,
};

// Gentle spring for larger movements
export const springGentle = {
  type: 'spring',
  stiffness: 200,
  damping: 25,
  mass: 1.2,
};

// Bouncy spring for playful feedback
export const springBouncy = {
  type: 'spring',
  stiffness: 400,
  damping: 15,
  mass: 0.8,
};

// Stiff spring for precise movements
export const springStiff = {
  type: 'spring',
  stiffness: 600,
  damping: 40,
  mass: 0.8,
};

// Slow spring for dramatic reveals
export const springDramatic = {
  type: 'spring',
  stiffness: 150,
  damping: 20,
  mass: 1.5,
};

// Quick tween for instant feedback
export const tweenQuick = {
  type: 'tween',
  duration: 0.15,
  ease: 'easeOut',
};

// Standard tween
export const tweenStandard = {
  type: 'tween',
  duration: 0.25,
  ease: [0.4, 0, 0.2, 1], // Material ease
};

// Slow tween for emphasis
export const tweenSlow = {
  type: 'tween',
  duration: 0.4,
  ease: [0.4, 0, 0.2, 1],
};

// Page transition spring
export const springPage = {
  type: 'spring',
  stiffness: 250,
  damping: 28,
  mass: 1,
};

// Modal/sheet spring
export const springModal = {
  type: 'spring',
  stiffness: 350,
  damping: 32,
  mass: 1,
};

// List item stagger delay
export const staggerChildren = {
  staggerChildren: 0.05,
  delayChildren: 0.1,
};

// Fast stagger for many items
export const staggerFast = {
  staggerChildren: 0.03,
  delayChildren: 0.05,
};

// Slow stagger for emphasis
export const staggerSlow = {
  staggerChildren: 0.1,
  delayChildren: 0.15,
};

// Presets object for easy access
export const springPresets = {
  default: springDefault,
  snappy: springSnappy,
  gentle: springGentle,
  bouncy: springBouncy,
  stiff: springStiff,
  dramatic: springDramatic,
  page: springPage,
  modal: springModal,
};

export const tweenPresets = {
  quick: tweenQuick,
  standard: tweenStandard,
  slow: tweenSlow,
};

export const staggerPresets = {
  default: staggerChildren,
  fast: staggerFast,
  slow: staggerSlow,
};

export default springPresets;
