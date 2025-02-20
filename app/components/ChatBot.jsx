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
import { doctorTypes, extractDoctorType } from './doctorTypes';
import { getFirestore, doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { app, auth } from '../config/FirebaseConfig';
import { onAuthStateChanged } from "firebase/auth";
import { useSpacebarHandler } from '../hooks/useSpacebarHandler';
import { toast } from 'react-toastify';

const LANGUAGE_OPTIONS = {
  en: "English",
  hi: "Hindi", 
  mr: "Marathi",
  gu: "Gujarati"
};
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
  mr: {  // Marathi uses Hindi config
    lang: "hi-IN",
    fallbackLangs: ["hi"],
    preferredVoices: ["Microsoft Hemant", "Google हिन्दी"]
  },
  gu: {  // Gujarati uses Hindi config
    lang: "hi-IN",
    fallbackLangs: ["hi"],
    preferredVoices: ["Microsoft Hemant", "Google हिन्दी"]
  }
};
const VOICE_CONFIG = {
  en: { lang: 'en-US', voiceName: 'Google US English' },
  hi: { lang: 'hi-IN', voiceName: 'Microsoft Hemant - Hindi (India)' },
  mr: { lang: 'mr-IN', voiceName: 'Microsoft Hemant - Hindi (India)' },
  gu: { lang: 'gu-IN', voiceName: 'Microsoft Hemant - Hindi (India)' }
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
    processingError: "Sorry, there was an error processing your booking request. Please try again.",
    cancelPrompt: "Please provide your email address to cancel the appointment.",
    cancelDatePrompt: "Please provide the appointment date to cancel (DD/MM/YYYY format).",
    cancelSuccess: "Your appointment has been successfully cancelled.",
    cancelNoAppointment: "No appointments found for the provided email and date.",
    cancelError: "There was an error cancelling your appointment. Please try again.",
    provideMeetingEmail: "Please provide your email address to schedule a meeting.",
    invalidEmail: "Please provide a valid email address.",
    invalidDate: "Please provide a valid date format.",
    errorFetchingSlots: "There was an error fetching the time slots. Please try again."
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
    processingError: "क्षमा करें, आपके बुकिंग अनुरोध को संसाधित करने में एक त्रुटि हुई। कृपया पुनः प्रयास करें।",
    cancelPrompt: "अपॉइंटमेंट रद्द करने के लिए कृपया अपना ईमेल पता प्रदान करें।",
    cancelDatePrompt: "कृपया रद्द करने के लिए अपॉइंटमेंट की तारीख प्रदान करें (DD/MM/YYYY प्रारूप)।",
    cancelSuccess: "आपका अपॉइंटमेंट सफलतापूर्वक रद्द कर दिया गया है।",
    cancelNoAppointment: "दिए गए ईमेल और तारीख के लिए कोई अपॉइंटमेंट नहीं मिला।",
    cancelError: "आपका अपॉइंटमेंट रद्द करने में एक त्रुटि हुई। कृपया पुनः प्रयास करें।",
    provideMeetingEmail: "बैठक शेड्यूल करने के लिए कृपया अपना ईमेल पता प्रदान करें।",
    invalidEmail: "कृपया एक वैध ईमेल पता प्रदान करें।",
    invalidDate: "कृपया एक वैध तिथि प्रदान करें।",
    errorFetchingSlots: "कृपया समय स्लॉट फेचवाने में एक त्रुटि हुई। कृपया पुनः प्रयास करें।"
  },
  mr: {
    welcome: "नमस्कार! मी तुमचा मेडिकल असिस्टंट आहे. मी तुम्हाला कशी मदत करू शकतो? तुम्ही अपॉइंटमेंट बुक करू शकता किंवा आरोग्याशी संबंधित प्रश्न विचारू शकता.",
    provideName: "कृपया तुमचे नाव सांगा.",
    provideEmail: "धन्यवाद. आता कृपया तुमचा ईमेल पत्ता द्या.",
    providePhone: "कृपया तुमचा फोन नंबर द्या.",
    // ... Add other Marathi translations
    provideMeetingEmail: "मीटिंग शेड्यूल करण्यासाठी कृपया तुमचा ईमेल पत्ता द्या.",
    invalidEmail: "कृपया वैध ईमेल पत्ता द्या.",
    invalidDate: "कृपया एक वैध तिथि प्रदान करें।",
    errorFetchingSlots: "कृपया समय स्लॉट फेचवाने में एक त्रुटि हुई। कृपया पुनः प्रयास करें।"
  },
  gu: {
    welcome: "નમસ્તે! હું તમારો મેડિકલ આસિસ્ટન્ટ છું. હું તમને કેવી રીતે મદદ કરી શકું? તમે એપોઇન્ટમેન્ટ બુક કરી શકો છો અથવા આરોગ્ય સંબંધિત પ્રશ્નો પૂછી શકો છો.",
    provideName: "કૃપા કરીને તમારું નામ આપો.",
    provideEmail: "આભાર. હવે કૃપા કરીને તમારું ઈમેઈલ સરનામું આપો.",
    providePhone: "કૃપા કરીને તમારો ફોન નંબર આપો.",
    // ... Add other Gujarati translations
    provideMeetingEmail: "મીટિંગ શેડ્યૂલ કરવા માટે કૃપા કરીને તમારું ઈમેઈલ સરનામું આપો.",
    invalidEmail: "કૃપા કરીને માન્ય ઈમેઈલ સરનામું આપો.",
    invalidDate: "કૃપા કરીને એક વैધ તિથિ પ્રદાન કરો.",
    errorFetchingSlots: "કૃપા સમય સ્લોટ ફેચવામાં એક ત્રુટિ હોઈ. કૃપા પુનઃ પ્રયાસ કરો."
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
    'છ': '6', 'सात': '7', 'आठ': '8', 'નવ': '9', 'દસ': '10'
  },
  en: {
    'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
    'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10'
  }
};

const TIME_WORDS = {
  hi: {
    'सुबह': 'AM',
    'दोपहर': 'PM',
    'शाम': 'PM',
    'रात': 'PM',
    'एएम': 'AM',
    'पीएम': 'PM',
    'बजे': '',
    'साढ़े': ':30',
    'पौने': ':45',
    'पंद्रह': ':15',
    'एक': '1',
    'दो': '2',
    'तीन': '3',
    'चार': '4',
    'पांच': '5',
    'छह': '6',
    'सात': '7',
    'आठ': '8',
    'नौ': '9',
    'दस': '10',
    'ग्यारह': '11',
    'बारह': '12'
  },
  mr: {
    'सकाळी': 'AM',
    'दुपारी': 'PM',
    'संध्याकाळी': 'PM',
    'रात्री': 'PM',
    'एएम': 'AM',
    'पीएम': 'PM',
    'वाजता': '',
    'साडे': ':30',
    'पाऊण': ':45',
    'पंधरा': ':15',
    'एक': '1',
    'दोन': '2',
    'तीन': '3',
    'चार': '4',
    'पाच': '5',
    'सहा': '6',
    'सात': '7',
    'आठ': '8',
    'नऊ': '9',
    'दहा': '10',
    'अकरा': '11',
    'बारा': '12'
  }
};

const convertNumberWordsToDigits = (input, language) => {
  if (!input) return input;
  
  // Clean and normalize the input
  let processedInput = cleanInputText(input).toLowerCase();
  const numberMap = NUMBER_WORDS[language] || NUMBER_WORDS.en;
  
  // First try exact match for the entire input
  if (numberMap[processedInput]) {
    return numberMap[processedInput];
  }
  
  // Then try word by word replacement
  processedInput = processedInput.split(' ').map(word => {
    return numberMap[word] || word;
  }).join(' ');
  
  // Extract the first number found
  const numberMatch = processedInput.match(/\d+/);
  if (numberMatch) {
    return numberMatch[0];
  }
  
  return processedInput;
};

