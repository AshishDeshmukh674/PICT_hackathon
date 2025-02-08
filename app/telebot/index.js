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
      date: "",
      clinicType: ""
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

// Add these helper functions at the top
const getTimeSlotsForDoctor = (doctorId) => {
    const doctorTimeSlots = {
        '3': { 
            morning: [[8, 30], [9, 30]], 
            evening: [[19, 30], [20, 30]] 
        },
        '4': { 
            morning: [[8, 0], [9, 0]], 
            evening: [[11, 0], [1, 0]],
            AfterNoon: [[9, 0], [11, 0]]
        },
        '5': { // Special case for ID 5
            morning: [[8, 30], [11, 0]], 
            evening: [[19, 0], [21, 0]]
        },
        '7': { 
            morning: [[8, 0], [10, 45]] 
        }
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
        const clinicTypeKey = clinicTypeOnly.toLowerCase().replace(' clinic', '');
        const doctorSlots = getTimeSlotsForDoctor(doctorId.toString());

        const isToday = isSameDay(date, new Date());
        const now = new Date();
        const dayOfWeek = date.getDay();

        // Check if it's Sunday
        if (dayOfWeek === 0) {
            return [];
        }

        // Special handling for doctor ID 5
        if (doctorId === 5) {
            if (clinicTypeKey === 'morning' && ![1, 6].includes(dayOfWeek)) {
                return [];
            }
            if (clinicTypeKey === 'evening' && dayOfWeek !== 4) {
                return [];
            }
        }

        // Get time range for the selected clinic type
        const timeRange = doctorSlots[clinicTypeKey];
        if (!timeRange) {
            console.error('No slots found for clinic type:', clinicTypeKey);
            return [];
        }

        const [startSlot, endSlot] = timeRange;
        let [currentHour, currentMinutes] = startSlot;
        const [endHour, endMinutes] = endSlot;

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

        return timeList;
    } catch (error) {
        console.error("Error getting available time slots:", error);
        throw error;
    }
};

