
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { Exercise } from "../types";

const getAI = () => {
  const apiKey = (import.meta.env?.VITE_GEMINI_API_KEY as string) || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '');
  if (!apiKey) throw new Error("Gemini API Key not found");
  return new GoogleGenerativeAI(apiKey);
};

export const geminiService = {
  async generateExerciseData(name: string, muscleGroup: string): Promise<Partial<Exercise>> {
    const genAI = getAI();
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            description: { type: SchemaType.STRING },
            instructions: { type: SchemaType.STRING },
            technical_tips: { type: SchemaType.STRING },
            secondary_muscles: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            movement_pattern: { type: SchemaType.STRING, description: "push, pull, hinge, squat, lunge, carry or isolation" },
            plane: { type: SchemaType.STRING, description: "horizontal, vertical, sagittal, frontal or transverse" },
            training_goal: { type: SchemaType.STRING, description: "strength, hypertrophy, power or endurance" }
          },
          required: ["description", "instructions", "technical_tips", "secondary_muscles", "movement_pattern", "plane", "training_goal"]
        }
      }
    });

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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const data = JSON.parse(response.text() || "{}");

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
    const genAI = getAI();
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            score: { type: SchemaType.NUMBER },
            status: { type: SchemaType.STRING, description: "premium, good or improvable" },
            notes: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            biomechanic_check: { type: SchemaType.BOOLEAN }
          },
          required: ["score", "status", "notes", "biomechanic_check"]
        }
      }
    });

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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text() || "{}");
  },

  async checkSemanticSimilarity(name: string, existingNames: string[]): Promise<{ isDuplicate: boolean, similarTo?: string }> {
    const genAI = getAI();
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            isDuplicate: { type: SchemaType.BOOLEAN },
            similarTo: { type: SchemaType.STRING }
          },
          required: ["isDuplicate"]
        }
      }
    });

    const prompt = `Verifique se o exercício "${name}" é semanticamente idêntico a algum destes existentes: ${existingNames.join(", ")}.
    Considere variações de nome como "Supino Reto" e "Supino Barra Reto" como duplicadas.
    Retorne JSON.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text() || "{}");
  },

  async suggestVariations(name: string): Promise<string[]> {
    const genAI = getAI();
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING }
        }
      }
    });

    const prompt = `Sugira 4 variações inteligentes e comuns para o exercício: "${name}". 
    Exemplo: Supino Reto -> Supino Inclinado, Supino Halter, etc.
    Retorne apenas uma lista de strings em JSON.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text() || "[]");
  },

  async suggestMissingExercises(muscleGroup: string, existingNames: string[]): Promise<string[]> {
    const genAI = getAI();
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING }
        }
      }
    });

    const prompt = `Para o grupo muscular "${muscleGroup}", identifique 3 exercícios essenciais que NÃO estão nesta lista: ${existingNames.join(", ")}.
    Retorne apenas uma lista de strings em JSON.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text() || "[]");
  },

  async standardizeText(text: string): Promise<string> {
    const genAI = getAI();
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const prompt = `Reescreva o seguinte texto seguindo um padrão técnico, profissional e direto, mantendo a clareza e autoridade. Use tom de Coach especialista:
    TEXTO: "${text}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || text;
  }
};
