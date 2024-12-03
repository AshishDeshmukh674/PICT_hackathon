import { streamText, Message } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

// Ensure the API key is properly loaded
const apiKey = process.env.GOOGLE_API_KEY || "";
if (!apiKey) {
  console.error("GOOGLE_API_KEY is not defined in environment variables.");
}
else{
    console.log("ashish")
}

// Create an instance of Google Generative AI
const google = createGoogleGenerativeAI({
    apiKey: apiKey,
});

// Edge runtime setup
export const runtime = "edge";

// Function to generate a unique ID
const generateId = () => Math.random().toString(36).slice(2, 15);

// Define the initial message for the conversation
const initialMessage: Message = {
  id: generateId(),
  role: "user",
  content: "You are an AI assistant. Please help answer questions clearly and concisely.",
};

// Build the prompt for Google Generative AI
const buildGoogleGenAIPrompt = (messages: Message[]): Message[] => [
  initialMessage, // Add the initial message
  ...messages.map((message) => ({
    id: message.id || generateId(),
    role: message.role,
    content: message.content,
  })),
];

// Handle POST request
export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid request payload. Messages array is required.", { status: 400 });
    }

    const stream = await streamText({
      model: google("gemini-pro"), // Specify the model
      messages: buildGoogleGenAIPrompt(messages),
      temperature: 0.7, // Adjust temperature for response creativity
    });

    return stream?.toDataStreamResponse();
  } catch (error) {
    console.error("Error in POST handler:", error);
    return new Response(`Error processing the request: ${error.message}`, { status: 500 });
  }
}
