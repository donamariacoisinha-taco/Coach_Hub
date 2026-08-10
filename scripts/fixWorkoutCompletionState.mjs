import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve('src/features/workout/WorkoutPlayer.tsx');
let source = fs.readFileSync(file, 'utf8');

const oldAddBlock = `    // Auto-update live tracker performance map
    setWorkoutPerformance(prev => {
      const nextIdx = updatedExercises.length - 1;
      return {
        ...prev,
        [nextIdx]: Array.from({ length: 3 }).map(() => ({
          weight: 0, reps: 10, rpe: 8
        }))
      };
    });

    showSuccess(\`Adicionado: \${ex.name}\`);`;

const newAddBlock = `    // Auto-update live tracker performance map. Performance data is not completion state.
    const nextIdx = updatedExercises.length - 1;
    setWorkoutPerformance(prev => ({
      ...prev,
      [nextIdx]: Array.from({ length: 3 }).map(() => ({
        weight: 0, reps: 10, rpe: 8
      }))
    }));

    // A newly added exercise must always start with zero completed sets.
    setCompletedSetsByExercise(prev => ({
      ...prev,
      [nextIdx]: new Set<number>()
    }));

    showSuccess(\`Adicionado: \${ex.name}\`);`;

const oldFallbackBlock = `      if (savedCompleted) {
        setCompletedSetIndices(savedCompleted);
      } else {
        // Fallback: check if we have workoutPerformance logs already completed
        if (workoutPerformance[currentIndex] && workoutPerformance[currentIndex].length > 0) {
          const defaultCompleted = new Set<number>();
          workoutPerformance[currentIndex].forEach((_, sIdx) => defaultCompleted.add(sIdx));
          setCompletedSetIndices(defaultCompleted);
        } else {
          setCompletedSetIndices(new Set());
        }
      }`;

const newFallbackBlock = `      if (savedCompleted) {
        setCompletedSetIndices(savedCompleted);
      } else {
        // workoutPerformance may contain editable/prefilled targets. It must never imply completion.
        // Completion comes only from completedSetsByExercise or hydrated workout logs.
        setCompletedSetIndices(new Set());
      }`;

let changed = false;

if (source.includes(oldAddBlock)) {
  source = source.replace(oldAddBlock, newAddBlock);
  changed = true;
} else if (!source.includes('A newly added exercise must always start with zero completed sets.')) {
  throw new Error('WorkoutPlayer add-exercise block changed unexpectedly; patch not applied.');
}

if (source.includes(oldFallbackBlock)) {
  source = source.replace(oldFallbackBlock, newFallbackBlock);
  changed = true;
} else if (!source.includes('workoutPerformance may contain editable/prefilled targets. It must never imply completion.')) {
  throw new Error('WorkoutPlayer completion fallback changed unexpectedly; patch not applied.');
}

if (changed) {
  fs.writeFileSync(file, source);
  console.log('[WorkoutPlayer] Applied completion-state fix for newly added exercises.');
} else {
  console.log('[WorkoutPlayer] Completion-state fix already present.');
}
