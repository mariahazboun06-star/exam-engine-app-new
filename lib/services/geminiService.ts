import { GoogleGenerativeAI, Part } from '@google/generative-ai';

// Initialize Gemini - Ensure NEXT_PUBLIC_GEMINI_API_KEY is in your .env.local
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function generateCourseKnowledgeMap(syllabusBuffer: Buffer, mimeType: string) {
  if (!apiKey) throw new Error("Gemini API Key is missing.");

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    You are an expert academic AI. Analyze the attached course syllabus and generate a hierarchical Course Knowledge Map.
    Break down the course into main Topics. For each topic, extract specific sub-concepts and generate an Active Recall prompt (question) for self-testing.
    
    IMPORTANT: Respond ONLY with valid JSON. Do not include markdown formatting like \`\`\`json.
    
    Expected JSON schema:
    {
      "courseName": "String",
      "topics": [
        {
          "name": "String",
          "description": "String",
          "concepts": [
            {
              "name": "String",
              "description": "String",
              "recallPrompt": "String (A targeted active recall question testing this concept)"
            }
          ]
        }
      ]
    }
  `;

  const pdfPart: Part = {
    inlineData: {
      data: syllabusBuffer.toString("base64"),
      mimeType
    },
  };

  const result = await model.generateContent([prompt, pdfPart]);
  const response = await result.response;
  const text = response.text();

  try {
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    throw new Error("Failed to parse Gemini response as JSON. Raw output: " + text);
  }
}
export async function extractExamQuestions(examBuffer: Buffer, mimeType: string) {
  if (!apiKey) throw new Error("Gemini API Key is missing.");

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    You are an expert academic AI. Analyze the attached past exam paper in detail.
    Extract every question along with its full solution/rubric (if present).
    Identify if the question represents a standard core question or a "trap/trick question" (שאלת פינה/מלכודת).

    IMPORTANT: Respond ONLY with valid JSON. Do not include markdown formatting like \`\`\`json.

    Expected JSON schema:
    [
      {
        "question_text": "String",
        "solution_text": "String or null",
        "topic": "String",
        "difficulty": "Easy | Medium | Hard",
        "is_trap": true,
        "guidance_notes": "String (Short summary of the core solving logic or trap reason in Hebrew)"
      }
    ]
  `;

  const pdfPart: Part = {
    inlineData: {
      data: examBuffer.toString("base64"),
      mimeType
    },
  };

  const result = await model.generateContent([prompt, pdfPart]);
  const response = await result.response;
  const text = response.text();

  try {
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    throw new Error("Failed to parse Exam AI response as JSON. Raw output: " + text);
  }
}
export async function parseCourseBooklet(bookletBuffer: Buffer, mimeType: string) {
  if (!apiKey) throw new Error("Gemini API Key is missing.");

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    You are an expert academic AI assistant. Analyze the attached course booklet/textbook material.
    Extract key concepts, formulas, theorems, and definitions.
    For each item, generate a 2-sided Active Recall Flashcard:
    - Front (recallPrompt): The question, formula identifier, or prompt asking the student to recall the material.
    - Back (recallAnswer): The complete definition, proof summary, equation details, or explanation.

    IMPORTANT: Respond ONLY with valid JSON. Do not include markdown formatting like \`\`\`json.

    Expected JSON schema:
    [
      {
        "conceptName": "String",
        "itemType": "concept" | "formula" | "theorem",
        "recallPrompt": "String (Front of card: Question or formula prompt)",
        "recallAnswer": "String (Back of card: Full explanation, formula breakdown, or answer)",
        "detailedExplanation": "String (Detailed contextual background or step-by-step logic)"
      }
    ]
  `;

  const pdfPart: Part = {
    inlineData: {
      data: bookletBuffer.toString("base64"),
      mimeType
    },
  };

  const result = await model.generateContent([prompt, pdfPart]);
  const response = await result.response;
  const text = response.text();

  try {
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    throw new Error("Failed to parse Booklet AI response as JSON. Raw output: " + text);
  }
}