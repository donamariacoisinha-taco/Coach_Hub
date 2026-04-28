import { Exercise } from "../../../types";

export const mediaMatcher = {
  findSimilarAssets(exercise: Exercise, allExercises: Exercise[]): Partial<Exercise>[] {
    const normalize = (s: string) => s.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/com|de|na|no|barra|halteres|maquina/g, '')
      .trim();

    const currentName = normalize(exercise.name);
    
    return allExercises
      .filter(e => e.id !== exercise.id && (e.image_url || e.video_url))
      .filter(e => {
        const otherName = normalize(e.name);
        // Basic fuzzy matching or shared muscle/equipment
        const nameSimilarity = otherName.includes(currentName) || currentName.includes(otherName);
        const muscleMatch = e.muscle_group === exercise.muscle_group;
        const equipmentMatch = e.equipment === exercise.equipment;
        
        return nameSimilarity || (muscleMatch && equipmentMatch);
      })
      .slice(0, 5);
  }
};
