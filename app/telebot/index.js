import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import GlobalApi from '../_utils/DoctorApi.js';
import { app } from '../config/FirebaseConfig.js';
import { getFirestore, doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import axios from 'axios';

// Load environment variables
dotenv.config();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });

// Store user states
const userStates = new Map();

// Initialize state for a user
const initUserState = (chatId) => {
  userStates.set(chatId, {
    bookingStep: 0,
    cancelStep: 0,
    meetingStep: 0,
    selectedLanguage: 'en',
    bookingData: {
      name: "",
      email: "",
      phone: "",
      doctorId: "",
      timeSlot: "",
      date: "",
      clinicType: "",
      selectedDoctor: null
    },
    cancelData: {
      email: "",
      date: ""
    },
    meetingData: {
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
    },
    availableDoctors: [],
    availableTimeSlots: [],
    chatHistory: []
  });
  return userStates.get(chatId);
};

// Get or create user state
const getUserState = (chatId) => {
  if (!userStates.has(chatId)) {
    return initUserState(chatId);
  }
  return userStates.get(chatId);
};

// Handle chat messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  const state = getUserState(chatId);

  try {
    // Update chat history
    state.chatHistory.push({ role: "user", content: text });

    // Handle booking flow
    if (state.bookingStep > 0) {
      await handleBookingFlow(chatId, text, state);
    }
    // Handle cancellation flow
    else if (state.cancelStep > 0) {
      await handleCancellationFlow(chatId, text, state);
    }
    // Handle meeting flow
    else if (state.meetingStep > 0) {
      await handleMeetingFlow(chatId, text, state);
    }
    // Handle general chat
    else {
      await handleGeneralChat(chatId, text, state);
    }
  } catch (error) {
    console.error('Error handling message:', error);
    bot.sendMessage(chatId, "Sorry, there was an error processing your request. Please try again.");
  }
});

// Handle general chat
async function handleGeneralChat(chatId, text, state) {
  try {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('book') || lowerText.includes('appointment')) {
      state.bookingStep = 1;
      bot.sendMessage(chatId, "Please provide your name.");
      return;
    }

    if (lowerText.includes('cancel')) {
      state.cancelStep = 1;
      bot.sendMessage(chatId, "Please provide your email address to cancel the appointment.");
      return;
    }

    if (lowerText.includes('meeting') || lowerText.includes('schedule')) {
      state.meetingStep = 1;
      bot.sendMessage(chatId, "Please provide your email address to schedule a meeting.");
      return;
    }

    // Process general chat using your existing chat API
    const response = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatHistory: state.chatHistory,
        language: state.selectedLanguage
      }),
    });

    const data = await response.json();
    bot.sendMessage(chatId, data.response);
    state.chatHistory.push({ role: "assistant", content: data.response });
  } catch (error) {
    console.error('Error in general chat:', error);
    bot.sendMessage(chatId, "Sorry, I couldn't process your message. Please try again.");
  }
}

// Add these helper functions at the top with other helpers
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

