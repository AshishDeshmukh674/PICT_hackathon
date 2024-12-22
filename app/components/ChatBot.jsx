import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, StopCircle, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { ScrollArea } from "../../components/ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import { FileUploadHandler } from './FileUploadHandler';

function ChatHeader({ onClose }) {
  return (
    <div className="flex justify-between items-center p-4 border-b border-border">
      <div className="text-lg font-semibold">Medical Assistant</div>
      <button onClick={onClose} className="text-gray-600">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

// TypingAnimation Component
const TypingAnimation = () => {
  return (
    <div className="flex space-x-1">
      <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-pulse"></div>
      <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-pulse delay-150"></div>
      <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-pulse delay-300"></div>
    </div>
  );
};

export default function ChatBot({ isOpen, onClose }) {
  const [userInput, setUserInput] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { role: "system", content: "You are a helpful medical assistant." },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const chatContainerRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) {
      setError("Voice recognition is not supported in your browser.");
      return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");
      setUserInput(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Voice recognition error:", event.error);
      setError("Voice recognition failed. Please try again.");
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const handleExtractedText = (text) => {
    setUserInput((prev) => prev + '\n\nExtracted text from file:\n' + text);
  };

  const sendMessage = async () => {
    if (!userInput.trim() && !extractedText.trim()) {
      return;
    }

    const fullPrompt = userInput + extractedText;
    
    const updatedChatHistory = [
      ...chatHistory,
      { role: "user", content: userInput || "File uploaded" },
    ];
    
    setChatHistory(updatedChatHistory);
    setUserInput("");
    setExtractedText("");
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          chatHistory: [
            ...chatHistory,
            { role: "user", content: fullPrompt }
          ]
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get a response from the server.");
      }

      const data = await response.json();

      const botReply = data.response;
      setChatHistory([
        ...updatedChatHistory,
        { role: "assistant", content: botReply },
      ]);

      speak(botReply);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setError("");
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const speak = (text) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 1;
      speechSynthesis.speak(utterance);
    } else {
      console.error("Text-to-speech is not supported in your browser.");
      setError("Text-to-speech is not supported in your browser.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Layer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* ChatBot UI */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-4 right-4 w-full max-w-md bg-card rounded-lg shadow-xl overflow-hidden z-50"
          >
            <ChatHeader onClose={onClose} />
            <ScrollArea className="h-[60vh] p-4 space-y-4">
              <AnimatePresence>
                {chatHistory.slice(1).map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    transition={{ duration: 0.5 }}
                  >
                    <ChatMessage role={message.role} content={message.content} />
                  </motion.div>
                ))}
              </AnimatePresence>
              {isLoading && (
                <div className="flex justify-start">
                  <TypingAnimation />
                </div>
              )}
            </ScrollArea>
            <div className="p-4 border-t border-border space-y-4">
              <FileUploadHandler onExtractedText={handleExtractedText} />
              <div className="flex space-x-2">
                <Textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Ask me something about health..."
                  className="flex-1 min-h-[80px] max-h-[200px] resize-y"
                  onKeyPress={handleKeyPress}
                />
                <div className="flex flex-col space-y-2">
                  <Button 
                    onClick={sendMessage} 
                    disabled={isLoading}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send
                  </Button>
                  <Button variant="outline" onClick={toggleRecording}>
                    {isRecording ? (
                      <StopCircle className="w-4 h-4 mr-2 text-destructive" />
                    ) : (
                      <Mic className="w-4 h-4 mr-2" />
                    )}
                    {isRecording ? "Stop" : "Voice"}
                  </Button>
                </div>
              </div>
              {error && <p className="text-destructive mt-2">{error}</p>}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


