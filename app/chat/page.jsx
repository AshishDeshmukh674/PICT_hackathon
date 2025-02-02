"use client";

import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import ChatBot from "../components/ChatBot";
import { PreventScroll } from "../components/PreventScroll";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatPage() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSpacebarPressed, setIsSpacebarPressed] = useState(false);
  const [spacebarPressTime, setSpacebarPressTime] = useState(null);
  const HOLD_DURATION = 3000; // 3 seconds in milliseconds

  useEffect(() => {
    let animationFrameId;
    let startTime;

    const updateProgress = (timestamp) => {
      if (!startTime) startTime = timestamp;
      if (!isSpacebarPressed) return;

      const progress = timestamp - startTime;
      const currentDuration = Date.now() - spacebarPressTime;

      if (currentDuration < HOLD_DURATION) {
        animationFrameId = requestAnimationFrame(updateProgress);
      }
    };

    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !isSpacebarPressed) {
        e.preventDefault();
        setIsSpacebarPressed(true);
        setSpacebarPressTime(Date.now());
        startTime = null;
        animationFrameId = requestAnimationFrame(updateProgress);
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        const pressDuration = Date.now() - spacebarPressTime;
        
        if (pressDuration >= HOLD_DURATION) {
          setIsChatOpen(true);
        }
        
        setIsSpacebarPressed(false);
        setSpacebarPressTime(null);
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isSpacebarPressed, spacebarPressTime, HOLD_DURATION]);

  // Visual feedback component for spacebar hold
  const SpacebarHoldIndicator = () => {
    if (!isSpacebarPressed || !spacebarPressTime || isChatOpen) return null;

    const currentDuration = Date.now() - spacebarPressTime;
    const progress = Math.min((currentDuration / HOLD_DURATION) * 100, 100);

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg z-50"
      >
        <div className="text-center mb-2">
          {progress >= 100 ? 'Release to open chat' : 'Hold spacebar...'}
        </div>
        <div className="w-48 h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-blue-500"
            initial={{ width: 0 }}
            animate={{ 
              width: `${progress}%`,
            }}
            transition={{ 
              duration: 0.1,
              ease: "linear"
            }}
          />
        </div>
      </motion.div>
    );
  };

  return (
    <div>
      <PreventScroll />
      <Button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-4 right-4 w-14 h-14 p-0 rounded-full shadow-lg bg-primary text-white flex items-center justify-center text-2xl"
      >
        {isChatOpen ? "X" : "+"}
      </Button>

      <ChatBot 
        isOpen={isChatOpen} 
        onClose={(forceClose = true) => setIsChatOpen(!forceClose)} 
      />
      <SpacebarHoldIndicator />
    </div>
  );
}
