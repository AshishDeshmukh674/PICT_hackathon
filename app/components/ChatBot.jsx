"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, StopCircle, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { ScrollArea } from "../../components/ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import GlobalApi from "../_utils/GlobalApi";
import axios from 'axios';
import { FileUploadHandler } from "./FileUploadHandler";

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

function TypingAnimation() {
  return (
    <div className="flex space-x-2">
      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></div>
      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-300"></div>
    </div>
  );
}

const getTimeSlotsForDoctor = (doctorId) => {
  const doctorTimeSlots = {
    '3': { morning: [[8, 30], [9, 30]], evening: [[19, 30], [20, 30]] },
    '4': { 
      morning: [[8, 0], [9, 0]], 
      evening: [[11, 0], [1, 0]],
      AfterNoon: [[9, 0], [11, 0]]
    },
    '5': {
      morning: [[8, 30], [11, 0]], 
      evening: [[19, 0], [21, 0]]
    },
    '7': { morning: [[8, 0], [10, 45]] },
  };
  return doctorTimeSlots[doctorId] || { morning: [[9, 0], [12, 0]], evening: [[13, 0], [18, 0]] };
};

const formatTime = (date) => {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours || 12;
  const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
  return `${hours}:${minutesStr} ${ampm}`;
};

const isSameDay = (d1, d2) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

const getAvailableTimeSlots = async (doctorId, date, clinicType) => {
  try {
    const dateStr = date.toLocaleDateString('en-CA');
    const response = await GlobalApi.getDoctorAppointmentsByDate(doctorId, dateStr);
    const bookedSlots = response.data.data
      ? response.data.data.map(appointment => appointment.attributes.Time)
      : [];

    const timeList = [];
    const clinicTypeOnly = clinicType.split(" - ")[0];
    const { morning, evening, AfterNoon } = getTimeSlotsForDoctor(doctorId);

    const isToday = isSameDay(date, new Date());
    const now = new Date();
    const dayOfWeek = date.getDay();

    const generateTimeSlots = (startTime, endTime) => {
      let [currentHour, currentMinutes] = startTime;
      const [endHour, endMinutes] = endTime;

      while (currentHour < endHour || (currentHour === endHour && currentMinutes < endMinutes)) {
        const slotTime = new Date(date);
        slotTime.setHours(currentHour, currentMinutes);

        if (isToday && slotTime <= now) {
          currentMinutes += 15;
          if (currentMinutes === 60) {
            currentHour++;
            currentMinutes = 0;
          }
          continue;
        }

        const formattedTime = formatTime(slotTime);
        if (!bookedSlots.includes(formattedTime)) {
          timeList.push(formattedTime);
        }

        currentMinutes += 15;
        if (currentMinutes === 60) {
          currentHour++;
          currentMinutes = 0;
        }
      }
    };

    // Special case for doctor ID 5
    if (doctorId === 5) {
      if (clinicTypeOnly === 'Morning Clinic' && (dayOfWeek === 1 || dayOfWeek === 6)) {
        generateTimeSlots(morning[0], morning[1]);
      } else if (clinicTypeOnly === 'Evening Clinic' && dayOfWeek === 4) {
        generateTimeSlots(evening[0], evening[1]);
      }
    } else {
      if (clinicTypeOnly === 'Morning Clinic' && morning) {
        generateTimeSlots(morning[0], morning[1]);
      } else if (clinicTypeOnly === 'Evening Clinic' && evening) {
        generateTimeSlots(evening[0], evening[1]);
      } else if (clinicTypeOnly === 'AfterNoon Clinic' && AfterNoon) {
        generateTimeSlots(AfterNoon[0], AfterNoon[1]);
      }
    }

    return timeList;
  } catch (error) {
    console.error("Error getting available time slots:", error);
    return [];
  }
};

