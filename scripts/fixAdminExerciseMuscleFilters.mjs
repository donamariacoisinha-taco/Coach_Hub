import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve('src/features/admin/components/LibraryOS.tsx');
let source = fs.readFileSync(file, 'utf8');

if (!source.includes("import { Exercise, getVirtualAnatomicalCut, normalizeMuscleGroup } from '../../../types';")) {
  source = source.replace(
    "import { Exercise } from '../../../types';",
    "import { Exercise, getVirtualAnatomicalCut, normalizeMuscleGroup } from '../../../types';"
  );
}

const oldBlock = `    // Muscle Filter\n    if (selectedMuscleFilter !== 'Todos') {\n      result = result.filter(ex => \n        ex.muscle_group === selectedMuscleFilter ||\n        (selectedMuscleFilter === 'Pernas' && (ex.muscle_group === 'Perna' || ex.muscle_group === 'Panturrilhas' || ex.muscle_group === 'Adutores' || ex.muscle_group === 'Glúteos' || ex.muscle_group === 'Quadríceps' || ex.muscle_group === 'Posterior' || ex.muscle_group === 'Posteriores')) ||\n        (selectedMuscleFilter === 'Abdominais' && (ex.muscle_group === 'Abdômen' || ex.muscle_group === 'Oblíquos')) ||\n        (selectedMuscleFilter === 'Ombros' && ex.muscle_group === 'Ombro')\n      );\n    }`;

const newBlock = `    // Muscle Filter: resolve the displayed filter against the normalized\n    // KYRON taxonomy + anatomical cut. The API normalizes Bíceps/Tríceps to\n    // Braços and leg subgroups to Pernas, so direct muscle_group equality\n    // makes these pills return an empty library.\n    if (selectedMuscleFilter !== 'Todos') {\n      const normalizeText = (value) => String(value || '')\n        .normalize('NFD')\n        .replace(/[\\u0300-\\u036f]/g, '')\n        .toLowerCase()\n        .trim();\n\n      const selected = normalizeText(selectedMuscleFilter);\n\n      result = result.filter(ex => {\n        const normalizedGroup = normalizeText(normalizeMuscleGroup(ex.muscle_group || ''));\n        const rawGroup = normalizeText(ex.muscle_group);\n        const cut = normalizeText(\n          ex.anatomical_cut ||\n          getVirtualAnatomicalCut(ex.muscle_group || '', ex.name || '')\n        );\n\n        if (selected === 'pernas') return normalizedGroup === 'pernas';\n        if (selected === 'biceps') return normalizedGroup === 'bracos' && cut === 'biceps';\n        if (selected === 'triceps') return normalizedGroup === 'bracos' && cut === 'triceps';\n        if (selected === 'quadriceps') return normalizedGroup === 'pernas' && cut === 'quadriceps';\n        if (selected === 'posterior') return normalizedGroup === 'pernas' && cut === 'posterior';\n        if (selected === 'gluteos') return normalizedGroup === 'pernas' && (cut === 'gluteo' || cut === 'gluteos');\n        if (selected === 'panturrilha') return normalizedGroup === 'pernas' && (cut === 'panturrilha' || cut === 'panturrilhas');\n        if (selected === 'abdominais') return normalizedGroup === 'abdomen' || cut === 'obliquos';\n        if (selected === 'ombros') return normalizedGroup === 'ombros';\n        if (selected === 'peito') return normalizedGroup === 'peito';\n        if (selected === 'costas') return normalizedGroup === 'costas';\n\n        return normalizedGroup === selected || rawGroup === selected;\n      });\n    }`;

if (!source.includes("selected === 'panturrilha'")) {
  if (!source.includes(oldBlock)) {
    throw new Error('[AdminMuscleFilters] Expected LibraryOS muscle filter block not found.');
  }
  source = source.replace(oldBlock, newBlock);
}

fs.writeFileSync(file, source);
console.log('[AdminMuscleFilters] Admin exercise muscle filters fixed.');
