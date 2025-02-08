import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { text } = await req.json();

    // Construct the prompt for the LLM
    const prompt = `
      Extract the following information from the text below in JSON format:
      - name (full name of the person)
      - phoneNumber (mobile or contact number)
      - email (email address if present)
      - date (any dates mentioned)
      - address (physical address if mentioned)
      - symptoms (any medical symptoms or conditions mentioned)
      - medications (any medications mentioned)
      - doctorName (name of any doctors mentioned)
      
      Text:
      ${text}
      
      Please return only the JSON object with the extracted information. If a field is not found, use an empty string.
    `;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that extracts structured information from medical documents."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to process document with LLM');
    }

    const data = await response.json();
    console.log("OpenAI Response:", data);
    
    const structuredData = JSON.parse(data.choices[0].message.content);
    console.log("Parsed Structured Data:", structuredData);
    
    return NextResponse.json(structuredData);
  } catch (error) {
    console.error('Error processing document:', error);
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    );
  }
} 