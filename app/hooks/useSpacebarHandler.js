"use client";
import { useEffect } from 'react';

export function useSpacebarHandler({ onTriplePress, onDoublePress, isOpen, isTyping, canStartRecording, isSpeaking, isRecording }) {
  useEffect(() => {
    let spacebarPressTime = null;
    let spacebarPressCount = 0;
    let spacebarTimeout = null;

    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        
        const currentTime = Date.now();
        
        if (!spacebarPressTime || (currentTime - spacebarPressTime) > 500) {
          // Reset count if too much time has passed
          spacebarPressCount = 1;
        } else {
          spacebarPressCount++;
        }
        
        spacebarPressTime = currentTime;

        // Clear existing timeout
        if (spacebarTimeout) {
          clearTimeout(spacebarTimeout);
        }

        // Set new timeout to reset count
        spacebarTimeout = setTimeout(() => {
          spacebarPressCount = 0;
        }, 500);

        // Handle triple press to open chatbot
        if (spacebarPressCount === 3 && !isOpen) {
          onTriplePress();
          spacebarPressCount = 0;
          return;
        }

        // Handle mic control when chatbot is open
        if (isOpen && !isTyping && !e.repeat) {
          if (!isRecording && canStartRecording && !isSpeaking) {
            onTriplePress(); // Start recording
          }
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space' || e.key === ' ') {
        if (isOpen && isRecording) {
          onTriplePress(); // Stop recording
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (spacebarTimeout) {
        clearTimeout(spacebarTimeout);
      }
    };
  }, [onTriplePress, onDoublePress, isOpen, isTyping, canStartRecording, isSpeaking, isRecording]);
} 