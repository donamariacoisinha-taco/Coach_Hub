import { GoogleGenerativeAI } from "@google/generative-ai";
import { Exercise } from "../../../types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const auditExercise = async (exercise: Exercise) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

  const prompt = `
    Audit the following exercise for quality and completeness according to "Coach Rubi Premium" standards.
    Exercise Data: ${JSON.stringify(exercise)}

    Check for:
    1. Weak or too short descriptions.
    2. Lack of step-by-step instructions.
    3. Missing technical tips or common mistakes.
    4. Missing muscle groups (secondary).
    5. Inconsistent naming.
    6. Grammatical issues.

    Return a JSON object:
    {
      "issues": [ { "type": "content|structure|quality|consistency", "description": "short description" } ],
      "confidence": number (0-1),
      "suggestions": {
        "name": "suggested name if inconsistent",
        "description": "suggested description",
        "instructions": "suggested instructions",
        "technical_tips": "suggested tips",
        "secondary_muscles": ["suggested muscles"]
      }
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    // Extract JSON from markdown
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Invalid AI response");
  } catch (error) {
    console.error("Audit AI Error:", error);
    return null;
  }
};
