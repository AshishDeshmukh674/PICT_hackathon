export const generateHealthTask = async (metrics) => {
  const prompt = `
  A patient has the following latest health metrics:
  - Blood Pressure: ${metrics.bloodPressure} mmHg
  - Heart Rate: ${metrics.heartRate} bpm
  - Progress: ${metrics.progress}%
  - Risk Level: ${metrics.riskLevel}
  - Normal Ranges: BP (90-120), HR (60-100)

  Please provide:
  1. Alert messages for any concerning metrics
  2. A personalized health recommendation
  3. A detailed diet and lifestyle plan
  4. Calculate a risk level (Low/Medium/High) based on these metrics
  5. Calculate a progress score (0-100%) based on how close metrics are to ideal ranges

  Return in this format:
  {
    "alerts": [
      { "type": "warning/info", "message": "alert message" }
    ],
    "recommendation": "specific health recommendation",
    "dietPlan": {
      "title": "Personalized Diet Plan",
      "meals": ["breakfast", "lunch", "dinner"],
      "restrictions": "any restrictions",
      "supplements": "recommended supplements"
    },
    "calculatedMetrics": {
      "riskLevel": "calculated risk level",
      "progress": "calculated progress percentage"
    }
  }
  Keep recommendations practical and actionable.
  `;

  try {
    const response = await groq.chat.completions.create({
      model: "mixtral-8x7b-32768",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error generating health recommendations:", error);
    return {
      alerts: [{ 
        type: "info", 
        message: "Maintain a balanced lifestyle and regular checkups." 
      }],
      recommendation: "Consider consulting with your healthcare provider.",
      dietPlan: {
        title: "General Health Diet",
        meals: [
          "Balanced breakfast with protein and whole grains",
          "Light lunch with vegetables",
          "Nutritious dinner with lean protein"
        ],
        restrictions: "Follow general dietary guidelines",
        supplements: "As recommended by your doctor"
      },
      calculatedMetrics: {
        riskLevel: "Medium",
        progress: "50"
      }
    };
  }
}; 