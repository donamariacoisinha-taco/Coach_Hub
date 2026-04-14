import { LastSetData } from "../types";

export function getPreSetHint({
  lastSet,
  targetReps,
}: {
  lastSet?: LastSetData | null;
  targetReps: number;
}) {
  if (!lastSet) return "Comece leve para calibrar";

  if (lastSet.reps < targetReps) {
    return `Meta: ${targetReps} reps (último: ${lastSet.reps})`;
  }

  if (lastSet.rpe <= 7) {
    return `Hoje: tente ${lastSet.weight + 2.5}kg`;
  }

  return "Mantenha consistência";
}
