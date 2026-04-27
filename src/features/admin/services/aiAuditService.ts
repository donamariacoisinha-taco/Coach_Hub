import { GoogleGenerativeAI } from "@google/generative-ai";
import { Exercise } from "../../../types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const auditExercise = async (exercise: Exercise) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

  const prompt = `
    Audit the following exercise for quality and completeness according to "Coach Rubi Premium" standards.
    Exercise Data: ${JSON.stringify(exercise)}

    Check for:
    1. Content: Weak/short descriptions, lack of step-by-step, missing technical tips.
    2. Structural: Missing muscle groups, equipment, difficulty, movement patterns.
    3. Governance: Inconsistent naming, grammatical issues, missing media tags.

    Return a JSON object:
    {
      "issues": [ { "category": "content|structural|governance", "type": "string", "description": "short description" } ],
      "confidence": number (0-1),
      "suggestions": {
        "name": "suggested name if inconsistent",
        "description": "suggested description",
        "instructions": "suggested instructions",
        "technical_tips": "suggested tips",
        "secondary_muscles": ["suggested muscles"],
        "equipment": "suggested equipment",
        "difficulty_level": "Beginner|Intermediate|Advanced",
        "movement_pattern": "Push|Pull|Squat|Hinge|etc",
        "training_goal": "Hypertrophy|Strength|Fat Loss|etc"
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
