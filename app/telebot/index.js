import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import GlobalApi from '../_utils/DoctorApi.js';
import { app, auth } from '../config/FirebaseConfig.js';
import { getFirestore, doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import axios from 'axios';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import path from 'path';
import fs from 'fs';
import { createWorker } from 'tesseract.js';
import Groq from "groq-sdk";

// Load environment variables
dotenv.config();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });

// Store user states
const userStates = new Map();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  timeout: 30000,
});

const CHAT_MEMORY_FILE = join(process.cwd(), 'data', 'chatMemory.json');

// Function to read chat memory
async function readChatMemory() {
  try {
    const content = await readFile(CHAT_MEMORY_FILE, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return {
      data: {
        UserName: null,
        Email: null,
        Time: null,
        Date: null,
        doctor: null,
        PhoneNumber: null,
      },
      lastUpdated: null
    };
  }
}

// Function to update chat memory
async function updateChatMemory(newData) {
  try {
    const existingMemory = await readChatMemory();
    
    // Only update fields if new values are non-null
    const updatedData = {
      UserName: newData.UserName || existingMemory.data.UserName,
      Email: newData.Email || existingMemory.data.Email,
      Time: newData.Time || existingMemory.data.Time,
      Date: newData.Date || existingMemory.data.Date,
      doctor: newData.doctor || existingMemory.data.doctor,
      PhoneNumber: newData.PhoneNumber || existingMemory.data.PhoneNumber
    };

    const updatedMemory = {
      data: updatedData,
      lastUpdated: new Date().toISOString()
    };

    await writeFile(CHAT_MEMORY_FILE, JSON.stringify(updatedMemory, null, 2));
    console.log('Updated memory with preserved values:', updatedMemory);
    return updatedMemory;
  } catch (error) {
    console.error('Error updating chat memory:', error);
    throw error;
  }
}

// Function to extract information from chat
async function extractInformation(chatHistory) {
  if (!chatHistory || !Array.isArray(chatHistory) || chatHistory.length === 0) {
    return {
      data: {
        UserName: null,
        Email: null,
        Time: null,
        Date: null,
        doctor: null,
        PhoneNumber: null,
      }
    };
  }

  const validMessages = chatHistory.filter(msg => 
    msg && 
    typeof msg === 'object' && 
    msg.role && 
    typeof msg.role === 'string' && 
    msg.content && 
    typeof msg.content === 'string'
  );

  if (validMessages.length === 0) {
    return {
      data: {
        UserName: null,
        Email: null,
        Time: null,
        Date: null,
        doctor: null,
        PhoneNumber: null,
      }
    };
  }

  const prompt = {
    role: "system",
    content: `Analyze the conversation and extract ONLY the following information in the exact format specified:

    {
      "data": {
        "UserName": string or null,
        "Email": string or null,
        "Time": string or null (in HH:MM AM/PM format),
        "Date": string or null (in DD/MM/YYYY format),
        "doctor": string or null,
        "PhoneNumber": string or null (10 digits)
      }
    }

    Rules:
    1. Only extract information if you're highly confident it's correct
    2. Maintain exact format with these exact key names
    3. Use null when information is not available
    4. Don't add any additional fields
    5. Don't add any explanation text, only return the JSON object
    6. For phone numbers, only extract if it's a valid 10-digit number
    7. For dates, only extract if it matches DD/MM/YYYY format
    8. For times, only extract if it matches HH:MM AM/PM format`
  };

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.2-90b-vision-preview",
      messages: [
        prompt,
        ...validMessages,
        {
          role: "system",
          content: "Extract and format the information as JSON only, no additional text."
        }
      ],
      temperature: 0.1,
      max_tokens: 500,
    });

    try {
      return JSON.parse(completion.choices[0]?.message?.content || "{}");
    } catch (parseError) {
      console.error("Error parsing LLM response:", parseError);
      return {
        data: {
          UserName: null,
          Email: null,
          Time: null,
          Date: null,
          doctor: null,
          PhoneNumber: null,
        }
      };
    }
  } catch (error) {
    console.error("Error in extractInformation:", error);
    return {
      data: {
        UserName: null,
        Email: null,
        Time: null,
        Date: null,
        doctor: null,
        PhoneNumber: null,
      }
    };
  }
}

