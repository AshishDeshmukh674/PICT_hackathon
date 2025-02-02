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
  mr: {
    lang: "mr-IN",
    fallbackLangs: ["hi-IN", "hi"],
    preferredVoices: ["Microsoft Marathi", "Microsoft Hemant", "Google हिन्दी"]
  },
  gu: {
    lang: "gu-IN",
    fallbackLangs: ["hi-IN", "hi"],
    preferredVoices: ["Microsoft Gujarati", "Microsoft Hemant", "Google हिन्दी"]
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
Please enter the number (1-3) for your choice.`,
    invalidClinic: "Please select a valid clinic type (1-3).",
    noTimeSlots: "चयनित तिथि और क्लिनिक प्रकार के लिए कोई समय स्लॉट उपलब्ध नहीं है। क्या आप दूसरा क्लिनिक प्रकार आज़माना चाहेंगे? (हां/नहीं)",
    availableSlots: "उपलब्ध समय स्लॉट हैं:\n{slots}\nPlease choose a time slot.",
    invalidTimeSlot: "Please select a valid time slot from the list provided.",
    bookingSuccess: "आपका अपॉइंटमेंट सफलतापूर्वक बुक कर लिया गया है! आपको जल्द ही एक पुष्टिकरण संदेश प्राप्त होगा।",
    bookingError: "क्षमा करें, आपका अपॉइंटमेंट बुक करने में एक त्रुटि हुई। कृपया पुनः प्रयास करें।",
    processingError: "क्षमा करें, आपके बुकिंग अनुरोध को संसाधित करने में एक त्रुटि हुई। कृपया पुनः प्रयास करें।",
    cancelPrompt: "अपॉइंटमेंट रद्द करने के लिए कृपया अपना ईमेल पता प्रदान करें।",
    cancelDatePrompt: "कृपया रद्द करने के लिए अपॉइंटमेंट की तारीख प्रदान करें (DD/MM/YYYY प्रारूप)।",
    cancelSuccess: "आपका अपॉइंटमेंट सफलतापूर्वक रद्द कर दिया गया है।",
    cancelNoAppointment: "दिए गए ईमेल और तारीख के लिए कोई अपॉइंटमेंट नहीं मिला।",
    cancelError: "आपका अपॉइंटमेंट रद्द करने में एक त्रुटि हुई। कृपया पुनः प्रयास करें।",
  },
  mr: {
    welcome: "नमस्कार! मी तुमचा मेडिकल असिस्टंट आहे. मी तुम्हाला कशी मदत करू शकतो? तुम्ही अपॉइंटमेंट बुक करू शकता किंवा आरोग्याशी संबंधित प्रश्न विचारू शकता.",
    provideName: "कृपया तुमचे नाव सांगा.",
    provideEmail: "धन्यवाद. आता कृपया तुमचा ईमेल पत्ता द्या.",
    providePhone: "कृपया तुमचा फोन नंबर द्या.",
    chooseDoctorPrompt: "उपलब्ध डॉक्टर येथे आहेत:\n{doctorList}\nकृपया त्यांचा ID नंबर सांगून डॉक्टर निवडा.",
    invalidDoctorId: "कृपया वैध डॉक्टर ID नंबर द्या.",
    provideDate: "कृपया DD/MM/YYYY स्वरूपात तुमची पसंतीची अपॉइंटमेंट तारीख द्या.",
    invalidDateFormat: "कृपया तारीख DD/MM/YYYY स्वरूपात द्या.",
    futureDateRequired: "कृपया भविष्यातील तारीख निवडा.",
    closedSunday: "क्षमस्व, आम्ही रविवारी बंद असतो. कृपया दुसरी तारीख निवडा.",
    chooseClinic: `कृपया क्लिनिकचा प्रकार निवडा:
1. सकाळचे क्लिनिक - रत्नमुकुंद क्लिनिक, वारजे
2. संध्याकाळचे क्लिनिक - रत्नमुकुंद क्लिनिक, वारजे
3. दुपारचे क्लिनिक - शाश्वत क्लिनिक, पुणे
कृपया तुमच्या निवडीसाठी क्रमांक (1-3) टाका.`,
    invalidClinic: "कृपया वैध क्लिनिक प्रकार (1-3) निवडा.",
    noTimeSlots: "निवडलेल्या तारखेसाठी आणि क्लिनिक प्रकारासाठी कोणतेही वेळेचे स्लॉट उपलब्ध नाहीत. तुम्हाला दुसरा क्लिनिक प्रकार प्रयत्न करायचा आहे का? (होय/नाही)",
    availableSlots: "उपलब्ध वेळेचे स्लॉट आहेत:\n{slots}\nकृपया एक वेळेचा स्लॉट निवडा.",
    invalidTimeSlot: "कृपया दिलेल्या यादीतून वैध वेळेचा स्लॉट निवडा.",
    bookingSuccess: "तुमची अपॉइंटमेंट यशस्वीरित्या बुक केली गेली आहे! तुम्हाला लवकरच एक पुष्टीकरण संदेश मिळेल.",
    bookingError: "क्षमस्व, तुमची अपॉइंटमेंट बुक करताना एक त्रुटी आली. कृपया पुन्हा प्रयत्न करा.",
    processingError: "क्षमस्व, तुमच्या बुकिंग विनंतीवर प्रक्रिया करताना एक त्रुटी आली. कृपया पुन्हा प्रयत्न करा.",
    cancelPrompt: "अपॉइंटमेंट रद्द करण्यासाठी कृपया तुमचा ईमेल पत्ता द्या.",
    cancelDatePrompt: "कृपया रद्द करण्यासाठी अपॉइंटमेंटची तारीख द्या (DD/MM/YYYY स्वरूपात).",
    cancelSuccess: "तुमची अपॉइंटमेंट यशस्वीरित्या रद्द केली गेली आहे.",
    cancelNoAppointment: "आपેલા ईमेल अनै तारखेसाठी कोणतीही अपॉइंटमेंट सापडली नाही.",
    cancelError: "तुमची अपॉइंटमेंट रद्द करताना एक त्रुटी आली. कृपया पुन्हा प्रयत्न करો."
  },
  gu: {
    welcome: "નમસ્તે! હું તમારો મેડિકલ આસિસ્ટન્ટ છું. હું તમને કેવી રીતે મદદ કરી શકું? તમે એપોઇન્ટમેન્ટ બુક કરી શકો છો અથવા આરોગ્ય સંબંધિત પ્રશ્નો પૂછી શકો છો.",
    provideName: "કૃપા કરીને તમારું નામ આપો.",
    provideEmail: "આભાર. હવે કૃપા કરીને તમારું ઈમેઈલ સરનામું આપો.",
    providePhone: "કૃપા કરીને તમારો ફોન નંબર આપો.",
    chooseDoctorPrompt: "ઉપલબ્ધ ડૉક્ટર અહીં છે:\n{doctorList}\nકૃપા કરીને તેમનો ID નંબર કહીને ડૉક્ટર પસંદ કરો.",
    invalidDoctorId: "કૃપા કરીને માન્ય ડૉક્ટર ID નંબર આપો.",
    provideDate: "કૃપા કરીને DD/MM/YYYY ફોર્મેટમાં તમારી પસંદગીની એપોઇન્ટમેન્ટ તારીખ આપો.",
    invalidDateFormat: "કૃપા કરીને તારીખ DD/MM/YYYY ફોર્મેટમાં આપો.",
    futureDateRequired: "કૃપા કરીને ભવિષ્યની તારીખ પસંદ કરો.",
    closedSunday: "માફ કરશો, અમે રવિવારે બંધ છીએ. કૃપા કરીને બીજી તારીખ પસંદ કરો.",
    chooseClinic: `કૃપા કરીને ક્લિનિકનો પ્રકાર પસંદ કરો:
1. સવારનું ક્લિનિક - રત્નમુકુંદ ક્લિનિક, વારજે
2. સાંજનું ક્લિનિક - રત્નમુકુંદ ક્લિનિક, વારજે
3. બપોરનું ક્લિનિક - શાશ્વત ક્લિનિક, પુણે
કૃપા કરીને તમારી પસંદગી માટે નંબર (1-3) દાખલ કરો.`,
    invalidClinic: "કૃપા કરીને માન્ય ક્લિનિક પ્રકાર (1-3) પસંદ કરો.",
    noTimeSlots: "પસંદ કરેલી તારીખ અને ક્લિનિક પ્રકાર માટે કોઈ સમય સ્લોટ ઉપલબ્ધ નથી. શું તમે બીજો ક્લિનિક પ્રકાર અજમાવવા માંગો છો? (હા/ના)",
    availableSlots: "ઉપલબ્ધ સમય સ્લોટ છે:\n{slots}\nકૃપા કરીને એક સમય સ્લોટ પસંદ કરો.",
    invalidTimeSlot: "કૃપા કરીને આપેલી યાદીમાંથી માન્ય સમય સ્લોટ પસંદ કરો.",
    bookingSuccess: "તમારી એપોઇન્ટમેન્ટ સફળતાપૂર્વક બુક થઈ ગઈ છે! તમને ટૂંક સમયમાં એક પુષ્ટિ સંદેશ મળશે.",
    bookingError: "માફ કરશો, તમારી એપોઇન્ટમેન્ટ બુક કરવામાં એક ભૂલ આવી. કૃપા કરીને ફરી પ્રયાસ કરો.",
    processingError: "માફ કરશો, તમારી બુકિંગ વિનંતી પર પ્રક્રિયા કરવામાં એક ભૂલ આવી. કૃપા કરીને ફરી પ્રયાસ કરો.",
    cancelPrompt: "એપોઇન્ટમેન્ટ રદ કરવા માટે કૃપા કરીને તમારું ઈમેઈલ સરનામું આપો.",
    cancelDatePrompt: "કૃપા કરીને રદ કરવા માટે એપોઇન્ટમેન્ટની તારીખ આપો (DD/MM/YYYY ફોર્મેટમાં).",
    cancelSuccess: "તમારી એપોઇન્ટમેન્ટ સફળતાપૂર્વક રદ કરી દેવામાં આવી છે.",
    cancelNoAppointment: "આપેલા ઈમેઈલ અને તારીખ માટે કોઈ એપોઇન્ટમેન્ટ મળી નથી.",
    cancelError: "તમારી એપોઇન્ટમેન્ટ રદ કરવામાં એક ભૂલ આવી. કૃપા કરીને ફરી પ્રયાસ કરો."
  }
};

const NUMBER_WORDS = {
  hi: {
    'एक': '1', 'दो': '2', 'तीन': '3', 'चार': '4', 'पांच': '5',
    'छह': '6', 'सात': '7', 'आठ': '8', 'नौ': '9', 'दस': '10'
  },
  mr: {
    'एक': '1', 'दोन': '2', 'तीन': '3', 'चार': '4', 'पाच': '5',
    'सहा': '6', 'सात': '7', 'आठ': '8', 'नऊ': '9', 'दहा': '10',
    'अकरा': '11', 'बारा': '12', 'तेरा': '13', 'चौदा': '14', 'पंधरा': '15',
    'सोळा': '16', 'सतरा': '17', 'अठरा': '18', 'एकोणीस': '19', 'वीस': '20'
  },
  gu: {
    'એક': '1', 'બે': '2', 'ત્રણ': '3', 'ચાર': '4', 'પાંચ': '5',
    'છ': '6', 'સાત': '7', 'આઠ': '8', 'નવ': '9', 'દસ': '10',
    'અગિયાર': '11', 'બાર': '12', 'તેર': '13', 'ચૌદ': '14', 'પંદર': '15',
    'સોળ': '16', 'સત્તર': '17', 'અઢાર': '18', 'ઓગણીસ': '19', 'વીસ': '20'
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
  },
  gu: {
    'સવારે': 'AM',
    'બપોરે': 'PM', 
    'સાંજે': 'PM',
    'રાત્રે': 'PM',
    'એએમ': 'AM',
    'પીએમ': 'PM',
    'વાગ્યે': '',
    'સવા': ':15',
    'સાડા': ':30',
    'પોણા': ':45',
    'એક': '1',
    'બે': '2',
    'ત્રણ': '3',
    'ચાર': '4',
    'પાંચ': '5',
    'છ': '6',
    'સાત': '7',
    'આઠ': '8',
    'નવ': '9',
    'દસ': '10',
    'અગિયાર': '11',
    'બાર': '12'
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

const getTimeSlotsForDoctor = (doctorId) => {
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

  // Default slots if doctor ID not found
  return doctorTimeSlots[doctorId] || {
    'Morning Clinic': [[9, 0], [12, 0]],
    'Evening Clinic': [[16, 0], [20, 0]],
    'AfterNoon Clinic': [[13, 0], [16, 0]]
  };
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
    const clinicTypeShort = clinicType.split(" - ")[0]; // Extract just the clinic type without location
    const doctorSlots = getTimeSlotsForDoctor(doctorId.toString());
    
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
    if (!text || typeof window === 'undefined') return;
    
    try {
      // Cancel any ongoing speech
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay after canceling
      }

      const voices = await forceLoadVoices();
      if (!voices.length) {
        console.warn('No voices available');
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Get language configuration
      const langConfig = ['mr', 'gu'].includes(selectedLanguage) ? 
        languageConfig.hi : 
        languageConfig[selectedLanguage] || languageConfig.en;

      // Find appropriate voice
      let selectedVoice = voices.find(voice => 
        langConfig.preferredVoices.some(preferred => 
          voice.name.includes(preferred) || voice.voiceURI.includes(preferred)
        )
      );

      // Fallback to language match if no preferred voice
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => 
          langConfig.fallbackLangs.some(lang => voice.lang.startsWith(lang))
        );
      }

      // Final fallback to any available voice
      if (!selectedVoice && voices.length > 0) {
        selectedVoice = voices[0];
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = langConfig.lang;
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        setIsSpeaking(true);

        return new Promise((resolve, reject) => {
          utterance.onend = () => {
            setIsSpeaking(false);
            resolve();
          };

          utterance.onerror = (event) => {
            const errorDetails = {
              type: event.type,
              timeStamp: event.timeStamp,
              error: event.error,
              message: 'Speech synthesis failed'
            };
            console.warn('Speech synthesis error:', errorDetails);
            setIsSpeaking(false);
            resolve(); // Resolve instead of reject to prevent error cascade
          };

          try {
            speechSynthesis.speak(utterance);
          } catch (error) {
            console.warn('Speech synthesis speak error:', error);
            setIsSpeaking(false);
            resolve();
          }
        });
      }
    } catch (error) {
      console.warn('Speech synthesis setup error:', error);
      setIsSpeaking(false);
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

  const setupVoiceRecognition = () => {
    if (!recognitionRef.current && typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        
        recognition.lang = selectedLanguage === "en" ? "en-US" : 
                          selectedLanguage === "hi" ? "hi-IN" : 
                          selectedLanguage === "mr" ? "mr-IN" : 
                          selectedLanguage === "gu" ? "gu-IN" : "en-US";

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setUserInput(transcript);
          setTimeout(() => handleUserInput(transcript), 100);
        };

        recognition.onerror = (event) => {
          console.warn('Voice recognition error:', event.error);
          setError("Voice recognition failed. Please try again or type your message.");
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }
  };

  const startVoiceRecognition = () => {
    setupVoiceRecognition();
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        setError(null);
      } catch (error) {
        console.warn("Failed to start recognition:", error);
        setError("Please wait a moment before trying voice input again.");
        setIsRecording(false);
        
        // Reset recognition instance
        recognitionRef.current = null;
        setupVoiceRecognition();
      }
    } else {
      setError("Voice recognition is not supported in your browser.");
    }
  };

  const handleUserInput = async (input) => {
    if (!input.trim()) return;
    
    setIsLoading(true);
    // Add message to chat history immediately
    setChatHistory(prev => [...prev, { role: "user", content: input }]);
    setUserInput(""); // Clear input right away

    try {
      if (cancelStep > 0) {
        await handleCancellationFlow(input);
      } else if (checkCancellationIntent(input)) {
        setCancelStep(1);
        const messages = TRANSLATIONS[selectedLanguage] || TRANSLATIONS.en;
        setChatHistory(prev => [...prev, { 
          role: "assistant", 
          content: messages.cancelPrompt 
        }]);
        setIsLoading(false); // Remove loading before speech
        await speak(messages.cancelPrompt);
      } else if (bookingStep > 0) {
        await handleBookingFlow(input);
      } else {
        // Check for symptoms
        const symptoms = extractSymptoms(input, selectedLanguage);
        if (symptoms) {
          localStorage.setItem('currentSymptoms', symptoms);
        }

        if (input.toLowerCase().includes("book") || 
            input.toLowerCase().includes("appointment") || 
            input.toLowerCase().includes("अपॉइंटमेंट") || 
            input.toLowerCase().includes("बुक")) {
          setBookingStep(1);
          const messages = TRANSLATIONS[selectedLanguage] || TRANSLATIONS.en;
          setChatHistory(prev => [...prev, { 
            role: "assistant", 
            content: messages.provideName 
          }]);
          setIsLoading(false); // Remove loading before speech
          await speak(messages.provideName);
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
          // Add response to chat history before speaking
          setChatHistory(prev => [...prev, { 
            role: "assistant", 
            content: data.response
          }]);
          setIsLoading(false); // Remove loading before speech
          await speak(data.response);
          
          const llmResponse = data.response;
          const doctorType = extractDoctorType(llmResponse);
          if(doctorType) {
            try {
              const doctorResponse = await GlobalApi.getDoctorByCategory(doctorType);
              // Format the doctor list before adding to chat
              const formattedDoctorList = doctorResponse.data.data.map(doctor => 
                `Doctor ID: ${doctor.id} - ${doctor.attributes.Name}`
              ).join('\n');
              
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
                content: formattedDoctorList || "No doctors found for this category."
              }]);
              await speak(formattedDoctorList || "No doctors found for this category.");
            } catch (error) {
              console.error("Error getting doctor list:", error);
              const errorMsg = "Sorry, there was an error processing your request.";
              setChatHistory(prev => [...prev, { 
                role: "assistant", 
                content: errorMsg 
              }]);
              await speak(errorMsg);
            } 
          }
        }
      }
    } catch (error) {
      console.error(error);
      const errorMsg = "Sorry, there was an error processing your request.";
      setChatHistory(prev => [...prev, { 
        role: "assistant", 
        content: errorMsg 
      }]);
      setIsLoading(false); // Remove loading before speech
      await speak(errorMsg);
    } finally {
      if (isLoading) setIsLoading(false); // Ensure loading is removed if still active
      setUserInput(""); // Ensure input is cleared
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
      gu: ['रद', 'कેन્સલ', 'કાઢી']
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

  const handleBookingFlow = async (input) => {
    const messages = TRANSLATIONS[selectedLanguage] || TRANSLATIONS.en;
    
    try {
      switch(bookingStep) {
        case 1: // Name step
          setBookingData(prev => ({ ...prev, name: input }));
          setBookingStep(2);
          await speak(messages.provideEmail);
          setChatHistory(prev => [...prev, { 
            role: "assistant", 
            content: messages.provideEmail 
          }]);
          break;

        case 2: // Email step
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(input)) {
            const invalidEmail = "Please provide a valid email address.";
            await speak(invalidEmail);
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: invalidEmail 
            }]);
            break;
          }
          setBookingData(prev => ({ ...prev, email: input }));
          setBookingStep(3);
          await speak(messages.providePhone);
          setChatHistory(prev => [...prev, { 
            role: "assistant", 
            content: messages.providePhone 
          }]);
          break;

        case 3: // Phone step
          // Convert number words to digits for all languages
          const processedInput = convertNumberWordsToDigits(input, selectedLanguage);
          const phoneNumber = processedInput.replace(/\D/g, '');
          
          if (phoneNumber.length < 10) {
            const invalidPhone = "Please provide a valid phone number.";
            await speak(invalidPhone);
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: invalidPhone 
            }]);
            break;
          }
          
          setBookingData(prev => ({ ...prev, phone: phoneNumber }));
          setBookingStep(4);
          
          // Fetch available doctors
          try {
            const response = await GlobalApi.getDoctorList();
            if (isValidDoctorResponse(response)) {
              setAvailableDoctors(response.data.data);
              const doctorList = response.data.data
                .map(doc => `Doctor ID: ${doc.id} - ${doc.attributes.Name}`)
                .join('\n');
              const prompt = messages.chooseDoctorPrompt.replace('{doctorList}', doctorList);
              await speak(prompt);
              setChatHistory(prev => [...prev, { 
                role: "assistant", 
                content: prompt 
              }]);
            }
          } catch (error) {
            console.error("Error fetching doctors:", error);
            throw new Error(messages.processingError);
          }
          break;

        case 4: // Doctor selection step
          const doctorId = convertNumberWordsToDigits(input, selectedLanguage);
          const selectedDoctor = availableDoctors.find(d => d.id === doctorId);
          
          if (!selectedDoctor) {
            await speak(messages.invalidDoctorId);
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: messages.invalidDoctorId 
            }]);
            break;
          }
          
          setBookingData(prev => ({ 
            ...prev, 
            doctorId: doctorId,
            doctorName: selectedDoctor.attributes.Name 
          }));
          setBookingStep(5);
          await speak(messages.provideDate);
          setChatHistory(prev => [...prev, { 
            role: "assistant", 
            content: messages.provideDate 
          }]);
          break;

        case 5: // Date step
          const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
          if (!dateRegex.test(input)) {
            await speak(messages.invalidDateFormat);
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: messages.invalidDateFormat 
            }]);
            break;
          }

          const [day, month, year] = input.split('/');
          const selectedDate = new Date(year, month - 1, day);
          const today = new Date();
          
          if (selectedDate < today) {
            await speak(messages.futureDateRequired);
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: messages.futureDateRequired 
            }]);
            break;
          }

          if (selectedDate.getDay() === 0) {
            await speak(messages.closedSunday);
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: messages.closedSunday 
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
          break;

        case 6: // Clinic selection step
          const clinicNumber = convertNumberWordsToDigits(input, selectedLanguage);
          const clinicTypes = {
            '1': 'Morning Clinic - Ratnamukund Clinic, Warje',
            '2': 'Evening Clinic - Ratnamukund Clinic, Warje',
            '3': 'AfterNoon Clinic - Shashwat Clinic, Pune'
          };

          if (!clinicTypes[clinicNumber]) {
            await speak(messages.invalidClinic);
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: messages.invalidClinic 
            }]);
            break;
          }

          setClinicType(clinicTypes[clinicNumber]);
          const slots = await getAvailableTimeSlots(
            bookingData.doctorId,
            new Date(bookingData.date.split('/').reverse().join('-')),
            clinicTypes[clinicNumber]
          );

          if (slots.length === 0) {
            await speak(messages.noTimeSlots);
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: messages.noTimeSlots 
            }]);
            break;
          }

          setAvailableTimeSlots(slots);
          setBookingStep(7);
          const slotsPrompt = messages.availableSlots.replace('{slots}', slots.join('\n'));
          await speak(slotsPrompt);
          setChatHistory(prev => [...prev, { 
            role: "assistant", 
            content: slotsPrompt 
          }]);
          break;

        case 7: // Time slot selection step
          const selectedTime = convertTimeExpression(input, selectedLanguage);
          
          if (!availableTimeSlots.includes(selectedTime)) {
            await speak(messages.invalidTimeSlot);
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: messages.invalidTimeSlot 
            }]);
            break;
          }

          setBookingData(prev => ({ ...prev, time: selectedTime }));
          
          try {
            const symptoms = localStorage.getItem('currentSymptoms') || "No symptoms mentioned";
            const formData = {
              ...bookingData,
              time: selectedTime,
              symptoms,
              clinic_type: clinicType
            };

            const response = await GlobalApi.bookAppointment(formData);
            if (response.status === 200) {
              await sendMessage(formData);
              await speak(messages.bookingSuccess);
              setChatHistory(prev => [...prev, { 
                role: "assistant", 
                content: messages.bookingSuccess 
              }]);
            } else {
              throw new Error(messages.bookingError);
            }
          } catch (error) {
            console.error("Booking error:", error);
            await speak(messages.bookingError);
            setChatHistory(prev => [...prev, { 
              role: "assistant", 
              content: messages.bookingError 
            }]);
          }

          // Reset booking flow
          setBookingStep(0);
          setBookingData({
            name: "",
            email: "",
            phone: "",
            doctorId: "",
            timeSlot: "",
            date: ""
          });
          localStorage.removeItem('currentSymptoms');
          break;
      }
    } catch (error) {
      console.error("Error in booking flow:", error);
      await speak(messages.processingError);
      setChatHistory(prev => [...prev, { 
        role: "assistant", 
        content: messages.processingError 
      }]);
      setBookingStep(0);
      setBookingData({
        name: "",
        email: "",
        phone: "",
        doctorId: "",
        timeSlot: "",
        date: ""
      });
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
                <Button variant="outline" onClick={startVoiceRecognition}>
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