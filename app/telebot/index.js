import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import GlobalApi from '../_utils/DoctorApi.js';
import { app, auth } from '../config/FirebaseConfig.js';
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
      date: ""
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

// Handle booking flow
async function handleBookingFlow(chatId, text, state) {
  try {
    switch (state.bookingStep) {
      case 1:
        state.bookingData.name = text;
        state.bookingStep = 2;
        bot.sendMessage(chatId, "Thank you. Now please provide your email address.");
        break;

      case 2:
        state.bookingData.email = text;
        state.bookingStep = 3;
        bot.sendMessage(chatId, "Please provide your phone number.");
        break;

      case 3:
        state.bookingData.phone = text;
        state.bookingStep = 4;
        
        // Fetch doctor list
        try {
          const response = await GlobalApi.getDoctorList();
          const doctors = response.data.data;
          state.availableDoctors = doctors;
          
          const doctorList = doctors
            .map(doc => `Doctor ID: ${doc.id} - ${doc.attributes.Name} (${doc.attributes.Profession})`)
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
        const doctor = state.availableDoctors.find(d => d.id.toString() === selectedDoctorId);
        
        if (!doctor) {
          bot.sendMessage(chatId, "Invalid doctor ID. Please select a valid doctor from the list.");
          return;
        }
        
        state.bookingData.doctorId = selectedDoctorId;
        state.bookingStep = 5;
        bot.sendMessage(chatId, "Please provide your preferred appointment date in DD/MM/YYYY format.");
        break;

      case 5:
        // Validate date format
        const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        if (!dateRegex.test(text)) {
          bot.sendMessage(chatId, "Invalid date format. Please use DD/MM/YYYY format.");
          return;
        }

        state.bookingData.date = text;
        state.bookingStep = 6;

        // Show clinic types
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

        // Map clinic choice to time slots
        const timeSlots = {
          1: ["9:00 AM", "10:00 AM", "11:00 AM"],
          2: ["4:00 PM", "5:00 PM", "6:00 PM"],
          3: ["2:00 PM", "3:00 PM", "4:00 PM"]
        };

        state.availableTimeSlots = timeSlots[clinicChoice];
        state.bookingStep = 7;
        bot.sendMessage(chatId, `Available time slots are:\n${state.availableTimeSlots.join('\n')}\nPlease choose a time slot.`);
        break;

      case 7:
        if (!state.availableTimeSlots.includes(text)) {
          bot.sendMessage(chatId, "Please select a valid time slot from the list provided.");
          return;
        }

        state.bookingData.timeSlot = text;

        // Create appointment
        try {
          await GlobalApi.bookAppointment({
            data: {
              Name: state.bookingData.name,
              Email: state.bookingData.email,
              Phone: state.bookingData.phone,
              Date: state.bookingData.date,
              Time: state.bookingData.timeSlot,
              doctor: state.bookingData.doctorId
            }
          });

          bot.sendMessage(chatId, "Your appointment has been successfully booked! You will receive a confirmation message shortly.");
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
          date: ""
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

// Add handleMeetingFlow function
async function handleMeetingFlow(chatId, text, state) {
  try {
    switch (state.meetingStep) {
      case 1:
        if (!text.includes('@')) {
          bot.sendMessage(chatId, "Please provide a valid email address.");
          return;
        }
        state.meetingData.userEmail = text;
        state.meetingStep = 2;
        
        // Fetch doctor list
        try {
          const response = await GlobalApi.getDoctorList();
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

      case 2:
        const selectedDoctorId = text;
        const doctor = state.availableDoctors.find(d => d.id.toString() === selectedDoctorId);
        
        if (!doctor) {
          bot.sendMessage(chatId, "Invalid doctor ID. Please select a valid doctor from the list.");
          return;
        }
        
        state.meetingData.doctorId = selectedDoctorId;
        state.meetingStep = 3;
        bot.sendMessage(chatId, "Please provide your preferred meeting date in DD/MM/YYYY format.");
        break;

      case 3:
        const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        if (!dateRegex.test(text)) {
          bot.sendMessage(chatId, "Invalid date format. Please use DD/MM/YYYY format.");
          return;
        }
        
        state.meetingData.selectedDate = text;
        state.meetingStep = 4;
        bot.sendMessage(chatId, "Please provide the meeting time (e.g., 10:00 AM).");
        break;

      case 4:
        state.meetingData.selectedTime = text;
        state.meetingData.eventName = `Medical Consultation with Dr. ${state.availableDoctors.find(d => d.id.toString() === state.meetingData.doctorId).attributes.Name}`;
        
        try {
          await GlobalApi.bookAppointment({
            data: {
              Name: state.meetingData.eventName,
              Email: state.meetingData.userEmail,
              Date: state.meetingData.selectedDate,
              Time: state.meetingData.selectedTime,
              doctor: state.meetingData.doctorId,
              Type: "Online Meeting"
            }
          });
          
          bot.sendMessage(chatId, "Your meeting has been successfully scheduled! You will receive a confirmation email shortly.");
        } catch (error) {
          console.error('Meeting scheduling error:', error);
          bot.sendMessage(chatId, "Sorry, there was an error scheduling your meeting. Please try again.");
        }
        
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

// Start the bot
console.log('Bot is running...'); 