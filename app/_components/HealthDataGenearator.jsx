import { Groq } from "groq";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY, // Use Groq API Key
});

export const generateHealthTask = async (latestData) => {
  const prompt = `
  A patient has the following latest health metrics:
  - Blood Pressure: ${latestData.bloodPressure} mmHg
  - Heart Rate: ${latestData.heartRate} bpm
  - Normal Ranges: BP (90-120), HR (60-100)

  Based on these values, suggest a **personalized health improvement task** in **one short sentence**. 
  The task should be simple, actionable, and effective.
  `;

  try {
    const response = await groq.chat.completions.create({
      model: "mixtral-8x7b-32768", // Use the best available Groq model
      messages: [{ role: "user", content: prompt }],
      max_tokens: 50,
      temperature: 0.7,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error generating AI health task:", error);
    return "Maintain a balanced lifestyle and regular checkups.";
  }
};
