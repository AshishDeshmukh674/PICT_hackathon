import Groq from "groq-sdk";

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  timeout: 30000, // 30 second timeout
});

// Supported languages configuration
const SUPPORTED_LANGUAGES = {
  en: "English",
  hi: "Hindi",
  mr: "Marathi",
  gu: "Gujarati",
};

// Booking-related keywords in different languages
const BOOKING_KEYWORDS = {
  en: ["book", "reserve", "appointment", "schedule", "ticket"],
  hi: ["बुक", "आरक्षण", "टिकट", "नियुक्ति"],
  mr: ["बुक", "आरक्षण", "तिकीट", "नियुक्ती"],
  gu: ["બુક", "આરક્ષણ", "ટિકિટ", "નિમણૂક"],
};

// Helper function to detect if query is booking related
function isBookingQuery(text, language) {
  const keywords = [...BOOKING_KEYWORDS.en, ...(BOOKING_KEYWORDS[language] || [])];
  return keywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
}

// Input validation function
function validateInput(body) {
  if (!body.chatHistory || !Array.isArray(body.chatHistory)) {
    throw new Error("Invalid chat history format");
  }
  
  if (!body.language || !SUPPORTED_LANGUAGES[body.language]) {
    throw new Error(`Unsupported language. Supported languages are: ${Object.keys(SUPPORTED_LANGUAGES).join(", ")}`);
  }
  
  return true;
}

export async function POST(request) {
  try {
    // Parse and validate request body
    const body = await request.json();
    validateInput(body);
    
    const { chatHistory, language } = body;
    
    // Check if the last message is booking related
    const lastMessage = chatHistory[chatHistory.length - 1];
    const isBooking = lastMessage && isBookingQuery(lastMessage.content, language);
    
    // Construct enhanced system prompt
    const systemPrompt = {
      role: "system",
      content: `
Instructions for response:
1. Primary Language: Respond in ${SUPPORTED_LANGUAGES[language]}
2. Language Code: ${language}
3. Special Rules: 
   ${isBooking ? "- This is a booking-related query. Respond in English only." : ""}
   - Use appropriate honorifics and formal language
   - Preserve technical terms in English where necessary
   - Format numbers and dates according to ${SUPPORTED_LANGUAGES[language]} conventions
4. Cultural Context:
   - Maintain cultural sensitivity
   - Use appropriate greetings and closings
5. Quality Requirements:
   - Ensure responses are clear and concise
   - Maintain professional tone
   - Provide complete information
      `
    };

    // Create contextualized chat history
    const contextualizedHistory = [
      systemPrompt,
      ...chatHistory
    ];

    // Call Groq API with enhanced parameters
    const completion = await groq.chat.completions.create({
      model: "llama-3.2-90b-vision-preview",
      messages: contextualizedHistory,
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      presence_penalty: 0.1,  // Slightly penalize token repetition
      frequency_penalty: 0.1, // Slightly penalize word repetition
    });

    // Extract and validate response
    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error("Empty response from Groq API");
    }

    // Return formatted response
    return new Response(
      JSON.stringify({
        response: responseContent,
        metadata: {
          language,
          isBookingQuery: isBooking,
          timestamp: new Date().toISOString(),
        }
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        }
      }
    );

  } catch (error) {
    console.error("Error processing request:", error);
    
    // Enhanced error response
    const errorResponse = {
      error: {
        message: error.message || "Failed to process request",
        type: error.name,
        timestamp: new Date().toISOString(),
      }
    };

    return new Response(
      JSON.stringify(errorResponse),
      {
        status: error.status || 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        }
      }
    );
  }
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Allow": "POST, OPTIONS",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json",
    },
  });
}