
import { Exercise } from "../types";

export const geminiService = {
  async callAI(params: { prompt: string, systemInstruction?: string, responseSchema?: any, model?: string }) {
    const response = await fetch("/api/intelligence/proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });
    if (!response.ok) throw new Error("AI Proxy request failed");
    return await response.json();
  },

  async generateExerciseData(name: string, muscleGroup: string): Promise<Partial<Exercise>> {
    const data = await this.callAI({
      prompt: `Como Rubi, Especialista em Biomecânica e Treinamento, gere dados técnicos para o exercício:
      NOME: ${name}
      GRUPO MUSCULAR: ${muscleGroup}

      Gere:
      1. Uma descrição curta e motivadora (1 frase).
      2. Instruções técnicas detalhadas passo a passo.
      3. Dicas de segurança e biomecânica.
      4. Músculos secundários envolvidos.
      5. Tags estruturais: padrão de movimento, plano anatômico e objetivo principal.

      Retorne estritamente em JSON no formato especificado.`,
      responseSchema: {
        type: "object",
        properties: {
          description: { type: "string" },
          instructions: { type: "string" },
          technical_tips: { type: "string" },
          secondary_muscles: { type: "array", items: { type: "string" } },
          movement_pattern: { type: "string" },
          plane: { type: "string" },
          training_goal: { type: "string" }
        },
        required: ["description", "instructions", "technical_tips", "secondary_muscles", "movement_pattern", "plane", "training_goal"]
      }
    });

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
    return await this.callAI({
      prompt: `Como Auditor de Qualidade Rubi AI, revise este exercício:
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

      Retorne JSON.`,
      responseSchema: {
        type: "object",
        properties: {
          score: { type: "number" },
          status: { type: "string" },
          notes: { type: "array", items: { type: "string" } },
          biomechanic_check: { type: "boolean" }
        },
        required: ["score", "status", "notes", "biomechanic_check"]
      }
    });
  },

  async checkSemanticSimilarity(name: string, existingNames: string[]): Promise<{ isDuplicate: boolean, similarTo?: string }> {
    return await this.callAI({
      prompt: `Verifique se o exercício "${name}" é semanticamente idêntico a algum destes existentes: ${existingNames.join(", ")}.
      Considere variações de nome como "Supino Reto" e "Supino Barra Reto" como duplicadas.
      Retorne JSON.`,
      responseSchema: {
        type: "object",
        properties: {
          isDuplicate: { type: "boolean" },
          similarTo: { type: "string" }
        },
        required: ["isDuplicate"]
      }
    });
  },

  async suggestVariations(name: string): Promise<string[]> {
    return await this.callAI({
      prompt: `Sugira 4 variações inteligentes e comuns para o exercício: "${name}". 
      Exemplo: Supino Reto -> Supino Inclinado, Supino Halter, etc.
      Retorne apenas uma lista de strings em JSON.`,
      responseSchema: {
        type: "array",
        items: { type: "string" }
      }
    });
  },

  async suggestMissingExercises(muscleGroup: string, existingNames: string[]): Promise<string[]> {
    return await this.callAI({
      prompt: `Para o grupo muscular "${muscleGroup}", identifique 3 exercícios essenciais que NÃO estão nesta lista: ${existingNames.join(", ")}.
      Retorne apenas uma lista de strings em JSON.`,
      responseSchema: {
        type: "array",
        items: { type: "string" }
      }
    });
  },

  async standardizeText(text: string): Promise<string> {
    const result = await this.callAI({
      prompt: `Reescreva o seguinte texto seguindo um padrão técnico, profissional e direto, mantendo a clareza e autoridade. Use tom de Coach especialista:
      TEXTO: "${text}"`
    });
    return result.text || text;
  }
};
