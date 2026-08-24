import fs from 'node:fs';
import path from 'node:path';

const files = [
  path.resolve('src/features/admin/components/LibraryOS.tsx'),
  path.resolve('src/features/admin/components/SmartGrid.tsx')
];

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  if (!source.includes('exerciseMatchesMuscleFilter')) {
    throw new Error(`[AdminMuscleFilters] Filtro taxonômico central ausente em ${file}.`);
  }
}

console.log('[AdminMuscleFilters] Filtros centrais de LibraryOS e SmartGrid validados.');
