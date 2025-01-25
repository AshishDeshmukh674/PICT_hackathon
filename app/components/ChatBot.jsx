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

const LANGUAGE_OPTIONS = {
  en: "English",
  hi: "Hindi",
  mr: "Marathi",
  gu: "Gujarati"
};

const TRANSLATIONS = {
  en: {
    welcome: "Hello! I'm your medical assistant. How can I help you today? You can book an appointment or ask me health-related questions.",
    provideName: "Please provide your name.",
    provideEmail: "Thank you. Now please provide your email address.",
    providePhone: "Please provide your phone number.",
    chooseDoctorPrompt: "Here are the available doctors:\n{doctorList}\nPlease choose a doctor by saying their ID number.",
    invalidDoctorId: "Please provide a valid doctor ID number.",
    provideDate: "Please provide your preferred appointment date in DD/MM/YYYY format.",
    invalidDateFormat: "Please provide the date in DD/MM/YYYY format.",
    futureDateRequired: "Please select a future date.",
    closedSunday: "Sorry, we are closed on Sundays. Please select another date.",
    chooseClinic: `Please choose a clinic type:
1. Morning Clinic - Ratnamukund Clinic, Warje
2. Evening Clinic - Ratnamukund Clinic, Warje
3. AfterNoon Clinic - Shashwat Clinic, Pune
Please enter the number (1-3) for your choice.`,
    invalidClinic: "Please select a valid clinic type (1-3).",
    noTimeSlots: "No available time slots for the selected date and clinic type. Would you like to try another clinic type? (yes/no)",
    availableSlots: "Available time slots are:\n{slots}\nPlease choose a time slot.",
    invalidTimeSlot: "Please select a valid time slot from the list provided.",
    bookingSuccess: "Your appointment has been successfully booked! You will receive a confirmation message shortly.",
    bookingError: "Sorry, there was an error booking your appointment. Please try again.",
    processingError: "Sorry, there was an error processing your booking request. Please try again."
  },
  hi: {
    welcome: "नमस्ते! मैं आपका मेडिकल असिस्टेंट हूं। मैं आपकी कैसे मदद कर सकता हूं? आप अपॉइंटमेंट बुक कर सकते हैं या स्वास्थ्य संबंधी प्रश्न पूछ सकते हैं।",
    provideName: "कृपया अपना नाम बताएं।",
    provideEmail: "धन्यवाद। अब कृपया अपना ईमेल पता प्रदान करें।",
    providePhone: "कृपया अपना फोन नंबर प्रदान करें।",
    chooseDoctorPrompt: "उपलब्ध डॉक्टर यहां हैं:\n{doctorList}\nकृपया उनका ID नंबर बोलकर डॉक्टर चुनें।",
    invalidDoctorId: "कृपया एक वैध डॉक्टर ID नंबर प्रदान करें।",
    provideDate: "कृपया DD/MM/YYYY प्रारूप में अपनी पसंदीदा अपॉइंटमेंट तिथि प्रदान करें।",
    invalidDateFormat: "कृपया तिथि DD/MM/YYYY प्रारूप में प्रदान करें।",
    futureDateRequired: "कृपया भविष्य की तिथि चुनें।",
    closedSunday: "क्षमा करें, हम रविवार को बंद हैं। कृपया कोई अन्य तिथि चुनें।",
    chooseClinic: `कृपया क्लिनिक का प्रकार चुनें:
1. सुबह का क्लिनिक - रत्नमुकुंद क्लिनिक, वारजे
2. शाम का क्लिनिक - रत्नमुकुंद क्लिनिक, वारजे
3. दोपहर का क्लिनिक - शाश्वत क्लिनिक, पुणे
कृपया अपनी पसंद के लिए नंबर (1-3) दर्ज करें।`,
    invalidClinic: "कृपया वैध क्लिनिक प्रकार (1-3) चुनें।",
    noTimeSlots: "चयनित तिथि और क्लिनिक प्रकार के लिए कोई समय स्लॉट उपलब्ध नहीं है। क्या आप दूसरा क्लिनिक प्रकार आज़माना चाहेंगे? (हां/नहीं)",
    availableSlots: "उपलब्ध समय स्लॉट हैं:\n{slots}\nकृपया एक समय स्लॉट चुनें।",
    invalidTimeSlot: "कृपया दी गई सूची से एक वैध समय स्लॉट चुनें।",
    bookingSuccess: "आपका अपॉइंटमेंट सफलतापूर्वक बुक कर लिया गया है! आपको जल्द ही एक पुष्टिकरण संदेश प्राप्त होगा।",
    bookingError: "क्षमा करें, आपका अपॉइंटमेंट बुक करने में एक त्रुटि हुई। कृपया पुनः प्रयास करें।",
    processingError: "क्षमा करें, आपके बुकिंग अनुरोध को संसाधित करने में एक त्रुटि हुई। कृपया पुनः प्रयास करें।"
  },
  mr: {
    welcome: "नमस्कार! मी तुमचा मेडिकल असिस्टंट आहे. मी तुम्हाला कशी मदत करू शकतो? तुम्ही अपॉइंटमेंट बुक करू शकता किंवा आरोग्याशी संबंधित प्रश्न विचारू शकता.",
    provideName: "कृपया तुमचे नाव सांगा.",
    provideEmail: "धन्यवाद. आता कृपया तुमचा ईमेल पत्ता द्या.",
    providePhone: "कृपया तुमचा फोन नंबर द्या.",
    // ... Add other Marathi translations
  },
  gu: {
    welcome: "નમસ્તે! હું તમારો મેડિકલ આસિસ્ટન્ટ છું. હું તમને કેવી રીતે મદદ કરી શકું? તમે એપોઇન્ટમેન્ટ બુક કરી શકો છો અથવા આરોગ્ય સંબંધિત પ્રશ્નો પૂછી શકો છો.",
    provideName: "કૃપા કરીને તમારું નામ આપો.",
    provideEmail: "આભાર. હવે કૃપા કરીને તમારું ઈમેઈલ સરનામું આપો.",
    providePhone: "કૃપા કરીને તમારો ફોન નંબર આપો.",
    // ... Add other Gujarati translations
  }
};

