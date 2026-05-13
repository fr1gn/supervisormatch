import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for managing sidebar state across breakpoints.
 */
export function useSidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const checkScreen = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsOpen(false);
        setIsCollapsed(false);
      } else {
        setIsOpen(true);
      }
    };

    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  const toggle = useCallback(() => {
    if (isMobile) {
      setIsOpen(prev => !prev);
    } else {
      setIsCollapsed(prev => !prev);
    }
  }, [isMobile]);

  const close = useCallback(() => {
    if (isMobile) setIsOpen(false);
  }, [isMobile]);

  return { isOpen, isMobile, isCollapsed, toggle, close };
}