const sendMessage = async (formData) => {
  const phoneNumbers = [
    "+918149623527",
    // "+919822038877",
    // "+919764432460",
  ];

  try {
    const promises = phoneNumbers.map(async (number) => {
      const response = await axios.post(
        `https://graph.facebook.com/v16.0/405802159279444/messages`,
        {
          messaging_product: "whatsapp",
          to: number,
          type: "template",
          template: {
            name: "booking_appointment",
            language: { code: "en" },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: formData.user_name },  // {{1}}
                  { type: "text", text: formData.user_phone },  // {{2}}
                  { type: "text", text: formData.date },  // {{3}}
                  { type: "text", text: formData.time },  // {{4}}
                  { type: "text", text: formData.doctorName }  // {{5}}
                ]
              }
            ]
          }
        },
        {
          headers: {
            "Authorization": `Bearer EAAE2eCrRWPkBO5IJD2ZCjepnBu16tfITg1aSWXeVuoqMEXWLE0ME2JZAKRNQUeE5T19rKzPltkk5PNuxSfwqnxzRWJtJuoCAqBTJxTANQW7hRnlHvYokTVPVjPccghhJVCBCiKZBlUKAUvnzJmuftZCOesX5uNVIJ94YvaZBBEwKWfFt9BQ1qDjlfZAQ4C7uPZBDQZDZD`,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.status !== 200) {
        throw new Error(`Failed to send message to ${number}: ${response.data.error.message}`);
      }
    });

    await Promise.all(promises);
    return "Your message has been sent successfully to all recipients.";
  } catch (error) {
    console.error(`Failed to send message: ${error.message}`);
    throw new Error(`Failed to send message: ${error.message}`);
  }
};

