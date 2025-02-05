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
  },
  mr: {
    welcome: "नमस्कार! मी तुमचा मेडिकल असिस्टंट आहे. मी तुम्हाला कशी मदत करू शकतो? तुम्ही अपॉइंटमेंट बुक करू शकता किंवा आरोग्याशी संबंधित प्रश्न विचारू शकता.",
    provideName: "कृपया तुमचे नाव सांगा.",
    provideEmail: "धन्यवाद. आता कृपया तुमचा ईमेल पत्ता द्या.",
    providePhone: "कृपया तुमचा फोन नंबर द्या.",
    // ... Add other Marathi translations
    provideMeetingEmail: "मीटिंग शेड्यूल करण्यासाठी कृपया तुमचा ईमेल पत्ता द्या.",
    invalidEmail: "कृपया वैध ईमेल पत्ता द्या.",
  },
  gu: {
    welcome: "નમસ્તે! હું તમારો મેડિકલ આસિસ્ટન્ટ છું. હું તમને કેવી રીતે મદદ કરી શકું? તમે એપોઇન્ટમેન્ટ બુક કરી શકો છો અથવા આરોગ્ય સંબંધિત પ્રશ્નો પૂછી શકો છો.",
    provideName: "કૃપા કરીને તમારું નામ આપો.",
    provideEmail: "આભાર. હવે કૃપા કરીને તમારું ઈમેઈલ સરનામું આપો.",
    providePhone: "કૃપા કરીને તમારો ફોન નંબર આપો.",
    // ... Add other Gujarati translations
    provideMeetingEmail: "મીટિંગ શેડ્યૂલ કરવા માટે કૃપા કરીને તમારું ઈમેઈલ સરનામું આપો.",
    invalidEmail: "કૃપા કરીને માન્ય ઈમેઈલ સરનામું આપો.",
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
            name: "pict_wp",
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

  const speak = async (text) => {
    if ("speechSynthesis" in window) {
      try {
        if (speechSynthesis.speaking) {
          speechSynthesis.cancel();
        }
  
        const voices = await forceLoadVoices();
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Force Hindi voice for Marathi and Gujarati
        const langConfig = ['mr', 'gu'].includes(selectedLanguage) ? 
          languageConfig.hi : 
          languageConfig[selectedLanguage] || languageConfig.en;
  
        utterance.lang = langConfig.lang;
        
        // Find the best matching voice
        let selectedVoice = null;
  
        // First try preferred voices
        for (const preferredVoice of langConfig.preferredVoices) {
          selectedVoice = voices.find(voice => 
            voice.name.includes(preferredVoice) || 
            voice.voiceURI.includes(preferredVoice)
          );
          if (selectedVoice) break;
        }
  
        // Then try language fallbacks
        if (!selectedVoice) {
          for (const fallbackLang of langConfig.fallbackLangs) {
            selectedVoice = voices.find(voice => 
              voice.lang.startsWith(fallbackLang)
            );
            if (selectedVoice) break;
          }
        }
  
        // Final fallback to any available voice
        if (!selectedVoice) {
          selectedVoice = voices[0];
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
    recognition.maxAlternatives = 1;

    // Add a longer timeout for speech detection
    recognition.speechTimeout = 5000; // 5 seconds to start speaking
 
    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      const cleanedInput = cleanInputText(transcript);
      setUserInput(cleanedInput);
      
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
        // Check for symptoms
        const symptoms = extractSymptoms(input, selectedLanguage);
        if (symptoms) {
          // Store symptoms in localStorage for use during appointment booking
          localStorage.setItem('currentSymptoms', symptoms);
          console.log('Symptoms stored:', symptoms);
        }

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
        } else if (input.toLowerCase().includes("schedule") || 
                   input.toLowerCase().includes("meeting") || 
                   input.toLowerCase().includes("zoom") || 
                   input.toLowerCase().includes("online")) {
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
          }
        } else {
          // Normal chat flow
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
          await speak(data.response);
          setChatHistory(prev => [...prev, { 
            role: "assistant", 
            content: data.response
          }]);
          const llmResponse =data.response;
          const doctorType = extractDoctorType(llmResponse);
          console.log(doctorType);
          if(doctorType){
            try{doctorlist_ = await GlobalApi.getDoctorByCategory(doctorType);
            await speak(doctorlist)
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: doctorlist   
            }]);}
            catch (error) {
              console.error("Error getting doctor list:", error);
              await speak("Sorry, there was an error processing your request.");
              setChatHistory(prev => [...prev, { role: "assistant", content: "Sorry, there was an error processing your request." }]);
            } 
          }


        }
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
          // Check if user is authenticated first
          if (!currentUser || !currentUser.email) {
            const errorMsg = "Please log in first to book an appointment.";
            await speak(errorMsg);
            setChatHistory(prev => [...prev, { role: "assistant", content: errorMsg }]);
            setBookingStep(0); // Reset booking flow
            break;
          }
          setBookingStep(1);
          await speak(messages.provideName);
          setChatHistory(prev => [...prev, { role: "assistant", content: messages.provideName }]);
          break;

        case 1:
          if (!input.trim()) {
            const errorMsg = "Please provide a valid name.";
            await speak(errorMsg);
            setChatHistory(prev => [...prev, { role: "assistant", content: errorMsg }]);
            break;
          }
          // Set both name and email (from authenticated user)
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
          // Clean and validate phone number
          const phoneNumber = input.replace(/[^0-9]/g, '').replace(/\.+$/, '');
          if (phoneNumber.length !== 10) {
            const errorMsg = "Please provide a valid 10-digit phone number.";
            await speak(errorMsg);
            setChatHistory(prev => [...prev, { role: "assistant", content: errorMsg }]);
            // Repeat the phone prompt
            await speak(messages.providePhone);
            // Stay on the same step
            break;
          }
          setBookingData(prev => ({ ...prev, phone: phoneNumber }));
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
              .map(doc => `Doctor ID: ${doc.id} - ${doc.attributes.Name}`)
              .join('\n');

            const doctorPrompt = messages.chooseDoctorPrompt.replace('{doctorList}', doctorList);
            
            // Log successful doctor list fetch
            console.log('Successfully fetched doctors:', doctors.length);
            console.log('Doctor list:', doctorList);

            await speak(doctorPrompt);
            setChatHistory(prev => [...prev, { role: "assistant", content: doctorPrompt }]);
            setBookingStep(4);

          } catch (error) {
            console.error('Doctor list fetch error:', {
              error,
              message: error.message,
              response: error.response,
              status: error.response?.status
            });

            // Handle specific error cases
            let errorMsg;
            if (error.response?.status === 404) {
              errorMsg = "The doctor list service is currently unavailable. Please try again later.";
            } else if (error.message === 'Invalid doctor list response') {
              errorMsg = "Unable to retrieve the doctor list. Please try again.";
            } else {
              errorMsg = "There was a problem fetching the doctor list. Please try again in a moment.";
            }

            await speak(errorMsg);
            setChatHistory(prev => [...prev, { role: "assistant", content: errorMsg }]);
            // Stay on current step
            break;
          }
          break;

        case 4:
          const processedInput = convertNumberWordsToDigits(input, selectedLanguage);
          const doctorId = parseInt(processedInput);
          
          if (!availableDoctors.some(doc => doc.id === doctorId)) {
            const errorMsg = messages.invalidDoctorId;
            await speak(errorMsg);
            setChatHistory(prev => [...prev, { role: "assistant", content: errorMsg }]);
            // Show doctor list again
            const doctorList = availableDoctors
                .map(doc => `Doctor ID: ${doc.id} - ${doc.attributes.Name}`)
                .join('\n');
            const doctorPrompt = messages.chooseDoctorPrompt.replace('{doctorList}', doctorList);
            await speak(doctorPrompt);
            setChatHistory(prev => [...prev, { role: "assistant", content: doctorPrompt }]);
            // Stay on the same step
            break;
          }
          
          // If we get here, the doctor ID is valid
          setBookingData(prev => ({ ...prev, doctorId }));
          const datePrompt = messages.provideDate;
          await speak(datePrompt);
          setChatHistory(prev => [...prev, { role: "assistant", content: datePrompt }]);
          setBookingStep(5);
          break;

        case 5:
          const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
          const match = input.match(dateRegex);
          
          if (!match) {
            const errorMsg = messages.invalidDateFormat;
            await speak(errorMsg);
            setChatHistory(prev => [...prev, { role: "assistant", content: errorMsg }]);
            // Repeat the date prompt
            await speak(messages.provideDate);
            // Stay on the same step
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
            // Repeat the date prompt
            await speak(messages.provideDate);
            // Stay on the same step
            break;
          }

          if (selectedDate.getDay() === 0) {
            const errorMsg = messages.closedSunday;
            await speak(errorMsg);
            setChatHistory(prev => [...prev, { role: "assistant", content: errorMsg }]);
            // Repeat the date prompt
            await speak(messages.provideDate);
            // Stay on the same step
            break;
          }

          setBookingData(prev => ({ ...prev, date: selectedDate.toLocaleDateString('en-CA') }));
          
          const clinicPrompt = messages.chooseClinic;
          await speak(clinicPrompt);
          setChatHistory(prev => [...prev, { role: "assistant", content: clinicPrompt }]);
          setBookingStep(6);
          break;

        case 6:
          const clinicNumberInput = convertNumberWordsToDigits(input, selectedLanguage);
          const clinicChoice = clinicNumberInput.trim();
          
          if (!['1', '2', '3'].includes(clinicChoice)) {
            const errorMsg = messages.invalidClinic;
            await speak(errorMsg);
            setChatHistory(prev => [...prev, { role: "assistant", content: errorMsg }]);
            await speak(messages.chooseClinic);
            break;
          }

          const selectedClinic = clinicChoice === '1' 
            ? 'Morning Clinic - Ratnamukund Clinic, Warje'
            : clinicChoice === '2' 
            ? 'Evening Clinic - Ratnamukund Clinic, Warje'
            : 'AfterNoon Clinic - Shashwat Clinic, Pune';

          setClinicType(selectedClinic);

          try {
            const slots = await getAvailableTimeSlots(
              bookingData.doctorId, 
              new Date(bookingData.date),
              selectedClinic
            );
            
            console.log('Available slots:', slots); // Debug log
            
            if (!slots || slots.length === 0) {
              const noSlotsMsg = messages.noTimeSlots;
              await speak(noSlotsMsg);
              setChatHistory(prev => [...prev, { role: "assistant", content: noSlotsMsg }]);
              // Show clinic options again
              await speak(messages.chooseClinic);
              break;
            }

            const slotsPrompt = messages.availableSlots.replace('{slots}', slots.join('\n'));
            await speak(slotsPrompt);
            setChatHistory(prev => [...prev, { role: "assistant", content: slotsPrompt }]);
            setAvailableTimeSlots(slots);
            setBookingStep(7);
          } catch (error) {
            console.error('Error getting time slots:', error);
            const errorMsg = messages.processingError;
            await speak(errorMsg);
            setChatHistory(prev => [...prev, { role: "assistant", content: errorMsg }]);
            break;
          }
          break;

        case 7:
          const convertedTime = convertTimeExpression(input, selectedLanguage);
          const selectedTime = convertedTime.trim().toUpperCase();
          
          if (!availableTimeSlots.includes(selectedTime)) {
            const errorMsg = messages.invalidTimeSlot;
            await speak(errorMsg);
            setChatHistory(prev => [...prev, { role: "assistant", content: errorMsg }]);
            // Show available slots again
            const slotsPrompt = messages.availableSlots.replace('{slots}', availableTimeSlots.join('\n'));
            await speak(slotsPrompt);
            setChatHistory(prev => [...prev, { role: "assistant", content: slotsPrompt }]);
            // Stay on the same step
            break;
          }

          // Prepare and submit booking
          const storedSymptoms = localStorage.getItem('currentSymptoms');
          
          const appointmentData = {
            data: {
              UserName: bookingData.name,
              Email: bookingData.email,
              PhoneNumber: bookingData.phone,
              Time: selectedTime,
              Date: bookingData.date,
              doctor: bookingData.doctorId,
              symp: storedSymptoms || "No symptoms recorded"  // Add symptoms to appointment data
            }
          };
          console.log('Appointment data:', appointmentData);

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
              date: new Date(bookingData.date).toLocaleDateString('en-GB'),
              time: selectedTime,
              doctorName: doctorName,
              symptoms: storedSymptoms || "No symptoms recorded"  // Include symptoms in formData
            };

            // Send WhatsApp message
            await sendMessage(formData);

            // Clear stored symptoms after successful booking
            localStorage.removeItem('currentSymptoms');

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
      console.error('Error in handleBookingFlow:', error);
      
      // Instead of resetting the booking flow, stay on the current step
      const errorMsg = messages.processingError;
      await speak(errorMsg);
      setChatHistory(prev => [...prev, { role: "assistant", content: errorMsg }]);
      
      // Repeat the current step's prompt
      const currentPrompt = getCurrentStepPrompt(bookingStep, messages, availableDoctors, availableTimeSlots);
      if (currentPrompt) {
        await speak(currentPrompt);
        setChatHistory(prev => [...prev, { role: "assistant", content: currentPrompt }]);
      }
    }
  };

  // Helper function to get the appropriate prompt for the current step
  const getCurrentStepPrompt = (step, messages, doctors, timeSlots) => {
    switch(step) {
      case 1:
        return messages.provideName;
      case 2:
        return messages.provideEmail;
      case 3:
        return messages.providePhone;
      case 4:
        const doctorList = doctors
          .map(doc => `Doctor ID: ${doc.id} - ${doc.attributes.Name}`)
          .join('\n');
        return messages.chooseDoctorPrompt.replace('{doctorList}', doctorList);
      case 5:
        return messages.provideDate;
      case 6:
        return messages.chooseClinic;
      case 7:
        return messages.availableSlots.replace('{slots}', timeSlots.join('\n'));
      default:
        return null;
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

        case 3: // Meeting name - Remove the extra "Dr." prefix
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
            // Format date for Firebase
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
              const data = doc.data();
              bookedSlots.push(data.selectedTime);
            });
            
            console.log('Current doctorId:', meetingData.doctorId);
            console.log('Booked slots:', bookedSlots);
            
            // Get available time slots
            const availableSlots = createTimeSlots(selectedDate, meetingData.doctorId, 30, bookedSlots);
            console.log('Available slots:', availableSlots);

            if (availableSlots.length === 0) {
              await speak("No time slots available for this date. Please select another date.");
              setChatHistory(prev => [...prev, { 
                role: "assistant", 
                content: "No time slots available for this date. Please select another date." 
              }]);
              break;
            }

            // Update meeting data and state
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

        case 5: // Time selection
          const convertedTime = convertTimeExpression(input, selectedLanguage);
          const selectedTime = convertedTime.trim().toUpperCase();
          
          if (!availableTimeSlots.includes(selectedTime)) {
            await speak("Please select a valid time slot from the list provided.");
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: "Please select a valid time slot from the list provided." 
            }]);
            // Show available slots again
            await speak(`Available time slots are: ${availableTimeSlots.join(', ')}`);
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: `Available time slots are: ${availableTimeSlots.join(', ')}` 
            }]);
            break;
          }

          setMeetingData(prev => ({ ...prev, selectedTime }));
          setMeetingStep(6);
          await speak("Your meeting will be scheduled on Zoom. Type 'yes' to confirm.");
          setChatHistory(prev => [...prev, { 
            role: "assistant", 
            content: "Your meeting will be scheduled on Zoom. Type 'yes' to confirm." 
          }]);
          break;

        case 6: // Platform confirmation and Zoom meeting creation
          if (input.toLowerCase() !== 'yes') {
            await speak("Please type 'yes' to confirm your Zoom meeting.");
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: "Please type 'yes' to confirm your Zoom meeting." 
            }]);
            break;
          }

          try {
            // Convert time to proper format for Zoom API
            const [time, period] = meetingData.selectedTime.split(' ');
            const [hours, minutes] = time.split(':').map(Number);
            let militaryHours = hours;
            if (period === 'PM' && hours !== 12) militaryHours += 12;
            if (period === 'AM' && hours === 12) militaryHours = 0;
            
            const startTime = `${meetingData.selectedDate}T${String(militaryHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

            // Create Zoom meeting with better error handling
            try {
              const zoomResponse = await axios.post('/api/zoom/create-meeting', {
                topic: meetingData.eventName,
                start_time: startTime,
                duration: 30
              });

              if (!zoomResponse.data) {
                console.error('Empty response from Zoom API');
                throw new Error('No response from Zoom API');
              }

              if (!zoomResponse.data.join_url) {
                console.error('Missing join_url in Zoom response:', zoomResponse.data);
                throw new Error('Invalid Zoom meeting URL');
              }

              const locationUrl = zoomResponse.data.join_url;

              // Create the meeting in Firebase
              const id = Date.now().toString();
              const db = getFirestore(app);
              
              const meetingDoc = {
                id,
                eventName: meetingData.eventName,
                duration: 30,
                locationType: "Zoom",
                locationUrl: locationUrl,
                selectedDate: meetingData.selectedDate,
                selectedTime: meetingData.selectedTime,
                themeColor: "#4F46E5",
                businessId: `/Business/${meetingData.userEmail}`,
                createdBy: meetingData.userEmail,
                createdAt: new Date().toISOString(),
                doctorId: meetingData.doctorId,
                clinicType: "Evening Clinic",
                clinicTiming: "8:00 PM - 10:00 PM"
              };

              // Verify all required fields are present
              const requiredFields = ['id', 'eventName', 'locationUrl', 'selectedDate', 'selectedTime', 'businessId', 'createdBy', 'doctorId'];
              const missingFields = requiredFields.filter(field => !meetingDoc[field]);
              
              if (missingFields.length > 0) {
                throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
              }

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
              console.error('Detailed Zoom error:', error.response?.data || error.message);
              throw new Error(`Zoom meeting creation failed: ${error.message}`);
            }

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