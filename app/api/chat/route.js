import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request) {
  try {
    const body = await request.json();
    const { chatHistory } = body;

    // Validate the request
    if (!Array.isArray(chatHistory)) {
      return new Response(
        JSON.stringify({ error: "Invalid chat history format" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Call Groq API to get the chat completion
    const completion = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: chatHistory,
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
    });

    const responseContent = completion.choices[0]?.message?.content;

    // Return the assistant's response
    return new Response(
      JSON.stringify({ response: responseContent }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error with Groq API:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process request" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Allow": "POST, OPTIONS",
      "Content-Type": "application/json",
    },
  });
}
