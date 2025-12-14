/**
 * AnimatedList - List with staggered item animations
 */
import React, { forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from './useAnimations';
import { springDefault, staggerChildren } from './springPresets';

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

const AnimatedList = forwardRef(({
  children,
  items = [],
  renderItem,
  keyExtractor,
  className = '',
  itemClassName = '',
  stagger = 0.05,
  delayStart = 0.1,
  emptyComponent,
  ...props
}, ref) => {
  const reducedMotion = useReducedMotion();

  // If renderItem is provided, use it to render items array
  // Otherwise, render children directly
  const renderContent = () => {
    if (renderItem && items.length > 0) {
      return items.map((item, index) => {
        const key = keyExtractor ? keyExtractor(item, index) : index;
        
        if (reducedMotion) {
          return (
            <div key={key} className={itemClassName}>
              {renderItem(item, index)}
            </div>
          );
        }

        return (
          <motion.div
            key={key}
            className={itemClassName}
            variants={itemVariants}
            transition={springDefault}
            layout
          >
            {renderItem(item, index)}
          </motion.div>
        );
      });
    }

    // Render children with animation wrapper
    return React.Children.map(children, (child, index) => {
      if (!React.isValidElement(child)) return child;

      if (reducedMotion) {
        return child;
      }

      return (
        <motion.div
          key={child.key || index}
          className={itemClassName}
          variants={itemVariants}
          transition={springDefault}
          layout
        >
          {child}
        </motion.div>
      );
    });
  };

  if (items.length === 0 && emptyComponent && !children) {
    return emptyComponent;
  }

  if (reducedMotion) {
    return (
      <div ref={ref} className={className} {...props}>
        {renderContent()}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: stagger,
            delayChildren: delayStart,
          },
        },
      }}
      {...props}
    >
      <AnimatePresence mode="popLayout">
        {renderContent()}
      </AnimatePresence>
    </motion.div>
  );
});

AnimatedList.displayName = 'AnimatedList';

export default AnimatedList;