// Update OCR functionality
async function performOCR(imagePath) {
  const worker = await createWorker();
  try {
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data: { text } } = await worker.recognize(imagePath);
    await worker.terminate();
    return text;
  } catch (error) {
    console.error('OCR Error:', error);
    throw error;
  }
}

// Add function to validate file type
function isValidFileType(mimeType, fileExt) {
  const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  const validImageExts = ['.jpg', '.jpeg', '.png'];
  const validPDFTypes = ['application/pdf'];
  const validPDFExts = ['.pdf'];

  return (
    (validImageTypes.includes(mimeType) && validImageExts.includes(fileExt)) ||
    (validPDFTypes.includes(mimeType) && validPDFExts.includes(fileExt))
  );
}

// Update the file handler to process both images and PDFs
bot.on('document', async (msg) => {
  const chatId = msg.chat.id;
  const state = getUserState(chatId);
  
  try {
    if (!msg.document || !msg.document.file_id) {
      throw new Error('Invalid document data received');
    }

    const file = await bot.getFile(msg.document.file_id);
    if (!file || !file.file_path) {
      throw new Error('Could not get file information');
    }

    const originalFileName = msg.document.file_name;
    const mimeType = msg.document.mime_type;
    
    // File type validation
    const fileExt = path.extname(originalFileName).toLowerCase();
    
    // Check if it's a Chrome HTML Document
    if (mimeType.includes('html') || originalFileName.includes('Chrome HTML Document')) {
      bot.sendMessage(chatId, "Please save the PDF file directly instead of using 'Save as Chrome HTML Document'. You can do this by clicking the download button in your PDF viewer.");
      return;
    }

    // Validate file type
    if (!isValidFileType(mimeType, fileExt)) {
      bot.sendMessage(chatId, "Please upload only PDF documents or images (JPEG, PNG).");
      return;
    }

    // Create temp directory if it doesn't exist
    const tempDir = path.join(process.cwd(), 'temp');
    fs.mkdirSync(tempDir, { recursive: true });

    // Generate a safe filename using timestamp
    const timestamp = Date.now();
    const safeFileName = `${timestamp}${fileExt}`;
    const filePath = path.join(tempDir, safeFileName);

    try {
      // Download the file using axios
      const fileUrl = `https://api.telegram.org/file/bot${TOKEN}/${file.file_path}`;
      const response = await axios({
        method: 'get',
        url: fileUrl,
        responseType: 'arraybuffer'
      });

      // Save the file
      await fs.promises.writeFile(filePath, response.data);
      console.log('File downloaded successfully to:', filePath);

      let extractedText = '';
      if (mimeType === 'application/pdf') {
        bot.sendMessage(chatId, "PDF processing is not implemented yet. Please upload images for now.");
        return;
      } else {
        try {
          extractedText = await performOCR(filePath);
          console.log('OCR completed successfully');
        } catch (ocrError) {
          console.error('OCR Error:', ocrError);
          throw new Error('Failed to extract text from the image. Please ensure the image is clear and try again.');
        }
      }

      // Extract information using the correct function name
      const extractedInfo = await extractInformation([{ role: "user", content: extractedText }]);
      
      // Update chat memory with extracted information
      if (extractedInfo.data) {
        await updateChatMemory(extractedInfo.data);
        console.log('Updated chat memory with extracted info:', extractedInfo.data);
      }

      // Store the full text in the user's state for context
      state.documentContext = extractedText;

      // Update chat history
      state.chatHistory.push({ 
        role: "user", 
        content: `[Document uploaded]\n${extractedText.substring(0, 200)}...` 
      });

      // Send confirmation and extracted information
      let responseMessage = "I've processed your document. Here's what I found:\n\n";
      
      if (extractedInfo.data.UserName) responseMessage += `Patient Name: ${extractedInfo.data.UserName}\n`;
      if (extractedInfo.data.doctor) responseMessage += `Doctor: ${extractedInfo.data.doctor}\n`;
      if (extractedInfo.data.Date) responseMessage += `Date: ${extractedInfo.data.Date}\n`;
      
      responseMessage += "\nYou can now ask me questions about the document or proceed with booking an appointment.";
      
      bot.sendMessage(chatId, responseMessage);

      // Handle booking flow if active
      if (state.bookingStep > 0) {
        const { data } = extractedInfo;
        
        switch(state.bookingStep) {
          case 1:
            if (data.UserName) {
              state.bookingData.userName = data.UserName;
              state.bookingStep = 2;
              bot.sendMessage(chatId, `I found your name (${data.UserName}) in the document. Please provide your email address.`);
            }
            break;
          case 2:
            if (data.Email) {
              state.bookingData.email = data.Email;
              state.bookingStep = 3;
              bot.sendMessage(chatId, `I found your email (${data.Email}) in the document. Please provide your phone number.`);
            }
            break;
          case 3:
            if (data.PhoneNumber) {
              state.bookingData.phone = data.PhoneNumber;
              state.bookingStep = 4;
              handleBookingFlow(chatId, "", state);
            }
            break;
        }
      }

    } finally {
      // Clean up the file regardless of success or failure
      if (fs.existsSync(filePath)) {
        try {
          await fs.promises.unlink(filePath);
          console.log('Temporary file cleaned up:', filePath);
        } catch (cleanupError) {
          console.error('Error cleaning up temporary file:', cleanupError);
        }
      }
    }
  } catch (error) {
    console.error('Error processing document:', error);
    bot.sendMessage(chatId, `Sorry, I couldn't process your document: ${error.message}. Please try again or provide the information manually.`);
  }
});

