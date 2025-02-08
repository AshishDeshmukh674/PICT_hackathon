import { NextResponse } from 'next/server';
import { Groq } from "groq-sdk";

export async function POST(req) {
    try {
        const { message, formData, chatHistory } = await req.json();
        const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
        });

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are a professional nutritionist and diet expert. Analyze the form data and provide personalized diet advice. 
                    When generating diet plans, be specific about:
                    - Daily meal breakdowns
                    - Portion sizes
                    - Caloric content
                    - Nutritional values
                    - Recommended supplements if needed
                    Format the response in a clear, structured way.`
                },
                ...chatHistory,
                {
                    role: "user",
                    content: `Form data: ${JSON.stringify(formData)}\n\nUser question: ${message}`
                }
            ],
            model: "mixtral-8x7b-32768",
            temperature: 0.7,
            max_tokens: 2048,
        });

        return NextResponse.json({ 
            response: completion.choices[0]?.message?.content || "I apologize, I couldn't generate a response."
        });
    } catch (error) {
        console.error('Error in diet-chat API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 