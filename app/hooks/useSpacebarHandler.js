"use client";
import { useEffect } from 'react';

export function useSpacebarHandler({ onTriplePress, onDoublePress, isOpen, isSpeaking }) {
  useEffect(() => {
    let spacebarCount = 0;
    let lastSpaceTime = 0;
    const SPACE_TIMEOUT = 500; // ms to wait between presses

    const handleKeyDown = (e) => {
      // If user is typing in an input/textarea, don't trigger spacebar actions
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.code === 'Space' || e.key === ' ') {
        const currentTime = Date.now();

        // Reset count if too much time has passed
        if (currentTime - lastSpaceTime > SPACE_TIMEOUT) {
          spacebarCount = 1;
        } else {
          spacebarCount++;
        }

        lastSpaceTime = currentTime;

        // Handle different spacebar press patterns
        if (spacebarCount === 3) {
          e.preventDefault(); // Prevent space from scrolling page
          if (!isOpen) {
            onTriplePress(); // Open chatbot and start read-aloud
          } else {
            // Start recording
            onTriplePress();
          }
          spacebarCount = 0;
        } else if (spacebarCount === 2 && isSpeaking) {
          e.preventDefault();
          onDoublePress(); // Stop read-aloud
          spacebarCount = 0;
        }

        // Reset count after timeout
        setTimeout(() => {
          spacebarCount = 0;
        }, SPACE_TIMEOUT);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTriplePress, onDoublePress, isOpen, isSpeaking]);
} 