export default function ChatBot({ isOpen, onClose }) {
  const [userInput, setUserInput] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { 
      role: "assistant", 
      content: "Hello! I'm your medical assistant. How can I help you today? You can book an appointment or ask me health-related questions." 
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [bookingStep, setBookingStep] = useState(0);
  const [bookingData, setBookingData] = useState({
    name: "",
    email: "",
    phone: "",
    doctorId: "",
    timeSlot: "",
    date: ""
  });
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const recognitionRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [clinicType, setClinicType] = useState('Morning Clinic - Ratnamukund Clinic, Warje');
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) {
      setError("Voice recognition is not supported in your browser.");
      return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setUserInput(transcript);
      handleUserInput(transcript);
    };

    recognition.onerror = () => {
      setError("Voice recognition failed. Please try again.");
      setIsRecording(false);
    };

    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
  }, []);

  const speak = (text) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 1;
      speechSynthesis.speak(utterance);
    }
  };

  const handleUserInput = async (input) => {
    if (!input.trim()) return;
    
    setIsLoading(true);
    setChatHistory(prev => [...prev, { role: "user", content: input }]);

    try {
      // First, check if it's a booking-related query
      if (bookingStep > 0 || input.toLowerCase().includes("book") || input.toLowerCase().includes("appointment")) {
        await handleBookingFlow(input);
      } else {
        // Otherwise, use Groq for general medical queries
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            chatHistory: [...chatHistory, { role: "user", content: input }]
          }),
        });

        if (!response.ok) throw new Error("Failed to get response from server");

        const data = await response.json();
        const assistantResponse = data.response;
        
        speak(assistantResponse);
        setChatHistory(prev => [...prev, { role: "assistant", content: assistantResponse }]);
      }
    } catch (error) {
      console.error(error);
      const errorMsg = "Sorry, there was an error processing your request.";
      speak(errorMsg);
      setChatHistory(prev => [...prev, { role: "assistant", content: errorMsg }]);
    } finally {
      setIsLoading(false);
      setUserInput("");
    }
  };

  const handleBookingFlow = async (input) => {
    try {
      switch(bookingStep) {
        case 0:
          setBookingStep(1);
          const namePrompt = "Please provide your name.";
          speak(namePrompt);
          setChatHistory(prev => [...prev, { role: "assistant", content: namePrompt }]);
          break;

        case 1:
          setBookingData(prev => ({ ...prev, name: input }));
          setBookingStep(2);
          const emailPrompt = "Thank you. Now please provide your email address.";
          speak(emailPrompt);
          setChatHistory(prev => [...prev, { role: "assistant", content: emailPrompt }]);
          break;

        case 2:
          setBookingData(prev => ({ ...prev, email: input }));
          setBookingStep(3);
          const phonePrompt = "Please provide your phone number.";
          speak(phonePrompt);
          setChatHistory(prev => [...prev, { role: "assistant", content: phonePrompt }]);
          break;

        case 3:
          setBookingData(prev => ({ ...prev, phone: input }));
          const doctors = await GlobalApi.getDoctorList();
          setAvailableDoctors(doctors.data.data);
          const doctorList = doctors.data.data.map(doc => 
            `Doctor ID: ${doc.id} - ${doc.attributes.Name}`
          ).join('\n');
          const doctorPrompt = `Here are the available doctors:\n${doctorList}\nPlease choose a doctor by saying their ID number.`;
          speak(doctorPrompt);
          setChatHistory(prev => [...prev, { role: "assistant", content: doctorPrompt }]);
          setBookingStep(4);
          break;

        case 4:
          const doctorId = parseInt(input);
          if (isNaN(doctorId)) {
            const errorMsg = "Please provide a valid doctor ID number.";
            speak(errorMsg);
            setChatHistory(prev => [...prev, { role: "assistant", content: errorMsg }]);
            break;
          }
          
          setBookingData(prev => ({ ...prev, doctorId }));
          const datePrompt = "Please provide your preferred appointment date in DD/MM/YYYY format.";
          speak(datePrompt);
          setChatHistory(prev => [...prev, { role: "assistant", content: datePrompt }]);
          setBookingStep(5);
          break;

        case 5:
          // Validate date format and check if it's not in the past
          const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
          const match = input.match(dateRegex);
          
          if (!match) {
            const errorMsg = "Please provide the date in DD/MM/YYYY format.";
            speak(errorMsg);
            setChatHistory(prev => [...prev, { role: "assistant", content: errorMsg }]);
            break;
          }

          const [, day, month, year] = match;
          const selectedDate = new Date(year, month - 1, day);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (selectedDate < today) {
            const errorMsg = "Please select a future date.";
            speak(errorMsg);
            setChatHistory(prev => [...prev, { role: "assistant", content: errorMsg }]);
            break;
          }

          if (selectedDate.getDay() === 0) {
            const errorMsg = "Sorry, we are closed on Sundays. Please select another date.";
            speak(errorMsg);
            setChatHistory(prev => [...prev, { role: "assistant", content: errorMsg }]);
            break;
          }

          setBookingData(prev => ({ ...prev, date: selectedDate.toLocaleDateString('en-CA') }));
          
          const clinicPrompt = `Please choose a clinic type:
1. Morning Clinic - Ratnamukund Clinic, Warje
2. Evening Clinic - Ratnamukund Clinic, Warje
3. AfterNoon Clinic - Shashwat Clinic, Pune
Please enter the number (1-3) for your choice.`;
          speak(clinicPrompt);
          setChatHistory(prev => [...prev, { role: "assistant", content: clinicPrompt }]);
          setBookingStep(6);
          break;

        case 6:
          let selectedClinic;
          switch(input.trim()) {
            case '1':
              selectedClinic = 'Morning Clinic - Ratnamukund Clinic, Warje';
              break;
            case '2':
              selectedClinic = 'Evening Clinic - Ratnamukund Clinic, Warje';
              break;
            case '3':
              selectedClinic = 'AfterNoon Clinic - Shashwat Clinic, Pune';
              break;
            default:
              const errorMsg = "Please select a valid clinic type (1-3).";
              speak(errorMsg);
              setChatHistory(prev => [...prev, { role: "assistant", content: errorMsg }]);
              return;
          }
          setClinicType(selectedClinic);

          // Get available time slots
          const slots = await getAvailableTimeSlots(
            bookingData.doctorId, 
            new Date(bookingData.date), 
            selectedClinic
          );
          
          if (slots.length === 0) {
            const noSlotsMsg = "No available time slots for the selected date and clinic type. Would you like to try another clinic type? (yes/no)";
            speak(noSlotsMsg);
            setChatHistory(prev => [...prev, { role: "assistant", content: noSlotsMsg }]);
            setBookingStep(6); // Stay on same step to allow retry
            break;
          }

          const slotsPrompt = `Available time slots are:\n${slots.join('\n')}\nPlease choose a time slot.`;
          speak(slotsPrompt);
          setChatHistory(prev => [...prev, { role: "assistant", content: slotsPrompt }]);
          setAvailableTimeSlots(slots);
          setBookingStep(7);
          break;

        case 7:
          const selectedTime = input.trim().toUpperCase();
          if (!availableTimeSlots.includes(selectedTime)) {
            const errorMsg = "Please select a valid time slot from the list provided.";
            speak(errorMsg);
            setChatHistory(prev => [...prev, { role: "assistant", content: errorMsg }]);
            break;
          }

          // Prepare and submit booking
          const appointmentData = {
            data: {
              UserName: bookingData.name,
              Email: bookingData.email,
              PhoneNumber: bookingData.phone,
              Time: selectedTime,
              Date: bookingData.date,
              doctor: bookingData.doctorId
            }
          };

          try {
            // Book the appointment
            await GlobalApi.bookAppointment(appointmentData);

            // Get doctor details for the message
            const doctorResponse = await GlobalApi.getDoctorById(bookingData.doctorId);
            const doctorName = doctorResponse.data.data.attributes.Name;

            // Prepare form data for the WhatsApp message
            const formData = {
              user_name: bookingData.name,
              user_phone: bookingData.phone,
              date: new Date(bookingData.date).toLocaleDateString('en-GB'), // Convert to DD/MM/YYYY format
              time: selectedTime,
              doctorName: doctorName
            };

            // Send WhatsApp message
            await sendMessage(formData);

            const confirmationMsg = "Your appointment has been successfully booked! You will receive a confirmation message shortly.";
            speak(confirmationMsg);
            setChatHistory(prev => [...prev, { role: "assistant", content: confirmationMsg }]);
            setBookingStep(0); // Reset booking flow
          } catch (error) {
            console.error("Booking failed:", error);
            const errorMsg = "Sorry, there was an error booking your appointment. Please try again.";
            speak(errorMsg);
            setChatHistory(prev => [...prev, { role: "assistant", content: errorMsg }]);
            setBookingStep(0);
          }
          break;
      }
    } catch (error) {
      console.error(error);
      const errorMsg = "Sorry, there was an error processing your booking request. Please try again.";
      speak(errorMsg);
      setChatHistory(prev => [...prev, { role: "assistant", content: errorMsg }]);
      setBookingStep(0);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
    setIsRecording(!isRecording);
  };

  const handleExtractedText = async (text) => {
    if (!text.trim()) return;
    
    setIsLoading(true);
    setChatHistory(prev => [...prev, { role: "user", content: text }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          chatHistory: [...chatHistory, { role: "user", content: text }]
        }),
      });

      if (!response.ok) throw new Error("Failed to get response from server");

      const data = await response.json();
      const assistantResponse = data.response;
      
      speak(assistantResponse);
      setChatHistory(prev => [...prev, { role: "assistant", content: assistantResponse }]);
    } catch (error) {
      console.error(error);
      const errorMsg = "Sorry, there was an error processing your request.";
      speak(errorMsg);
      setChatHistory(prev => [...prev, { role: "assistant", content: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-xl"
        >
          <ChatHeader onClose={onClose} />
          <ScrollArea className="h-[400px] p-4">
            {chatHistory.map((msg, idx) => (
              <ChatMessage key={idx} role={msg.role} content={msg.content} />
            ))}
            {isLoading && <TypingAnimation />}
            <div className="mt-4">
              <FileUploadHandler onExtractedText={handleExtractedText} />
            </div>
          </ScrollArea>
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <Textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1"
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleUserInput(userInput);
                  }
                }}
              />
              <div className="flex flex-col gap-2">
                <Button onClick={() => handleUserInput(userInput)}>
                  <Send className="w-4 h-4" />
                </Button>
                <Button variant="outline" onClick={toggleRecording}>
                  {isRecording ? 
                    <StopCircle className="w-4 h-4 text-red-500" /> : 
                    <Mic className="w-4 h-4" />
                  }
                </Button>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}