import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { Exercise } from "../../../types";

const apiKey = (process.env.GEMINI_API_KEY as string) || "";
const genAI = new GoogleGenerativeAI(apiKey);

const OPTIMIZATION_PROMPT = `
Você é o Rubi Intelligence Engine, uma IA especialista em biomecânica e treinamento de força.
Sua missão é otimizar os metadados de exercícios de musculação para um sistema premium.

Regras de Ouro:
1. Nomes devem ser padronizados e elegantes (ex: "Supino Reto com Barra" ao invés de "sup reto barra").
2. Descrições devem ser técnicas, claras e motivadoras.
3. Passos (steps) devem ser curtos e focados na execução perfeita.
4. Identificar músculos secundários com precisão biomecânica.
5. Definir dificuldade baseada em complexidade motora.
6. Gerar um Quality Score (0-100) baseado na qualidade das informações.

Retorne os dados EXATAMENTE no formato JSON solicitado.
`;

export const rubiIntelligenceService = {
  async optimizeExercise(exercise: Partial<Exercise>, operation: string): Promise<Partial<Exercise>> {
    const prompt = `
      Exercício Atual:
      Nome: ${exercise.name}
      Grupo Muscular: ${exercise.muscle_group}
      Descrição: ${exercise.description || 'N/A'}
      
      Operação Solicitada: ${operation}
      
      Por favor, forneca a otimização completa deste exercício.
    `;

    try {
      if (!apiKey) throw new Error("API Key GEMINI_API_KEY non set");

      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash-latest",
        systemInstruction: OPTIMIZATION_PROMPT,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING },
              description: { type: SchemaType.STRING },
              instructions: { 
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING }
              },
              secondary_muscles: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING }
              },
              equipment: { type: SchemaType.STRING },
              difficulty_level: { 
                type: SchemaType.STRING,
                enum: ['Iniciante', 'Intermediário', 'Avançado', 'Elite']
              },
              quality_score_v3: { type: SchemaType.NUMBER },
              technical_tips: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING }
              }
            },
            required: ['name', 'description', 'instructions', 'quality_score_v3']
          }
        }
      });

      const resultText = await model.generateContent(prompt);
      const jsonText = resultText.response.text();
      const result = JSON.parse(jsonText || '{}');
      
      return {
        ...exercise,
        ...result,
        ai_review_status: 'auto_fixed',
        ai_fixed_at: new Date().toISOString(),
        auto_fixed: true
      };
    } catch (error) {
      console.error("Rubi Intelligence Error:", error);
      throw error;
    }
  }
};