// Update photo handler
bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;
  const state = getUserState(chatId);

  try {
    // Get the highest resolution photo
    const photo = msg.photo[msg.photo.length - 1];
    if (!photo || !photo.file_id) {
      throw new Error('Invalid photo data received');
    }

    const file = await bot.getFile(photo.file_id);
    if (!file || !file.file_path) {
      throw new Error('Could not get file information');
    }

    // Create temp directory if it doesn't exist
    const tempDir = path.join(process.cwd(), 'temp');
    fs.mkdirSync(tempDir, { recursive: true });

    // Generate a safe filename with timestamp
    const timestamp = Date.now();
    const filePath = path.join(tempDir, `${timestamp}.jpg`);

    try {
      // Download the file using axios
      const fileUrl = `https://api.telegram.org/file/bot${TOKEN}/${file.file_path}`;
      const response = await axios({
        method: 'get',
        url: fileUrl,
        responseType: 'arraybuffer'
      });

      // Save the file
      await fs.promises.writeFile(filePath, response.data);
      console.log('Image downloaded successfully to:', filePath);

      // Perform OCR
      let extractedText = '';
      try {
        extractedText = await performOCR(filePath);
        console.log('OCR completed successfully');
      } catch (ocrError) {
        console.error('OCR Error:', ocrError);
        throw new Error('Failed to extract text from the image. Please ensure the image is clear and try again.');
      }

      // Extract information using the correct function name
      const extractedInfo = await extractInformation([{ role: "user", content: extractedText }]);
      
      // Update chat memory with extracted information
      if (extractedInfo.data) {
        await updateChatMemory(extractedInfo.data);
        console.log('Updated chat memory with extracted info:', extractedInfo.data);
      }

      // Store the full text in the user's state for context
      state.documentContext = extractedText;

      // Update chat history
      state.chatHistory.push({ 
        role: "user", 
        content: `[Image uploaded]\n${extractedText.substring(0, 200)}...` 
      });

      // Clean up the temporary file
      fs.unlinkSync(filePath);

      // Send confirmation and extracted information
      let responseMessage = "I've processed your image. Here's what I found:\n\n";
      
      if (extractedInfo.data.UserName) responseMessage += `Patient Name: ${extractedInfo.data.UserName}\n`;
      if (extractedInfo.data.doctor) responseMessage += `Doctor: ${extractedInfo.data.doctor}\n`;
      if (extractedInfo.data.Date) responseMessage += `Date: ${extractedInfo.data.Date}\n`;
      
      responseMessage += "\nYou can now ask me questions about the document or proceed with booking an appointment.";
      
      bot.sendMessage(chatId, responseMessage);

      // Handle booking flow if active
      if (state.bookingStep > 0) {
        const { data } = extractedInfo;
        
        switch(state.bookingStep) {
          case 1:
            if (data.UserName) {
              state.bookingData.userName = data.UserName;
              state.bookingStep = 2;
              bot.sendMessage(chatId, `I found your name (${data.UserName}) in the image. Please provide your email address.`);
            }
            break;
          case 2:
            if (data.Email) {
              state.bookingData.email = data.Email;
              state.bookingStep = 3;
              bot.sendMessage(chatId, `I found your email (${data.Email}) in the image. Please provide your phone number.`);
            }
            break;
          case 3:
            if (data.PhoneNumber) {
              state.bookingData.phone = data.PhoneNumber;
              state.bookingStep = 4;
              handleBookingFlow(chatId, "", state);
            }
            break;
        }
      }
    } catch (error) {
      console.error('Error processing image:', error);
      bot.sendMessage(chatId, "Sorry, I couldn't process your image. Please try again or provide the information manually.");
    }
  } catch (error) {
    console.error('Error processing image:', error);
    bot.sendMessage(chatId, "Sorry, I couldn't process your image. Please try again or provide the information manually.");
  }
});