const NUMBER_WORDS = {
  hi: {
    'एक': '1', 'दो': '2', 'तीन': '3', 'चार': '4', 'पांच': '5',
    'छह': '6', 'सात': '7', 'आठ': '8', 'नौ': '9', 'दस': '10'
  },
  mr: {
    'एक': '1', 'दोन': '2', 'तीन': '3', 'चार': '4', 'पाच': '5',
    'सहा': '6', 'सात': '7', 'आठ': '8', 'नऊ': '9', 'दहा': '10'
  },
  gu: {
    'એક': '1', 'બે': '2', 'ત્રણ': '3', 'ચાર': '4', 'પાંચ': '5',
    'છ': '6', 'સાત': '7', 'આઠ': '8', 'નવ': '9', 'દસ': '10'
  },
  en: {
    'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
    'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10'
  }
};

const convertNumberWordsToDigits = (input, language) => {
  if (!input) return input;
  
  let processedInput = input.toLowerCase();
  const numberMap = NUMBER_WORDS[language] || NUMBER_WORDS.en;
  
  // Replace number words with digits
  Object.entries(numberMap).forEach(([word, digit]) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    processedInput = processedInput.replace(regex, digit);
  });
  
  return processedInput;
};

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
    { role: "assistant", content: TRANSLATIONS.en.welcome }
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
  const [clinicType, setClinicType] = useState('Morning Clinic - Ratnamukund Clinic, Warje');
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef(null);

  const forceLoadVoices = () => {
    return new Promise((resolve) => {
      const voices = speechSynthesis.getVoices();
      if (voices.length) {
        resolve(voices);
        return;
      }
      
      speechSynthesis.onvoiceschanged = () => {
        resolve(speechSynthesis.getVoices());
      };
    });
  };

  const speak = async (text) => {
    if ("speechSynthesis" in window) {
      try {
        if (speechSynthesis.speaking) {
          speechSynthesis.cancel();
        }

        const voices = await forceLoadVoices();
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Language configurations with fallbacks
        const languageConfig = {
          en: {
            lang: "en-US",
            fallbackLangs: ["en-GB", "en"],
            preferredVoices: ["Google US English", "Microsoft David", "Alex"]
          },
          hi: {
            lang: "hi-IN",
            fallbackLangs: ["hi"],
            preferredVoices: ["Google हिन्दी", "Microsoft Hemant"]
          },
          mr: {
            lang: "mr-IN",
            fallbackLangs: ["mr"],
            preferredVoices: ["Google मराठी", "Microsoft Marathi"]
          },
          gu: {
            lang: "gu-IN",
            fallbackLangs: ["gu"],
            preferredVoices: ["Google ગુજરાતી", "Microsoft Gujarati"]
          }
        };

        const config = languageConfig[selectedLanguage] || languageConfig.en;
        utterance.lang = config.lang;

        // Find the best matching voice
        let selectedVoice = null;

        // Voice selection logic...
        for (const preferredVoice of config.preferredVoices) {
          selectedVoice = voices.find(voice => 
            voice.name.includes(preferredVoice) || 
            voice.voiceURI.includes(preferredVoice)
          );
          if (selectedVoice) break;
        }

        if (!selectedVoice) {
          selectedVoice = voices.find(voice => voice.lang === config.lang);
        }

        if (!selectedVoice) {
          for (const fallbackLang of config.fallbackLangs) {
            selectedVoice = voices.find(voice => 
              voice.lang.startsWith(fallbackLang)
            );
            if (selectedVoice) break;
          }
        }

        if (!selectedVoice) {
          const langCode = config.lang.split('-')[0];
          selectedVoice = voices.find(voice => 
            voice.lang.includes(langCode)
          );
        }

        if (selectedVoice) {
          utterance.voice = selectedVoice;
          console.log(`Using voice: ${selectedVoice.name} (${selectedVoice.lang})`);
        }

        utterance.rate = selectedLanguage === 'en' ? 1 : 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event);
          setIsSpeaking(false);
        };

        speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('Error in speak function:', error);
        setIsSpeaking(false);
      }
    }
  };

  useEffect(() => {
    const loadAndLogVoices = async () => {
      try {
        const voices = await forceLoadVoices();
        console.log('Available voices:', voices.map(voice => ({
          name: voice.name,
          lang: voice.lang,
          voiceURI: voice.voiceURI,
          default: voice.default,
          localService: voice.localService
        })));
      } catch (error) {
        console.error('Error loading voices:', error);
      }
    };

    loadAndLogVoices();

    return () => {
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) {
      setError("Voice recognition is not supported in your browser.");
      return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.lang = selectedLanguage === "en" ? "en-US" : 
                      selectedLanguage === "hi" ? "hi-IN" : 
                      selectedLanguage === "mr" ? "mr-IN" : 
                      selectedLanguage === "gu" ? "gu-IN" : "en-US";
    recognition.interimResults = false;

    let isProcessing = false;

    recognition.onresult = async (event) => {
      if (isProcessing) return;
      isProcessing = true;
      
      const transcript = event.results[0][0].transcript;
      setUserInput(transcript);
      
      try {
        if (bookingStep > 0) {
          await handleBookingFlow(transcript);
        } else {
          await handleUserInput(transcript);
        }
      } finally {
        isProcessing = false;
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== 'aborted') {
        setError("Voice recognition failed. Please try again.");
      }
      setIsRecording(false);
      isProcessing = false;
    };

    recognition.onend = () => {
      setIsRecording(false);
      // Only restart if we're in booking flow and not processing
      if (bookingStep > 0 && !isProcessing && !error) {
        setTimeout(() => {
          try {
            if (!recognition.started) {
              recognition.start();
              setIsRecording(true);
            }
          } catch (error) {
            console.error("Failed to restart recognition:", error);
          }
        }, 1000);
      }
    };

    recognition.started = false;
    recognition.onstart = () => {
      recognition.started = true;
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognition.started) {
        recognition.stop();
      }
    };
  }, [bookingStep, selectedLanguage]);

  const handleUserInput = async (input) => {
    if (!input.trim()) return;
    
    setIsLoading(true);
    setChatHistory(prev => [...prev, { role: "user", content: input }]);

    try {
      // Check if we should start booking flow
      if (input.toLowerCase().includes("book") || 
          input.toLowerCase().includes("appointment") || 
          input.toLowerCase().includes("अपॉइंटमेंट") || 
          input.toLowerCase().includes("बुक")) {
        setBookingStep(1);
        const messages = TRANSLATIONS[selectedLanguage] || TRANSLATIONS.en;
        await speak(messages.provideName);
        setChatHistory(prev => [...prev, { 
          role: "assistant", 
          content: messages.provideName 
        }]);
      } else if (bookingStep > 0) {
        // If already in booking flow, continue with it
        await handleBookingFlow(input);
      } else {
        // Normal chat flow
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            chatHistory: [...chatHistory, { role: "user", content: input }],
            language: selectedLanguage
          }),
        });

        if (!response.ok) throw new Error("Failed to get response from server");

        const data = await response.json();
        await speak(data.response);
        setChatHistory(prev => [...prev, { 
          role: "assistant", 
          content: data.response
        }]);
      }
    } catch (error) {
      console.error(error);
      const errorMsg = "Sorry, there was an error processing your request.";
      await speak(errorMsg);
      setChatHistory(prev => [...prev, { role: "assistant", content: errorMsg }]);
    } finally {
      setIsLoading(false);
      setUserInput("");
    }
  };

  const handleBookingFlow = async (input) => {
    const messages = TRANSLATIONS[selectedLanguage] || TRANSLATIONS.en;
    
    try {
      switch(bookingStep) {
        case 0:
          setBookingStep(1);
          await speak(messages.provideName);
          setChatHistory(prev => [...prev, { role: "assistant", content: messages.provideName }]);
          break;

        case 1:
          setBookingData(prev => ({ ...prev, name: input }));
          setBookingStep(2);
          await speak(messages.provideEmail);
          setChatHistory(prev => [...prev, { role: "assistant", content: messages.provideEmail }]);
          break;

        case 2:
          setBookingData(prev => ({ ...prev, email: input }));
          setBookingStep(3);
          await speak(messages.providePhone);
          setChatHistory(prev => [...prev, { role: "assistant", content: messages.providePhone }]);
          break;

        case 3:
          setBookingData(prev => ({ ...prev, phone: input }));
          const doctors = await GlobalApi.getDoctorList();
          setAvailableDoctors(doctors.data.data);
          const doctorList = doctors.data.data.map(doc => 
            `Doctor ID: ${doc.id} - ${doc.attributes.Name}`
          ).join('\n');
          const doctorPrompt = messages.chooseDoctorPrompt.replace('{doctorList}', doctorList);
          await speak(doctorPrompt);
          setChatHistory(prev => [...prev, { role: "assistant", content: doctorPrompt }]);
          setBookingStep(4);
          break;

        case 4:
          // Convert number words to digits before parsing
          const processedInput = convertNumberWordsToDigits(input, selectedLanguage);
          const doctorId = parseInt(processedInput);
          
          if (isNaN(doctorId) || !availableDoctors.some(doc => doc.id === doctorId)) {
            const errorMsg = messages.invalidDoctorId;
            await speak(errorMsg);
            setChatHistory(prev => [...prev, { role: "assistant", content: errorMsg }]);
            break;
          }
          
          setBookingData(prev => ({ ...prev, doctorId }));
          const datePrompt = messages.provideDate;
          await speak(datePrompt);
          setChatHistory(prev => [...prev, { role: "assistant", content: datePrompt }]);
          setBookingStep(5);
          break;

        case 5:
          // Validate date format and check if it's not in the past
          const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
          const match = input.match(dateRegex);
          
          if (!match) {
            const errorMsg = messages.invalidDateFormat;
            await speak(errorMsg);
            setChatHistory(prev => [...prev, { role: "assistant", content: errorMsg }]);
            break;
          }

          const [, day, month, year] = match;
          const selectedDate = new Date(year, month - 1, day);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (selectedDate < today) {
            const errorMsg = messages.futureDateRequired;
            await speak(errorMsg);
            setChatHistory(prev => [...prev, { role: "assistant", content: errorMsg }]);
            break;
          }

          if (selectedDate.getDay() === 0) {
            const errorMsg = messages.closedSunday;
            await speak(errorMsg);
            setChatHistory(prev => [...prev, { role: "assistant", content: errorMsg }]);
            break;
          }

          setBookingData(prev => ({ ...prev, date: selectedDate.toLocaleDateString('en-CA') }));
          
          const clinicPrompt = messages.chooseClinic;
          await speak(clinicPrompt);
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
              const errorMsg = messages.invalidClinic;
              await speak(errorMsg);
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
            const noSlotsMsg = messages.noTimeSlots;
            await speak(noSlotsMsg);
            setChatHistory(prev => [...prev, { role: "assistant", content: noSlotsMsg }]);
            setBookingStep(6); // Stay on same step to allow retry
            break;
          }

          const slotsPrompt = messages.availableSlots.replace('{slots}', slots.join('\n'));
          await speak(slotsPrompt);
          setChatHistory(prev => [...prev, { role: "assistant", content: slotsPrompt }]);
          setAvailableTimeSlots(slots);
          setBookingStep(7);
          break;

        case 7:
          const selectedTime = input.trim().toUpperCase();
          if (!availableTimeSlots.includes(selectedTime)) {
            const errorMsg = messages.invalidTimeSlot;
            await speak(errorMsg);
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

            const confirmationMsg = messages.bookingSuccess;
            await speak(confirmationMsg);
            setChatHistory(prev => [...prev, { role: "assistant", content: confirmationMsg }]);
            setBookingStep(0); // Reset booking flow
          } catch (error) {
            console.error("Booking failed:", error);
            const errorMsg = messages.bookingError;
            await speak(errorMsg);
            setChatHistory(prev => [...prev, { role: "assistant", content: errorMsg }]);
            setBookingStep(0);
          }
          break;
      }
    } catch (error) {
      console.error(error);
      await speak(messages.processingError);
      setChatHistory(prev => [...prev, { role: "assistant", content: messages.processingError }]);
      setBookingStep(0);
    }
  };

  const startVoiceRecognition = () => {
    if (recognitionRef.current && !recognitionRef.current.started) {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Failed to start recognition:", error);
        setError("Failed to start voice recognition. Please try again.");
      }
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current?.started) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      startVoiceRecognition();
    }
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
      
      await speak(assistantResponse);
      setChatHistory(prev => [...prev, { role: "assistant", content: assistantResponse }]);
    } catch (error) {
      console.error(error);
      const errorMsg = "Sorry, there was an error processing your request.";
      await speak(errorMsg);
      setChatHistory(prev => [...prev, { role: "assistant", content: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (chatHistory.length === 1 && chatHistory[0].role === "assistant") {
      setChatHistory([{ 
        role: "assistant", 
        content: TRANSLATIONS[selectedLanguage].welcome 
      }]);
    }
  }, [selectedLanguage]);

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
            <div className="flex justify-end mb-2">
              <select 
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="p-2 border rounded-md text-sm"
              >
                {Object.entries(LANGUAGE_OPTIONS).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
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
                {isSpeaking && (
                  <Button 
                    variant="destructive" 
                    onClick={() => speechSynthesis.cancel()}
                    title="Stop Speaking"
                  >
                    <StopCircle className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}