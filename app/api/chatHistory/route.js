import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  timeout: 30000,
});

const CHAT_MEMORY_FILE = join(process.cwd(), 'data', 'chatMemory.json');

// Function to read existing memory
async function readMemoryFile() {
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

// Function to extract information from chat
async function extractInformation(chatHistory) {
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

  const completion = await groq.chat.completions.create({
    model: "llama-3.2-90b-vision-preview",
    messages: [
      prompt,
      ...chatHistory,
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
  } catch (error) {
    console.error("Error parsing LLM response:", error);
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

export async function POST(request) {
  try {
    const { chatHistory } = await request.json();

    // Read existing memory
    const existingMemory = await readMemoryFile();

    // Extract new information
    const extractedInfo = await extractInformation(chatHistory);

    // Merge new information with existing memory, only updating non-null values
    const updatedMemory = {
      data: {
        UserName: extractedInfo.data?.UserName || existingMemory.data?.UserName || null,
        Email: extractedInfo.data?.Email || existingMemory.data?.Email || null,
        Time: extractedInfo.data?.Time || existingMemory.data?.Time || null,
        Date: extractedInfo.data?.Date || existingMemory.data?.Date || null,
        doctor: extractedInfo.data?.doctor || existingMemory.data?.doctor || null,
        PhoneNumber: extractedInfo.data?.PhoneNumber || existingMemory.data?.PhoneNumber || null,
      },
      lastUpdated: new Date().toISOString()
    };

    // Save updated memory
    await writeFile(CHAT_MEMORY_FILE, JSON.stringify(updatedMemory, null, 2));

    return new Response(JSON.stringify({ 
      success: true, 
      memory: updatedMemory 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error processing chat history:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to process chat history" 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
} 