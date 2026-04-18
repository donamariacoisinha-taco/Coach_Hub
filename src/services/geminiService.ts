
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
            secondary_muscles: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["description", "instructions", "technical_tips", "secondary_muscles"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    // Combine tips into instructions or technical_prompt if needed
    return {
      description: data.description,
      instructions: data.instructions + "\n\n⚠️ DICAS TÉCNICAS:\n" + data.technical_tips,
      secondary_muscles: data.secondary_muscles,
      technical_prompt: data.technical_tips
    };
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
