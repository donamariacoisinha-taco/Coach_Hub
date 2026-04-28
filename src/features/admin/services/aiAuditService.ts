import { Exercise } from "../../../types";
import { geminiService } from "../../../services/geminiService";

export const auditExercise = async (exercise: Exercise) => {
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
    const result = await geminiService.callAI({
      prompt,
      responseSchema: {
        type: "object",
        properties: {
          issues: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                type: { type: "string" },
                description: { type: "string" }
              },
              required: ["category", "type", "description"]
            }
          },
          confidence: { type: "number" },
          suggestions: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              instructions: { type: "string" },
              technical_tips: { type: "string" },
              secondary_muscles: { type: "array", items: { type: "string" } },
              equipment: { type: "string" },
              difficulty_level: { type: "string" },
              movement_pattern: { type: "string" },
              training_goal: { type: "string" }
            }
          }
        },
        required: ["issues", "confidence", "suggestions"]
      }
    });

    return result;
  } catch (error) {
    console.error("Audit AI Error:", error);
    return null;
  }
};