// Initialize state for a user
const initUserState = (chatId) => {
  userStates.set(chatId, {
    bookingStep: 0,
    cancelStep: 0,
    meetingStep: 0,
    selectedLanguage: 'en',
    documentContext: null,
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

// Update the message handler
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  const state = getUserState(chatId);

  try {
    // Only process text messages
    if (!text) {
      return;
    }

    // Update chat history with valid content
    state.chatHistory.push({ role: "user", content: text });

    // First, try to extract and store any relevant information from the message
    try {
      const extractedInfo = await extractInformation([{ 
        role: "user", 
        content: text 
      }]);
      
      if (extractedInfo && extractedInfo.data && Object.values(extractedInfo.data).some(val => val !== null)) {
        await updateChatMemory(extractedInfo.data);
        console.log('Updated chat memory with:', extractedInfo.data);
      }
    } catch (extractError) {
      console.error('Error extracting information:', extractError);
      // Continue with message processing even if extraction fails
    }

    // Handle different flows
    if (state.bookingStep > 0) {
      await handleBookingFlow(chatId, text, state);
    } else if (state.cancelStep > 0) {
      await handleCancellationFlow(chatId, text, state);
    } else if (state.meetingStep > 0) {
      await handleMeetingFlow(chatId, text, state);
    } else {
      // Check if message contains booking intent
      if (text.toLowerCase().includes('book') || text.toLowerCase().includes('appointment')) {
        // Before starting booking flow, check if we already have any information
        const memory = await readChatMemory();
        const { data } = memory;
        
        state.bookingStep = 1;
        
        // If we have the name, skip to email step
        if (data.UserName) {
          state.bookingData.userName = data.UserName;
          state.bookingStep = 2;
          bot.sendMessage(chatId, `I found your name (${data.UserName}) in our records. Please provide your email address.`);
        } else {
          bot.sendMessage(chatId, "Please provide your name.");
        }
        return;
      }
      
      await handleGeneralChat(chatId, text, state);
    }

    // After handling the message, update chat memory with any new information
    try {
      if (state.chatHistory.length > 0) {
        const newInfo = await extractInformation(state.chatHistory.filter(msg => msg.content));
        if (newInfo && newInfo.data && Object.values(newInfo.data).some(val => val !== null)) {
          await updateChatMemory(newInfo.data);
        }
      }
    } catch (memoryError) {
      console.error('Error updating chat memory:', memoryError);
      // Continue with bot operation even if memory update fails
    }
  } catch (error) {
    console.error('Error handling message:', error);
    bot.sendMessage(chatId, "Sorry, there was an error processing your request. Please try again.");
  }
});

// Update handleGeneralChat to include document context
async function handleGeneralChat(chatId, text, state) {
  try {
    const lowerText = text.toLowerCase();
    
    // Before processing the chat, try to extract and store any relevant information
    const extractedInfo = await extractInformation([{ role: "user", content: text }]);
    if (Object.values(extractedInfo.data).some(val => val !== null)) {
      await updateChatMemory(extractedInfo.data);
    }

    if (lowerText.includes('book') || lowerText.includes('appointment')) {
      const memory = await readChatMemory();
      const { data } = memory;
      
      state.bookingStep = 1;
      
      if (data.UserName) {
        state.bookingData.userName = data.UserName;
        state.bookingStep = 2;
        bot.sendMessage(chatId, `I found your name (${data.UserName}) in our records. Please provide your email address.`);
      } else {
        bot.sendMessage(chatId, "Please provide your name.");
      }
      return;
    }

    if (lowerText.includes('cancel')) {
      state.cancelStep = 1;
      const memory = await readChatMemory();
      const { data } = memory;
      
      if (data.Email) {
        state.cancelData.email = data.Email;
        state.cancelStep = 2;
        bot.sendMessage(chatId, `I found your email (${data.Email}) in our records. Please provide the appointment date to cancel (DD/MM/YYYY format).`);
      } else {
        bot.sendMessage(chatId, "Please provide your email address to cancel the appointment.");
      }
      return;
    }

    if (lowerText.includes('meeting') || lowerText.includes('schedule')) {
      state.meetingStep = 1;
      const memory = await readChatMemory();
      const { data } = memory;
      
      if (data.Email) {
        state.meetingData.userEmail = data.Email;
        state.meetingStep = 2;
        // Proceed with doctor selection
        const response = await GlobalApi.getDoctorList();
        const doctors = response.data.data;
        state.availableDoctors = doctors;
        
        const doctorList = doctors
          .map(doc => `Doctor ID: ${doc.id} - ${doc.attributes.Name} (${doc.attributes.Profession})`)
          .join('\n');
        
        bot.sendMessage(chatId, `I found your email (${data.Email}) in our records.\n\nAvailable doctors:\n${doctorList}\nPlease choose a doctor by entering their ID number.`);
      } else {
        bot.sendMessage(chatId, "Please provide your email address to schedule a meeting.");
      }
      return;
    }

    // Process general chat with document context if available
    const chatPayload = {
      chatHistory: state.chatHistory,
      language: state.selectedLanguage
    };

    // Include document context if available
    if (state.documentContext) {
      chatPayload.documentContext = state.documentContext;
    }

    const response = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chatPayload),
    });

    const data = await response.json();
    bot.sendMessage(chatId, data.response);
    state.chatHistory.push({ role: "assistant", content: data.response });

    // After chat response, check for any new information to store
    const newInfo = await extractInformation([...state.chatHistory, { role: "assistant", content: data.response }]);
    if (Object.values(newInfo.data).some(val => val !== null)) {
      await updateChatMemory(newInfo.data);
    }
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
    const memory = await readChatMemory();
    const { data } = memory;

    switch (state.bookingStep) {
      case 1:
        // Check if name exists in memory
        if (data.UserName) {
          state.bookingData.userName = data.UserName;
          state.bookingStep = 2;
          bot.sendMessage(chatId, `I found your name (${data.UserName}) in our records. Please provide your email address.`);
          break;
        }
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
        // Check if email exists in memory
        if (data.Email) {
          state.bookingData.email = data.Email;
          state.bookingStep = 3;
          bot.sendMessage(chatId, `I found your email (${data.Email}) in our records. Please provide your phone number.`);
          break;
        }
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
        // Check if phone exists in memory
        if (data.PhoneNumber) {
          state.bookingData.phone = data.PhoneNumber;
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
        }
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

        // Show clinic type options first
        bot.sendMessage(chatId, `Please choose a clinic type:
1. Morning Clinic - Ratnamukund Clinic, Warje
2. Evening Clinic - Ratnamukund Clinic, Warje
3. AfterNoon Clinic - Shashwat Clinic, Pune
Please enter the number (1-3) for your choice.`);
        break;

      case 5:
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

        state.bookingData.clinicType = selectedClinic;
        state.bookingStep = 6;
        bot.sendMessage(chatId, "Please provide your preferred appointment date in YYYY-MM-DD format.");
        break;

      case 6:
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

        const dayOfWeek = selectedDate.getDay();

        // Check if it's Sunday
        if (dayOfWeek === 0) {
            bot.sendMessage(chatId, "Sorry, appointments are not available on Sundays. Please choose another date.");
            return;
        }

        // Special handling for doctor ID 5
        if (state.bookingData.doctorId === 5) {
            const clinicTypeShort = state.bookingData.clinicType.split(" - ")[0].toLowerCase().replace(' clinic', '');
            if (clinicTypeShort === 'morning' && ![1, 6].includes(dayOfWeek)) {
                bot.sendMessage(chatId, "This doctor only has morning clinic on Mondays and Saturdays. Please choose another date or clinic type.");
                return;
            }
            if (clinicTypeShort === 'evening' && dayOfWeek !== 4) {
                bot.sendMessage(chatId, "This doctor only has evening clinic on Thursdays. Please choose another date or clinic type.");
                return;
            }
        }

        try {
            // Get available time slots
            const slots = await getAvailableTimeSlots(
                state.bookingData.doctorId,
                selectedDate,
                state.bookingData.clinicType
            );

            if (!slots || slots.length === 0) {
                bot.sendMessage(chatId, "No time slots available for the selected date and clinic type. Please try another date or clinic type.");
                return;
            }

            state.availableTimeSlots = slots;
            state.bookingData.date = text;
            bot.sendMessage(chatId, `Available time slots for ${state.bookingData.clinicType}:\n${slots.join('\n')}\nPlease choose a time slot from the list above.`);
            state.bookingStep = 7;
        } catch (error) {
            console.error('Error getting time slots:', error);
            bot.sendMessage(chatId, "Sorry, there was an error fetching available time slots. Please try another date.");
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

        if (!state.availableTimeSlots.includes(text)) {
          bot.sendMessage(chatId, "Please select a time slot from the available options.");
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
              PhoneNumber: state.bookingData.phone,
              clinicType: state.bookingData.clinicType
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
              date: new Date(state.bookingData.date).toLocaleDateString('en-GB'),
              time: state.bookingData.time,
              doctorName: doctorName,
              symptoms: "No symptoms mentioned"
            };

            // Send WhatsApp message
            try {
              await sendWhatsAppMessage(formData);
              bot.sendMessage(chatId, `✅ Appointment Booked Successfully!\n\n📅 Date: ${state.bookingData.date}\n⏰ Time: ${state.bookingData.time}\n👨‍⚕️ Doctor: ${doctorName}\n🏥 Clinic: ${state.bookingData.clinicType}\n\n✉️ WhatsApp confirmation has been sent.`);
            } catch (whatsappError) {
              console.error('WhatsApp message error:', whatsappError);
              bot.sendMessage(chatId, `✅ Appointment Booked Successfully!\n\n📅 Date: ${state.bookingData.date}\n⏰ Time: ${state.bookingData.time}\n👨‍⚕️ Doctor: ${doctorName}\n🏥 Clinic: ${state.bookingData.clinicType}\n\n⚠️ Note: WhatsApp confirmation could not be sent.`);
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
          time: "",
          clinicType: ""
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

        // Show clinic type options first
        bot.sendMessage(chatId, `Please choose a clinic type:
1. Morning Clinic - Ratnamukund Clinic, Warje
2. Evening Clinic - Ratnamukund Clinic, Warje
3. AfterNoon Clinic - Shashwat Clinic, Pune
Please enter the number (1-3) for your choice.`);
        break;

      case 3:
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

        state.meetingData.clinicType = selectedClinic;
        state.meetingStep = 4;
        bot.sendMessage(chatId, "Please provide your preferred meeting date in YYYY-MM-DD format.");
        break;

      case 4:
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

        const dayOfWeek = selectedDate.getDay();

        // Check if it's Sunday
        if (dayOfWeek === 0) {
            bot.sendMessage(chatId, "Sorry, meetings are not available on Sundays. Please choose another date.");
            return;
        }

        // Special handling for doctor ID 5
        if (state.meetingData.doctorId === "5") {
            const clinicTypeShort = state.meetingData.clinicType.split(" - ")[0].toLowerCase().replace(' clinic', '');
            if (clinicTypeShort === 'morning' && ![1, 6].includes(dayOfWeek)) {
                bot.sendMessage(chatId, "This doctor only has morning meetings on Mondays and Saturdays. Please choose another date or clinic type.");
                return;
            }
            if (clinicTypeShort === 'evening' && dayOfWeek !== 4) {
                bot.sendMessage(chatId, "This doctor only has evening meetings on Thursdays. Please choose another date or clinic type.");
                return;
            }
        }

        try {
            // Get available time slots
            const slots = await getAvailableTimeSlots(
                parseInt(state.meetingData.doctorId),
                selectedDate,
                state.meetingData.clinicType
            );

            if (!slots || slots.length === 0) {
                bot.sendMessage(chatId, "No time slots available for the selected date and clinic type. Please try another date or clinic type.");
                return;
            }

            state.availableTimeSlots = slots;
            state.meetingData.selectedDate = text;
            bot.sendMessage(chatId, `Available time slots for ${state.meetingData.clinicType}:\n${slots.join('\n')}\nPlease choose a time slot from the list above.`);
            state.meetingStep = 5;
        } catch (error) {
            console.error('Error getting time slots:', error);
            bot.sendMessage(chatId, "Sorry, there was an error fetching available time slots. Please try another date.");
            return;
        }
        break;

      case 5:
        // Validate time format
        const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/i;
        if (!timeRegex.test(text)) {
          bot.sendMessage(chatId, "Invalid time format. Please use format like '09:00 AM'.");
          return;
        }

        if (!state.availableTimeSlots.includes(text)) {
          bot.sendMessage(chatId, "Please select a time slot from the available options.");
          return;
        }

        state.meetingData.selectedTime = text;
        state.meetingData.eventName = `Medical Consultation with Dr. ${state.availableDoctors.find(d => d.id.toString() === state.meetingData.doctorId).attributes.Name}`;
        
        try {
          // Create Zoom meeting
          const [time, period] = state.meetingData.selectedTime.split(' ');
          const [hours, minutes] = time.split(':').map(Number);
          let militaryHours = hours;
          if (period === 'PM' && hours !== 12) militaryHours += 12;
          if (period === 'AM' && hours === 12) militaryHours = 0;

          const [year, month, day] = state.meetingData.selectedDate.split('-');
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
            selectedDate: state.meetingData.selectedDate,
            selectedTime: state.meetingData.selectedTime,
            themeColor: "#4F46E5",
            businessId: `/Business/${state.meetingData.userEmail}`,
            createdBy: state.meetingData.userEmail,
            createdAt: new Date().toISOString(),
            doctorId: state.meetingData.doctorId,
            clinicType: state.meetingData.clinicType,
            clinicTiming: `${state.meetingData.selectedTime}`
          };

          await setDoc(doc(db, "MeetingEvent", id), meetingDoc);

          bot.sendMessage(chatId, `✅ Zoom meeting scheduled successfully!\n\n📅 Date: ${state.meetingData.selectedDate}\n⏰ Time: ${state.meetingData.selectedTime}\n👨‍⚕️ Doctor: ${state.meetingData.eventName.split('with ')[1]}\n🏥 Clinic: ${state.meetingData.clinicType}\n\n🔗 Join URL: ${zoomResponse.data.join_url}`);
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
        // Check if email exists in memory
        const memory = await readChatMemory();
        if (memory.data.Email) {
          state.cancelData.email = memory.data.Email;
          state.cancelStep = 2;
          bot.sendMessage(chatId, `I found your email (${memory.data.Email}) in our records. Please provide the appointment date to cancel (YYYY-MM-DD format).`);
          break;
        }

        // Validate email
        if (!text.includes('@')) {
          bot.sendMessage(chatId, "Please provide a valid email address.");
          return;
        }
        state.cancelData.email = text;
        state.cancelStep = 2;
        bot.sendMessage(chatId, "Please provide the appointment date to cancel (YYYY-MM-DD format).");
        break;

      case 2:
        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(text)) {
          bot.sendMessage(chatId, "Invalid date format. Please use YYYY-MM-DD format.");
          return;
        }

        try {
          // Log the search parameters
          console.log('Searching appointments with:', {
            email: state.cancelData.email,
            date: text
          });

          // First, get all appointments for the date
          const response = await GlobalApi.getDoctorAppointmentsByDate(null, text);
          console.log('API Response:', response.data);

          // Filter appointments by email with case-insensitive comparison
          const appointments = response.data.data.filter(app => {
            const appointmentEmail = app.attributes.Email?.toLowerCase();
            const searchEmail = state.cancelData.email.toLowerCase();
            console.log('Comparing emails:', { appointmentEmail, searchEmail });
            return appointmentEmail === searchEmail;
          });

          console.log('Filtered appointments:', appointments);

          if (!appointments || appointments.length === 0) {
            bot.sendMessage(chatId, `No appointments found for email ${state.cancelData.email} on ${text}. Please verify your email and date.`);
            state.cancelStep = 0;
            return;
          }

          // If multiple appointments exist, show them all
          if (appointments.length > 1) {
            const appointmentList = appointments.map((app, index) => 
              `${index + 1}. ${app.attributes.Time} with Dr. ${app.attributes.doctor.data.attributes.Name} at ${app.attributes.clinicType}`
            ).join('\n');

            state.cancelData.appointments = appointments;
            state.cancelStep = 3;
            bot.sendMessage(chatId, `Multiple appointments found for ${text}:\n${appointmentList}\n\nPlease select the appointment to cancel by entering its number.`);
          } else {
            // If only one appointment, cancel it directly
            const appointment = appointments[0];
            try {
              console.log('Attempting to cancel appointment:', appointment.id);
              await GlobalApi.cancelAppointment(appointment.id);
              bot.sendMessage(chatId, `✅ Successfully cancelled your appointment for ${text} at ${appointment.attributes.Time} with Dr. ${appointment.attributes.doctor.data.attributes.Name}.`);
            } catch (error) {
              console.error('Error cancelling appointment:', error);
              bot.sendMessage(chatId, `❌ Failed to cancel the appointment: ${error.message}. Please try again later.`);
            }
            state.cancelStep = 0;
          }
        } catch (error) {
          console.error('Error fetching appointments:', error);
          bot.sendMessage(chatId, `Sorry, there was an error fetching your appointments: ${error.message}. Please try again.`);
          state.cancelStep = 0;
        }
        break;

      case 3:
        // Handle appointment selection for multiple appointments
        const selection = parseInt(text);
        if (isNaN(selection) || selection < 1 || selection > state.cancelData.appointments.length) {
          bot.sendMessage(chatId, "Please select a valid appointment number from the list.");
          return;
        }

        const selectedAppointment = state.cancelData.appointments[selection - 1];
        try {
          await GlobalApi.cancelAppointment(selectedAppointment.id);
          bot.sendMessage(chatId, `✅ Successfully cancelled your appointment at ${selectedAppointment.attributes.Time} with Dr. ${selectedAppointment.attributes.doctor.data.attributes.Name}.`);
        } catch (error) {
          console.error('Error cancelling appointment:', error);
          bot.sendMessage(chatId, "❌ Failed to cancel the appointment. Please try again later.");
        }

        // Reset cancel state
        state.cancelStep = 0;
        state.cancelData = {
          email: "",
          date: "",
          appointments: []
        };
        break;

      default:
        state.cancelStep = 0;
        bot.sendMessage(chatId, "Cancellation process completed or invalid step.");
    }
  } catch (error) {
    console.error('Error in cancellation flow:', error);
    bot.sendMessage(chatId, `Sorry, there was an error in the cancellation process: ${error.message}. Please try again.`);
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