// Modify the cleanInputText function
const cleanInputText = (text) => {
  if (!text) return text;
  
  // Remove special characters like ।, |, ॥, and trailing dots
  return text
    .replace(/[।|॥]/g, '') // Remove Hindi/Marathi punctuation
    .replace(/\.$/, '')     // Remove trailing dot
    .replace(/\.(?!\d)/g, '') // Remove dots that aren't part of numbers
    .trim();
};

// Add this helper function to convert time expressions
const convertTimeExpression = (input, language) => {
  if (!input || !TIME_WORDS[language]) return input;

  let timeStr = input.trim();
  const timeWords = TIME_WORDS[language];
  
  // Convert time period (AM/PM)
  Object.entries(timeWords).forEach(([word, value]) => {
    const regex = new RegExp(word, 'gi');
    timeStr = timeStr.replace(regex, value);
  });

  // Extract hours, minutes, and period
  const timeMatch = timeStr.match(/(\d+)(?::(\d+))?\s*(AM|PM)?/i);
  if (!timeMatch) return input;

  let [, hours, minutes = '00', period] = timeMatch;
  hours = parseInt(hours);

  // Handle time period context
  if (!period) {
    if (timeStr.includes('दोपहर') || timeStr.includes('शाम') || timeStr.includes('रात') ||
        timeStr.includes('दुपारी') || timeStr.includes('संध्याकाळी') || timeStr.includes('रात्री')) {
      period = 'PM';
    } else if (timeStr.includes('सुबह') || timeStr.includes('सकाळी')) {
      period = 'AM';
    }
  }

  // Adjust hours for PM
  if (period === 'PM' && hours < 12) {
    hours += 12;
  }
  if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  // Format time in 12-hour format
  const formattedHours = hours % 12 || 12;
  const formattedTime = `${formattedHours}:${minutes.padStart(2, '0')} ${period || 'AM'}`;

  return formattedTime;
};

// Add this constant for symptom detection
const SYMPTOM_INDICATORS = {
  en: ['symptom', 'feeling', 'suffering', 'pain', 'ache', 'discomfort', 'having', 'experiencing', 'hurts'],
  hi: ['लक्षण', 'दर्द', 'तकलीफ', 'परेशानी', 'बीमारी', 'समस्या', 'महसूस', 'पीड़ा'],
  mr: ['लक्षण', 'वेदना', 'त्रास', 'आजार', 'समस्या', 'दुखणे', 'जाणवत', 'आजारपण'],
  gu: ['લક્ષણ', 'દર્દ', 'તકલીફ', 'બીમારી', 'સમસ્યા', 'પીડા', 'દુખાવો']
};

// Add this function to detect and extract symptoms
const extractSymptoms = (input, language) => {
  const indicators = SYMPTOM_INDICATORS[language] || SYMPTOM_INDICATORS.en;
  
  // Check if input contains any symptom indicators
  const hasSymptomIndicator = indicators.some(indicator => 
    input.toLowerCase().includes(indicator.toLowerCase())
  );

  if (hasSymptomIndicator) {
    // Clean the input by removing common phrases
    let symptomText = input;
    const commonPhrases = {
      en: ['i am', 'i have', 'i am having', 'suffering from', 'experiencing'],
      hi: ['मुझे', 'मैं', 'मुझको', 'हो रहा है', 'महसूस कर रहा हूं'],
      mr: ['मला', 'मी', 'आहे', 'होत आहे', 'जाणवत आहे'],
      gu: ['મને', 'હું', 'છે', 'થાય છે']
    };

    (commonPhrases[language] || []).forEach(phrase => {
      symptomText = symptomText.replace(new RegExp(phrase, 'gi'), '');
    });

    return symptomText.trim();
    console.log(symptomText);
  }
  return null;
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

// Update the getTimeSlotsForDoctor function
const getTimeSlotsForDoctor = (doctorId, forMeeting = false) => {
  if (forMeeting) {
    // Time slots for meetings (from PreviewMeeting.jsx)
  const doctorTimeSlots = {
      '3': { 
        'Evening Clinic': [[20, 0], [22, 0]] // 8 PM to 10 PM
      },
    '4': { 
        'Evening Clinic': [[20, 0], [22, 0]]
    },
    '5': {
        'Evening Clinic': [[20, 0], [22, 0]]
      },
      '7': { 
        'Evening Clinic': [[20, 0], [22, 0]]
      }
    };
    return doctorTimeSlots[doctorId] || { 'Evening Clinic': [[20, 0], [22, 0]] }; // Default 8 PM to 10 PM
  } else {
    // Time slots for appointments (from BookAppointment.jsx)
    const doctorTimeSlots = {
      '3': {
        'Morning Clinic': [[8, 30], [11, 30]],
        'Evening Clinic': [[16, 0], [20, 0]],
        'AfterNoon Clinic': [[13, 0], [16, 0]]
      },
      '4': {
        'Morning Clinic': [[8, 0], [12, 0]],
        'Evening Clinic': [[16, 0], [20, 0]],
        'AfterNoon Clinic': [[13, 0], [16, 0]]
      },
      '5': {
        'Morning Clinic': [[8, 30], [12, 0]],
        'Evening Clinic': [[16, 0], [21, 0]],
        'AfterNoon Clinic': [[13, 0], [16, 0]]
      },
      '7': {
        'Morning Clinic': [[8, 0], [12, 0]],
        'Evening Clinic': [[16, 0], [20, 0]],
        'AfterNoon Clinic': [[13, 0], [16, 0]]
      }
    };
    return doctorTimeSlots[doctorId] || {
      'Morning Clinic': [[9, 0], [12, 0]],
      'Evening Clinic': [[16, 0], [20, 0]],
      'AfterNoon Clinic': [[13, 0], [16, 0]]
    };
  }
};

// Update the createTimeSlots function to handle the new time slot structure
const createTimeSlots = (date, doctorId, interval = 30, bookedSlots = []) => {
  const timeList = [];
  const doctorSlots = getTimeSlotsForDoctor(doctorId, true); // For meetings
  const eveningSlots = doctorSlots['Evening Clinic']; // Get Evening Clinic slots

  if (!eveningSlots) {
    console.error('No evening slots found for doctor:', doctorId);
    return [];
  }

  const isToday = isSameDay(date, new Date());
  const now = new Date();

  let [currentHour, currentMinutes] = eveningSlots[0];
  const [endHour, endMinutes] = eveningSlots[1];

  while (currentHour < endHour || (currentHour === endHour && currentMinutes < endMinutes)) {
    const slotTime = new Date(date);
    slotTime.setHours(currentHour, currentMinutes);

    if (isToday && slotTime <= now) {
      currentMinutes += interval;
      if (currentMinutes >= 60) {
        currentHour += Math.floor(currentMinutes / 60);
        currentMinutes = currentMinutes % 60;
      }
      continue;
    }

    const formattedTime = formatTime(slotTime);
    if (!bookedSlots.includes(formattedTime)) {
      timeList.push(formattedTime);
    }

    currentMinutes += interval;
    if (currentMinutes >= 60) {
      currentHour += Math.floor(currentMinutes / 60);
      currentMinutes = currentMinutes % 60;
    }
  }

  return timeList;
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

// Update the getAvailableTimeSlots function to handle clinic type properly
const getAvailableTimeSlots = async (doctorId, date, clinicType) => {
  try {
    const dateStr = date.toLocaleDateString('en-CA');
    const response = await GlobalApi.getDoctorAppointmentsByDate(doctorId, dateStr);
    const bookedSlots = response.data.data
      ? response.data.data.map(appointment => appointment.attributes.Time)
      : [];

    const timeList = [];
    const clinicTypeShort = clinicType.split(" - ")[0]; // Extract just the clinic type without location
    const doctorSlots = getTimeSlotsForDoctor(doctorId.toString(), false); // For appointments
    
    if (!doctorSlots[clinicTypeShort]) {
      console.error('No slots found for clinic type:', clinicTypeShort);
      return [];
    }

    const [startSlot, endSlot] = doctorSlots[clinicTypeShort];
    const isToday = isSameDay(date, new Date());
    const now = new Date();

    let currentHour = startSlot[0];
    let currentMinutes = startSlot[1];
    const endHour = endSlot[0];
    const endMinutes = endSlot[1];

    while (
      currentHour < endHour || 
      (currentHour === endHour && currentMinutes <= endMinutes)
    ) {
        const slotTime = new Date(date);
        slotTime.setHours(currentHour, currentMinutes);

        if (isToday && slotTime <= now) {
          currentMinutes += 15;
        if (currentMinutes >= 60) {
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
      if (currentMinutes >= 60) {
          currentHour++;
          currentMinutes = 0;
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
            name: "pict_wp_2",
            language: { code: "en" },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: formData.user_name },      // {{1}}
                  { type: "text", text: formData.user_phone },     // {{2}}
                  { type: "text", text: formData.date },           // {{3}}
                  { type: "text", text: formData.time },           // {{4}}
                  { type: "text", text: formData.doctorName },     // {{5}}
                  { type: "text", text: formData.symptoms || "No symptoms mentioned" }  // {{6}}
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
        throw new Error(`Failed to send message to ${number}`);
      }
    });

    await Promise.all(promises);
    return "Your message has been sent successfully to all recipients.";
  } catch (error) {
    console.error(`Failed to send message: ${error.message}`);
    throw new Error(`Failed to send message: ${error.message}`);
  }
};

// Add this function to check if the API response is valid
const isValidDoctorResponse = (response) => {
  return response?.data?.data && 
         Array.isArray(response.data.data) && 
         response.data.data.length > 0 &&
         response.data.data.every(doc => doc.id && doc.attributes?.Name);
};

// Fix the checkChatMemory function
const checkChatMemory = async () => {
  try {
    const response = await fetch('/api/chatMemory');
    if (!response.ok) throw new Error('Failed to fetch chat memory');
    const memory = await response.json();
    return memory; // Return the whole response
  } catch (error) {
    console.error('Error fetching chat memory:', error);
    // Return a default structure if there's an error
    return {
      data: {
        UserName: null,
        Email: null,
        Time: null,
        Date: null,
        doctor: null,
        PhoneNumber: null
      },
      lastUpdated: null
    };
  }
};

// Add this function to clear chat memory
const clearChatMemory = async () => {
  try {
    console.log('Clearing chat memory...');
    const emptyMemory = {
      data: {
        UserName: null,
        Email: null,
        Time: null,
        Date: null,
        doctor: null,
        PhoneNumber: null
      },
      lastUpdated: new Date().toISOString()
    };

    const response = await fetch('/api/chatHistory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        chatHistory: [],
        clearMemory: true  // Add this flag to indicate clearing memory
      })
    });

    if (!response.ok) {
      throw new Error('Failed to clear chat memory');
    }
    console.log('Chat memory cleared successfully');
  } catch (error) {
    console.error('Error clearing chat memory:', error);
  }
};