// Update handleBookingFlow function
async function handleBookingFlow(chatId, text, state) {
  try {
    switch (state.bookingStep) {
      case 1:
        state.bookingData.name = text;
        state.bookingStep = 2;
        bot.sendMessage(chatId, "Thank you. Now please provide your email address.");
        break;

      case 2:
        if (!validateEmail(text)) {
          bot.sendMessage(chatId, "Please provide a valid email address.");
          return;
        }
        state.bookingData.email = text;
        state.bookingStep = 3;
        bot.sendMessage(chatId, "Please provide your phone number (10 digits).");
        break;

      case 3:
        const phoneNumber = text.replace(/[^0-9]/g, '');
        if (phoneNumber.length !== 10) {
          bot.sendMessage(chatId, "Please provide a valid 10-digit phone number.");
          return;
        }
        state.bookingData.phone = phoneNumber;
        state.bookingStep = 4;
        
        try {
          const response = await GlobalApi.getDoctorList();
          if (!response.data || !response.data.data) {
            throw new Error('Invalid doctor list response');
          }
          
          const doctors = response.data.data;
          state.availableDoctors = doctors;
          
          const doctorList = doctors
            .map(doc => `Doctor ID: ${doc.id} - Dr. ${doc.attributes.Name} (${doc.attributes.Profession})`)
            .join('\n');
          
          bot.sendMessage(chatId, `Available doctors:\n${doctorList}\nPlease choose a doctor by entering their ID number.`);
        } catch (error) {
          console.error('Error fetching doctors:', error);
          bot.sendMessage(chatId, "Sorry, there was an error fetching the doctor list. Please try again.");
          state.bookingStep = 0;
        }
        break;

      case 4:
        const selectedDoctorId = text;
        const selectedDoctor = state.availableDoctors.find(d => d.id.toString() === selectedDoctorId);
        
        if (!selectedDoctor) {
          bot.sendMessage(chatId, "Invalid doctor ID. Please select a valid doctor from the list.");
          return;
        }
        
        state.bookingData.doctorId = selectedDoctorId;
        state.bookingData.selectedDoctor = selectedDoctor;
        state.bookingStep = 5;
        bot.sendMessage(chatId, "Please provide your preferred appointment date in DD/MM/YYYY format.");
        break;

      case 5:
        const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        if (!dateRegex.test(text)) {
          bot.sendMessage(chatId, "Invalid date format. Please use DD/MM/YYYY format.");
          return;
        }

        const [day, month, year] = text.split('/');
        const appointmentDate = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (appointmentDate < today) {
          bot.sendMessage(chatId, "Please select a future date.");
          return;
        }

        if (appointmentDate.getDay() === 0) {
          bot.sendMessage(chatId, "Sorry, we are closed on Sundays. Please select another date.");
          return;
        }

        if (state.bookingData.selectedDoctor.id === '5' && 
            ![1, 4, 6].includes(appointmentDate.getDay())) {
          bot.sendMessage(chatId, "This doctor is only available on Mondays, Thursdays, and Saturdays.");
          return;
        }

        state.bookingData.date = text;
        state.bookingStep = 6;

        const clinicMessage = `Please choose a clinic type:
1. Morning Clinic - Ratnamukund Clinic, Warje
2. Evening Clinic - Ratnamukund Clinic, Warje
3. AfterNoon Clinic - Shashwat Clinic, Pune
Please enter the number (1-3) for your choice.`;
        
        bot.sendMessage(chatId, clinicMessage);
        break;

      case 6:
        const clinicChoice = parseInt(text);
        if (clinicChoice < 1 || clinicChoice > 3) {
          bot.sendMessage(chatId, "Please select a valid clinic type (1-3).");
          return;
        }

        const clinicTypes = {
          1: "Morning Clinic",
          2: "Evening Clinic",
          3: "AfterNoon Clinic"
        };

        const selectedClinicType = clinicTypes[clinicChoice];
        state.bookingData.clinicType = selectedClinicType;

        try {
          const dateStr = state.bookingData.date.split('/').reverse().join('-');
          const availableSlots = await GlobalApi.getAvailableTimeSlots(
            state.bookingData.doctorId,
            dateStr,
            selectedClinicType
          );

          if (availableSlots.length === 0) {
            bot.sendMessage(chatId, "No time slots available for the selected date and clinic type. Please choose a different date or clinic type.");
            state.bookingStep = 5;
            return;
          }

          state.availableTimeSlots = availableSlots;
          state.bookingStep = 7;
          bot.sendMessage(chatId, `Available time slots are:\n${availableSlots.join('\n')}\nPlease choose a time slot.`);
        } catch (error) {
          console.error('Error fetching time slots:', error);
          bot.sendMessage(chatId, "Sorry, there was an error fetching available time slots. Please try again.");
          state.bookingStep = 5;
        }
        break;

      case 7:
        if (!state.availableTimeSlots.includes(text)) {
          bot.sendMessage(chatId, "Please select a valid time slot from the list provided.");
          return;
        }

        state.bookingData.timeSlot = text;

        try {
          const appointmentData = {
            data: {
              Name: state.bookingData.name,
              Email: state.bookingData.email,
              Phone: state.bookingData.phone,
              Date: state.bookingData.date,
              Time: state.bookingData.timeSlot,
              doctor: state.bookingData.doctorId,
              Type: "In-Person",
              clinicType: state.bookingData.clinicType,
              symp: state.chatHistory
                .filter(msg => msg.role === 'user')
                .map(msg => msg.content)
                .join(' ') || "No symptoms provided"
            }
          };

          await GlobalApi.bookAppointment(appointmentData);

          // Send confirmation message
          const confirmationMessage = `Appointment Booked Successfully!
          
Details:
- Name: ${state.bookingData.name}
- Date: ${state.bookingData.date}
- Time: ${state.bookingData.timeSlot}
- Clinic: ${state.bookingData.clinicType}
- Doctor: Dr. ${state.availableDoctors.find(d => d.id.toString() === state.bookingData.doctorId).attributes.Name}

You will receive a confirmation message shortly.`;

          bot.sendMessage(chatId, confirmationMessage);

          // Send WhatsApp notification
          await sendMessage({
            user_name: state.bookingData.name,
            user_phone: state.bookingData.phone,
            date: state.bookingData.date,
            time: state.bookingData.timeSlot,
            doctorName: state.availableDoctors.find(d => d.id.toString() === state.bookingData.doctorId).attributes.Name
          });

        } catch (error) {
          console.error('Booking error:', error);
          bot.sendMessage(chatId, "Sorry, there was an error booking your appointment. Please try again.");
        }

        // Reset booking state
        state.bookingStep = 0;
        state.bookingData = {
          name: "",
          email: "",
          phone: "",
          doctorId: "",
          timeSlot: "",
          date: "",
          clinicType: "",
          selectedDoctor: null
        };
        break;

      default:
        state.bookingStep = 0;
        bot.sendMessage(chatId, "Booking process completed or invalid step.");
    }
  } catch (error) {
    console.error('Error in booking flow:', error);
    bot.sendMessage(chatId, "Sorry, there was an error in the booking process. Please try again.");
    state.bookingStep = 0;
  }
}

