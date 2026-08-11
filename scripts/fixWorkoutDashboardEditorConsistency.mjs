import fs from 'node:fs';
import path from 'node:path';

const dashboardFile = path.resolve('src/features/dashboard/Dashboard.tsx');
const editorFile = path.resolve('src/components/WorkoutEditor.tsx');

let dashboard = fs.readFileSync(dashboardFile, 'utf8');
let editor = fs.readFileSync(editorFile, 'utf8');

const replaceOrAssert = (source, oldValue, newValue, marker, label) => {
  if (source.includes(marker)) return source;
  if (!source.includes(oldValue)) {
    throw new Error(`[WorkoutConsistency] ${label}: source block changed unexpectedly.`);
  }
  return source.replace(oldValue, newValue);
};

// Dashboard must never invent exercise totals from the card position. A missing
// count is represented as zero until fresh data arrives from getDashboardData.
dashboard = replaceOrAssert(
  dashboard,
  `                    const exercisesCount = workout.exercises_count || (idx % 3 === 0 ? 8 : (idx % 3 === 1 ? 6 : 7));`,
  `                    const exercisesCount = workout.exercises_count ?? 0;`,
  'const exercisesCount = workout.exercises_count ?? 0;',
  'real dashboard exercise count'
);

// Existing workout editors may hydrate cached data immediately for a fast UI,
// but must always revalidate against Supabase. Previously an empty cache caused
// an early return and could make a populated workout look permanently empty.
editor = replaceOrAssert(
  editor,
  `    const cached = cacheStore.get(cacheKey);\n    \n    if (cached) {\n      console.log(\`[EDITOR] Using cached data for \${cacheKey}\`, cached);\n      hydrateEditorState(cached);\n      editorState.setData(true);\n      return;\n    }\n\n    editorState.setLoading(true);`,
  `    const cached = cacheStore.get(cacheKey);\n    const hasCachedData = !!cached;\n    \n    if (cached) {\n      console.log(\`[EDITOR] Hydrating cached data for \${cacheKey} before revalidation\`, cached);\n      hydrateEditorState(cached);\n      editorState.setData(true);\n    }\n\n    // Always revalidate an existing workout against Supabase. Only show the\n    // blocking loading state when there is no cached snapshot to render.\n    if (!hasCachedData) editorState.setLoading(true);`,
  'const hasCachedData = !!cached;',
  'editor cache revalidation'
);

// If revalidation fails after a cached snapshot has already rendered, retain
// that snapshot rather than replacing the editor with an error state. A retry
// or next navigation will revalidate again.
editor = replaceOrAssert(
  editor,
  `    } catch (err) { \n      editorState.setError(err);\n      showError(err);\n    }\n  };`,
  `    } catch (err) {\n      if (hasCachedData) {\n        console.warn('[EDITOR] Revalidation failed; keeping cached workout snapshot.', err);\n        return;\n      }\n      editorState.setError(err);\n      showError(err);\n    }\n  };`,
  'Revalidation failed; keeping cached workout snapshot.',
  'editor cached fallback'
);

fs.writeFileSync(dashboardFile, dashboard);
fs.writeFileSync(editorFile, editor);
console.log('[WorkoutConsistency] Dashboard counts and editor revalidation fixed.');
