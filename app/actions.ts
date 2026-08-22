'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

export async function getAIFeedback(score: number, total: number, wrongAnswers: string) {
  // 'use server' guarantees this runs securely on your backend so your API key is safe!
  
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return "AI is currently taking a nap. Keep up the good work!";

    // Initialize the Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Give the AI its instructions (the prompt)
    let prompt = "";
    if (score === total) {
      prompt = "A student just got a perfect score on their exam! Write a short, fun 2-sentence congratulatory message.";
    } else {
      prompt = `A student got ${score} out of ${total} correct on their exam. They got these questions wrong: ${wrongAnswers}. Write a short, encouraging 2-3 sentence feedback message telling them what topics to review. Be highly supportive!`;
    }

    // Ask Gemini to generate the text
    const result = await model.generateContent(prompt);
    return result.response.text();
    
  } catch (error) {
    console.error("AI Error:", error);
    return "Great effort! Keep studying and you will do even better next time.";
  }
}