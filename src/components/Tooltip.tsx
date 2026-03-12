import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  children: React.ReactNode;
  term: string;
  definition: string;
}

export default function Tooltip({ children, term, definition }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);

  const updatePosition = () => {
    if (triggerRef.current && isVisible) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        x: rect.left + rect.width / 2,
        y: rect.top - 8 // 8px gap above the element
      });
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible]);

  return (
    <>
      <span
        ref={triggerRef}
        className="relative inline-block cursor-help border-b border-dashed border-accent-primary/50 text-accent-primary hover:text-accent-secondary transition-colors"
        onMouseEnter={() => {
          setIsVisible(true);
          // Small delay to ensure DOM is ready before calculating position
          setTimeout(updatePosition, 0);
        }}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => {
          setIsVisible(true);
          setTimeout(updatePosition, 0);
        }}
        onBlur={() => setIsVisible(false)}
        tabIndex={0}
      >
        {children}
      </span>
      {createPortal(
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                left: coords.x,
                top: coords.y,
                transform: 'translate(-50%, -100%)',
                zIndex: 9999,
              }}
              className="pointer-events-none w-max max-w-xs p-3 rounded-xl bg-mystic-900 border border-white/10 shadow-xl shadow-black/50"
            >
              <div className="text-sm font-bold text-accent-primary mb-1">{term}</div>
              <div className="text-xs text-slate-300 leading-relaxed">{definition}</div>
              
              {/* Tooltip Arrow */}
              <div 
                className="absolute left-1/2 -bottom-2 -translate-x-1/2 border-8 border-transparent border-t-mystic-900"
                style={{ filter: 'drop-shadow(0 1px 0 rgba(255,255,255,0.1))' }}
              />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
