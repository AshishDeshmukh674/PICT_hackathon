"use client";

import { useState } from "react";
import { Button } from "../../components/ui/button";
import ChatBot from "../components/ChatBot";

export default function ChatPage() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-4 right-4 w-14 h-14 p-0 rounded-full shadow-lg bg-primary text-white flex items-center justify-center text-2xl z-50"
      >
        {isChatOpen ? "X" : "+"}
      </Button>

      <div className={`${isChatOpen ? 'z-50' : ''}`}>
        <ChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      </div>
    </div>
  );
}
