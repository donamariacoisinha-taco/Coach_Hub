import { describe, expect, it } from "vitest";
import { matchesExerciseMuscleFilter } from "./exerciseMuscleFilter";

describe("matchesExerciseMuscleFilter", () => {
  it("classifica Rosca Direta como Bíceps mesmo quando o grupo amplo é Braços", () => {
    expect(matchesExerciseMuscleFilter(
      { name: "Rosca Direta", muscle_group: "Braços" },
      "Bíceps",
    )).toBe(true);
  });

  it("classifica Tríceps corda como Tríceps mesmo quando o grupo amplo é Braços", () => {
    expect(matchesExerciseMuscleFilter(
      { name: "Tríceps corda", muscle_group: "Braços" },
      "Tríceps",
    )).toBe(true);
  });

  it("não inclui rosca no filtro de Tríceps", () => {
    expect(matchesExerciseMuscleFilter(
      { name: "Rosca Scott", muscle_group: "Braços" },
      "Tríceps",
    )).toBe(false);
  });

  it("não inclui tríceps no filtro de Bíceps", () => {
    expect(matchesExerciseMuscleFilter(
      { name: "Tríceps testa", muscle_group: "Braços" },
      "Bíceps",
    )).toBe(false);
  });

  it("preserva os filtros musculares existentes", () => {
    expect(matchesExerciseMuscleFilter(
      { name: "Supino reto", muscle_group: "Peito" },
      "Peito",
    )).toBe(true);
    expect(matchesExerciseMuscleFilter(
      { name: "Remada baixa", muscle_group: "Costas" },
      "Peito",
    )).toBe(false);
  });
});
