import { Exercise } from "../../../types";

const MEDIA_FINDER_PROMPT = `
Você é o KYRON AI Media Finder. Sua missão é localizar e sugerir as melhores mídias (imagens e vídeos) para exercícios físicos.
Analise o nome do exercício, equipamento e biomecânica.

Fontes recomendadas (use links reais se possível via busca, ou links de alta qualidade de bancos conhecidos):
- YouTube (para vídeos demonstrativos)
- Imagens específicas que demonstrem exatamente o exercício e o equipamento; nunca fotos genéricas de academia ou alimentos.
- Wikimedia Commons (para diagramas anatômicos)

Critérios de Qualidade:
- Alta resolução
- Fundo limpo
- Foco educacional
- Não invente URLs, notas de qualidade ou correspondência biomecânica. Se não houver mídia verificada, retorne listas vazias.
- Branding compatível com KYRON OS (Minimalista, Premium, Profissional)
`;

export const aiMediaFinder = {
  async findMedia(exercise: Exercise): Promise<any> {
    const prompt = `
      Localize sugestões de mídia para o exercício: "${exercise.name}"
      Equipamento: ${exercise.equipment || exercise.muscle_group}
      Foco: ${exercise.muscle_group}
      
      Sugira URLs reais de:
      1. Imagens Principais (Hero)
      2. Miniaturas (Thumbnails)
      3. Imagens de Guia Paso-a-Passo
      4. Vídeos do YouTube
      
      Para cada sugestão, atribua um visual_quality_score (0-100) e tags relevantes.
    `;

    try {
      const response = await fetch("/api/intelligence/find-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, systemInstruction: MEDIA_FINDER_PROMPT })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.details || "API request failed");
      }
      return await response.json();
    } catch (error) {
      console.error("[MediaFinder] AI Error:", error);
      // Fallback suggestions if AI fails or search is restricted
      return this.getFallbackSuggestions(exercise);
    }
  },

  getFallbackSuggestions(_exercise: Exercise): any {
    // A failed lookup provides no evidence of a matching exercise image or video.
    // Generic stock photos and search-result URLs are not exercise media.
    return { main_images: [], videos: [], guides: [] };
  }
};
