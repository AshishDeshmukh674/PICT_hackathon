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

// Add these medical context configurations
const MEDICAL_CONTEXT = {
  emergency_symptoms: [
    'chest pain', 'difficulty breathing', 'severe bleeding', 'unconsciousness',
    'सीने में दर्द', 'सांस लेने में तकलीफ', 'बेहोशी', 'गंभीर रक्तस्राव',
    'छातीत दुखणे', 'श्वास घेण्यास त्रास', 'बेशुद्धी', 'गंभीर रक्तस्त्राव',
    'છાતીમાં દુખાવો', 'શ્વાસ લેવામાં તકલીફ', 'બેહોશી', 'ગંભીર રક્તસ્રાવ'
  ],
  specialist_referral_symptoms: [
    'chronic pain', 'persistent fever', 'unusual growth',
    'पुराना दर्द', 'लगातार बुखार', 'असामान्य वृद्धि',
    'जुनं दुखणं', 'सतत ताप', 'असामान्य वाढ',
    'ક્રોનિક પીડા', 'સતત તાવ', 'અસામાન્ય વૃદ્ધિ'
  ]
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
    
    const { chatHistory, language, symptoms = [] } = body;
    
    // Check if the last message is booking related
    const lastMessage = chatHistory[chatHistory.length - 1];
    const isBooking = lastMessage && isBookingQuery(lastMessage.content, language);
    
    // Construct enhanced system prompt
    const systemPrompt = {
      role: "system",
      content: `
You are an advanced medical assistant chatbot with the following capabilities and rules:

1. Language & Communication:
   - Primary Response Language: ${SUPPORTED_LANGUAGES[language]}
   - Use formal and respectful language appropriate for medical context
   - Maintain professional tone while being empathetic
   - Preserve medical terms in English when necessary

2. Medical Assessment:
   - Analyze symptoms carefully and ask follow-up questions if symptoms are unclear
   - Look for patterns in reported symptoms
   - Flag potentially serious conditions requiring immediate attention
   - Current User Symptoms: ${symptoms.join(', ')}

3. Emergency Protocol:
   - If user reports any emergency symptoms, immediately provide emergency number: 9822081777
   - Emergency symptoms include: ${MEDICAL_CONTEXT.emergency_symptoms.join(', ')}
   - Always err on the side of caution with serious symptoms

4. Specialist Referral:
   - Recommend specialist consultation for: ${MEDICAL_CONTEXT.specialist_referral_symptoms.join(', ')}
   - Explain why specialist care might be needed
   - Connect symptoms to appropriate medical specialties

5. Appointment Guidance:
   - Guide users to appropriate doctors based on symptoms
   - Explain why a particular doctor might be suitable
   - ${isBooking ? "Currently handling a booking request - provide clear booking-related information" : ""}

6. Cultural Sensitivity:
   - Respect cultural and traditional medical perspectives
   - Use culturally appropriate examples and explanations
   - Maintain professional boundaries while being culturally aware

7. Information Quality:
   - Provide evidence-based medical information
   - Avoid making definitive diagnoses
   - Include preventive care recommendations when appropriate
   - Clarify that advice is not a substitute for in-person medical consultation

8. Privacy & Ethics:
   - Maintain medical privacy and confidentiality
   - Do not store or reference personal medical information
   - Provide disclaimers when discussing serious conditions

Remember: You are not replacing a doctor. Your role is to provide initial guidance, help with appointments, and direct to appropriate medical care.

9.if symptoms found in this list then recommend the specialist 
"3": [
        "Fever", "Cough", "Cold", "Headache", "Fatigue", 
        "Diabetes management", "High blood pressure", "Asthma",
        "बुखार", "खोकला", "सिरदर्द", "बेशुद्धी", "गंभीर रक्तस्त्राव",
        "તાવ", "ઉધરસ", "શરદી", "માથું", "પેટ", "ગળું"
    ],
"4": [
        "Menstrual irregularities", "Pregnancy care", 
        "Hormonal imbalances", "Pelvic pain", 
        "Infertility issues", "UTIs",
        "बेहोशी", "गंभीर रक्तस्त्राव",
        "બેહોશી", "ગંભીર રક્તસ્રાવ",
    ],
"5": [
        "Blood disorders", "Infections", "Tumor diagnosis", 
        "Autoimmune conditions", "Liver dysfunction", 
        "Anemia detection",
        "बुखार", "खोकला", "सिरदर्द", "बेशुद्धी", "गंभीर रक्तस्त्राव",
        "તાવ", "ઉધરસ", "શરદી", "માથું", "પેટ", "ગળું"
    ],
"6": [
        "Bone fractures", "Chest infections", "Pneumonia", 
        "Joint injuries", "Spinal disorders",
        "बुखार", "खोकला", "सिरदर्द", "बेशुद्धी", "गंभीर रक्तस्त्राव",
        "તાવ", "ઉધરસ", "શરદી", "માથું", "પેટ", "ગળું"
    ],
"7": [
        "Back pain", "Neck pain", "Joint stiffness", 
        "Post-surgery rehabilitation", "Sports injuries", 
        "Muscle weakness",
        "बुखार", "खोकला", "सिरदर्द", "बेशुद्धी", "गंभीर रक्तस्त्राव",
        "તાવ", "ઉધરસ", "શરદી", "માથું", "પેટ", "ગળું"
    ],
"8": [
        "Obesity", "Malnutrition", "Food allergies", 
        "Digestive disorders", "Cholesterol management", 
        "Diet planning for diabetes",
        "बुखार", "खोकला", "सिरदर्द", "बेशुद्धी", "गंभीर रक्तस्त्राव",
        "તાવ", "ઉધરસ", "શરદી", "માથું", "પેટ", "ગળું"
    ]

    10. if symptoms found then in short ask the user to book the appointment with the specialist dont give extra information just prefer the specialist name and ask the user that should i book the appointment with the specialist?
`
    };

    // Create contextualized chat history with enhanced system prompt
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