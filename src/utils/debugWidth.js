// Debug utility to log width measurements for all screens
export const logWidthMeasurements = (componentName) => {
  setTimeout(() => {
    const container = document.querySelector('.page-corporate');
    const contentFull = document.querySelector('.content-full');
    const contentWrapper = document.querySelector('.content-wrapper-corporate');
    
    if (container) {
      const rect = container.getBoundingClientRect();
      const computed = window.getComputedStyle(container);
      
      console.log(`📐 [${componentName.toUpperCase()}] Width Measurements:`, {
        component: componentName,
        actualWidth: `${rect.width}px`,
        maxWidth: computed.maxWidth,
        padding: computed.padding,
        paddingLeft: computed.paddingLeft,
        paddingRight: computed.paddingRight,
        margin: computed.margin,
        marginLeft: computed.marginLeft,
        marginRight: computed.marginRight,
        boxSizing: computed.boxSizing,
        classList: container.className,
        contentFullWidth: contentFull ? `${contentFull.getBoundingClientRect().width}px` : 'N/A',
        wrapperWidth: contentWrapper ? `${contentWrapper.getBoundingClientRect().width}px` : 'N/A',
        windowInnerWidth: `${window.innerWidth}px`
      });
    } else {
      console.warn(`⚠️ [${componentName.toUpperCase()}] No .page-corporate element found`);
    }
  }, 100);
};
