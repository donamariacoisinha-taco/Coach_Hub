
import { GoogleGenAI, Type } from "@google/genai";
import { Exercise } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const geminiService = {
  async generateExerciseData(name: string, muscleGroup: string): Promise<Partial<Exercise>> {
    const prompt = `Como Rubi, Especialista em Biomecânica e Treinamento, gere dados técnicos para o exercício:
    NOME: ${name}
    GRUPO MUSCULAR: ${muscleGroup}

    Gere:
    1. Uma descrição curta e motivadora (1 frase).
    2. Instruções técnicas detalhadas passo a passo.
    3. Dicas de segurança e biomecânica.
    4. Músculos secundários envolvidos.
    5. Tags estruturais: padrão de movimento, plano anatômico e objetivo principal.

    Retorne estritamente em JSON no formato especificado.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            instructions: { type: Type.STRING },
            technical_tips: { type: Type.STRING },
            secondary_muscles: { type: Type.ARRAY, items: { type: Type.STRING } },
            movement_pattern: { type: Type.STRING, enum: ['push', 'pull', 'hinge', 'squat', 'lunge', 'carry', 'isolation'] },
            plane: { type: Type.STRING, enum: ['horizontal', 'vertical', 'sagittal', 'frontal', 'transverse'] },
            training_goal: { type: Type.STRING, enum: ['strength', 'hypertrophy', 'power', 'endurance'] }
          },
          required: ["description", "instructions", "technical_tips", "secondary_muscles", "movement_pattern", "plane", "training_goal"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    return {
      description: data.description,
      instructions: data.instructions + "\n\n⚠️ DICAS TÉCNICAS:\n" + data.technical_tips,
      secondary_muscles: data.secondary_muscles,
      technical_prompt: data.technical_tips,
      movement_pattern: data.movement_pattern,
      plane: data.plane,
      training_goal: data.training_goal
    };
  },

  async reviewExercise(exercise: Exercise): Promise<{ score: number, status: 'premium' | 'good' | 'improvable', notes: string[], biomechanic_check: boolean }> {
    const prompt = `Como Auditor de Qualidade Rubi AI, revise este exercício:
    NOME: ${exercise.name}
    GRUPO: ${exercise.muscle_group}
    DESCRIÇÃO: ${exercise.description}
    INSTRUÇÕES: ${exercise.instructions}
    PADRÃO: ${exercise.movement_pattern}
    PLANO: ${exercise.plane}

    Avalie:
    1. Completude e clareza.
    2. Coerência biomecânica (O exercício realmente trabalha o grupo muscular selecionado?).
    3. Qualidade da linguagem.
    4. Score de 0 a 100.

    Retorne JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            status: { type: Type.STRING, enum: ['premium', 'good', 'improvable'] },
            notes: { type: Type.ARRAY, items: { type: Type.STRING } },
            biomechanic_check: { type: Type.BOOLEAN }
          },
          required: ["score", "status", "notes", "biomechanic_check"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  },

  async checkSemanticSimilarity(name: string, existingNames: string[]): Promise<{ isDuplicate: boolean, similarTo?: string }> {
    const prompt = `Verifique se o exercício "${name}" é semanticamente idêntico a algum destes existentes: ${existingNames.join(", ")}.
    Considere variações de nome como "Supino Reto" e "Supino Barra Reto" como duplicadas.
    Retorne JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isDuplicate: { type: Type.BOOLEAN },
            similarTo: { type: Type.STRING }
          },
          required: ["isDuplicate"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  },

  async suggestVariations(name: string): Promise<string[]> {
    const prompt = `Sugira 4 variações inteligentes e comuns para o exercício: "${name}". 
    Exemplo: Supino Reto -> Supino Inclinado, Supino Halter, etc.
    Retorne apenas uma lista de strings em JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  },

  async suggestMissingExercises(muscleGroup: string, existingNames: string[]): Promise<string[]> {
    const prompt = `Para o grupo muscular "${muscleGroup}", identifique 3 exercícios essenciais que NÃO estão nesta lista: ${existingNames.join(", ")}.
    Retorne apenas uma lista de strings em JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  },

  async standardizeText(text: string): Promise<string> {
    const prompt = `Reescreva o seguinte texto seguindo um padrão técnico, profissional e direto, mantendo a clareza e autoridade. Use tom de Coach especialista:
    TEXTO: "${text}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });

    return response.text || text;
  }
};
