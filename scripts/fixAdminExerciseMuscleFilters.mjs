import fs from 'node:fs';
import path from 'node:path';

const files = [
  path.resolve('src/features/admin/components/LibraryOS.tsx'),
  path.resolve('src/features/admin/components/SmartGrid.tsx')
];

const oldBlock = `    // Muscle Filter\n    if (selectedMuscleFilter !== 'Todos') {\n      result = result.filter(ex => \n        ex.muscle_group === selectedMuscleFilter ||\n        (selectedMuscleFilter === 'Pernas' && (ex.muscle_group === 'Perna' || ex.muscle_group === 'Panturrilhas' || ex.muscle_group === 'Adutores' || ex.muscle_group === 'Glúteos' || ex.muscle_group === 'Quadríceps' || ex.muscle_group === 'Posterior' || ex.muscle_group === 'Posteriores')) ||\n        (selectedMuscleFilter === 'Abdominais' && (ex.muscle_group === 'Abdômen' || ex.muscle_group === 'Oblíquos')) ||\n        (selectedMuscleFilter === 'Ombros' && ex.muscle_group === 'Ombro')\n      );\n    }`;

const oldSmartGridBlock = `    // 2. Global Muscle filter pill selection\n    if (selectedMuscleFilter !== 'Todos') {\n      result = result.filter(ex => \n        ex.muscle_group === selectedMuscleFilter ||\n        (selectedMuscleFilter === 'Pernas' && (ex.muscle_group === 'Perna' || ex.muscle_group === 'Panturrilhas' || ex.muscle_group === 'Adutores' || ex.muscle_group === 'Glúteos' || ex.muscle_group === 'Quadríceps' || ex.muscle_group === 'Posterior' || ex.muscle_group === 'Posteriores')) ||\n        (selectedMuscleFilter === 'Abdominais' && (ex.muscle_group === 'Abdômen' || ex.muscle_group === 'Oblíquos')) ||\n        (selectedMuscleFilter === 'Ombros' && ex.muscle_group === 'Ombro')\n      );\n    }`;

const buildNewBlock = (comment) => `    // ${comment}\n    if (selectedMuscleFilter !== 'Todos') {\n      const normalizeText = (value) => String(value || '')\n        .normalize('NFD')\n        .replace(/[\\u0300-\\u036f]/g, '')\n        .toLowerCase()\n        .trim();\n\n      const selected = normalizeText(selectedMuscleFilter);\n\n      result = result.filter(ex => {\n        const normalizedGroup = normalizeText(normalizeMuscleGroup(ex.muscle_group || ''));\n        const rawGroup = normalizeText(ex.muscle_group);\n        const cut = normalizeText(\n          ex.anatomical_cut ||\n          getVirtualAnatomicalCut(ex.muscle_group || '', ex.name || '')\n        );\n\n        if (selected === 'biceps') return normalizedGroup === 'bracos' && cut === 'biceps';\n        if (selected === 'triceps') return normalizedGroup === 'bracos' && cut === 'triceps';\n        if (selected === 'quadriceps') return normalizedGroup === 'pernas' && cut === 'quadriceps';\n        if (selected === 'posterior') return normalizedGroup === 'pernas' && cut === 'posterior';\n        if (selected === 'gluteos') return normalizedGroup === 'pernas' && (cut === 'gluteo' || cut === 'gluteos');\n        if (selected === 'panturrilha') return normalizedGroup === 'pernas' && (cut === 'panturrilha' || cut === 'panturrilhas');\n        if (selected === 'abdomen' || selected === 'abdominais') return normalizedGroup === 'abdomen';\n        if (selected === 'ombros') return normalizedGroup === 'ombros';\n        if (selected === 'peito') return normalizedGroup === 'peito';\n        if (selected === 'costas') return normalizedGroup === 'costas';\n        if (selected === 'pernas') return normalizedGroup === 'pernas';\n\n        return normalizedGroup === selected || rawGroup === selected;\n      });\n    }`;

for (const file of files) {
  let source = fs.readFileSync(file, 'utf8');

  if (!source.includes("getVirtualAnatomicalCut, normalizeMuscleGroup")) {
    source = source.replace(
      "import { Exercise } from '../../../types';",
      "import { Exercise, getVirtualAnatomicalCut, normalizeMuscleGroup } from '../../../types';"
    );
  }

  if (!source.includes("selected === 'biceps'")) {
    if (source.includes(oldSmartGridBlock)) {
      source = source.replace(oldSmartGridBlock, buildNewBlock('Global Muscle filter pill selection using KYRON normalized taxonomy + inferred anatomical cut'));
    } else if (source.includes(oldBlock)) {
      source = source.replace(oldBlock, buildNewBlock('Muscle Filter using KYRON normalized taxonomy + inferred anatomical cut'));
    } else {
      throw new Error(`[AdminMuscleFilters] Expected muscle filter block not found in ${file}.`);
    }
  }

  fs.writeFileSync(file, source);
}

console.log('[AdminMuscleFilters] LibraryOS and SmartGrid muscle filters fixed.');