// Handle booking flow
async function handleBookingFlow(chatId, text, state) {
  try {
    switch (state.bookingStep) {
      case 1:
        // Validate name
        if (text.length < 2) {
          bot.sendMessage(chatId, "Please provide a valid name (at least 2 characters).");
          return;
        }
        state.bookingData.userName = text;
        state.bookingStep = 2;
        bot.sendMessage(chatId, "Thank you. Now please provide your email address.");
        break;

      case 2:
        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(text)) {
          bot.sendMessage(chatId, "Please provide a valid email address.");
          return;
        }
        state.bookingData.email = text;
        state.bookingStep = 3;
        bot.sendMessage(chatId, "Please provide your phone number.");
        break;

      case 3:
        // Validate phone number
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(text)) {
          bot.sendMessage(chatId, "Please provide a valid 10-digit phone number.");
          return;
        }
        state.bookingData.phone = text;
        state.bookingStep = 4;

        // Fetch doctor list
        try {
          const response = await GlobalApi.getDoctorList();
          state.availableDoctors = response.data.data;
          
          const doctorList = state.availableDoctors
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
        const selectedDoctorId = parseInt(text);
        const doctor = state.availableDoctors.find(d => d.id === selectedDoctorId);

        if (!doctor) {
          bot.sendMessage(chatId, "Invalid doctor ID. Please select a valid doctor from the list.");
          return;
        }

        state.bookingData.doctorId = selectedDoctorId;
        state.bookingStep = 5;
        bot.sendMessage(chatId, "Please provide your preferred appointment date in YYYY-MM-DD format.");
        break;

      case 5:
        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(text)) {
          bot.sendMessage(chatId, "Invalid date format. Please use YYYY-MM-DD format.");
          return;
        }

        // Validate date is in the future
        const selectedDate = new Date(text);
        const today = new Date();
        if (selectedDate < today) {
          bot.sendMessage(chatId, "Please select a future date.");
          return;
        }

        state.bookingData.date = text;
        state.bookingStep = 6;

        // Show clinic type options first
        bot.sendMessage(chatId, `Please choose a clinic type:
1. Morning Clinic - Ratnamukund Clinic, Warje
2. Evening Clinic - Ratnamukund Clinic, Warje
3. AfterNoon Clinic - Shashwat Clinic, Pune
Please enter the number (1-3) for your choice.`);
        break;

      case 6:
        // Handle clinic type selection
        const clinicChoice = text.trim();
        let selectedClinic;
        
        if (clinicChoice === '1') {
            selectedClinic = 'Morning Clinic - Ratnamukund Clinic, Warje';
        } else if (clinicChoice === '2') {
            selectedClinic = 'Evening Clinic - Ratnamukund Clinic, Warje';
        } else if (clinicChoice === '3') {
            selectedClinic = 'AfterNoon Clinic - Shashwat Clinic, Pune';
        } else {
            bot.sendMessage(chatId, "Please select a valid clinic type (1-3).");
            return;
        }

        try {
            const selectedDate = new Date(state.bookingData.date);
            const dayOfWeek = selectedDate.getDay();

            // Check if it's Sunday
            if (dayOfWeek === 0) {
                bot.sendMessage(chatId, "Sorry, appointments are not available on Sundays. Please choose another date.");
                state.bookingStep = 5;
                return;
            }

            // Special handling for doctor ID 5
            if (state.bookingData.doctorId === 5) {
                const clinicTypeShort = selectedClinic.split(" - ")[0].toLowerCase().replace(' clinic', '');
                if (clinicTypeShort === 'morning' && ![1, 6].includes(dayOfWeek)) {
                    bot.sendMessage(chatId, "This doctor only has morning clinic on Mondays and Saturdays. Please choose another date or clinic type.");
                    return;
                }
                if (clinicTypeShort === 'evening' && dayOfWeek !== 4) {
                    bot.sendMessage(chatId, "This doctor only has evening clinic on Thursdays. Please choose another date or clinic type.");
                    return;
                }
            }

            // Get available time slots
            const slots = await getAvailableTimeSlots(
                state.bookingData.doctorId,
                selectedDate,
                selectedClinic
            );

            if (!slots || slots.length === 0) {
                bot.sendMessage(chatId, "No time slots available for the selected date and clinic type. Please try another date or clinic type.");
                state.bookingStep = 5;
                return;
            }

            state.availableTimeSlots = slots;
            state.selectedClinic = selectedClinic;
            bot.sendMessage(chatId, `Available time slots for ${selectedClinic}:\n${slots.join('\n')}\nPlease choose a time slot from the list above.`);
            state.bookingStep = 7;
        } catch (error) {
            console.error('Error getting time slots:', error);
            bot.sendMessage(chatId, "Sorry, there was an error fetching available time slots. Please try another clinic type or date.");
            return;
        }
        break;

      case 7:
        // Validate time format
        const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/i;
        if (!timeRegex.test(text)) {
          bot.sendMessage(chatId, "Invalid time format. Please use format like '09:00 AM'.");
          return;
        }

        state.bookingData.time = text;

        try {
          // Construct the API request payload
          const requestData = {
            data: {
              UserName: state.bookingData.userName,
              Email: state.bookingData.email,
              Time: state.bookingData.time,
              Date: state.bookingData.date,
              doctor: state.bookingData.doctorId,
              PhoneNumber: state.bookingData.phone
            }
          };

          console.log('Booking Appointment Payload:', requestData);

          // Book the appointment
          const response = await axios.post(
            'https://appointment-booking-strapi.onrender.com/api/appointments',
            requestData,
            {
              headers: {
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_STRAPI_API_KEY}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (response.data && response.data.data) {
            // Get doctor name for the WhatsApp message
            const doctor = state.availableDoctors.find(d => d.id === state.bookingData.doctorId);
            const doctorName = doctor ? doctor.attributes.Name : 'Unknown Doctor';

            // Prepare form data for WhatsApp message
            const formData = {
              user_name: state.bookingData.userName,
              user_phone: state.bookingData.phone,
              date: new Date(state.bookingData.date).toLocaleDateString('en-GB'), // Convert to DD/MM/YYYY
              time: state.bookingData.time,
              doctorName: doctorName,
              symptoms: "No symptoms mentioned"
            };

            // Send WhatsApp message
            try {
              await sendWhatsAppMessage(formData);
              bot.sendMessage(chatId, `✅ Appointment Booked Successfully!\n\n📅 Date: ${state.bookingData.date}\n⏰ Time: ${state.bookingData.time}\n👨‍⚕️ Doctor: ${doctorName}\n\n✉️ WhatsApp confirmation has been sent.`);
            } catch (whatsappError) {
              console.error('WhatsApp message error:', whatsappError);
              bot.sendMessage(chatId, `✅ Appointment Booked Successfully!\n\n📅 Date: ${state.bookingData.date}\n⏰ Time: ${state.bookingData.time}\n👨‍⚕️ Doctor: ${doctorName}\n\n⚠️ Note: WhatsApp confirmation could not be sent.`);
            }
          } else {
            throw new Error('Invalid response from server');
          }
        } catch (error) {
          console.error('Booking error:', error.response?.data || error.message);
          const errorMessage = error.response?.data?.error?.message || "Please try again later.";
          bot.sendMessage(chatId, `❌ Error booking appointment: ${errorMessage}`);
        }

        // Reset booking state
        state.bookingStep = 0;
        state.bookingData = {
          userName: "",
          email: "",
          phone: "",
          doctorId: "",
          date: "",
          time: ""
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
          // Create Zoom meeting
          const [time, period] = state.meetingData.selectedTime.split(' ');
          const [hours, minutes] = time.split(':').map(Number);
          let militaryHours = hours;
          if (period === 'PM' && hours !== 12) militaryHours += 12;
          if (period === 'AM' && hours === 12) militaryHours = 0;

          const [day, month, year] = state.meetingData.selectedDate.split('/');
          const startTime = `${year}-${month}-${day}T${String(militaryHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

          const zoomResponse = await axios.post('http://localhost:3000/api/zoom/create-meeting', {
            topic: state.meetingData.eventName,
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
            eventName: state.meetingData.eventName,
            duration: 30,
            locationType: "Zoom",
            locationUrl: zoomResponse.data.join_url,
            selectedDate: `${year}-${month}-${day}`,
            selectedTime: state.meetingData.selectedTime,
            themeColor: "#4F46E5",
            businessId: `/Business/${state.meetingData.userEmail}`,
            createdBy: state.meetingData.userEmail,
            createdAt: new Date().toISOString(),
            doctorId: state.meetingData.doctorId,
            clinicType: "Evening Clinic",
            clinicTiming: "8:00 PM - 10:00 PM"
          };

          await setDoc(doc(db, "MeetingEvent", id), meetingDoc);

          bot.sendMessage(chatId, "Your Zoom meeting has been scheduled successfully!");
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

const sendWhatsAppMessage = async (formData) => {
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
                  { type: "text", text: formData.user_name },  // {{1}}
                  { type: "text", text: formData.user_phone },  // {{2}}
                  { type: "text", text: formData.date },  // {{3}}
                  { type: "text", text: formData.time },  // {{4}}
                  { type: "text", text: formData.doctorName },  // {{5}}
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

// Start the bot
console.log('Bot is running...'); 