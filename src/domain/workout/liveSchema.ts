/**
 * Colunas lidas em 2026-11-15 no projeto eqnkuqkadtywgfsoilpe (somente leitura).
 * Não selecionar nem gravar nada fora desta lista: o PostgREST responde 400
 * e a consulta inteira falha.
 */
export const LIVE_SCHEMA = {
  workout_sets_log: [
    'id', 'history_id', 'exercise_id', 'set_number', 'weight_achieved', 'reps_achieved',
    'rpe', 'created_at', 'notes', 'rest_time_actual', 'user_id', 'set_type', 'client_id',
  ],
  workout_exercises: [
    'id', 'category_id', 'exercise_id', 'sets', 'reps', 'weight', 'rest_time', 'notes',
    'sort_order', 'sets_json', 'instructions', 'superset_id', 'default_rpe', 'exercise_name_snapshot',
  ],
  workout_history: [
    'id', 'user_id', 'category_id', 'category_name', 'completed_at', 'duration_minutes',
    'exercises_count', 'total_time_ms', 'rest_time_ms', 'execution_time_ms',
  ],
} as const;

export type LiveTable = keyof typeof LIVE_SCHEMA;

export function columnsOf(table: LiveTable): readonly string[] {
  return LIVE_SCHEMA[table];
}

export function selectExisting(table: LiveTable, wanted: string[]): string[] {
  const known = new Set<string>(columnsOf(table));
  return wanted.filter((column) => known.has(column));
}

export function rowForTable<T extends Record<string, unknown>>(table: LiveTable, row: T): Partial<T> {
  const known = new Set<string>(columnsOf(table));
  const next: Partial<T> = {};
  for (const [key, value] of Object.entries(row)) {
    if (known.has(key) && value !== undefined) next[key as keyof T] = value as T[keyof T];
  }
  return next;
}

/** Último log. rest_time não existe; o descanso real está em rest_time_actual. */
export function lastSetColumns(): string[] {
  return selectExisting('workout_sets_log', [
    'weight_achieved', 'reps_achieved', 'rpe', 'rest_time_actual', 'rest_time',
  ]);
}
