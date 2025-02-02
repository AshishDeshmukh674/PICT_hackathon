"use client";
import { useEffect } from 'react';

export function PreventScroll() {
  useEffect(() => {
    const preventDefault = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
      }
    };

    // Add event listeners to both keydown and keypress
    window.addEventListener('keydown', preventDefault, { passive: false });
    window.addEventListener('keypress', preventDefault, { passive: false });

    // Cleanup
    return () => {
      window.removeEventListener('keydown', preventDefault);
      window.removeEventListener('keypress', preventDefault);
    };
  }, []);

  return null;
} 