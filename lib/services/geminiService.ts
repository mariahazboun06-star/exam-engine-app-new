import { GoogleGenerativeAI, Part } from '@google/generative-ai';

// Initialize Gemini - Ensure NEXT_PUBLIC_GEMINI_API_KEY is in your .env.local
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function generateCourseKnowledgeMap(syllabusBuffer: Buffer, mimeType: string) {
  if (!apiKey) throw new Error("Gemini API Key is missing.");

  // We use gemini-1.5-flash as it is fast and supports large multimodal inputs (like PDFs)
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    You are an expert academic AI. Analyze the attached course syllabus and generate a complete Course Knowledge Map.
    Break down the course into Topics, Concepts within those topics, and specific Skills required. 
    Also, note any Dependencies (which concepts must be learned before others).
    
    IMPORTANT: Respond ONLY with valid JSON. Do not include markdown formatting like \`\`\`json.
    
    Expected JSON schema:
    {
      "courseName": "String",
      "topics": [
        {
          "name": "String",
          "concepts": [
            {
              "name": "String",
              "skills": ["String", "String"],
              "dependencies": ["Concept Name 1", "Concept Name 2"]
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
    // Attempt to parse the raw JSON (stripping markdown if Gemini accidentally included it)
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
    You are an expert academic AI. Analyze the attached past exam paper.
    Extract every individual question. If solutions or rubrics are included, pair them with the correct question.
    Assign a 'topic' to each question based on standard academic concepts, and estimate the 'difficulty' (Easy, Medium, Hard).
    
    IMPORTANT: Respond ONLY with valid JSON. Do not include markdown formatting like \`\`\`json.
    
    Expected JSON schema:
    [
      {
        "question_text": "String",
        "solution_text": "String or null if not found",
        "topic": "String",
        "difficulty": "Easy | Medium | Hard"
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