// Add helper function for time slots
const createTimeSlots = (date, doctorId, interval = 30, bookedSlots = []) => {
  const timeList = [];
  const eveningSlots = [
    { start: 20, end: 22 } // 8 PM to 10 PM
  ];

  const isToday = isSameDay(date, new Date());
  const now = new Date();

  eveningSlots.forEach(slot => {
    let currentHour = slot.start;
    let currentMinutes = 0;

    while (currentHour < slot.end) {
      const slotTime = new Date(date);
      slotTime.setHours(currentHour, currentMinutes);

      if (isToday && slotTime <= now) {
        currentMinutes += interval;
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

      currentMinutes += interval;
      if (currentMinutes >= 60) {
        currentHour++;
        currentMinutes = 0;
      }
    }
  });

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

// Update handleMeetingFlow function
async function handleMeetingFlow(chatId, text, state) {
  try {
    switch(state.meetingStep) {
      case 1: // Email validation
        if (!validateEmail(text)) {
          bot.sendMessage(chatId, "Please provide a valid email address.");
          return;
        }
        state.meetingData.userEmail = text;
        state.meetingStep = 2;
        
        try {
          const response = await GlobalApi.getDoctorList();
          if (!response.data || !response.data.data) {
            throw new Error('Invalid doctor list response');
          }
          
          const doctors = response.data.data;
          state.availableDoctors = doctors;
          
          const doctorList = doctors
            .map(doc => `Doctor ID: ${doc.id} - ${doc.attributes.Name} (${doc.attributes.Profession})`)
            .join('\n');
          
          bot.sendMessage(chatId, `Available doctors:\n${doctorList}\nPlease choose a doctor by entering their ID number.`);
        } catch (error) {
          console.error('Error fetching doctors:', error);
          bot.sendMessage(chatId, "Sorry, there was an error fetching the doctor list. Please try again.");
          state.meetingStep = 0;
        }
        break;

      case 2: // Doctor selection
        const doctorId = text;
        const selectedDoctor = state.availableDoctors.find(d => d.id.toString() === doctorId);
        
        if (!selectedDoctor) {
          bot.sendMessage(chatId, "Invalid doctor ID. Please select a valid doctor from the list.");
          return;
        }
        
        state.meetingData.doctorId = doctorId;
        state.meetingData.eventName = `Medical Consultation with Dr. ${selectedDoctor.attributes.Name}`;
        state.meetingStep = 3;
        bot.sendMessage(chatId, "Please provide your preferred meeting date in DD/MM/YYYY format.");
        break;

      case 3: // Date selection
        const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        if (!dateRegex.test(text)) {
          bot.sendMessage(chatId, "Invalid date format. Please use DD/MM/YYYY format.");
          return;
        }

        const [day, month, year] = text.split('/');
        const selectedDate = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
          bot.sendMessage(chatId, "Please select a future date.");
          return;
        }

        if (selectedDate.getDay() === 0) {
          bot.sendMessage(chatId, "Sorry, we are closed on Sundays. Please select another date.");
          return;
        }

        try {
          const formattedDate = selectedDate.toISOString().split('T')[0];
          state.meetingData.selectedDate = formattedDate;
          
          // Fetch booked meetings from Firebase
          const db = getFirestore(app);
          const meetingsRef = collection(db, "MeetingEvent");
          const q = query(meetingsRef, 
            where("doctorId", "==", state.meetingData.doctorId),
            where("selectedDate", "==", formattedDate)
          );
          
          const querySnapshot = await getDocs(q);
          const bookedSlots = [];
          querySnapshot.forEach((doc) => {
            bookedSlots.push(doc.data().selectedTime);
          });
          
          // Get available time slots
          const availableSlots = createTimeSlots(selectedDate, state.meetingData.doctorId, 30, bookedSlots);

          if (availableSlots.length === 0) {
            bot.sendMessage(chatId, "No time slots available for this date. Please select another date.");
            return;
          }

          state.availableTimeSlots = availableSlots;
          state.meetingStep = 4;
          bot.sendMessage(chatId, `Available time slots are:\n${availableSlots.join('\n')}\nPlease choose a time slot.`);
        } catch (error) {
          console.error('Error processing date selection:', error);
          bot.sendMessage(chatId, "There was an error processing the date. Please try again.");
          state.meetingStep = 0;
        }
        break;

      case 4: // Time selection and Zoom meeting creation
        if (!state.availableTimeSlots.includes(text)) {
          bot.sendMessage(chatId, "Please select a valid time slot from the list provided.");
          return;
        }

        try {
          // Create Zoom meeting
          const [time, period] = text.split(' ');
          const [hours, minutes] = time.split(':').map(Number);
          let militaryHours = hours;
          if (period === 'PM' && hours !== 12) militaryHours += 12;
          if (period === 'AM' && hours === 12) militaryHours = 0;
          
          const startTime = `${state.meetingData.selectedDate}T${String(militaryHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

          const zoomResponse = await axios.post('http://localhost:3000/api/zoom/create-meeting', {
            topic: state.meetingData.eventName,
            start_time: startTime,
            duration: 30
          });

          if (!zoomResponse.data?.join_url) {
            throw new Error('Invalid Zoom meeting URL');
          }

          // Save to Firebase
          const db = getFirestore(app);
          const id = Date.now().toString();
          
          const meetingDoc = {
            id,
            eventName: state.meetingData.eventName,
            duration: 30,
            locationType: "Zoom",
            locationUrl: zoomResponse.data.join_url,
            selectedDate: state.meetingData.selectedDate,
            selectedTime: text,
            themeColor: "#4F46E5",
            businessId: `/Business/${state.meetingData.userEmail}`,
            createdBy: state.meetingData.userEmail,
            createdAt: new Date().toISOString(),
            doctorId: state.meetingData.doctorId,
            clinicType: "Evening Clinic",
            clinicTiming: "8:00 PM - 10:00 PM"
          };

          await setDoc(doc(db, "MeetingEvent", id), meetingDoc);

          // Create appointment record
          await GlobalApi.bookAppointment({
            data: {
              Name: state.meetingData.eventName,
              Email: state.meetingData.userEmail,
              Date: state.meetingData.selectedDate,
              Time: text,
              doctor: state.meetingData.doctorId,
              Type: "Online Meeting",
              ZoomUrl: zoomResponse.data.join_url
            }
          });

          bot.sendMessage(chatId, `Your Zoom meeting has been scheduled successfully!\nMeeting link: ${zoomResponse.data.join_url}`);
          
          // Reset meeting state
          state.meetingStep = 0;
          state.meetingData = {
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
          };
        } catch (error) {
          console.error('Meeting creation error:', error);
          bot.sendMessage(chatId, "Unable to schedule the meeting. Please try again later.");
          state.meetingStep = 0;
        }
        break;

      default:
        state.meetingStep = 0;
        bot.sendMessage(chatId, "Meeting scheduling process completed or invalid step.");
    }
  } catch (error) {
    console.error('Error in meeting flow:', error);
    bot.sendMessage(chatId, "Sorry, there was an error in the meeting scheduling process. Please try again.");
    state.meetingStep = 0;
  }
}

// Add handleCancellationFlow function
async function handleCancellationFlow(chatId, text, state) {
  try {
    switch (state.cancelStep) {
      case 1:
        if (!text.includes('@')) {
          bot.sendMessage(chatId, "Please provide a valid email address.");
          return;
        }
        state.cancelData.email = text;
        state.cancelStep = 2;
        bot.sendMessage(chatId, "Please provide the appointment date to cancel (DD/MM/YYYY format).");
        break;

      case 2:
        const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        if (!dateRegex.test(text)) {
          bot.sendMessage(chatId, "Invalid date format. Please use DD/MM/YYYY format.");
          return;
        }
        
        try {
          const appointments = await GlobalApi.getAppointmentsByEmailAndDate(state.cancelData.email, text);
          if (appointments.data.data.length === 0) {
            bot.sendMessage(chatId, "No appointments found for the provided email and date.");
          } else {
            await Promise.all(appointments.data.data.map(app => GlobalApi.cancelAppointment(app.id)));
            bot.sendMessage(chatId, "Your appointment has been successfully cancelled.");
          }
        } catch (error) {
          console.error('Cancellation error:', error);
          bot.sendMessage(chatId, "Sorry, there was an error cancelling your appointment. Please try again.");
        }
        
        // Reset cancel state
        state.cancelStep = 0;
        state.cancelData = {
          email: "",
          date: ""
        };
        break;

      default:
        state.cancelStep = 0;
        bot.sendMessage(chatId, "Cancellation process completed or invalid step.");
    }
  } catch (error) {
    console.error('Error in cancellation flow:', error);
    bot.sendMessage(chatId, "Sorry, there was an error in the cancellation process. Please try again.");
    state.cancelStep = 0;
  }
}

// Add validation functions
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

function validatePhone(phone) {
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone);
}

function validateDate(dateStr) {
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  if (!regex.test(dateStr)) return false;
  
  const [day, month, year] = dateStr.split('/');
  const date = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return date >= today && date.getDay() !== 0;
}

// Add error handling middleware
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

bot.on('error', (error) => {
  console.error('Bot error:', error);
});

// Start the bot
console.log('Bot is running...'); 