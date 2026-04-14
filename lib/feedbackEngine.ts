import { LastSetData } from "../types";

export function getEmotionalFeedback({
  current,
  lastSet,
  previousSet,
}: {
  current: LastSetData;
  lastSet?: LastSetData | null;
  previousSet?: LastSetData | null;
}) {
  const { weight, reps } = current;

  if (lastSet && weight >= lastSet.weight && reps > lastSet.reps) {
    return "🔥 Novo recorde";
  }

  if (lastSet && weight > lastSet.weight) {
    return "+ carga aumentada";
  }

  if (previousSet && reps === previousSet.reps) {
    return "Consistência perfeita";
  }

  if (previousSet && reps < previousSet.reps) {
    return "Fadiga detectada";
  }

  return "Bom trabalho";
}
