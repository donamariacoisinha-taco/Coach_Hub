import { Exercise } from "../../../types";

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
      const response = await fetch("/api/intelligence/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, systemInstruction: OPTIMIZATION_PROMPT })
      });

      if (!response.ok) throw new Error("API request failed");
      const result = await response.json();
      
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