const updateChatMemory = async (data) => {
  try {
    const response = await fetch('/api/updateChatMemory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update chat memory');
    }
    
    console.log('Chat memory updated successfully');
  } catch (error) {
    console.error('Error updating chat memory:', error);
  }
};

export default function ChatBot({ isOpen, onClose, onOpen }) {
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
  const [cancelStep, setCancelStep] = useState(0);
  const [cancelData, setCancelData] = useState({
    email: "",
    date: ""
  });
  const [meetingStep, setMeetingStep] = useState(0);
  const [meetingData, setMeetingData] = useState({
    eventName: "",
    duration: 30,
    locationType: "",
    locationUrl: "",
    themeColor: "#4F46E5", // Default indigo color
    doctorId: "",
    selectedDate: "",
    selectedTime: "",
    clinicType: "Evening Clinic",
    userEmail: "",
  });

  const [currentUser, setCurrentUser] = useState(null);
  const [canStartRecording, setCanStartRecording] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  // Add this state to track voice input
  const [voiceInput, setVoiceInput] = useState("");

  // Add these state variables at the top
  const [speechQueue, setSpeechQueue] = useState([]);
  const speechSynthesisRef = useRef(null);

  // Add these state variables at the top of the ChatBot component
  const [recognitionError, setRecognitionError] = useState(false);
  const recognitionRetryCount = useRef(0);

  // Add useEffect to handle auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

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

  // Add this function to handle speech synthesis
  const speak = (text) => {
    try {
      if (!text) return;
      
      // Cancel any ongoing speech
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      const config = VOICE_CONFIG[selectedLanguage];
      
      utterance.lang = config.lang;
      utterance.onstart = () => {
        setIsSpeaking(true);
        setCanStartRecording(false);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setCanStartRecording(true);
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsSpeaking(false);
        setCanStartRecording(true);
      };

      // Get available voices
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => voice.name === config.voiceName);
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      speechSynthesis.speak(utterance);
      speechSynthesisRef.current = utterance;
    } catch (error) {
      console.error('Speech synthesis error:', error);
      setIsSpeaking(false);
      setCanStartRecording(true);
    }
  };

  // Add cleanup effect
  useEffect(() => {
    return () => {
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
    };
  }, []);

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

  // Add this function to properly reset the recognition instance
  const resetRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      } catch (error) {
        console.error('Error resetting recognition:', error);
      }
    }
    
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const recognition = new webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.lang = languageConfig[selectedLanguage].lang;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
        setIsRecording(true);
        setRecognitionError(false);
        recognition.started = true;
      };
      
      recognition.onend = () => {
        recognition.started = false;
        setIsRecording(false);
        
        if (!recognitionError && canStartRecording) {
          if (recognitionRetryCount.current < 3) {
            recognitionRetryCount.current++;
            startVoiceRecognition();
          }
        }
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setUserInput(transcript);
        handleUserInput(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Recognition error:', event.error);
        setRecognitionError(true);
        setIsRecording(false);
        setCanStartRecording(true);
        toast.error('Voice recognition error. Please try again.');
      };
      
      recognitionRef.current = recognition;
    }
  };

  // Update the startVoiceRecognition function
  const startVoiceRecognition = async () => {
    try {
      if (!recognitionRef.current) {
        resetRecognition();
      }
      
      if (recognitionRef.current?.started) {
        recognitionRef.current.stop();
      }
      
      await recognitionRef.current.start();
      recognitionRetryCount.current = 0;
      setCanStartRecording(false);
      setIsRecording(true);
      
    } catch (error) {
      console.error('Failed to start recognition:', error);
      setRecognitionError(true);
      setIsRecording(false);
      setCanStartRecording(true);
      resetRecognition(); // Add this line to reset on error
      toast.error('Failed to start voice recognition. Please try again.');
    }
  };

  // Add cleanup in useEffect
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (error) {
          console.error('Error cleaning up recognition:', error);
        }
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
    recognition.maxAlternatives = 1;

    // Add a longer timeout for speech detection
    recognition.speechTimeout = 5000; // 5 seconds to start speaking
 
    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      const cleanedInput = cleanInputText(transcript);
      setUserInput(cleanedInput);
      
      // Add voice input to chat history immediately
      setChatHistory(prev => [...prev, { role: "user", content: cleanedInput }]);
      
      try {
        if (bookingStep > 0) {
          await handleBookingFlow(cleanedInput);
        } else if (cancelStep > 0) {
          await handleCancellationFlow(cleanedInput);
        } else if (meetingStep > 0) {
          await handleMeetingFlow(cleanedInput);
        } else {
          await handleUserInput(cleanedInput);
        }
      } catch (error) {
        console.error("Error processing voice input:", error);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      
      // Handle different types of errors
      switch (event.error) {
        case 'no-speech':
          setError("No speech was detected. Please try again and speak clearly.");
          break;
        case 'audio-capture':
          setError("No microphone was found. Ensure it is plugged in and allowed.");
          break;
        case 'not-allowed':
          setError("Microphone permission was denied. Please allow microphone access.");
          break;
        case 'network':
          setError("Network error occurred. Please check your internet connection.");
          break;
        case 'aborted':
          // Don't show error for user-initiated stops
          break;
        default:
      setError("Voice recognition failed. Please try again.");
      }
      
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      // Only restart if we're in booking/cancel flow and not processing
      if ((bookingStep > 0 || cancelStep > 0 || meetingStep > 0) && !error) {
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

    recognition.onstart = () => {
      recognition.started = true;
      setError(null); // Clear any previous errors when starting new recognition
      // Add a visual indicator that the bot is listening
      setChatHistory(prev => [...prev, { 
        role: "assistant", 
        content: "Listening... Please speak now." 
      }]);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognition.started) {
        recognition.stop();
      }
    };
  }, [bookingStep, cancelStep, meetingStep, selectedLanguage]);

  // Add this helper function near other utility functions
  const repeatLastPrompt = async (step, messages, data = {}) => {
    const prompts = {
      booking: {
        1: messages.provideName,
        2: messages.provideEmail,
        3: messages.providePhone,
        4: messages.chooseDoctorPrompt.replace('{doctorList}', 
          data.doctors?.map(doc => `Doctor ID: ${doc.id} - ${doc.attributes.Name}`).join('\n')),
        5: messages.provideDate,
        6: messages.chooseClinic,
        7: messages.availableSlots.replace('{slots}', data.slots?.join('\n'))
      },
      meeting: {
        1: messages.provideMeetingEmail,
        2: messages.chooseDoctorPrompt.replace('{doctorList}', 
          data.doctors?.map(doc => `Doctor ID: ${doc.id} - ${doc.attributes.Name}`).join('\n')),
        3: "Please provide a name for your meeting (e.g., 'Follow-up Consultation')",
        4: "Please provide the meeting date in DD/MM/YYYY format",
        5: `Available time slots are: ${data.slots?.join(', ')}. Please choose a time slot.`
      }
    };

    return prompts;
  };

  // Add new function to process chat history
  const processChatHistory = async (history) => {
    try {
      const response = await fetch('/api/chatHistory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatHistory: history })
      });

      if (!response.ok) {
        throw new Error('Failed to process chat history');
      }

      const data = await response.json();
      console.log('Updated chat memory:', data.memory);
    } catch (error) {
      console.error('Error processing chat history:', error);
    }
  };

  // Update handleUserInput to include chat history processing
  const handleUserInput = async (input) => {
    if (!input.trim()) return;
    
    setIsLoading(true);
    setChatHistory(prev => [...prev, { role: "user", content: input }]);

    try {
      if (cancelStep > 0) {
        await handleCancellationFlow(input);
      } else if (checkCancellationIntent(input)) {
        setCancelStep(1);
        const messages = TRANSLATIONS[selectedLanguage] || TRANSLATIONS.en;
        await speak(messages.cancelPrompt);
        setChatHistory(prev => [...prev, { 
          role: "assistant", 
          content: messages.cancelPrompt 
        }]);
      } else if (bookingStep > 0) {
        await handleBookingFlow(input);
      } else if (meetingStep > 0) {
        await handleMeetingFlow(input);
      } else {
        // Extract symptoms before processing general input
        const symptoms = extractSymptoms(input, selectedLanguage);
        if (symptoms) {
          localStorage.setItem('currentSymptoms', symptoms);
          console.log('Symptoms stored:', symptoms);
        }

        // Check for booking intent
        if (input.toLowerCase().includes("book") || 
            input.toLowerCase().includes("appointment") || 
            input.toLowerCase().includes("अपॉइंटमेंट") || 
            input.toLowerCase().includes("बुक")) {

          const getCurrentCity = async () => {
            try {
              const response = await fetch('https://ipapi.co/json/');
              const data = await response.json();
              console.log('Current City:', data.city);
              return data.city;
            } catch (error) {
              console.error('Error getting location:', error);
              return null;
            }
          };

          // Get the user's city
          const userCity = await getCurrentCity();
          const messages = TRANSLATIONS[selectedLanguage] || TRANSLATIONS.en;
          
          if (userCity === "Pune") {
            // Start normal booking flow
            startBookingFlow(messages);
          } else {
            // Ask for confirmation if not already asked
            if (!global.askedForBookingConfirmation) {
              const cityMessage = `You belong to ${userCity} and we have our hospital branches in Pune city. If you still want to book an appointment, please say "yes" or "no".`;
              await speak(cityMessage);
              setChatHistory(prev => [...prev, { 
                role: "assistant", 
                content: cityMessage 
              }]);
              global.askedForBookingConfirmation = true;
              global.awaitingBookingConfirmation = true;
            }
          }
        } else if (global.awaitingBookingConfirmation) {
          // Handle yes/no response
          if (input.toLowerCase() === "yes") {
            // Reset flags
            global.askedForBookingConfirmation = false;
            global.awaitingBookingConfirmation = false;
            
            // Start the booking flow
            const messages = TRANSLATIONS[selectedLanguage] || TRANSLATIONS.en;
            startBookingFlow(messages);
          } else if (input.toLowerCase() === "no") {
            // Reset flags
            global.askedForBookingConfirmation = false;
            global.awaitingBookingConfirmation = false;
            
            const thankYouMessage = "Thank you for connecting with us. If you have any health-related queries, feel free to ask.";
            await speak(thankYouMessage);
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: thankYouMessage 
            }]);
          }
        } else if (input.toLowerCase().includes("schedule") || 
                   input.toLowerCase().includes("meeting") || 
                   input.toLowerCase().includes("zoom") || 
                   input.toLowerCase().includes("online")) {
          // Handle meeting scheduling intent
          await handleMeetingIntent();
        } else {
          // Handle general chat flow with enhanced error handling
          try {
            const response = await fetch("/api/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                chatHistory: [...chatHistory, { role: "user", content: input }],
                language: selectedLanguage || "en"
              }),
            });

            if (!response.ok) throw new Error("Failed to get response from server");

            const data = await response.json();
            
            // Add chat history processing
            const updatedHistory = [
              ...chatHistory,
              { role: "user", content: input },
              { role: "assistant", content: data.response }
            ];
            
            await processChatHistory(updatedHistory);

            // Reset states before speaking to ensure clean state
            setError(null);
            setCanStartRecording(true);
            setIsRecording(false);
            
            await speak(data.response);
            setChatHistory(updatedHistory);

            // Check for doctor type in response
            const llmResponse = data.response;
            const doctorType = extractDoctorType(llmResponse);
            if(doctorType) {
              try {
                const response = await GlobalApi.getDoctorByCategory(doctorType);
                // Make sure to convert the response to a string before displaying
                const doctorListMessage = typeof response === 'string' 
                  ? response 
                  : 'Available doctors in this category: ' + 
                    response.data.data.map(doc => `\n- ${doc.attributes.Name}`).join('');
                
                await speak(doctorListMessage);
                setChatHistory(prev => [...prev, { 
                  role: "assistant", 
                  content: doctorListMessage
                }]);
              } catch (error) {
                console.error("Error getting doctor list:", error);
                const errorMsg = "Sorry, there was an error processing your request.";
                await speak(errorMsg);
                setChatHistory(prev => [...prev, { 
                  role: "assistant", 
                  content: errorMsg 
                }]);
              }
            }
            
            // Ensure states are reset after all processing
            setCanStartRecording(true);
            setIsRecording(false);
            
          } catch (error) {
            console.error("Error in chat flow:", error);
            const errorMsg = "Sorry, there was an error processing your request. Please try again.";
            await speak(errorMsg);
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: errorMsg 
            }]);
            setCanStartRecording(true);
            setIsRecording(false);
          }
        }
      }
    } catch (error) {
      console.error(error);
      const errorMsg = "Sorry, there was an error processing your request.";
      await speak(errorMsg);
      setChatHistory(prev => [...prev, { role: "assistant", content: errorMsg }]);
      setCanStartRecording(true);
      setIsRecording(false);
    } finally {
      setIsLoading(false);
      setUserInput("");
      setCanStartRecording(true);
      setIsRecording(false);
    }
  };

  // Modify handleBookingFlow to correctly check memory
  const handleBookingFlow = async (input) => {
    const messages = TRANSLATIONS[selectedLanguage] || TRANSLATIONS.en;
    const memory = await checkChatMemory();
    
    // Log for debugging
    console.log("Memory data:", memory?.data);

    try {
      switch(bookingStep) {
        case 1:
          if (!memory?.data?.UserName) {
            // Update memory when new name is provided
            await updateChatMemory({
              data: {
                ...memory?.data,
                UserName: input
              }
            });
          }
          // Check if UserName exists in memory
          if (memory?.data?.UserName) {
            console.log("Found username in memory:", memory.data.UserName);
            // Use the name from memory
            setBookingData(prev => ({ ...prev, name: memory.data.UserName }));
            
            // Check for email in memory
            if (memory.data.Email) {
              setBookingData(prev => ({ ...prev, email: memory.data.Email }));
              
              // Check for phone in memory
              if (memory.data.PhoneNumber) {
                setBookingData(prev => ({ ...prev, phone: memory.data.PhoneNumber }));
                setBookingStep(4); // Skip to doctor selection
                // Show doctor list
                await handleDoctorList(messages);
              } else {
                // Ask for phone number
                setBookingStep(3);
                await speak(messages.providePhone);
                setChatHistory(prev => [...prev, { 
                  role: "assistant", 
                  content: messages.providePhone 
                }]);
              }
            } else {
              // Ask for email
              setBookingStep(2);
              await speak(messages.provideEmail);
              setChatHistory(prev => [...prev, { 
                role: "assistant", 
                content: messages.provideEmail 
              }]);
            }
          } else {
            // If no name in memory, use the provided input
            setBookingData(prev => ({ ...prev, name: input }));
            setBookingStep(2);
            await speak(messages.provideEmail);
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: messages.provideEmail 
            }]);
          }
          break;

        case 2:
          if (isValidEmail(input)) {
            // Update memory when valid email is provided
            await updateChatMemory({
              data: {
                ...memory?.data,
                Email: input
              }
            });
          }
          // Email validation and handling
          if (!isValidEmail(input)) {
            await speak(messages.invalidEmail);
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: messages.invalidEmail 
            }]);
            break;
          }
          
          setBookingData(prev => ({ ...prev, email: input }));
          
          // Check if phone number exists in memory
          if (memory?.data?.PhoneNumber) {
            // Use phone number from memory and skip to doctor selection
            setBookingData(prev => ({ ...prev, phone: memory.data.PhoneNumber }));
            setBookingStep(4);
            // Show doctor list
            await handleDoctorList(messages);
          } else {
            // Only ask for phone if it's not in memory
            setBookingStep(3);
            await speak(messages.providePhone);
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: messages.providePhone 
            }]);
          }
          break;

        case 3:
          // Update memory when phone number is provided
          await updateChatMemory({
            data: {
              ...memory?.data,
              PhoneNumber: input
            }
          });
          // This case should only be reached if phone number wasn't in memory
          setBookingData(prev => ({ ...prev, phone: input }));
          setBookingStep(4);
          // Show doctor list
          await handleDoctorList(messages);
          break;

        case 4:
          // Check if doctor exists in memory
          if (memory?.doctor) {
            setBookingData(prev => ({ ...prev, doctorId: memory.doctor }));
            setBookingStep(5);
            await speak(messages.provideDate);
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: messages.provideDate 
            }]);
          } else {
            // Original doctor selection logic
            const doctorId = convertNumberWordsToDigits(input, selectedLanguage);
            const selectedDoctor = availableDoctors.find(d => d.id.toString() === doctorId);
            
            if (!selectedDoctor) {
              await speak(messages.invalidDoctorId);
              setChatHistory(prev => [...prev, { 
                role: "assistant", 
                content: messages.invalidDoctorId 
              }]);
              break;
            }
            
            setBookingData(prev => ({ ...prev, doctorId }));
            setBookingStep(5);
            await speak(messages.provideDate);
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: messages.provideDate 
            }]);
          }
          break;

        case 5:
          if (dateRegex.test(input)) {
            // Update memory when valid date is provided
            await updateChatMemory({
              data: {
                ...memory?.data,
                Date: input
              }
            });
          }
          // Check if date exists in memory
          if (memory?.Date && memory.Date !== "null") {
            setBookingData(prev => ({ ...prev, date: memory.Date }));
            setBookingStep(6);
            await speak(messages.chooseClinic);
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: messages.chooseClinic 
            }]);
          } else {
            // Original date validation logic
            const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
            if (!dateRegex.test(input)) {
              await speak(messages.invalidDate);
              setChatHistory(prev => [...prev, { 
                role: "assistant", 
                content: messages.invalidDate 
              }]);
              break;
            }

            setBookingData(prev => ({ ...prev, date: input }));
            setBookingStep(6);
            await speak(messages.chooseClinic);
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: messages.chooseClinic 
            }]);
          }
          break;

        case 6:
          // Clinic selection logic
          if (input === "1" || input.toLowerCase().includes("morning")) {
            setClinicType('Morning Clinic - Ratnamukund Clinic, Warje');
          } else if (input === "2" || input.toLowerCase().includes("evening")) {
            setClinicType('Evening Clinic - Ratnamukund Clinic, Warje');
          } else if (input === "3" || input.toLowerCase().includes("afternoon")) {
            setClinicType('AfterNoon Clinic - Shashwat Clinic, Pune');
          } else {
            await speak(messages.invalidClinic);
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: messages.invalidClinic 
            }]);
            break;
          }

          // Fetch available time slots based on clinic type
          try {
            const timeSlots = [
              "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM",
              "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM", "06:00 PM"
            ];
            setAvailableTimeSlots(timeSlots);
            const slotsMessage = messages.availableSlots.replace('{slots}', timeSlots.join('\n'));
            setBookingStep(7);
            await speak(slotsMessage);
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: slotsMessage 
            }]);
          } catch (error) {
            console.error('Error setting time slots:', error);
            await speak(messages.errorFetchingSlots);
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: messages.errorFetchingSlots 
            }]);
          }
          break;

        case 7:
          // Time slot selection logic
          const selectedTime = input.toUpperCase();
          const availableTimeSlots = [
            "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM",
            "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM", "06:00 PM"
          ];

          // Normalize input and available slots for comparison
          const normalizedInput = selectedTime.replace(/\s+/g, ' ').trim();
          const isValidSlot = availableTimeSlots.some(slot => 
            slot.replace(/\s+/g, ' ').trim() === normalizedInput
          );

          if (!isValidSlot) {
            await speak(messages.invalidTimeSlot);
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: messages.invalidTimeSlot 
            }]);
            break;
          }

          // Set the selected time slot and continue with booking
          setBookingData(prev => ({ ...prev, timeSlot: normalizedInput }));

          // Prepare booking confirmation
          try {
            const appointmentData = {
              data: {
                UserName: bookingData.name,
                Email: bookingData.email,
                PhoneNumber: bookingData.phone,
                Time: normalizedInput,
                Date: bookingData.date,
                doctor: bookingData.doctorId,
                symp: localStorage.getItem('currentSymptoms') || "No symptoms recorded",
                //clinicType: clinicType
              }
            };

            console.log("Sending appointment data:", appointmentData); // Debug log

            // Book the appointment
            await GlobalApi.bookAppointment(appointmentData);

            // Get doctor details
            const doctorResponse = await GlobalApi.getDoctorById(bookingData.doctorId);
            const doctorName = doctorResponse.data.data.attributes.Name;

            // Prepare WhatsApp message data
            const whatsappData = {
              user_name: bookingData.name,
              user_phone: bookingData.phone,
              date: bookingData.date,
              time: selectedTime,
              doctorName: doctorName,
              symptoms: appointmentData.data.symp
            };

            // Send WhatsApp notification
            await sendMessage(whatsappData);

            // Clear stored symptoms
            localStorage.removeItem('currentSymptoms');

            // Prepare confirmation message
            const confirmationMessage = `Great! I've booked your appointment with the following details:
            Name: ${bookingData.name}
            Email: ${bookingData.email}
            Phone: ${bookingData.phone}
            Doctor: ${doctorName}
            Date: ${bookingData.date}
            Time: ${selectedTime}
            Clinic: ${clinicType}
            Symptoms: ${appointmentData.data.symp}`;

            // Show success messages
            await speak(messages.bookingSuccess);
            setChatHistory(prev => [...prev, 
              { 
                role: "assistant", 
                content: confirmationMessage 
              },
              { 
                role: "assistant", 
                content: messages.bookingSuccess 
              }
            ]);

            // Reset booking state
            setBookingStep(0);
            setBookingData({
              name: "",
              email: "",
              phone: "",
              doctorId: "",
              timeSlot: "",
              date: ""
            });
            setClinicType("");
            setAvailableTimeSlots([]);

          } catch (error) {
            console.error('Error completing booking:', error);
            await speak(messages.bookingError);
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: messages.bookingError 
            }]);
            setBookingStep(0);
          }
          break;
      }
    } catch (error) {
      console.error('Error in booking flow:', error);
      await speak(messages.processingError);
      setChatHistory(prev => [...prev, { 
        role: "assistant", 
        content: messages.processingError 
      }]);
      setBookingStep(0);
    }
  };

  // Helper function to handle doctor list fetching and display
  const handleDoctorList = async (messages) => {
    try {
      const doctorsResponse = await GlobalApi.getDoctorList();
      if (!isValidDoctorResponse(doctorsResponse)) {
        throw new Error('Invalid doctor list response');
      }
      const doctors = doctorsResponse.data.data;
      setAvailableDoctors(doctors);
      
      // Format the doctor list as a string
      const doctorList = doctors
        .map(doc => `Doctor ID: ${doc.id} - ${doc.attributes.Name}`)
        .join('\n');
      
      const doctorPrompt = messages.chooseDoctorPrompt.replace('{doctorList}', doctorList);
      await speak(doctorPrompt);
      setChatHistory(prev => [...prev, { 
        role: "assistant", 
        content: doctorPrompt 
      }]);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      const errorMessage = "Failed to fetch doctor list. Please try again.";
      await speak(errorMessage);
      setChatHistory(prev => [...prev, { 
        role: "assistant", 
        content: errorMessage 
      }]);
      setBookingStep(0);
    }
  };

  const handleRecognitionError = (error) => {
    console.error("Recognition error:", error);
    setIsRecording(false);
    setCanStartRecording(true);
    setError("Voice recognition failed. Please try again.");
    
    // Reset recognition after error
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Error stopping recognition:", e);
      }
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current?.started) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      setCanStartRecording(true); // Add this line
      resetRecognition(); // Add this line
    } else if (canStartRecording && !isSpeaking) {
      startVoiceRecognition();
    }
  };

  // Add recovery mechanism for recognition
  useEffect(() => {
    if (!isRecording && canStartRecording) {
      // Reset recognition instance
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.error("Error aborting recognition:", e);
        }
      }
    }
  }, [isRecording, canStartRecording]);

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

  // Add this function to check for cancellation intent
  const checkCancellationIntent = (input) => {
    const cancelKeywords = {
      en: ['cancel', 'delete', 'remove'],
      hi: ['रद्द', 'कैंसिल', 'मिटा'],
      mr: ['रद्द', 'कॅन्सल', 'काढून'],
      gu: ['રદ', 'કેન્સલ', 'કાઢી']
    };

    const keywords = cancelKeywords[selectedLanguage] || cancelKeywords.en;
    return keywords.some(keyword => 
      input.toLowerCase().includes(keyword.toLowerCase())
    );
  };

  // Add this new function to handle cancellation flow
  const handleCancellationFlow = async (input) => {
    const messages = TRANSLATIONS[selectedLanguage] || TRANSLATIONS.en;
    
    try {
      switch(cancelStep) {
        case 1: // Email step
          setCancelData(prev => ({ ...prev, email: input }));
          setCancelStep(2);
          await speak(messages.cancelDatePrompt);
          setChatHistory(prev => [...prev, { 
            role: "assistant", 
            content: messages.cancelDatePrompt 
          }]);
          break;

        case 2: // Date step
          const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
          if (!dateRegex.test(input)) {
            await speak(messages.invalidDateFormat);
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: messages.invalidDateFormat 
            }]);
            break;
          }

          setCancelData(prev => ({ ...prev, date: input }));
          
          try {
            await GlobalApi.cancelAppointmentByEmailDate(cancelData.email, input);
            await speak(messages.cancelSuccess);
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: messages.cancelSuccess 
            }]);
          } catch (error) {
            console.error('Cancellation error:', error);
            const errorMessage = error.message === 'No appointment found for this email and date'
              ? messages.cancelNoAppointment
              : messages.cancelError;
            
            await speak(errorMessage);
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: errorMessage 
            }]);
          }
          
          setCancelStep(0); // Reset cancellation flow
          setCancelData({ email: "", date: "" }); // Clear cancellation data
          break;
      }
    } catch (error) {
      console.error('Error in cancellation flow:', error);
      await speak(messages.cancelError);
      setChatHistory(prev => [...prev, { 
        role: "assistant", 
        content: messages.cancelError 
      }]);
      setCancelStep(0);
      setCancelData({ email: "", date: "" });
    }
  };

  // Add email validation function
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Update the handleMeetingFlow function
  const handleMeetingFlow = async (input) => {
    const messages = TRANSLATIONS[selectedLanguage] || TRANSLATIONS.en;
    
    try {
      switch(meetingStep) {
        case 0:
          setMeetingStep(1);
          await speak(messages.provideMeetingEmail);
          setChatHistory(prev => [...prev, { 
            role: "assistant", 
            content: messages.provideMeetingEmail 
          }]);
          break;

        case 1: // Email validation step
          if (!isValidEmail(input)) {
            await speak(messages.invalidEmail);
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: messages.invalidEmail 
            }]);
            break;
          }
          setMeetingData(prev => ({ ...prev, userEmail: input }));
          
          // After email validation, fetch and show doctor list
          try {
            const doctorsResponse = await GlobalApi.getDoctorList();
            if (!isValidDoctorResponse(doctorsResponse)) {
              throw new Error('Invalid doctor list response');
            }
            const doctors = doctorsResponse.data.data;
            setAvailableDoctors(doctors);
            
            const doctorList = doctors
              .map(doc => `Doctor ID: ${doc.id} - ${doc.attributes.Name}`)
              .join('\n');
            
            const doctorPrompt = messages.chooseDoctorPrompt.replace('{doctorList}', doctorList);
            await speak(doctorPrompt);
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: doctorPrompt 
            }]);
            setMeetingStep(2);
          } catch (error) {
            console.error('Error fetching doctors:', error);
            await speak("Failed to fetch doctor list. Please try again.");
            setMeetingStep(0);
          }
          break;

        case 2: // Doctor selection
          const doctorId = parseInt(convertNumberWordsToDigits(input, selectedLanguage));
          const selectedDoctor = availableDoctors.find(doc => doc.id === doctorId);
          
          if (!selectedDoctor) {
            await speak(messages.invalidDoctorId);
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: messages.invalidDoctorId 
            }]);
            break;
          }
          
          setMeetingData(prev => ({ ...prev, doctorId }));
          setMeetingStep(3);
          await speak(`You've selected Dr. ${selectedDoctor.attributes.Name}. Please provide a name for your meeting (e.g., 'Follow-up Consultation')`);
          setChatHistory(prev => [...prev, { 
            role: "assistant", 
            content: `You've selected Dr. ${selectedDoctor.attributes.Name}. Please provide a name for your meeting (e.g., 'Follow-up Consultation')` 
          }]);
          break;

        case 3: // Meeting name
          if (!input.trim()) {
            await speak("Please provide a valid meeting name.");
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: "Please provide a valid meeting name." 
            }]);
            break;
          }

          setMeetingData(prev => ({ ...prev, eventName: input }));
          setMeetingStep(4);
          await speak("Please provide the meeting date in DD/MM/YYYY format.");
          setChatHistory(prev => [...prev, { 
            role: "assistant", 
            content: "Please provide the meeting date in DD/MM/YYYY format." 
          }]);
          break;

        case 4: // Date selection
          const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
          const match = input.match(dateRegex);
          
          if (!match) {
            await speak("Please provide the date in DD/MM/YYYY format.");
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: "Please provide the date in DD/MM/YYYY format." 
            }]);
            break;
          }

          const [, day, month, year] = match;
          const selectedDate = new Date(year, month - 1, day);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (selectedDate < today) {
            await speak("Please select a future date.");
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: "Please select a future date." 
            }]);
            break;
          }

          if (selectedDate.getDay() === 0) {
            await speak("Sorry, we are closed on Sundays. Please select another date.");
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: "Sorry, we are closed on Sundays. Please select another date." 
            }]);
            break;
          }

          try {
            const formattedDate = selectedDate.toISOString().split('T')[0];
            
            // Fetch booked meetings from Firebase
            const db = getFirestore(app);
            const meetingsRef = collection(db, "MeetingEvent");
            const q = query(meetingsRef, 
              where("doctorId", "==", meetingData.doctorId),
              where("selectedDate", "==", formattedDate)
            );
            
            const querySnapshot = await getDocs(q);
            const bookedSlots = [];
            querySnapshot.forEach((doc) => {
              bookedSlots.push(doc.data().selectedTime);
            });
            
            // Get available time slots
            const availableSlots = createTimeSlots(selectedDate, meetingData.doctorId, 30, bookedSlots);

            if (availableSlots.length === 0) {
              await speak("No time slots available for this date. Please select another date.");
              setChatHistory(prev => [...prev, { 
                role: "assistant", 
                content: "No time slots available for this date. Please select another date." 
              }]);
              break;
            }

            setMeetingData(prev => ({ ...prev, selectedDate: formattedDate }));
            setAvailableTimeSlots(availableSlots);
            
            await speak(`Available evening time slots are: ${availableSlots.join(', ')}. Please choose a time slot.`);
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: `Available evening time slots are: ${availableSlots.join(', ')}. Please choose a time slot.` 
            }]);
            setMeetingStep(5);
          } catch (error) {
            console.error('Error processing date selection:', error);
            await speak("There was an error processing the date. Please try again.");
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: "There was an error processing the date. Please try again." 
            }]);
          }
          break;

        case 5: // Time selection and Zoom meeting creation
          const convertedTime = convertTimeExpression(input, selectedLanguage);
          const selectedTime = convertedTime.trim().toUpperCase();
          
          if (!availableTimeSlots.includes(selectedTime)) {
            await speak("Please select a valid time slot from the list provided.");
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: "Please select a valid time slot from the list provided." 
            }]);
            await speak(`Available time slots are: ${availableTimeSlots.join(', ')}`);
            break;
          }

          try {
            // Create Zoom meeting
            const [time, period] = selectedTime.split(' ');
            const [hours, minutes] = time.split(':').map(Number);
            let militaryHours = hours;
            if (period === 'PM' && hours !== 12) militaryHours += 12;
            if (period === 'AM' && hours === 12) militaryHours = 0;
            
            const startTime = `${meetingData.selectedDate}T${String(militaryHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

            const zoomResponse = await axios.post('/api/zoom/create-meeting', {
              topic: meetingData.eventName,
              start_time: startTime,
              duration: 30
            });

            if (!zoomResponse.data?.join_url) {
              throw new Error('Invalid Zoom meeting URL');
            }

            // Save to Firebase
            const id = Date.now().toString();
            const db = getFirestore(app);
            
            const meetingDoc = {
              id,
              eventName: meetingData.eventName,
              duration: 30,
              locationType: "Zoom",
              locationUrl: zoomResponse.data.join_url,
              selectedDate: meetingData.selectedDate,
              selectedTime: selectedTime,
              themeColor: "#4F46E5",
              businessId: `/Business/${meetingData.userEmail}`,
              createdBy: meetingData.userEmail,
              createdAt: new Date().toISOString(),
              doctorId: meetingData.doctorId,
              clinicType: "Evening Clinic",
              clinicTiming: "8:00 PM - 10:00 PM"
            };

            await setDoc(doc(db, "MeetingEvent", id), meetingDoc);

            const successMessage = "Your Zoom meeting has been scheduled successfully!";
            await speak(successMessage);
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: successMessage 
            }]);

            // Reset meeting flow
            setMeetingStep(0);
            setMeetingData({
              eventName: "",
              duration: 30,
              locationType: "",
              locationUrl: "",
              themeColor: "#4F46E5",
              doctorId: "",
              selectedDate: "",
              selectedTime: "",
              clinicType: "Evening Clinic",
              userEmail: "",
            });
          } catch (error) {
            console.error('Meeting creation error:', error);
            const errorMessage = "Unable to schedule the meeting. Please try again later.";
            await speak(errorMessage);
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: errorMessage 
            }]);
            setMeetingStep(0);
          }
          break;
      }
    } catch (error) {
      console.error('Error in handleMeetingFlow:', error);
      await speak("Sorry, there was an error processing your request. Please try again.");
      setChatHistory(prev => [...prev, { 
        role: "assistant", 
        content: "Sorry, there was an error processing your request. Please try again." 
      }]);
      setMeetingStep(0);
    }
  };

  // Add handleMeetingIntent function
  const handleMeetingIntent = async () => {
    try {
      // Fetch doctor list with retry mechanism
      let retryCount = 0;
      let doctorsResponse = null;
      
      while (retryCount < 3) {
        try {
          doctorsResponse = await GlobalApi.getDoctorList();
          if (isValidDoctorResponse(doctorsResponse)) {
            break;
          }
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        } catch (err) {
          console.error(`Attempt ${retryCount + 1} failed:`, err);
          retryCount++;
          if (retryCount === 3) throw err;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!isValidDoctorResponse(doctorsResponse)) {
        throw new Error('Invalid doctor list response');
      }

      const doctors = doctorsResponse.data.data;
      setAvailableDoctors(doctors);

      // Create doctor list string
      const doctorList = doctors
        .map(doc => `Doctor ID: ${doc.id} - ${doc.attributes.Name} (${doc.attributes.Profession})`)
        .join('\n');

      const messages = TRANSLATIONS[selectedLanguage] || TRANSLATIONS.en;
      const doctorPrompt = messages.chooseDoctorPrompt.replace('{doctorList}', doctorList);
      
      setMeetingStep(1);
      await speak(doctorPrompt);
      setChatHistory(prev => [...prev, { 
        role: "assistant", 
        content: doctorPrompt 
      }]);
    } catch (error) {
      console.error('Doctor list fetch error:', error);
      const errorMsg = "There was a problem fetching the doctor list. Please try again in a moment.";
      await speak(errorMsg);
      setChatHistory(prev => [...prev, { 
        role: "assistant", 
        content: errorMsg 
      }]);
      setCanStartRecording(true); // Ensure recording can continue after error
    }
  };

  // Update the handleTripleSpacebar function
  const handleTripleSpacebar = () => {
    if (!isOpen) {
      onOpen();
      setTimeout(() => {
        speak(TRANSLATIONS[selectedLanguage].welcome);
      }, 300);
    } else {
      if (isSpeaking) {
        speechSynthesis.cancel();
        setIsSpeaking(false);
        setCanStartRecording(true);
      }
      
      toggleRecording(); // Use toggleRecording instead of direct manipulation
    }
  };

  // Add back the handleDoubleSpacebar function
  const handleDoubleSpacebar = () => {
    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      setCanStartRecording(true);
    }
  };

  // Add a new function to handle recognition restart
  const restartRecognitionIfNeeded = () => {
    if (canStartRecording && !isRecording && !isSpeaking && recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        setError(null);
      } catch (error) {
        console.error("Failed to restart recognition:", error);
        setCanStartRecording(true);
      }
    }
  };

  // Update the useSpacebarHandler hook usage
  useSpacebarHandler({
    onTriplePress: handleTripleSpacebar,
    onDoublePress: handleDoubleSpacebar,
    isOpen,
    isTyping,
    canStartRecording,
    isSpeaking
  });

  // Move RecordButton inside the main component
  const RecordButton = () => (
    <Button 
      variant="outline" 
      onClick={toggleRecording}
      disabled={!canStartRecording}
      className={`${!canStartRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={!canStartRecording ? "Please wait for the response to finish" : "Start/Stop Recording"}
    >
      {isRecording ? 
        <StopCircle className="w-4 h-4 text-red-500" /> : 
        <Mic className="w-4 h-4" />
      }
    </Button>
  );

  // Update the useEffect for cleanup
  useEffect(() => {
    if (!isOpen) {
      // Clean up when chatbot is closed
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
      if (recognitionRef.current?.started) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      setIsSpeaking(false);
      setCanStartRecording(true);
      setError(null);
      setChatHistory([{ role: "assistant", content: TRANSLATIONS[selectedLanguage].welcome }]);
    }
  }, [isOpen, selectedLanguage]);

  useEffect(() => {
    if (recognitionError) {
      const timer = setTimeout(() => {
        setRecognitionError(false);
        setCanStartRecording(true);
        resetRecognition();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [recognitionError]);

  // Add useEffect to handle cleanup when chat closes
  useEffect(() => {
    if (!isOpen) {
      clearChatMemory();
    }
  }, [isOpen]);

  // Modify the existing close handler if you have one
  const handleClose = async () => {
    await clearChatMemory();
    onClose();
  };

  // Add this helper function to handle the booking flow
  const startBookingFlow = async (messages) => {
    const memory = await checkChatMemory();
    console.log("Checking memory for booking:", memory);

    if (memory?.data?.UserName) {
      console.log("Found username:", memory.data.UserName);
      setBookingData(prev => ({ ...prev, name: memory.data.UserName }));
      
      if (memory.data.Email) {
        setBookingData(prev => ({ ...prev, email: memory.data.Email }));
        
        if (memory.data.PhoneNumber) {
          setBookingData(prev => ({ ...prev, phone: memory.data.PhoneNumber }));
          setBookingStep(4);
          await handleDoctorList(messages);
        } else {
          setBookingStep(3);
          await speak(messages.providePhone);
          setChatHistory(prev => [...prev, { 
            role: "assistant", 
            content: messages.providePhone 
          }]);
        }
      } else {
        setBookingStep(2);
        await speak(messages.provideEmail);
        setChatHistory(prev => [...prev, { 
          role: "assistant", 
          content: messages.provideEmail 
        }]);
      }
    } else {
      setBookingStep(1);
      await speak(messages.provideName);
      setChatHistory(prev => [...prev, { 
        role: "assistant", 
        content: messages.provideName 
      }]);
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
          <ChatHeader onClose={handleClose} />
          <ScrollArea className="h-[400px] p-4">
            {chatHistory.map((msg, idx) => (
              <ChatMessage key={idx} role={msg.role} content={msg.content} />
            ))}
            {isLoading && <TypingAnimation />}
            <div className="mt-4">
            <FileUploadHandler 
  onExtractedText={handleExtractedText} 
  language={selectedLanguage} 
/>            </div>
          </ScrollArea>
          <div className="p-4 border-t border-gray-200">
            <div className="flex justify-end mb-2">
            <select 
  value={selectedLanguage}
  onChange={(e) => {
    const lang = e.target.value;
    setSelectedLanguage(lang);
    if (recognitionRef.current) {
      // Set proper recognition language while using Hindi voice for mr/gu
      recognitionRef.current.lang = lang === "en" ? "en-US" : 
                                   lang === "hi" ? "hi-IN" : 
                                   lang === "mr" ? "mr-IN" : 
                                   lang === "gu" ? "gu-IN" : "en-US";
    }
  }}
  className="p-2 border rounded-md text-sm"
>
  {Object.entries(LANGUAGE_OPTIONS).map(([code, name]) => (
    <option key={code} value={code}>{name}</option>
  ))}
</select>

            </div>
            <div className="flex gap-2">
              <Textarea
                value={userInput}
                onChange={(e) => {
                  setUserInput(e.target.value);
                  setIsTyping(true);
                }}
                onBlur={() => setIsTyping(false)}
                placeholder="Type your message..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleUserInput(userInput);
                  }
                  // Allow normal spacebar behavior when typing
                  if (e.key === ' ' && isTyping) {
                    e.stopPropagation();
                  }
                }}
              />
              <div className="flex flex-col gap-2">
                <Button onClick={() => handleUserInput(userInput)}>
                  <Send className="w-4 h-4" />
                </Button>
                <RecordButton />
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
