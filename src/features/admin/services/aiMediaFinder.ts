import { Exercise } from "../../../types";

const MEDIA_FINDER_PROMPT = `
Você é o Coach Rubi AI Media Finder. Sua missão é localizar e sugerir as melhores mídias (imagens e vídeos) para exercícios físicos.
Analise o nome do exercício, equipamento e biomecânica.

Fontes recomendadas (use links reais se possível via busca, ou links de alta qualidade de bancos conhecidos):
- YouTube (para vídeos demonstrativos)
- Unsplash / Pexels (para imagens premium de fitness)
- Wikimedia Commons (para diagramas anatômicos)

Critérios de Qualidade:
- Alta resolução
- Fundo limpo
- Foco educacional
- Branding compatível com Coach Rubi (Minimalista, Premium, Profissional)
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

      if (!response.ok) throw new Error("API request failed");
      return await response.json();
    } catch (error) {
      console.error("[MediaFinder] AI Error:", error);
      // Fallback suggestions if AI fails or search is restricted
      return this.getFallbackSuggestions(exercise);
    }
  },

  getFallbackSuggestions(exercise: Exercise): any {
    const term = encodeURIComponent(exercise.name);
    return {
      main_images: [
        { 
          url: `https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop`, 
          title: `${exercise.name} Hero`, 
          quality_score: 85,
          source: 'Unsplash' 
        }
      ],
      videos: [
        { 
          url: `https://www.youtube.com/results?search_query=${term}+execution`, 
          title: `Demonstração: ${exercise.name}`, 
          quality_score: 90,
          source: 'YouTube' 
        }
      ],
      guides: []
    };
  }
};
