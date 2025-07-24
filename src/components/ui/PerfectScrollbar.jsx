import React, { useEffect, useRef, forwardRef } from 'react';
import PerfectScrollbar from 'perfect-scrollbar';

const PerfectScrollbarComponent = forwardRef(({ 
  children, 
  className = '', 
  options = {},
  onScroll,
  ...props 
}, ref) => {
  const containerRef = useRef(null);
  const psRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      // Initialize perfect-scrollbar with default options
      const defaultOptions = {
        wheelPropagation: false,
        suppressScrollX: true,
        ...options
      };

      psRef.current = new PerfectScrollbar(containerRef.current, defaultOptions);

      // Cleanup function
      return () => {
        if (psRef.current) {
          psRef.current.destroy();
          psRef.current = null;
        }
      };
    }
  }, [options]);

  // Update perfect-scrollbar when content changes
  useEffect(() => {
    if (psRef.current) {
      psRef.current.update();
    }
  });

  // Handle scroll events
  useEffect(() => {
    if (psRef.current && onScroll) {
      const element = containerRef.current;
      const handleScroll = (e) => {
        onScroll(e);
      };
      
      element.addEventListener('scroll', handleScroll);
      return () => element.removeEventListener('scroll', handleScroll);
    }
  }, [onScroll]);

  // Expose ref to parent component
  React.useImperativeHandle(ref, () => ({
    update: () => psRef.current?.update(),
    destroy: () => psRef.current?.destroy(),
    element: containerRef.current
  }));

  return (
    <div 
      ref={containerRef}
      className={`ps ${className}`}
      style={{ overflow: 'hidden' }}
      {...props}
    >
      {children}
    </div>
  );
});

PerfectScrollbarComponent.displayName = 'PerfectScrollbar';

export default PerfectScrollbarComponent; 